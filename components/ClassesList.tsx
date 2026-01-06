'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Plus, BookOpen, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Class {
  id: string;
  name: string;
  color?: string;
}

export function ClassesList({ isCollapsed }: { isCollapsed: boolean }) {
  const [classes, setClasses] = useState<Class[]>([]);
  const { user } = useAuth();
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
        .order('created_at', { ascending: false })
        .limit(10);

      if (classData) setClasses(classData);
    };

    fetchClasses();

    const channel = supabase
      .channel('classes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchClasses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (isCollapsed) return null;

  return (
    <div className="px-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5" />
          My Classes
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-md"
          onClick={() => router.push('/classes')}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-1">
        {classes.map((cls) => {
          const isActive = pathname === `/classes/${cls.id}`;
          return (
            <button
              key={cls.id}
              onClick={() => router.push(`/classes/${cls.id}`)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2.5 group relative",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200 font-medium"
                  : "text-slate-700 hover:bg-white hover:text-blue-600 hover:shadow-sm"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full transition-all shrink-0",
                isActive ? "bg-white shadow-sm" : "bg-slate-300 group-hover:bg-blue-500"
              )} />
              <span className="truncate flex-1">{cls.name}</span>
              <BookOpen className={cn(
                "h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                isActive && "opacity-100"
              )} />
            </button>
          );
        })}
        {classes.length === 0 && (
          <div className="text-center py-6 px-3">
            <div className="bg-slate-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-3">No classes yet</p>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => router.push('/classes')}
            >
              <Plus className="h-3 w-3 mr-1.5" />
              Create Class
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
