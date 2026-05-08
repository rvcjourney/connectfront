// Supabase Edge Function: process-withdrawal
// TEST MODE: Records withdrawal request in DB only.
// When going live, uncomment the RazorpayX payout block below.
//
// Required secrets: (none for test mode)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { mentorId, amount } = await req.json();

    if (!mentorId || !amount || amount <= 0) throw new Error('mentorId and amount are required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ── 1. Load mentor UPI + wallet balance ───────────────────────────────────
    const [{ data: mp, error: mpErr }, { data: wallet, error: walletErr }] = await Promise.all([
      supabase
        .from('mentor_profiles')
        .select('upi_id')
        .eq('id', mentorId)
        .single(),
      supabase
        .from('mentor_wallets')
        .select('balance, total_withdrawn')
        .eq('id', mentorId)
        .single(),
    ]);

    if (mpErr)     throw mpErr;
    if (walletErr) throw walletErr;
    if (!mp?.upi_id)              throw new Error('No UPI ID found. Complete payout setup first.');
    if ((wallet?.balance || 0) < amount) throw new Error('Insufficient wallet balance');

    // ── 2. Deduct balance + record withdrawal request ─────────────────────────
    const newBalance       = (wallet.balance || 0) - amount;
    const newTotalWithdrawn = (wallet.total_withdrawn || 0) + amount;

    const [walletUpdate, withdrawalInsert] = await Promise.all([
      supabase
        .from('mentor_wallets')
        .update({ balance: newBalance, total_withdrawn: newTotalWithdrawn })
        .eq('id', mentorId),
      supabase
        .from('withdrawal_requests')
        .insert({
          mentor_id: mentorId,
          amount,
          upi_id:    mp.upi_id,
          status:    'pending',  // admin manually processes this
        })
        .select('id')
        .single(),
    ]);

    if (walletUpdate.error)   throw walletUpdate.error;
    if (withdrawalInsert.error) throw withdrawalInsert.error;

    // ── TODO (go-live): Replace above with RazorpayX payout ──────────────────
    // Uncomment when you activate RazorpayX and set RAZORPAYX_ACCOUNT_NUMBER secret.
    //
    // const payout = await rzp('/payouts', 'POST', {
    //   account_number:       Deno.env.get('RAZORPAYX_ACCOUNT_NUMBER')!,
    //   fund_account_id:      fundAccountId,
    //   amount:               Math.round(amount * 100),
    //   currency:             'INR',
    //   mode:                 'UPI',
    //   purpose:              'payout',
    //   queue_if_low_balance: true,
    // });
    // ─────────────────────────────────────────────────────────────────────────

    return new Response(
      JSON.stringify({
        payoutId:   `manual_${withdrawalInsert.data.id}`,
        status:     'pending',
        newBalance,
        message:    'Withdrawal request recorded. Will be processed within 1–2 business days.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('process-withdrawal error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
