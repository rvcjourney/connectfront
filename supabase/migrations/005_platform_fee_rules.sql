-- Platform fee + GST rules per learner/mentor pair
CREATE TABLE IF NOT EXISTS platform_fee_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  gst_percent NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pfr_learner_idx ON platform_fee_rules (learner_id);
CREATE INDEX IF NOT EXISTS pfr_mentor_idx ON platform_fee_rules (mentor_id);
CREATE INDEX IF NOT EXISTS pfr_active_idx ON platform_fee_rules (is_active);
