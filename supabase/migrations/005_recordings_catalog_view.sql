-- Recording catalog for admin/reporting (URLs live on `recordings`, not `bookings`).
CREATE OR REPLACE VIEW recordings_catalog AS
SELECT
  r.booking_id,
  r.meeting_id,
  b.status,
  b.created_at,
  b.updated_at,
  COALESCE(r.recording_playback_url, r.recording_url) AS recording_url,
  mentor.id AS mentor_id,
  mentor.name AS mentor_name,
  learner.id AS learner_id,
  learner.name AS learner_name,
  (s.date::text || 'T' || COALESCE(s.end_time::text, '23:59:59'))::timestamptz AS completed_at
FROM recordings r
INNER JOIN bookings b ON b.id = r.booking_id
LEFT JOIN profiles mentor ON mentor.id = r.mentor_id
LEFT JOIN profiles learner ON learner.id = r.learner_id
LEFT JOIN availability_slots s ON s.id = b.slot_id
WHERE COALESCE(r.recording_playback_url, r.recording_url) IS NOT NULL
  AND COALESCE(r.recording_playback_url, r.recording_url) <> 'pending';
