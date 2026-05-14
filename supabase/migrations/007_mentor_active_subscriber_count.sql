-- Public-safe aggregate: active video-library subscribers per mentor (for mentor profile UI).
-- Uses SECURITY DEFINER so counts are readable without exposing learner_unlocks rows under RLS.

CREATE OR REPLACE FUNCTION public.mentor_active_subscriber_count(p_mentor_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT count(*)::int
      FROM public.learner_unlocks lu
      WHERE lu.mentor_id = p_mentor_id
        AND (lu.expires_at IS NULL OR lu.expires_at > now())
    ),
    0
  );
$$;

REVOKE ALL ON FUNCTION public.mentor_active_subscriber_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mentor_active_subscriber_count(uuid) TO anon, authenticated;
