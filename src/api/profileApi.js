import { supabase } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';

export const profileApi = {
  getProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
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
        .select('*')
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
        .update({
          ...(specialization && { specialization }),
          ...(bio !== undefined && { bio }),
          ...(experienceYears !== undefined && { experience_years: experienceYears }),
          ...(pricePerHour !== undefined && { price_per_hour: pricePerHour }),
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

  getLearnerProfile: async (learnerId) => {
    try {
      const { data, error } = await supabase
        .from('learner_profiles')
        .select('*')
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
        .update({
          ...(bio !== undefined && { bio }),
          ...(interests && { interests }),
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

  uploadAvatar: async ({ userId, imageUri, fileName }) => {
    try {
      const fileExt = fileName.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Upload to storage
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update profile with avatar URL
      await profileApi.updateProfile({
        userId,
        avatarUrl: data.publicUrl,
      });

      return data.publicUrl;
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
