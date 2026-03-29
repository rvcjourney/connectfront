import { supabase } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';

export const mentorApi = {
  searchMentors: async ({ query, specialization }) => {
    try {
      let dbQuery = supabase
        .from('mentor_profiles')
        .select(`
          id,
          specialization,
          bio,
          experience_years,
          price_per_hour,
          rating,
          total_sessions,
          profiles:id (
            id,
            name,
            email,
            avatar_url
          )
        `);

      if (specialization) {
        dbQuery = dbQuery.ilike('specialization', `%${specialization}%`);
      }

      if (query) {
        // Search in profiles table (name)
        const { data: profileMatches, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .ilike('name', `%${query}%`)
          .eq('role', 'mentor');

        if (profileError) throw profileError;

        if (profileMatches.length === 0) return [];

        const mentorIds = profileMatches.map(p => p.id);
        dbQuery = dbQuery.in('id', mentorIds);
      }

      const { data, error } = await dbQuery.order('rating', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getMentorWithProfile: async (mentorId) => {
    try {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .select(`
          id,
          specialization,
          bio,
          experience_years,
          price_per_hour,
          rating,
          total_sessions,
          profiles:id (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('id', mentorId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getTopMentors: async (limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .select(`
          id,
          specialization,
          bio,
          experience_years,
          price_per_hour,
          rating,
          total_sessions,
          profiles:id (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getMentorsBySpecialization: async (specialization, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .select(`
          id,
          specialization,
          bio,
          experience_years,
          price_per_hour,
          rating,
          total_sessions,
          profiles:id (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .ilike('specialization', `%${specialization}%`)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getMentorsByCategory: async () => {
    try {
      console.log('📂 Fetching mentors by category...');
      const { data, error } = await supabase
        .from('mentor_profiles')
        .select(`
          id,
          category,
          specialization,
          bio,
          experience_years,
          price_per_hour,
          rating,
          total_sessions,
          profiles:id (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .order('category', { ascending: true })
        .order('rating', { ascending: false });

      if (error) throw error;

      // Group mentors by category
      const grouped = {};
      (data || []).forEach(mentor => {
        const category = mentor.category || 'Others';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(mentor);
      });

      console.log('✅ Mentors grouped by category:', Object.keys(grouped));
      return grouped;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
