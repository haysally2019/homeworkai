'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/auth-context';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = pathname === '/login' || pathname === '/signup' || pathname === '/';

  return (
    <AuthProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        {!isPublicPage && <Sidebar />}

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {children}
        </div>
      </div>
      <Toaster />
    </AuthProvider>
  );
}
