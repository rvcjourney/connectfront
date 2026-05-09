import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';

async function invokeFunction(name, body) {
  const url = `${SUPABASE_URL}/functions/v1/${name}`;
  console.log(`🔗 Calling Edge Function: ${url}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log(`📥 Response status: ${res.status}`);
  console.log(`📥 Response body: ${text}`);

  if (!res.ok) {
    throw new Error(`Function error (${res.status}): ${text}`);
  }

  return JSON.parse(text);
}

export const paymentApi = {
  /**
   * Step 1: Create a Razorpay order via Supabase Edge Function.
   * Returns { orderId, amount, currency, keyId }
   */
  createOrder: async ({ mentorId, learnerId, slotId, message }) => {
    try {
      const data = await invokeFunction('create-razorpay-order', {
        mentorId,
        learnerId,
        slotId,
        message,
      });

      return data;
    } catch (error) {
      console.error('💳 createOrder error:', error?.message);
      throw new Error(error?.message || 'Failed to create order');
    }
  },

  /**
   * Step 2: Verify payment + create booking atomically via Edge Function.
   * Called after Razorpay checkout returns success.
   * Returns { success: true, bookingId }
   */
  verifyAndBook: async ({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    mentorId,
    learnerId,
    slotId,
    message,
  }) => {
    try {
      const data = await invokeFunction('verify-razorpay-payment', {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        mentorId,
        learnerId,
        slotId,
        message,
      });

      return data;
    } catch (error) {
      console.error('💳 verifyAndBook error:', error?.message);
      throw new Error(error?.message || 'Payment verification failed');
    }
  },

  /**
   * Get sum of pending earnings (paid but session not yet completed).
   */
  getPendingEarnings: async (mentorId) => {
    try {
      const { data, error } = await supabase
        .from('earnings')
        .select('amount')
        .eq('mentor_id', mentorId)
        .eq('status', 'pending');

      if (error) throw error;
      const total = (data || []).reduce((sum, row) => sum + parseFloat(row.amount || 0), 0);
      return total;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /**
   * Get mentor's wallet balance.
   */
  getWallet: async (mentorId) => {
    try {
      const { data, error } = await supabase
        .from('mentor_wallets')
        .select('balance, total_earned, total_withdrawn')
        .eq('id', mentorId)
        .maybeSingle();

      if (error) throw error;
      return data || { balance: 0, total_earned: 0, total_withdrawn: 0 };
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /**
   * Get all transactions for a user (as mentor or learner).
   */
  getTransactions: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, status, created_at, learner_id, mentor_id, razorpay_order_id, razorpay_payment_id, amount, platform_fee')
        .or(`learner_id.eq.${userId},mentor_id.eq.${userId}`)
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /**
   * Trigger a RazorpayX UPI payout via Edge Function.
   * Deducts balance and inserts withdrawal_request atomically server-side.
   */
  requestWithdrawal: async ({ mentorId, amount }) => {
    try {
      const url = `${SUPABASE_URL}/functions/v1/process-withdrawal`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ mentorId, amount }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(JSON.parse(text)?.error || `Payout failed (${res.status})`);
      return JSON.parse(text);
    } catch (error) {
      throw new Error(error.message || 'Withdrawal failed');
    }
  },

  /**
   * Resolve fee/GST rule for a learner+mentor combination.
   * Priority:
   * 1) exact learner+mentor
   * 2) learner-specific (mentor null)
   * 3) mentor-specific (learner null)
   * 4) global default (both null)
   */
  getFeeRule: async () => {
    try {
      const { data, error } = await supabase
        .from('platform_fee_rules')
        .select('platform_fee_percent, gst_percent')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data || null;
    } catch (error) {
      console.warn('⚠️ Fee rule lookup failed, using defaults:', error?.message);
      return null;
    }
  },
};
