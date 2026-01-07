'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { 
  LayoutDashboard, BookOpen, Settings, 
  LogOut, Flame, GraduationCap, ChevronRight, Clock 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: BookOpen, label: 'Classes', href: '/classes' },
  { icon: Flame, label: 'Roast My Essay', href: '/roast' }, // New Viral Feature
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const supabase = createClient();
  
  const [stats, setStats] = useState({
    streak: 0,
    nextTask: null as any,
    weeklyProgress: 0
  });

  useEffect(() => {
    if (user) fetchSidebarStats();
  }, [user]);

  const fetchSidebarStats = async () => {
    try {
      // 1. Get Streak
      const { data: creditData } = await supabase
        .from('users_credits')
        .select('streak_count')
        .eq('id', user?.id)
        .single();

      // 2. Get Assignments for "Next Up" & Progress
      const { data: assignments } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', user?.id)
        .order('due_date', { ascending: true });

      if (assignments) {
        const pending = assignments.filter((a: any) => !a.completed);
        const next = pending.filter((a: any) => a.due_date)[0]; 
        
        const completedCount = assignments.filter((a: any) => a.completed).length;
        const total = assignments.length;
        // Avoid division by zero
        const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

        setStats({
          streak: creditData?.streak_count || 0,
          nextTask: next,
          weeklyProgress: progress
        });
      }
    } catch (e) {
      console.error("Sidebar stats error", e);
    }
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col flex-shrink-0 fixed left-0 top-0 z-50">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl text-slate-900 tracking-tight">Altus AI</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 font-medium' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {item.label}
              </div>
            </Link>
          );
        })}

        {/* --- DYNAMIC DASHBOARD WIDGETS --- */}
        
        {/* 1. Streak Widget */}
        <div className="mt-8 px-2">
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full shadow-sm">
                <Flame className={`w-4 h-4 ${stats.streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-slate-300'}`} />
              </div>
              <div>
                <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider">Daily Streak</p>
                <p className="text-lg font-bold text-orange-900">{stats.streak} Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Mini "Up Next" Card */}
        {stats.nextTask && (
          <div className="mt-4 px-2">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center">
                <Clock className="w-3 h-3 mr-1" /> UP NEXT
              </p>
              <div className="mb-2">
                <p className="text-sm font-medium text-slate-800 line-clamp-1">{stats.nextTask.title}</p>
                <p className="text-xs text-slate-500">Due {new Date(stats.nextTask.due_date).toLocaleDateString()}</p>
              </div>
              <Link href={`/classes/${stats.nextTask.class_id}`}>
                <Button size="sm" variant="outline" className="w-full h-7 text-xs bg-white">
                  Open Task <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* 3. Progress Bar */}
        <div className="mt-4 px-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-500 font-medium">Completion Rate</span>
            <span className="text-indigo-600 font-bold">{stats.weeklyProgress}%</span>
          </div>
          <Progress value={stats.weeklyProgress} className="h-1.5" />
        </div>

      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
            {user?.email?.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
            <p className="text-xs text-slate-500">Student Plan</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 h-8 text-sm"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
}