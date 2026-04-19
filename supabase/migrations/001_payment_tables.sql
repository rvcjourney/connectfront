-- ============================================================
-- Payment tables for Connectiqo
-- Run this once in Supabase SQL Editor
-- ============================================================

-- ── 1. transactions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            UUID        REFERENCES bookings(id) ON DELETE SET NULL,
  learner_id            UUID        NOT NULL REFERENCES profiles(id),
  mentor_id             UUID        NOT NULL REFERENCES profiles(id),
  slot_id               UUID        REFERENCES availability_slots(id),
  razorpay_order_id     TEXT        UNIQUE NOT NULL,
  razorpay_payment_id   TEXT,
  razorpay_signature    TEXT,
  amount_total_paise    INTEGER     NOT NULL,            -- total charged to learner (paise)
  mentor_earning_paise  INTEGER     DEFAULT 0,           -- mentor's cut (paise)
  platform_fee_paise    INTEGER     DEFAULT 0,           -- platform cut incl. GST (paise)
  currency              TEXT        DEFAULT 'INR',
  status                TEXT        DEFAULT 'created'
                          CHECK (status IN ('created','paid','failed','refunded')),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 2. mentor_wallets ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mentor_wallets (
  id               UUID          PRIMARY KEY REFERENCES profiles(id),
  balance          NUMERIC(12,2) DEFAULT 0,
  total_earned     NUMERIC(12,2) DEFAULT 0,
  total_withdrawn  NUMERIC(12,2) DEFAULT 0,
  updated_at       TIMESTAMPTZ   DEFAULT now()
);

-- ── 3. withdrawal_requests ───────────────────────────────────
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id    UUID          NOT NULL REFERENCES profiles(id),
  amount       NUMERIC(12,2) NOT NULL,
  upi_id       TEXT,
  bank_account TEXT,
  status       TEXT          DEFAULT 'pending'
                  CHECK (status IN ('pending','processing','completed','rejected')),
  admin_note   TEXT,
  created_at   TIMESTAMPTZ   DEFAULT now(),
  updated_at   TIMESTAMPTZ   DEFAULT now()
);

-- ── 4. Atomic wallet increment RPC ──────────────────────────
CREATE OR REPLACE FUNCTION increment_mentor_wallet(
  p_mentor_id UUID,
  p_amount    NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO mentor_wallets (id, balance, total_earned)
  VALUES (p_mentor_id, p_amount, p_amount)
  ON CONFLICT (id) DO UPDATE
    SET balance      = mentor_wallets.balance      + p_amount,
        total_earned = mentor_wallets.total_earned + p_amount,
        updated_at   = now();
END;
$$;

-- ── 5. RLS ───────────────────────────────────────────────────
ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_wallets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- transactions: learner or mentor can view their own
CREATE POLICY "transactions_select" ON transactions
  FOR SELECT USING (learner_id = auth.uid() OR mentor_id = auth.uid());

-- mentor_wallets: mentor can view their own wallet
CREATE POLICY "wallet_select" ON mentor_wallets
  FOR SELECT USING (id = auth.uid());

-- withdrawal_requests: mentor can view + insert their own
CREATE POLICY "withdrawal_select" ON withdrawal_requests
  FOR SELECT USING (mentor_id = auth.uid());

CREATE POLICY "withdrawal_insert" ON withdrawal_requests
  FOR INSERT WITH CHECK (mentor_id = auth.uid());
