-- Admin-managed categories, home marketing clips, profile freeze, payment notes
-- Apply in Supabase SQL Editor if migrations are not auto-run.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.is_frozen IS 'When true, user cannot use the app until admin unfreezes.';

CREATE TABLE IF NOT EXISTS app_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_categories_active_sort_idx
  ON app_categories (is_active, sort_order);

CREATE TABLE IF NOT EXISTS home_marketing_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  clip_type TEXT NOT NULL DEFAULT 'youtube'
    CHECK (clip_type IN ('youtube', 'url')),
  youtube_video_id TEXT,
  media_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS home_marketing_clips_active_sort_idx
  ON home_marketing_clips (is_active, sort_order);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS admin_note TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-clips', 'marketing-clips', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE app_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_marketing_clips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_categories_select_public" ON app_categories;
CREATE POLICY "app_categories_select_public" ON app_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "app_categories_anon_mutate" ON app_categories;
CREATE POLICY "app_categories_anon_mutate" ON app_categories
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "app_categories_auth_mutate" ON app_categories;
CREATE POLICY "app_categories_auth_mutate" ON app_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "home_marketing_clips_select_public" ON home_marketing_clips;
CREATE POLICY "home_marketing_clips_select_public" ON home_marketing_clips
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "home_marketing_clips_anon_mutate" ON home_marketing_clips;
CREATE POLICY "home_marketing_clips_anon_mutate" ON home_marketing_clips
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "home_marketing_clips_auth_mutate" ON home_marketing_clips;
CREATE POLICY "home_marketing_clips_auth_mutate" ON home_marketing_clips
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "marketing_clips_public_read" ON storage.objects;
CREATE POLICY "marketing_clips_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'marketing-clips');

DROP POLICY IF EXISTS "marketing_clips_anon_upload" ON storage.objects;
CREATE POLICY "marketing_clips_anon_upload" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'marketing-clips');

DROP POLICY IF EXISTS "marketing_clips_anon_update" ON storage.objects;
CREATE POLICY "marketing_clips_anon_update" ON storage.objects
  FOR UPDATE TO anon USING (bucket_id = 'marketing-clips');

DROP POLICY IF EXISTS "marketing_clips_anon_delete" ON storage.objects;
CREATE POLICY "marketing_clips_anon_delete" ON storage.objects
  FOR DELETE TO anon USING (bucket_id = 'marketing-clips');

DROP POLICY IF EXISTS "marketing_clips_auth_upload" ON storage.objects;
CREATE POLICY "marketing_clips_auth_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'marketing-clips');

DROP POLICY IF EXISTS "marketing_clips_auth_update" ON storage.objects;
CREATE POLICY "marketing_clips_auth_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'marketing-clips');

DROP POLICY IF EXISTS "marketing_clips_auth_delete" ON storage.objects;
CREATE POLICY "marketing_clips_auth_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'marketing-clips');
