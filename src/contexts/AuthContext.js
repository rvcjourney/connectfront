import { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { registerFcmToken } from '../utils/fcmToken';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingPasswordReset, setPendingPasswordReset] = useState(false);

  useEffect(() => {
    let active = true;

    const bootstrapSession = async () => {
      try {
        console.log('📱 Restoring auth session...');
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Session restore timed out')), 12_000),
          ),
        ]);
        const {
          data: { session: initialSession },
        } = sessionResult;

        if (!active) return;

        if (initialSession?.user) {
          console.log('✅ Initial session restored, fetching profile...');
          setSession(initialSession);
          setUser(initialSession.user);
          // Do not block app startup on profile query.
          fetchProfile(initialSession.user.id);
          setLoading(false);
        } else {
          console.log('❌ No initial session found');
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Session bootstrap failed:', error?.message || error);
        if (!active) return;
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    bootstrapSession();

    // Listen for auth changes after bootstrap starts
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!active) return;
        console.log('🔔 Auth state changed:', event);
        if (newSession?.user) {
          console.log('✅ Session found, fetching profile...');
          setSession(newSession);
          setUser(newSession.user);
          // Keep auth transitions responsive even if profile query is slow.
          fetchProfile(newSession.user.id);
          setLoading(false);
        } else {
          console.log('❌ No session found');
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      active = false;
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
        if (data.is_frozen === true) {
          console.warn('🧊 Profile is frozen — signing out');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          Alert.alert(
            'Account suspended',
            'This account has been frozen by an administrator. Contact support if you believe this is a mistake.'
          );
          setLoading(false);
          return;
        }
        console.log('✅ Profile loaded:', data.name, data.role);
        setProfile(data);
        registerFcmToken(userId);
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
    pendingPasswordReset,
    setPendingPasswordReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
