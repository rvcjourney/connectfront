-- ============================================================
-- reviews table
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID          NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  mentor_id   UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  learner_id  UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      SMALLINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_mentor_id_idx ON reviews(mentor_id);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
DROP POLICY IF EXISTS "reviews_select" ON reviews;
CREATE POLICY "reviews_select" ON reviews
  FOR SELECT USING (true);

-- Only the learner who had the booking can insert (once, enforced by UNIQUE on booking_id)
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT WITH CHECK (learner_id = auth.uid());

-- ============================================================
-- Update mentor avg rating when a review is inserted
-- ============================================================

CREATE OR REPLACE FUNCTION update_mentor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE mentor_profiles
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM reviews
    WHERE mentor_id = NEW.mentor_id
  )
  WHERE id = NEW.mentor_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_mentor_rating ON reviews;
CREATE TRIGGER trg_update_mentor_rating
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_mentor_rating();
