-- ============================================================
-- earnings table
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS earnings (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id   UUID          NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  booking_id  UUID          NOT NULL REFERENCES bookings(id)  ON DELETE CASCADE,
  amount      NUMERIC(12,2) NOT NULL,
  status      TEXT          NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'completed')),
  created_at  TIMESTAMPTZ   DEFAULT now(),
  updated_at  TIMESTAMPTZ   DEFAULT now()
);

-- Index for fast mentor lookups
CREATE INDEX IF NOT EXISTS earnings_mentor_id_idx ON earnings(mentor_id);
CREATE INDEX IF NOT EXISTS earnings_booking_id_idx ON earnings(booking_id);

-- RLS
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "earnings_select" ON earnings
  FOR SELECT USING (mentor_id = auth.uid());

-- ============================================================
-- complete_session_payment RPC
-- Called when mentor marks booking as 'completed'.
-- Moves earnings from pending → completed and credits wallet.
-- ============================================================

CREATE OR REPLACE FUNCTION complete_session_payment(
  p_booking_id UUID,
  p_mentor_id  UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount NUMERIC(12,2);
BEGIN
  -- Get pending earnings amount for this booking
  SELECT amount INTO v_amount
  FROM earnings
  WHERE booking_id = p_booking_id
    AND mentor_id  = p_mentor_id
    AND status     = 'pending'
  LIMIT 1;

  IF v_amount IS NULL THEN
    RETURN; -- no pending earnings, nothing to do
  END IF;

  -- Mark earnings as completed
  UPDATE earnings
  SET status     = 'completed',
      updated_at = now()
  WHERE booking_id = p_booking_id
    AND mentor_id  = p_mentor_id
    AND status     = 'pending';

  -- Upsert mentor wallet and credit the balance
  INSERT INTO mentor_wallets (id, balance, total_earned, total_withdrawn)
  VALUES (p_mentor_id, v_amount, v_amount, 0)
  ON CONFLICT (id) DO UPDATE
    SET balance      = mentor_wallets.balance      + v_amount,
        total_earned = mentor_wallets.total_earned + v_amount,
        updated_at   = now();
END;
$$;
