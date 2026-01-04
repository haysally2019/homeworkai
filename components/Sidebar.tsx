'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  MessageSquare,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Settings,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaywallModal } from '@/components/PaywallModal';
import { cn } from '@/lib/utils';

interface Class {
  id: string;
  name: string;
}

export function Sidebar() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const { user, credits, isPro } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchClasses = async () => {
      const { data: classData } = await supabase
        .from('classes')
        .select('id, name')
        .eq('user_id', user.id)
        .limit(10);

      if (classData) setClasses(classData);
    };

    fetchClasses();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className={cn(
      "h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-sm z-50",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100 h-16 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
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
          
          <div className="space-y-1">
            <Button
              onClick={() => router.push('/chat')}
              variant={pathname === '/chat' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start font-medium transition-all",
                pathname === '/chat' ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                isCollapsed && "justify-center px-2"
              )}
            >
              <MessageSquare className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">AI Chat</span>}
            </Button>
            
            <Button
              onClick={() => router.push('/classes')}
              variant={pathname === '/classes' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start font-medium transition-all",
                pathname === '/classes' ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                isCollapsed && "justify-center px-2"
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Dashboard</span>}
            </Button>

            <Button
              onClick={() => router.push('/settings')}
              variant={pathname === '/settings' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start font-medium transition-all",
                pathname === '/settings' ? "bg-blue-50 text-blue-700 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Settings className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Settings</span>}
            </Button>
          </div>

          {!isCollapsed && (
            <>
              {/* Classes List */}
              <div className="px-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Classes</h3>
                  <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-blue-50 text-slate-400 hover:text-blue-600" onClick={() => router.push('/classes')}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => router.push(`/classes/${cls.id}`)}
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2 group"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors shrink-0" />
                      <span className="truncate">{cls.name}</span>
                    </button>
                  ))}
                  {classes.length === 0 && <p className="text-xs text-slate-400 px-3 italic">No classes yet</p>}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer Area: Credits & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        {!isCollapsed && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Daily Limit</span>
              <span className="text-xs font-bold text-blue-600">{isPro ? '∞' : `${credits}/3`}</span>
            </div>
            
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
              <div 
                className={cn("h-full rounded-full transition-all duration-500", isPro ? "bg-gradient-to-r from-blue-500 to-indigo-500 w-full" : "bg-blue-500")}
                style={{ width: isPro ? '100%' : `${(credits / 3) * 100}%` }} 
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

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}