// Supabase Edge Function: create-linked-account
// Saves mentor's UPI ID and payout details to DB.
//
// NOTE: Razorpay Route (/v2/accounts) requires separate activation.
// When you activate Route, add the API call here and set razorpay_account_id.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { mentorId, upiId } = await req.json();

    if (!mentorId || !upiId) throw new Error('mentorId and upiId are required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await supabase
      .from('mentor_profiles')
      .update({
        upi_id:     upiId,
        kyc_status: 'active',
      })
      .eq('id', mentorId);

    if (error) throw error;

    return new Response(
      JSON.stringify({
        accountId: null,
        kycUrl:    null,
        message:   'UPI ID saved successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('create-linked-account error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
