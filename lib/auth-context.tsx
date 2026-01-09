'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  credits: number;
  isPro: boolean;
  loading: boolean;
  currentStreak: number;
  longestStreak: number;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  credits: 0,
  isPro: false,
  loading: true,
  currentStreak: 0,
  longestStreak: 0,
  refreshCredits: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchCredits = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('users_credits')
        .select('credits, is_pro, current_streak, longest_streak')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setCredits(data.credits);
        setIsPro(data.is_pro);
        setCurrentStreak(data.current_streak || 0);
        setLongestStreak(data.longest_streak || 0);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const refreshCredits = async () => {
    if (user) await fetchCredits(user.id);
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            // PERFORMANCE: Fetch credits in background, don't await
            fetchCredits(session.user.id);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user);
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            fetchCredits(session.user.id);
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
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // PERFORMANCE: Render children immediately. 
  // Do not block the entire app with a spinner. 
  // Protected routes will handle their own loading states.
  return (
    <AuthContext.Provider value={{ user, credits, isPro, loading, currentStreak, longestStreak, refreshCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);