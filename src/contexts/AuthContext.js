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
        const {
          data: { session: initialSession },
        } = sessionResult;

        if (!active) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          // Do not block app startup on profile query.
          fetchProfile(initialSession.user.id);
          setLoading(false);
        } else {
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
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          // Keep auth transitions responsive even if profile query is slow.
          fetchProfile(newSession.user.id);
          setLoading(false);
        } else {
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        console.error('❌ Profile fetch error:', error.message, error.code || '');

        if (error.code === 'PGRST116' || error.message.includes('not found')) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
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
        setProfile(data);
        registerFcmToken(userId);
      }
      setLoading(false);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn('⚠️ Profile fetch timed out after 8s');
        setLoading(false);
        return;
      }
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
