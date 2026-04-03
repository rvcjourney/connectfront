import { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't wait for getSession - show app immediately
    // onAuthStateChange will handle session detection
    setLoading(false);
    console.log('📱 App ready, listening for auth changes...');

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔔 Auth state changed:', event);
        if (newSession?.user) {
          console.log('✅ Session found, fetching profile...');
          setSession(newSession);
          setUser(newSession.user);

          // Add small delay to let session fully establish
          // This prevents hanging on immediate profile queries
          setTimeout(() => {
            fetchProfile(newSession.user.id);
          }, 500);
        } else {
          console.log('❌ No session found');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      console.log('🔍 Fetching profile for userId:', userId);

      // Create a promise that logs if it takes too long
      const slowPromise = new Promise(resolve =>
        setTimeout(() => {
          console.log('⏳ Profile query is slow (3 seconds)...');
          resolve();
        }, 3000)
      );

      // Fetch profile
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Log if it's taking too long, but don't abort
      Promise.race([profilePromise, slowPromise]);

      const { data, error } = await profilePromise;

      if (error) {
        console.error('❌ Profile fetch error:', error.message, error.code || '');

        // If profile doesn't exist and user is authenticated, sign them out
        if (error.code === 'PGRST116' || error.message.includes('not found')) {
          console.log('⚠️ Profile does not exist for userId:', userId);
          console.log('⚠️ Signing out user and clearing session');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        // For other errors, just log and wait for next event
        console.log('⚠️ Query error, waiting for next auth event');
        setLoading(false);
        return;
      }

      if (!data) {
        console.warn('⚠️ No profile data returned for userId:', userId);
        setProfile(null);
      } else {
        console.log('✅ Profile loaded:', data.name, data.role);
        setProfile(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('❌ Profile fetch exception:', error.message);
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
    refreshProfile: () => user && fetchProfile(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
