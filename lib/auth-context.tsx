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

      if (error) {
        console.error('Error fetching credits:', error);
        return;
      }

      if (data) {
        setCredits(data.credits);
        setIsPro(data.is_pro);
        setCurrentStreak(data.current_streak || 0);
        setLongestStreak(data.longest_streak || 0);
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
          // OPTIMIZATION: Don't await this. Let it run in background so app loads instantly.
          fetchCredits(session.user.id);
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
            fetchCredits(session.user.id);
          }
        } else {
          setUser(null);
          setCredits(0);
          setIsPro(false);
          setCurrentStreak(0);
          setLongestStreak(0);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, credits, isPro, loading, currentStreak, longestStreak, refreshCredits }}>
      {loading ? (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold shadow-lg text-2xl">
              A
            </div>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);