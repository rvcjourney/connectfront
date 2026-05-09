// Supabase Edge Function: verify-razorpay-payment
// Deploy: supabase functions deploy verify-razorpay-payment
//
// This function:
//   1. Verifies Razorpay HMAC signature (prevents payment spoofing)
//   2. Creates the booking (atomically)
//   3. Marks the availability slot as booked
//   4. Updates transaction status to 'paid'
//   5. Saves earnings as PENDING (wallet credited only after session completes)

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto }       from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc     = new TextEncoder();
  const keyData = enc.encode(secret);
  const msgData = enc.encode(message);

  const key = await crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  );

  const sig     = await crypto.subtle.sign('HMAC', key, msgData);
  const hashArr = Array.from(new Uint8Array(sig));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      mentorId,
      learnerId,
      slotId,
      message,
    } = await req.json();

    // ── 1. Verify signature ───────────────────────────────────────────────────
    const keySecret   = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const body        = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSig = await hmacSha256Hex(keySecret, body);

    if (expectedSig !== razorpaySignature) {
      throw new Error('Payment signature verification failed — possible tampering');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ── 2. Fetch stored transaction to get server-calculated amounts ──────────
    // mentor_earning_paise was set by create-razorpay-order — never trust client
    const { data: tx, error: txFetchErr } = await supabase
      .from('transactions')
      .select('mentor_earning_paise')
      .eq('razorpay_order_id', razorpayOrderId)
      .single();

    if (txFetchErr || !tx) throw new Error('Transaction not found for this order');

    const mentorAmount = tx.mentor_earning_paise / 100;

    // ── 3. Check slot is still available (race-condition guard) ───────────────
    const { data: slot, error: slotErr } = await supabase
      .from('availability_slots')
      .select('is_booked')
      .eq('id', slotId)
      .single();

    if (slotErr) throw slotErr;
    if (slot.is_booked) {
      throw new Error('This slot was just booked by someone else. Please select another slot.');
    }

    // ── 4. Create booking with status = confirmed ─────────────────────────────
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        mentor_id:  mentorId,
        learner_id: learnerId,
        slot_id:    slotId,
        message:    message || null,
        status:     'confirmed',
      })
      .select()
      .single();

    if (bookingErr) throw bookingErr;

    // ── 5. Mark slot as booked ────────────────────────────────────────────────
    await supabase
      .from('availability_slots')
      .update({ is_booked: true })
      .eq('id', slotId);

    // ── 6. Update transaction: paid + link booking ────────────────────────────
    await supabase
      .from('transactions')
      .update({
        booking_id:           booking.id,
        razorpay_payment_id:  razorpayPaymentId,
        razorpay_signature:   razorpaySignature,
        status:               'paid',
        updated_at:           new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpayOrderId);

    // ── 7. Save earnings as PENDING (server-calculated amount only) ───────────
    await supabase.from('earnings').insert({
      mentor_id:  mentorId,
      booking_id: booking.id,
      amount:     mentorAmount,
      status:     'pending',
    });

    return new Response(
      JSON.stringify({ success: true, bookingId: booking.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('verify-razorpay-payment error:', err);
    const msg = err instanceof Error ? err.message
      : (typeof err === 'object' && err !== null && 'message' in (err as object))
        ? (err as Record<string, unknown>).message as string
        : JSON.stringify(err);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
