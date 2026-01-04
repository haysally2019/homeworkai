'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { BookOpen, MessageSquare, Plus, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Class {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface RecentActivity {
  id: string;
  type: 'class' | 'conversation';
  title: string;
  timestamp: string;
  link: string;
}

export function Sidebar() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (classesData) {
        setClasses(classesData);

        const activity: RecentActivity[] = classesData.slice(0, 5).map(cls => ({
          id: cls.id,
          type: 'class' as const,
          title: cls.name,
          timestamp: cls.created_at,
          link: `/classes/${cls.id}`
        }));

        setRecentActivity(activity);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleNewClass = () => {
    router.push('/classes');
  };

  const handleNewChat = () => {
    router.push('/chat');
  };

  return (
    <div className={cn(
      "h-screen bg-gray-950 border-r border-gray-800 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        {!isCollapsed && (
          <h2 className="font-semibold text-emerald-400 text-lg">PolyPro</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 text-gray-400 hover:text-gray-200"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Button
              onClick={handleNewChat}
              className={cn(
                "w-full justify-start bg-emerald-600 hover:bg-emerald-700",
                isCollapsed && "justify-center px-2"
              )}
            >
              <MessageSquare className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">New Chat</span>}
            </Button>
            <Button
              onClick={handleNewClass}
              variant="outline"
              className={cn(
                "w-full justify-start border-emerald-600/50 text-emerald-400 hover:bg-emerald-950",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Plus className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">New Class</span>}
            </Button>
          </div>

          {!isCollapsed && (
            <>
              <Separator className="bg-gray-800" />

              <div>
                <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                  My Classes
                </h3>
                {loading ? (
                  <div className="text-xs text-gray-500">Loading...</div>
                ) : classes.length === 0 ? (
                  <p className="text-xs text-gray-500">No classes yet</p>
                ) : (
                  <div className="space-y-1">
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => router.push(`/classes/${cls.id}`)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2 group"
                      >
                        <BookOpen className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{cls.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="bg-gray-800" />

              <div>
                <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                  Recent Activity
                </h3>
                {recentActivity.length === 0 ? (
                  <p className="text-xs text-gray-500">No recent activity</p>
                ) : (
                  <div className="space-y-1">
                    {recentActivity.map((activity) => (
                      <button
                        key={activity.id}
                        onClick={() => router.push(activity.link)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3 w-3 text-gray-500 shrink-0" />
                          <span className="truncate">{activity.title}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 ml-5">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-800">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className={cn(
            "w-full justify-start text-gray-400 hover:text-gray-200 hover:bg-gray-800",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}
