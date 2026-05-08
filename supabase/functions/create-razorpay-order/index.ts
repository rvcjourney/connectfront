// Supabase Edge Function: create-razorpay-order
// Deploy: supabase functions deploy create-razorpay-order
//
// Required secrets:
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

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
    const creds     = btoa(`${keyId}:${keySecret}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ── 1. Check if mentor has an active Razorpay linked account ─────────────
    const { data: mentorProfile } = await supabase
      .from('mentor_profiles')
      .select('razorpay_account_id, kyc_status')
      .eq('id', mentorId)
      .single();

    const linkedAccountId = mentorProfile?.razorpay_account_id;
    const kycActive       = mentorProfile?.kyc_status === 'active';
    const routeEnabled    = !!(linkedAccountId && kycActive);

    // ── 2. Build Razorpay order body ──────────────────────────────────────────
    const orderBody: Record<string, unknown> = {
      amount:   amountPaise,
      currency: 'INR',
      receipt:  `rcpt_${Date.now()}`,
    };

    // Add Route split only when mentor KYC is active
    if (routeEnabled) {
      orderBody.transfers = [
        {
          account:  linkedAccountId,
          amount:   mentorAmountPaise,
          currency: 'INR',
          on_hold:  0,          // transfer immediately on payment capture
          notes: {
            mentor_id: mentorId,
            slot_id:   slotId,
          },
        },
      ];
    }

    // ── 3. Create Razorpay order ──────────────────────────────────────────────
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization:  `Basic ${creds}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderBody),
    });

    const order = await rzpRes.json();
    if (!rzpRes.ok) {
      throw new Error(order?.error?.description || 'Razorpay order creation failed');
    }

    // ── 4. Save pending transaction ───────────────────────────────────────────
    const { error: txError } = await supabase.from('transactions').insert({
      mentor_id:            mentorId,
      learner_id:           learnerId,
      slot_id:              slotId,
      razorpay_order_id:    order.id,
      amount_total_paise:   amountPaise,
      mentor_earning_paise: mentorAmountPaise,
      platform_fee_paise:   platformFeePaise,
      route_enabled:        routeEnabled,
      status:               'created',
    });

    if (txError) throw txError;

    return new Response(
      JSON.stringify({
        orderId:      order.id,
        amount:       order.amount,
        currency:     order.currency,
        keyId,
        routeEnabled, // let app know if split is active
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
