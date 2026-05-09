-- Admin-managed categories, profile freeze, payment notes
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

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS admin_note TEXT;

ALTER TABLE app_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_categories_select_public" ON app_categories;
CREATE POLICY "app_categories_select_public" ON app_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "app_categories_anon_mutate" ON app_categories;
CREATE POLICY "app_categories_anon_mutate" ON app_categories
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "app_categories_auth_mutate" ON app_categories;
CREATE POLICY "app_categories_auth_mutate" ON app_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
