'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Flame, BookOpen, CheckCircle2, 
  Clock, ArrowRight, TrendingUp, Calendar, 
  Plus, GraduationCap 
} from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    streak: 0,
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    nextDue: null as any,
  });
  const [classes, setClasses] = useState<any[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      // 1. Fetch Streak & Credits
      const { data: creditData } = await supabase
        .from('users_credits')
        .select('streak_count')
        .eq('id', user?.id)
        .single();

      // 2. Fetch Classes
      const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // 3. Fetch All Assignments (for analytics)
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', user?.id)
        .order('due_date', { ascending: true });

      // --- Calculate Analytics ---
      const total = assignmentData?.length || 0;
      const completed = assignmentData?.filter((a: any) => a.completed).length || 0;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // Find next pending assignment
      const upcoming = assignmentData?.filter((a: any) => !a.completed && a.due_date);
      const nextDue = upcoming?.[0] || null;

      setStats({
        streak: creditData?.streak_count || 0,
        totalTasks: total,
        completedTasks: completed,
        completionRate: rate,
        nextDue
      });

      setClasses(classData || []);
      // Show top 3 pending, or just recent ones if all done
      setRecentAssignments(upcoming?.slice(0, 3) || []);

    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // --- Empty State (New User) ---
  if (classes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to HomeworkAI</h1>
          <p className="text-slate-500 mb-8">Let's get you set up. Create your first class to start organizing your assignments and notes.</p>
          <Button onClick={() => router.push('/classes')} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base">
            <Plus className="w-5 h-5 mr-2" /> Create First Class
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200 pt-12 pb-8 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back
            </h1>
            <p className="text-slate-500 mt-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          {/* Streak Badge */}
          <div className="bg-orange-50 border border-orange-100 px-4 py-2 rounded-full flex items-center gap-3 shadow-sm">
            <div className="bg-orange-100 p-1.5 rounded-full">
              <Flame className={`w-5 h-5 ${stats.streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-slate-400'}`} />
            </div>
            <div>
              <div className="font-bold text-orange-900 text-sm">{stats.streak} Day Streak</div>
              <div className="text-xs text-orange-600">Keep it up!</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Analytics & Stats */}
        <div className="space-y-6">
          {/* Progress Card */}
          <Card className="p-6 border-slate-200 shadow-sm relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-50" />
            
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4 relative z-10">
              <TrendingUp className="w-4 h-4 text-indigo-600" /> Progress
            </h3>
            
            <div className="space-y-4 relative z-10">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Assignments Done</span>
                  <span className="font-bold text-slate-900">{stats.completedTasks}/{stats.totalTasks}</span>
                </div>
                <Progress value={stats.completionRate} className="h-2.5 bg-slate-100" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.completionRate}%</div>
                  <div className="text-xs text-slate-500">Completion Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalTasks - stats.completedTasks}</div>
                  <div className="text-xs text-slate-500">Pending Tasks</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 flex flex-col justify-center items-center text-center hover:border-indigo-200 transition-colors cursor-pointer bg-white border-slate-200 shadow-sm" onClick={() => router.push('/classes')}>
              <BookOpen className="w-6 h-6 text-blue-600 mb-2" />
              <span className="text-2xl font-bold text-slate-900">{classes.length}</span>
              <span className="text-xs text-slate-500">Active Classes</span>
            </Card>
            <Card className="p-4 flex flex-col justify-center items-center text-center hover:border-indigo-200 transition-colors cursor-pointer bg-white border-slate-200 shadow-sm" onClick={() => router.push('/settings')}>
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-2" />
              <span className="text-2xl font-bold text-slate-900">{stats.completedTasks}</span>
              <span className="text-xs text-slate-500">Finished</span>
            </Card>
          </div>
        </div>

        {/* Center/Right Column: Tasks & Classes */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Priority Task (Only shows if something is pending) */}
          {stats.nextDue && (
            <div className="bg-white rounded-xl p-6 border border-indigo-100 shadow-sm bg-gradient-to-r from-white to-indigo-50/50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 mb-2">Up Next</Badge>
                  <h3 className="text-lg font-bold text-slate-900">{stats.nextDue.title}</h3>
                  <p className="text-slate-500 text-sm mt-1">Due {new Date(stats.nextDue.due_date).toLocaleDateString()}</p>
                </div>
                <Button onClick={() => router.push(`/chat?mode=solver&assignmentId=${stats.nextDue.id}`)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200">
                  Start Work <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Pending List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Priority Tasks</h2>
              <Button variant="link" onClick={() => router.push('/classes')} className="text-indigo-600">View All</Button>
            </div>
            
            <div className="space-y-3">
              {recentAssignments.length === 0 && (
                <div className="text-center py-8 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
                  No pending assignments. You're all caught up!
                </div>
              )}
              {recentAssignments.map((assignment) => (
                <Card 
                  key={assignment.id} 
                  onClick={() => router.push(`/classes/${assignment.class_id}`)}
                  className="p-4 flex items-center justify-between hover:shadow-md transition-all cursor-pointer group border-slate-200 bg-white"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${getDueDateColor(assignment.due_date)}`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{assignment.title}</h4>
                      <p className="text-xs text-slate-500">{assignment.type} • {classes.find(c => c.id === assignment.class_id)?.name || 'Class'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-600">{new Date(assignment.due_date).toLocaleDateString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Class Quick Links */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Your Classes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <Card 
                  key={cls.id} 
                  onClick={() => router.push(`/classes/${cls.id}`)}
                  className="p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer bg-white group relative overflow-hidden border-slate-200"
                >
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: cls.color }} />
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{cls.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 font-mono bg-slate-100 w-fit px-1.5 rounded">{cls.code}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </Card>
              ))}
              
              <Card 
                onClick={() => router.push('/classes')}
                className="p-4 border-dashed border-2 border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer min-h-[100px]"
              >
                <div className="flex items-center gap-2 font-medium">
                  <Plus className="w-5 h-5" /> Add Class
                </div>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function getDueDateColor(dateStr: string) {
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));
  
  if (days < 0) return 'bg-red-100 text-red-600'; // Overdue
  if (days <= 2) return 'bg-orange-100 text-orange-600'; // Urgent
  return 'bg-blue-50 text-blue-600'; // Normal
}