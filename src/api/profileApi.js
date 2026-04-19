import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';

export const profileApi = {
  getProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, email, role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updateProfile: async ({ userId, name, avatarUrl }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...(name && { name }),
          ...(avatarUrl && { avatar_url: avatarUrl }),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getMentorProfile: async (mentorId) => {
    try {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .select('id, specialization, bio, experience_years, price_per_hour, rating, total_sessions')
        .eq('id', mentorId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updateMentorProfile: async ({
    userId,
    specialization,
    bio,
    experienceYears,
    pricePerHour,
  }) => {
    try {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .upsert({
          id: userId,
          specialization: specialization || '',
          bio: bio || '',
          experience_years: experienceYears ?? 0,
          price_per_hour: pricePerHour ?? 0,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getLearnerProfile: async (learnerId) => {
    try {
      const { data, error } = await supabase
        .from('learner_profiles')
        .select('id, bio, interests')
        .eq('id', learnerId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updateLearnerProfile: async ({ userId, bio, interests }) => {
    try {
      const { data, error } = await supabase
        .from('learner_profiles')
        .upsert({
          id: userId,
          bio: bio || '',
          interests: interests ?? [],
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  uploadAvatar: async ({ userId, base64, mimeType, fileName }) => {
    try {
      const fileExt = (fileName || 'avatar.jpg').split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Decode base64 → ArrayBuffer (pure JS, no fetch — works on Android)
      const arrayBuffer = decode(base64);

      const { error: uploadError } = await supabase.storage
        .from('connectiqo_avatar')
        .upload(filePath, arrayBuffer, {
          contentType: mimeType || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;
      console.log('✅ Storage upload success | userId:', userId, '| filePath:', filePath);

      // Get public URL with cache-bust timestamp
      const { data } = supabase.storage.from('connectiqo_avatar').getPublicUrl(filePath);
      const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
      console.log('🔗 Public URL:', avatarUrl);

      // Update profiles table with timestamped URL so refreshProfile loads the fresh image
      const { data: updated, error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId)
        .select('avatar_url')
        .single();

      if (profileError) {
        console.error('❌ profiles update error:', profileError);
        throw profileError;
      }
      console.log('✅ profiles.avatar_url updated to:', updated?.avatar_url);

      return avatarUrl;
    } catch (error) {
      console.error('uploadAvatar error:', error);
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  createMentorProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .upsert({
          id: userId,
          specialization: '',
          bio: '',
          experience_years: 0,
          price_per_hour: 0,
          rating: 0,
          total_sessions: 0,
          category: '',
        }, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  createLearnerProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('learner_profiles')
        .upsert({
          id: userId,
          bio: '',
          interests: [],
        }, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updateMentorCategory: async (mentorId, category) => {
    try {
      console.log(`📂 Updating mentor ${mentorId} category to: ${category}`);
      const { data, error } = await supabase
        .from('mentor_profiles')
        .update({ category })
        .eq('id', mentorId)
        .select()
        .single();

      if (error) throw error;
      console.log(`✅ Category updated successfully:`, data);
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
