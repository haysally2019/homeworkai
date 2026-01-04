'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicPage = pathname === '/login' || pathname === '/signup' || pathname === '/';

  return (
    <html lang="en" className="light">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex h-screen bg-slate-50 overflow-hidden">
            {!isPublicPage && <Sidebar />}

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              {children}
            </div>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}