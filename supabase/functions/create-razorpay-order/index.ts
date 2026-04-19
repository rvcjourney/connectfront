// Supabase Edge Function: create-razorpay-order
// Deploy: supabase functions deploy create-razorpay-order
//
// Required secrets (set via Supabase dashboard → Settings → Edge Functions):
//   RAZORPAY_KEY_ID     - your Razorpay key_id (test: rzp_test_...)
//   RAZORPAY_KEY_SECRET - your Razorpay key_secret (NEVER expose to client)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      mentorId,
      learnerId,
      slotId,
      amountPaise,       // total charged to learner, in paise
      mentorAmountPaise, // what mentor earns, in paise
      platformFeePaise,  // platform cut incl. GST, in paise
    } = await req.json();

    if (!mentorId || !learnerId || !slotId || !amountPaise) {
      throw new Error('Missing required fields');
    }

    const keyId     = Deno.env.get('RAZORPAY_KEY_ID')!;
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    // ── 1. Create Razorpay order (server-side, key_secret never leaves here) ──
    const credentials = btoa(`${keyId}:${keySecret}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount:   amountPaise,
        currency: 'INR',
        receipt:  `rcpt_${Date.now()}`,
      }),
    });

    const order = await rzpRes.json();

    if (!rzpRes.ok) {
      throw new Error(order?.error?.description || 'Razorpay order creation failed');
    }

    // ── 2. Save pending transaction in DB ─────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error: txError } = await supabase.from('transactions').insert({
      mentor_id:            mentorId,
      learner_id:           learnerId,
      slot_id:              slotId,
      razorpay_order_id:    order.id,
      amount_total_paise:   amountPaise,
      mentor_earning_paise: mentorAmountPaise,
      platform_fee_paise:   platformFeePaise,
      status:               'created',
    });

    if (txError) throw txError;

    // Return order details + publishable key_id (safe to expose)
    return new Response(
      JSON.stringify({
        orderId:  order.id,
        amount:   order.amount,
        currency: order.currency,
        keyId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('create-razorpay-order error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
