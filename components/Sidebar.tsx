'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Settings,
  Sparkles,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ClassesList } from '@/components/ClassesList';

const PaywallModal = lazy(() => import('@/components/PaywallModal').then(m => ({ default: m.PaywallModal })));

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const { user, credits, isPro, currentStreak } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className={cn(
      "h-full bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 border-r border-slate-200 flex flex-col transition-all duration-300 shadow-lg z-50",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200/60 h-16 shrink-0 bg-white/50 backdrop-blur-sm">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold shadow-md">A</div>
            <span className="font-bold text-slate-800 text-lg">Altus</span>
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
      <ScrollArea className="flex-1 py-4">
        <div className="px-3 space-y-6">
          
          <div className="space-y-1.5">
            <Button
              onClick={() => router.push('/dashboard')}
              variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start font-medium transition-all",
                pathname === '/dashboard' ? "bg-blue-100 text-blue-700 shadow-sm hover:bg-blue-100" : "text-slate-700 hover:bg-white/80 hover:text-blue-600 hover:shadow-sm",
                isCollapsed && "justify-center px-2"
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Dashboard</span>}
            </Button>

            <Button
              onClick={() => router.push('/chat')}
              variant={pathname === '/chat' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start font-medium transition-all",
                pathname === '/chat' ? "bg-blue-100 text-blue-700 shadow-sm hover:bg-blue-100" : "text-slate-700 hover:bg-white/80 hover:text-blue-600 hover:shadow-sm",
                isCollapsed && "justify-center px-2"
              )}
            >
              <MessageSquare className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">AI Chat</span>}
            </Button>

            <Button
              onClick={() => router.push('/settings')}
              variant={pathname === '/settings' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start font-medium transition-all",
                pathname === '/settings' ? "bg-blue-100 text-blue-700 shadow-sm hover:bg-blue-100" : "text-slate-700 hover:bg-white/80 hover:text-blue-600 hover:shadow-sm",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Settings className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Settings</span>}
            </Button>
          </div>

          {!isCollapsed && <ClassesList isCollapsed={isCollapsed} />}
        </div>
      </ScrollArea>

      {/* Footer Area: Credits & Logout */}
      <div className="p-4 border-t border-slate-200/60 bg-white/40 backdrop-blur-sm">
        {!isCollapsed && (
          <>
            {/* Streak Counter - Free Users Only */}
            {!isPro && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className={cn("w-4 h-4", currentStreak >= 5 ? "text-orange-500" : "text-orange-400")} />
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Study Streak</span>
                  </div>
                  <span className="text-lg font-bold text-orange-600">{currentStreak}</span>
                </div>

                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((day) => (
                    <div
                      key={day}
                      className={cn(
                        "flex-1 h-1.5 rounded-full transition-all duration-300",
                        currentStreak >= day ? "bg-orange-500" : "bg-orange-200"
                      )}
                    />
                  ))}
                </div>

                <p className="text-xs text-slate-600">
                  {currentStreak >= 5 ? (
                    <span className="font-semibold text-orange-600">Amazing! Keep it up! 🎉</span>
                  ) : (
                    <>Study <span className="font-semibold">{5 - currentStreak} more day{5 - currentStreak !== 1 ? 's' : ''}</span> for <span className="font-semibold">+10 credits</span></>
                  )}
                </p>
              </div>
            )}

            {/* Credits Display */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Daily Limit</span>
                <span className="text-xs font-bold text-blue-600">{isPro ? '∞' : `${credits}/5`}</span>
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
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 text-xs h-8 shadow-sm"
                >
                  <Sparkles className="w-3 h-3 mr-2 text-yellow-400" />
                  Upgrade to Pro
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 bg-slate-50 py-1.5 rounded-lg border border-slate-100">
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
            "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">Sign Out</span>}
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