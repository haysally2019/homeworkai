'use client';

import { useState, lazy, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useClasses } from '@/hooks/use-classes';
import {
  MessageSquare,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Settings,
  Sparkles,
  Flame,
  BookOpen,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const PaywallModal = lazy(() => import('@/components/PaywallModal').then(m => ({ default: m.PaywallModal })));

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const { user, credits, isPro, currentStreak } = useAuth();
  const { classes } = useClasses(user?.id);
  
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = pathname === href;
    return (
      <Button
        onClick={() => router.push(href)}
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 mb-1",
          isActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
          isCollapsed && "justify-center px-0"
        )}
        title={isCollapsed ? label : undefined}
      >
        <Icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-slate-400")} />
        {!isCollapsed && <span className="font-medium">{label}</span>}
      </Button>
    );
  };

  return (
    <>
      <div 
        className={cn(
          "flex flex-col border-r border-slate-100 bg-white transition-all duration-300 relative z-20",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* HEADER: Centered Logo + Collapse Toggle */}
        <div className="flex h-20 items-center justify-between px-4 border-b border-slate-100 relative">
          
          {!isCollapsed && (
            <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
              <div className="relative h-8 w-32 pointer-events-auto transition-transform hover:scale-105">
                <Image 
                  src="https://i.imgur.com/8PqYx8W.png" 
                  alt="LockIn AI" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          )}

          {/* Toggle Button (Moves to center if collapsed) */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "z-10 text-slate-400 hover:text-slate-600",
              !isCollapsed && "ml-auto" // Push to right if expanded
            )}
          >
            {isCollapsed ? <div className="p-2 bg-blue-50 rounded-lg"><ChevronRight className="w-5 h-5 text-blue-600"/></div> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-6">
            
            {/* Main Navigation */}
            <nav>
              <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem href="/calendar" icon={Calendar} label="Schedule" />
              <NavItem href="/chat" icon={MessageSquare} label="AI Tutor" />
            </nav>

            {/* Classes Section */}
            <div>
              {!isCollapsed && (
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Classes</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => router.push('/classes')}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
              
              <div className="space-y-1">
                {classes?.map((c: any) => (
                  <NavItem 
                    key={c.id} 
                    href={`/classes/${c.id}`} 
                    icon={BookOpen} 
                    label={c.name} 
                  />
                ))}
                {(!classes || classes.length === 0) && !isCollapsed && (
                  <div className="px-2 py-4 text-center border border-dashed rounded-lg border-slate-200">
                    <p className="text-xs text-slate-400 mb-2">No classes yet</p>
                    <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={() => router.push('/classes')}>
                      Add Class
                    </Button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* FOOTER */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          
          {/* Streak Badge */}
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-100">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-600" />
              <span className="text-xs font-bold">{currentStreak} Day Streak</span>
            </div>
          )}

          {/* Credits / Pro Status */}
          {!isCollapsed ? (
            <div className="mb-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-slate-500">Daily Credits</span>
                <span className={cn("text-xs font-bold", isPro ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600" : "text-slate-900")}>
                  {isPro ? 'Unlimited' : `${credits}/5`}
                </span>
              </div>
              
              {/* Progress Bar for Free Users */}
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", isPro ? "bg-gradient-to-r from-blue-500 to-indigo-500" : "bg-blue-500")}
                  style={{ width: isPro ? '100%' : `${(credits / 5) * 100}%` }}
                />
              </div>

              {!isPro ? (
                <Button 
                  onClick={() => setShowPaywall(true)}
                  size="sm" 
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 text-xs h-8 shadow-sm font-medium"
                >
                  <Sparkles className="w-3 h-3 mr-1.5 text-yellow-400" />
                  Upgrade Pro
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 py-1.5 rounded-lg border border-slate-100">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span>Pro Active</span>
                </div>
              )}
            </div>
          ) : (
            // Collapsed Footer Icon
            <div className="flex justify-center mb-3">
               <div className={cn("w-8 h-8 rounded-full flex items-center justify-center cursor-pointer", isPro ? "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600" : "bg-slate-100 text-slate-500")} onClick={() => !isPro && setShowPaywall(true)}>
                 {isPro ? <Sparkles className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
               </div>
            </div>
          )}

          <Button 
            onClick={handleSignOut} 
            variant="ghost" 
            className={cn(
              "w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors h-9",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-3 text-sm">Sign Out</span>}
          </Button>
        </div>
      </div>

      {showPaywall && (
        <Suspense fallback={null}>
          <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
        </Suspense>
      )}
    </>
  );
}