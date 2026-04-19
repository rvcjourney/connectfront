import { supabase } from '../lib/supabase';

const CACHE_TTL_MS = 5 * 60 * 1000; // re-fetch after 5 minutes

let _cache = {};
let _fetchedAt = 0;

const DEFAULTS = {
  home_video_id:       'qp0HIF3SfI4',
  home_video_title:    'How Great Leaders Inspire Action',
  home_video_duration: '18:01',
};

async function fetchAll() {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('key, value');
    if (error || !data) return;
    _cache = {};
    data.forEach(row => { _cache[row.key] = row.value; });
    _fetchedAt = Date.now();
  } catch {
    // silently fall back to defaults / last cache
  }
}

export async function loadRemoteConfig() {
  const stale = Date.now() - _fetchedAt > CACHE_TTL_MS;
  if (stale) await fetchAll();
}

export function getConfig(key) {
  return _cache[key] ?? DEFAULTS[key] ?? null;
}
