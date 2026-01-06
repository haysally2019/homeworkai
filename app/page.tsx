'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // If logged in, go straight to classes
        router.push('/classes');
      } else {
        // If not logged in, go to login
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );
}