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
  Calendar // Added Calendar Icon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
    <Button
      onClick={() => router.push(href)}
      variant={pathname === href ? 'secondary' : 'ghost'}
      className={cn(
        "w-full justify-start font-medium transition-all group",
        pathname === href 
          ? "bg-blue-100 text-blue-700 shadow-sm hover:bg-blue-100" 
          : "text-slate-600 hover:bg-slate-50 hover:text-blue-600",
        isCollapsed && "justify-center px-2"
      )}
    >
      <Icon className={cn("h-5 w-5", pathname === href ? "text-blue-700" : "text-slate-500 group-hover:text-blue-600")} />
      {!isCollapsed && <span className="ml-3">{label}</span>}
    </Button>
  );

  return (
    <div className={cn(
      "h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-xl shadow-slate-200/50 z-50",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between h-16 shrink-0 border-b border-slate-100">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">A</div>
            <span className="font-bold text-slate-800 text-lg tracking-tight">LockIn AI</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 ml-auto"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 py-6">
        <div className="px-3 space-y-8">
          
          <div className="space-y-1">
            <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem href="/classes" icon={BookOpen} label="My Classes" />
            <NavItem href="/calendar" icon={Calendar} label="Calendar" /> {/* Added Calendar Link */}
            <NavItem href="/chat" icon={MessageSquare} label="AI Chat" />
            <NavItem href="/settings" icon={Settings} label="Settings" />
          </div>

          {!isCollapsed && (
            <div className="px-2">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Access</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-full" 
                  onClick={() => router.push('/classes')}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-1">
                {classes?.map((cls: any) => {
                  const isActive = pathname === `/classes/${cls.id}`;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => router.push(`/classes/${cls.id}`)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-3 group",
                        isActive
                          ? "bg-slate-50 text-slate-900 font-medium border border-slate-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div 
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 transition-transform group-hover:scale-110" 
                        style={{ backgroundColor: cls.color || '#94a3b8' }}
                      />
                      <span className="truncate">{cls.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Area */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        {!isCollapsed && (
          <>
            {!isPro && (
              <div className="bg-white border border-orange-100 rounded-xl p-3 mb-3 shadow-sm relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 to-red-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <Flame className={cn("w-4 h-4", currentStreak >= 5 ? "text-orange-500" : "text-orange-400")} />
                    <span className="text-xs font-bold text-slate-700">Streak</span>
                  </div>
                  <span className="text-sm font-bold text-orange-600">{currentStreak}</span>
                </div>
                <div className="flex gap-1 h-1.5 relative z-10">
                  {[1, 2, 3, 4, 5].map((day) => (
                    <div
                      key={day}
                      className={cn(
                        "flex-1 rounded-full transition-all duration-300",
                        currentStreak >= day ? "bg-orange-500" : "bg-orange-100"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 mb-3 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-500">Credits</span>
                <span className="text-xs font-bold text-blue-600">{isPro ? 'Unlimited' : `${credits}/5`}</span>
              </div>

              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", isPro ? "bg-gradient-to-r from-blue-500 to-indigo-500 w-full" : "bg-blue-500")}
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
          </>
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

      {showPaywall && (
        <Suspense fallback={null}>
          <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
        </Suspense>
      )}
    </div>
  );
}