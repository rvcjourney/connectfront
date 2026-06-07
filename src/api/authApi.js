import { supabase } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';

function generateUsername(email) {
  const prefix = email.split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${suffix}`;
}

export const authApi = {
  signUp: async ({ email, password, name, role }) => {
    try {

      // Create auth user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      // Create profile with created_at timestamp
      const username = generateUsername(email);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email,
            name,
            role,
            username,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      // Create role-specific profile
      if (role === 'mentor') {
        const { error: mentorError } = await supabase
          .from('mentor_profiles')
          .insert([
            {
              id: userId,
              specialization: '',
              bio: '',
              experience_years: 0,
              price_per_hour: 0,
            },
          ]);

        if (mentorError) {
        } else {
        }
      } else if (role === 'learner') {
        const { error: learnerError } = await supabase
          .from('learner_profiles')
          .insert([
            {
              id: userId,
              bio: '',
              interests: [],
            },
          ]);

        if (learnerError) {
        } else {
        }
      }

      return {
        user: authData.user,
        profile: profileData,
        message: 'Account created! Check your email to verify.',
      };
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  signIn: async ({ email, password }) => {
    try {

      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Don't fetch profile here - let AuthContext listener do it
      // This prevents double-fetching and timeout issues
      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  sendPasswordResetOtp: async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  verifyOtp: async (email, otp) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: 'email',
      });
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  updatePassword: async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

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
};
