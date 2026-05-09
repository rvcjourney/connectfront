// Supabase Edge Function: verify-video-subscription
// 1. Verifies Razorpay payment signature
// 2. Records learner_unlocks with expires_at (30 days)
// 3. Credits mentor earnings + wallet
//
// Required secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      mentorId,
      learnerId,
      amountPaid,        // full amount in ₹ (not paise)
      mentorAmount,      // 80% in ₹
    } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !mentorId || !learnerId) {
      throw new Error('Missing required fields');
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    // ── 1. Verify HMAC signature ──────────────────────────────────────────────
    const payload   = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected  = createHmac('sha256', keySecret).update(payload).digest('hex');

    if (expected !== razorpaySignature) {
      throw new Error('Payment verification failed: invalid signature');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const now      = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

    // ── 2. Record subscription with expiry ────────────────────────────────────
    const { error: unlockError } = await supabase
      .from('learner_unlocks')
      .upsert({
        learner_id:          learnerId,
        mentor_id:           mentorId,
        amount_paid:         amountPaid,
        razorpay_order_id:   razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        unlocked_at:         now.toISOString(),
        expires_at:          expiresAt.toISOString(),
      }, { onConflict: 'learner_id,mentor_id' });

    if (unlockError) throw unlockError;

    // ── 3. Record mentor earnings ─────────────────────────────────────────────
    const { error: earningsError } = await supabase
      .from('earnings')
      .insert({
        mentor_id:  mentorId,
        amount:     mentorAmount,
        source:     'video_subscription',
        status:     'completed',
        notes:      `Video subscription by learner ${learnerId}`,
      });

    if (earningsError) throw earningsError;

    // ── 4. Credit mentor wallet ───────────────────────────────────────────────
    const { data: wallet } = await supabase
      .from('mentor_wallets')
      .select('balance, total_earned')
      .eq('id', mentorId)
      .single();

    await supabase
      .from('mentor_wallets')
      .upsert({
        id:            mentorId,
        balance:       (wallet?.balance || 0) + mentorAmount,
        total_earned:  (wallet?.total_earned || 0) + mentorAmount,
      });

    return new Response(
      JSON.stringify({ success: true, expiresAt: expiresAt.toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('verify-video-subscription error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
