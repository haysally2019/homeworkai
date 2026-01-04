'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen, MessageSquare, Plus, ChevronLeft, ChevronRight, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Class {
  id: string;
  name: string;
}

export function Sidebar() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const fetchClasses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('classes').select('id, name').eq('user_id', user.id).limit(10);
      if (data) setClasses(data);
    };
    fetchClasses();
  }, []);

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
      <div className="p-4 flex items-center justify-between border-b border-slate-100 h-16">
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

      <ScrollArea className="flex-1 py-4">
        <div className="px-3 space-y-4">
          <div className="space-y-1">
            <Button
              onClick={() => router.push('/chat')}
              variant={pathname === '/chat' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start font-medium",
                pathname === '/chat' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50",
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
                "w-full justify-start font-medium",
                pathname === '/classes' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50",
                isCollapsed && "justify-center px-2"
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Dashboard</span>}
            </Button>
          </div>

          {!isCollapsed && (
            <>
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
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span className="truncate">{cls.name}</span>
                    </button>
                  ))}
                  {classes.length === 0 && <p className="text-xs text-slate-400 px-3">No classes added</p>}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-slate-100">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className={cn(
            "w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}