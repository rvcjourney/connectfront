import { supabase } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';

export const homeApi = {
  getHeroSlides: async () => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('id, image_url, position')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

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
