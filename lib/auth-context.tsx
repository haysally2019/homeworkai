'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  credits: number;
  isPro: boolean;
  currentStreak: number;
  longestStreak: number;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  credits: 0,
  isPro: false,
  currentStreak: 0,
  longestStreak: 0,
  refreshCredits: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  
  // Initialize client once
  const [supabase] = useState(() => createClient());

  const refreshCredits = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('users_credits')
        .select('credits, is_pro, current_streak, longest_streak')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setCredits(data.credits);
        setIsPro(data.is_pro);
        setCurrentStreak(data.current_streak || 0);
        setLongestStreak(data.longest_streak || 0);
      }
    } catch (error) {
      console.error("Error refreshing credits:", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check active session
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth init error:", error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes (login/logout/refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (user) {
      refreshCredits();
    } else {
      setCredits(0);
      setIsPro(false);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, credits, isPro, currentStreak, longestStreak, refreshCredits }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);