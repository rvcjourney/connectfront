import { supabase } from '../lib/supabase';
import { getSupabaseErrorMessage } from '../lib/supabaseErrorHandler';

export const authApi = {
  signUp: async ({ email, password, name, role }) => {
    try {
      console.log('📝 Starting signup for:', email);

      // Create auth user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      console.log('✅ Auth user created');

      const userId = authData.user.id;

      // Create profile with created_at timestamp
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email,
            name,
            role,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (profileError) throw profileError;
      console.log('✅ Profile created with timestamp');

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
          console.log('⚠️ Mentor profile creation failed:', mentorError.message);
        } else {
          console.log('✅ Mentor profile created');
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
          console.log('⚠️ Learner profile creation failed:', learnerError.message);
        } else {
          console.log('✅ Learner profile created');
        }
      }

      return {
        user: authData.user,
        profile: profileData,
        message: 'Account created! Check your email to verify.',
      };
    } catch (error) {
      console.log('❌ Signup failed:', error.message);
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  signIn: async ({ email, password }) => {
    try {
      console.log('🔐 Signing in user:', email);

      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      console.log('✅ User signed in successfully');

      // Don't fetch profile here - let AuthContext listener do it
      // This prevents double-fetching and timeout issues
      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      console.log('❌ Sign in failed:', error.message);
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
      console.log('👋 Signing out user');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('✅ User signed out');
    } catch (error) {
      console.log('❌ Sign out failed:', error.message);
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getProfile: async (userId) => {
    try {
      console.log('🔍 Fetching profile for userId:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      console.log('✅ Profile fetched');
      return data;
    } catch (error) {
      console.log('❌ Profile fetch failed:', error.message);
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
