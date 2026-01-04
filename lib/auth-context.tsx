'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  credits: number;
  isPro: boolean;
  loading: boolean;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  credits: 0,
  isPro: false,
  loading: true,
  refreshCredits: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchCredits = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('users_credits')
        .select('credits, is_pro')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching credits:', error);
        return;
      }

      if (data) {
        setCredits(data.credits);
        setIsPro(data.is_pro);
      }
    } catch (error) {
      console.error('Exception fetching credits:', error);
    }
  };

  const refreshCredits = async () => {
    if (user) {
      await fetchCredits(user.id);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchCredits(session.user.id);
        }
      } catch (error) {
        console.error('Exception in initAuth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            (async () => {
              await fetchCredits(session.user.id);
            })();
          }
        } else {
          setUser(null);
          setCredits(0);
          setIsPro(false);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, credits, isPro, loading, refreshCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
