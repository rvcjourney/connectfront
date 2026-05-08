// Supabase Edge Function: create-video-order
// Creates a Razorpay order for a video library subscription.
// Separate from create-razorpay-order which is for session bookings.
//
// Required secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { mentorId, learnerId, amountPaise } = await req.json();

    if (!mentorId || !learnerId || !amountPaise) {
      throw new Error('mentorId, learnerId and amountPaise are required');
    }

    const keyId     = Deno.env.get('RAZORPAY_KEY_ID')!;
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const creds     = btoa(`${keyId}:${keySecret}`);

    // ── 1. Create Razorpay order ──────────────────────────────────────────────
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:   amountPaise,
        currency: 'INR',
        receipt:  `vsub_${Date.now()}`,
        notes:    { mentor_id: mentorId, learner_id: learnerId, type: 'video_subscription' },
      }),
    });

    const order = await rzpRes.json();
    if (!rzpRes.ok) throw new Error(order?.error?.description || 'Order creation failed');

    // ── 2. Check if mentor has active Route account for auto-split ────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: mp } = await supabase
      .from('mentor_profiles')
      .select('razorpay_account_id, kyc_status, unlock_price')
      .eq('id', mentorId)
      .single();

    const mentorAmountPaise  = Math.round(amountPaise * 0.8);
    const platformFeePaise   = amountPaise - mentorAmountPaise;
    const routeEnabled       = !!(mp?.razorpay_account_id && mp?.kyc_status === 'active');

    return new Response(
      JSON.stringify({
        orderId:           order.id,
        amount:            order.amount,
        currency:          order.currency,
        keyId,
        mentorAmountPaise,
        platformFeePaise,
        routeEnabled,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('create-video-order error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
