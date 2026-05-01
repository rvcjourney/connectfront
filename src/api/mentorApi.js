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

  getMentorsByCategory: async (limitPerCategory = 6) => {
    try {
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
        .order('rating', { ascending: false })
        .limit(300);

      if (error) throw error;

      const grouped = {};
      (data || []).forEach(mentor => {
        const category = mentor.category || 'Others';
        if (!grouped[category]) grouped[category] = [];
        if (grouped[category].length < limitPerCategory) {
          grouped[category].push(mentor);
        }
      });

      return grouped;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  searchMentors: async (query, page = 0, pageSize = 20) => {
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const term = query.trim().toLowerCase();

      const selectFields = `
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
      `;

      // Run profile field search and name search in parallel
      const [fieldRes, nameRes] = await Promise.all([
        supabase
          .from('mentor_profiles')
          .select(selectFields)
          .or(`specialization.ilike.%${term}%,category.ilike.%${term}%,bio.ilike.%${term}%`)
          .order('rating', { ascending: false })
          .range(from, to),
        supabase
          .from('profiles')
          .select('id')
          .ilike('name', `%${term}%`),
      ]);

      if (fieldRes.error) throw fieldRes.error;

      let results = fieldRes.data || [];

      // Fetch mentor profiles for any name matches not already in results
      if (nameRes.data?.length > 0) {
        const existingIds = new Set(results.map(m => m.id));
        const newIds = nameRes.data.map(p => p.id).filter(id => !existingIds.has(id));

        if (newIds.length > 0) {
          const { data: byName } = await supabase
            .from('mentor_profiles')
            .select(selectFields)
            .in('id', newIds)
            .order('rating', { ascending: false });

          if (byName?.length) {
            results = [...results, ...byName];
          }
        }
      }

      return results;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getMentorsByCategoryName: async (category, page = 0, pageSize = 12) => {
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;
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
          profiles:id (id, name, email, avatar_url)
        `)
        .eq('category', category)
        .order('rating', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
