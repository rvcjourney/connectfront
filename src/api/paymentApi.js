import { supabase } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';

const SUPABASE_URL = 'https://pkoaxfxejgaawtwnkhvk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrb2F4ZnhlamdhYXd0d25raHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDcxMTcsImV4cCI6MjA4OTQyMzExN30.xzMh8CqUzQ9MEcSQbfTfr-VLxJxXdfyMcebrjQ4tWXQ';

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
  createOrder: async ({
    mentorId,
    learnerId,
    slotId,
    amountPaise,
    mentorAmountPaise,
    platformFeePaise,
  }) => {
    try {
      const data = await invokeFunction('create-razorpay-order', {
        mentorId,
        learnerId,
        slotId,
        amountPaise,
        mentorAmountPaise,
        platformFeePaise,
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
    mentorAmount,
    platformFee,
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
        mentorAmount,
        platformFee,
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
   * Submit a withdrawal request (mentor requesting payout).
   */
  requestWithdrawal: async ({ mentorId, amount, upiId }) => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({ mentor_id: mentorId, amount, upi_id: upiId })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
