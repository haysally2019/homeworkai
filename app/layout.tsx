import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Altus - Academic Intelligence',
  description: 'Your AI-powered university companion',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className={inter.className}>
        <div className="flex h-screen bg-slate-50 overflow-hidden">
          {/* Global Sidebar */}
          <Sidebar />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {children}
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}