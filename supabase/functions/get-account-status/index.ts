// Supabase Edge Function: get-account-status
// Returns mentor's payout setup status directly from DB.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { mentorId } = await req.json();
    if (!mentorId) throw new Error('mentorId is required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: mp, error } = await supabase
      .from('mentor_profiles')
      .select('razorpay_account_id, upi_id, kyc_status')
      .eq('id', mentorId)
      .single();

    if (error) throw error;

    const status = mp?.upi_id ? (mp.kyc_status || 'pending') : 'not_started';

    return new Response(
      JSON.stringify({
        status,
        accountId: mp?.razorpay_account_id || null,
        upiId:     mp?.upi_id || null,
        kycUrl:    null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('get-account-status error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
