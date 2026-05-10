import { supabase } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';

export const homeApi = {
  getVideos: async () => {
    try {
      const { data, error } = await supabase
        .from('home_videos')
        .select('id, type, title, label, video_url, thumbnail_url')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return {
        intro:    (data || []).find(v => v.type === 'intro') || null,
        sessions: (data || []).filter(v => v.type === 'session'),
      };
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
