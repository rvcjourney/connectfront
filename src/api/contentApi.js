import { supabase } from '../lib/supabase';

export async function fetchActiveCategoryNames() {
  try {
    const { data, error } = await supabase
      .from('app_categories')
      .select('name')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('app_categories:', error.message);
      return [];
    }
    return (data || []).map((r) => r.name).filter(Boolean);
  } catch (e) {
    console.warn('app_categories fetch failed:', e?.message);
    return [];
  }
}

export async function fetchHomeMarketingClips() {
  try {
    const { data, error } = await supabase
      .from('home_marketing_clips')
      .select('id, title, subtitle, clip_type, youtube_video_id, media_url, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('home_marketing_clips:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('home_marketing_clips fetch failed:', e?.message);
    return [];
  }
}
