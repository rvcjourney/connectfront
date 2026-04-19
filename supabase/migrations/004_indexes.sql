-- ============================================================
-- Performance indexes
-- Run in Supabase SQL Editor
-- ============================================================

-- bookings
CREATE INDEX IF NOT EXISTS bookings_mentor_id_idx   ON bookings(mentor_id);
CREATE INDEX IF NOT EXISTS bookings_learner_id_idx  ON bookings(learner_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx      ON bookings(status);
CREATE INDEX IF NOT EXISTS bookings_slot_id_idx     ON bookings(slot_id);

-- availability_slots
CREATE INDEX IF NOT EXISTS slots_mentor_id_idx      ON availability_slots(mentor_id);
CREATE INDEX IF NOT EXISTS slots_date_idx           ON availability_slots(date);
CREATE INDEX IF NOT EXISTS slots_mentor_date_idx    ON availability_slots(mentor_id, date);
CREATE INDEX IF NOT EXISTS slots_is_booked_idx      ON availability_slots(is_booked);

-- transactions
CREATE INDEX IF NOT EXISTS txn_learner_id_idx       ON transactions(learner_id);
CREATE INDEX IF NOT EXISTS txn_mentor_id_idx        ON transactions(mentor_id);
CREATE INDEX IF NOT EXISTS txn_status_idx           ON transactions(status);
CREATE INDEX IF NOT EXISTS txn_order_id_idx         ON transactions(razorpay_order_id);

-- earnings
CREATE INDEX IF NOT EXISTS earnings_status_idx      ON earnings(status);

-- reviews
CREATE INDEX IF NOT EXISTS reviews_booking_id_idx   ON reviews(booking_id);
