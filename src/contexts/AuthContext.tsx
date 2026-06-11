import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, session: null, loading: true, profileLoading: true,
  signOut: async () => {}, refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,           setUser]           = useState<User | null>(null);
  const [profile,        setProfile]        = useState<Profile | null>(null);
  const [session,        setSession]        = useState<Session | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data } = await supabase
        .from('profiles').select('*').eq('id', userId).single();
      setProfile(data ? (data as Profile) : null);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const signOut = async () => {
    setUser(null); setProfile(null); setSession(null);
    await supabase.auth.signOut();
  };

  useEffect(() => {
    let isMounted = true;

    const safetyTimer: ReturnType<typeof setTimeout> = setTimeout(() => {
      if (isMounted) { setLoading(false); setProfileLoading(false); }
    }, 10000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        clearTimeout(safetyTimer);
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          setProfile(null);
          setProfileLoading(false);
        }
        setLoading(false);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, profileLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
