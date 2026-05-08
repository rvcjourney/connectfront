-- Run in Supabase SQL editor (Dashboard → SQL Editor)

-- Phase 1: mentor payout fields
ALTER TABLE mentor_profiles
  ADD COLUMN IF NOT EXISTS razorpay_account_id TEXT,
  ADD COLUMN IF NOT EXISTS upi_id               TEXT,
  ADD COLUMN IF NOT EXISTS kyc_status           TEXT DEFAULT 'not_started';

-- Phase 2: track whether Route split was applied to a transaction
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS route_enabled BOOLEAN DEFAULT FALSE;

-- Phase 3: cache Razorpay contact + fund account IDs on mentor profile
ALTER TABLE mentor_profiles
  ADD COLUMN IF NOT EXISTS razorpay_contact_id      TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_fund_account_id TEXT;

-- Phase 3: track payout ID on withdrawal requests
ALTER TABLE withdrawal_requests
  ADD COLUMN IF NOT EXISTS razorpay_payout_id TEXT;

-- Phase 4: video subscription expiry + payment tracking
ALTER TABLE learner_unlocks
  ADD COLUMN IF NOT EXISTS expires_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS unlocked_at         TIMESTAMPTZ DEFAULT NOW();

-- earnings table: add source column to distinguish session vs video subscription
ALTER TABLE earnings
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'session',
  ADD COLUMN IF NOT EXISTS notes  TEXT;

-- Allow earnings without a booking_id (video subscriptions have no booking)
ALTER TABLE earnings ALTER COLUMN booking_id DROP NOT NULL;
