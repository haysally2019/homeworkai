'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  ChevronRight, // Added this import
  CheckCircle2, 
  Layers, 
  ArrowRight
} from 'lucide-react';
import { format, isToday, isPast, isFuture, isSameDay, parseISO, startOfDay, addDays } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Assignment {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  class_id: string;
  classes: {
    name: string;
    color: string;
  };
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (user) fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`*, classes(name, color)`)
        .eq('user_id', user?.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, completed: !currentStatus } : a));
    const { error } = await supabase.from('assignments').update({ completed: !currentStatus }).eq('id', id);
    if (error) { toast.error('Update failed'); fetchAssignments(); }
  };

  // Helper to safely parse dates without timezone shifts
  const safeDate = (dateStr: string) => {
    // Append time to force local parsing if it's YYYY-MM-DD
    return dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T12:00:00`);
  };

  // Grouping Logic
  const activeAssignments = assignments.filter(a => !a.completed);
  
  const overdue = activeAssignments.filter(a => a.due_date && isPast(startOfDay(safeDate(a.due_date))) && !isToday(safeDate(a.due_date)));
  const today = activeAssignments.filter(a => a.due_date && isToday(safeDate(a.due_date)));
  const upcoming = activeAssignments.filter(a => a.due_date && isFuture(startOfDay(safeDate(a.due_date))) && !isToday(safeDate(a.due_date)));
  const noDate = activeAssignments.filter(a => !a.due_date);

  // Calendar Markers
  const daysWithTasks = activeAssignments
    .filter(a => a.due_date)
    .map(a => safeDate(a.due_date!));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-50/50">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            Agenda
          </h1>
          <p className="text-slate-500 mt-1">Manage your deadlines and tasks from all classes</p>
        </div>
        <Link href="/classes">
          <Button variant="outline" className="hidden md:flex">
            Go to Classes <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Sticky Calendar Widget */}
        <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="w-full pointer-events-auto bg-white p-4"
                modifiers={{ hasTask: daysWithTasks }}
                modifiersStyles={{
                  hasTask: { 
                    color: '#2563eb',
                    fontWeight: 'bold',
                    textDecoration: 'underline', 
                    textDecorationColor: '#2563eb'
                  }
                }}
              />
            </CardContent>
          </Card>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-slate-500" /> Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-center">
                <div className="text-2xl font-bold text-red-600">{overdue.length}</div>
                <div className="text-[10px] text-red-500 font-medium uppercase tracking-wider">Overdue</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                <div className="text-2xl font-bold text-emerald-600">{today.length + upcoming.length}</div>
                <div className="text-[10px] text-emerald-500 font-medium uppercase tracking-wider">Upcoming</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Task List */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. Overdue */}
          {overdue.length > 0 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 text-red-600 font-bold px-1">
                <AlertCircle className="w-5 h-5" /> Overdue
              </div>
              <div className="grid gap-2">
                {overdue.map(a => <TaskItem key={a.id} assignment={a} onToggle={toggleComplete} variant="overdue" />)}
              </div>
            </div>
          )}

          {/* 2. Today */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-700 font-bold px-1">
              <CalendarIcon className="w-5 h-5" /> Today
            </div>
            {today.length > 0 ? (
              <div className="grid gap-2">
                {today.map(a => <TaskItem key={a.id} assignment={a} onToggle={toggleComplete} variant="default" />)}
              </div>
            ) : (
              <div className="p-6 border border-blue-100 bg-blue-50/50 rounded-xl text-center text-blue-600 text-sm">
                No tasks due today. Enjoy your free time!
              </div>
            )}
          </div>

          {/* 3. Upcoming */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700 font-bold px-1 mt-4">
                <Clock className="w-5 h-5" /> Upcoming
              </div>
              <div className="grid gap-2">
                {upcoming.map(a => <TaskItem key={a.id} assignment={a} onToggle={toggleComplete} variant="default" />)}
              </div>
            </div>
          )}

          {/* 4. No Due Date / Backlog */}
          {noDate.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-500 font-bold px-1 mt-4">
                <Layers className="w-5 h-5" /> No Due Date
              </div>
              <div className="grid gap-2">
                {noDate.map(a => <TaskItem key={a.id} assignment={a} onToggle={toggleComplete} variant="subtle" />)}
              </div>
            </div>
          )}

          {assignments.length === 0 && !loading && (
            <div className="text-center py-20 opacity-50">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-700">All caught up!</h3>
              <p className="text-slate-500">No pending assignments found in any class.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function TaskItem({ assignment, onToggle, variant = 'default' }: { assignment: Assignment, onToggle: any, variant?: 'default' | 'overdue' | 'subtle' }) {
  const styles = {
    default: "bg-white border-slate-200 hover:border-blue-300 shadow-sm",
    overdue: "bg-red-50/30 border-red-100 hover:border-red-300",
    subtle: "bg-slate-50 border-slate-100 opacity-80 hover:opacity-100 hover:bg-white"
  };

  const safeDate = (dateStr: string) => dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T12:00:00`);

  return (
    <div className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 group", styles[variant])}>
      <Checkbox 
        checked={assignment.completed} 
        onCheckedChange={() => onToggle(assignment.id, assignment.completed)}
        className={cn(
          "w-5 h-5 transition-all",
          variant === 'overdue' ? "data-[state=checked]:bg-red-600 border-red-300" : "data-[state=checked]:bg-blue-600"
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-900 truncate">{assignment.title}</p>
          <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-white/50" style={{ borderColor: assignment.classes?.color, color: assignment.classes?.color }}>
            {assignment.classes?.name}
          </Badge>
        </div>
        {assignment.due_date ? (
          <p className={cn("text-xs mt-0.5 font-medium flex items-center gap-1", variant === 'overdue' ? "text-red-600" : "text-slate-500")}>
            <Clock className="w-3 h-3" />
            {format(safeDate(assignment.due_date), "EEEE, MMM do")}
            {variant === 'overdue' && " • Overdue"}
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-0.5 italic">No deadline set</p>
        )}
      </div>
      <Link href={`/classes/${assignment.class_id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}