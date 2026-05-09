-- Mentor profession categories
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS mentor_categories (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT    NOT NULL UNIQUE,
  slug        TEXT    NOT NULL UNIQUE,
  icon        TEXT    NOT NULL DEFAULT 'category',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mentor_categories_active_sort_idx
  ON mentor_categories (is_active, sort_order);

ALTER TABLE mentor_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mentor_categories_select_public" ON mentor_categories
  FOR SELECT USING (true);

CREATE POLICY "mentor_categories_auth_mutate" ON mentor_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed data
INSERT INTO mentor_categories (name, slug, sort_order) VALUES
  ('Technology',             'technology',           1),
  ('Software Development',   'software-development', 2),
  ('AI & Machine Learning',  'ai-ml',                3),
  ('Data Science',           'data-science',         4),
  ('Cybersecurity',          'cybersecurity',        5),
  ('Cloud Computing',        'cloud-computing',      6),
  ('Business',               'business',             7),
  ('Entrepreneurship',       'entrepreneurship',     8),
  ('Product Management',     'product-management',   9),
  ('Finance & Investing',    'finance-investing',    10),
  ('Digital Marketing',      'digital-marketing',    11),
  ('Content Creation',       'content-creation',     12),
  ('Design & UX',            'design-ux',            13),
  ('Photography & Video',    'photography-video',    14),
  ('Personal Development',   'personal-development', 15),
  ('Health & Wellness',      'health-wellness',      16),
  ('Education & Coaching',   'education-coaching',   17),
  ('Legal',                  'legal',                18),
  ('Sales',                  'sales',                19),
  ('Other',                  'other',                20)
ON CONFLICT (slug) DO NOTHING;
