CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  meeting_id TEXT,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recording_url TEXT NOT NULL,
  recording_playback_url TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recordings_mentor_id_idx ON recordings(mentor_id);
CREATE INDEX IF NOT EXISTS recordings_learner_id_idx ON recordings(learner_id);
CREATE INDEX IF NOT EXISTS recordings_recorded_at_idx ON recordings(recorded_at DESC);

ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY recordings_select_own
  ON recordings
  FOR SELECT
  USING (mentor_id = auth.uid() OR learner_id = auth.uid());

CREATE POLICY recordings_insert_own
  ON recordings
  FOR INSERT
  WITH CHECK (mentor_id = auth.uid() OR learner_id = auth.uid());

CREATE POLICY recordings_update_own
  ON recordings
  FOR UPDATE
  USING (mentor_id = auth.uid() OR learner_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid() OR learner_id = auth.uid());
