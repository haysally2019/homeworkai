'use client';

import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, BookOpen, Trophy, TrendingUp, MessageSquare, FileText, Calendar, Zap, GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  activeClasses: number;
  totalAssignments: number;
  completedAssignments: number;
  recentNotes: number;
  totalConversations: number;
}

interface RecentActivity {
  id: string;
  type: 'note' | 'chat' | 'assignment';
  title: string;
  timestamp: string;
  className?: string;
}

export default function DashboardPage() {
  const { user, credits, currentStreak, longestStreak, isPro } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeClasses: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    recentNotes: 0,
    totalConversations: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Run all count queries in parallel
        const [
          classesCount,
          totalAssignmentsCount,
          completedAssignmentsCount,
          totalNotesCount,
          conversationsCount,
          recentNotesData 
        ] = await Promise.all([
          supabase.from('classes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
          supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('notes')
            .select('id, created_at, title')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        setStats({
          activeClasses: classesCount.count || 0,
          totalAssignments: totalAssignmentsCount.count || 0,
          completedAssignments: completedAssignmentsCount.count || 0,
          recentNotes: totalNotesCount.count || 0,
          totalConversations: conversationsCount.count || 0,
        });

        const activities: RecentActivity[] = recentNotesData.data?.map((note: any) => ({
          id: note.id,
          type: 'note' as const,
          title: note.title || 'Created a new note',
          timestamp: note.created_at,
        })) || [];

        setRecentActivity(activities);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Student';
  };

  const getSchoolName = () => {
    return user?.user_metadata?.school || 'University';
  };

  const completionRate = stats.totalAssignments > 0
    ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">
          {getGreeting()}, {getUserName()}! 👋
        </h1>
        <div className="flex items-center gap-2 text-slate-600">
           <GraduationCap className="w-5 h-5" />
           <span className="text-lg font-medium">{getSchoolName()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ... (Existing Cards Code) ... */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-700">Current Streak</CardTitle>
            <Flame className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{currentStreak} days</div>
            <p className="text-xs text-slate-600 mt-2">
              {currentStreak === longestStreak && currentStreak > 0
                ? "🏆 Personal best!"
                : `Best: ${longestStreak} days`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-700">Credits Available</CardTitle>
            <Zap className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{credits}</div>
            <p className="text-xs text-slate-600 mt-2">
              {isPro ? "Pro member" : "Resets daily"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-700">Active Classes</CardTitle>
            <BookOpen className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.activeClasses}</div>
            <p className="text-xs text-slate-600 mt-2">
              {stats.activeClasses === 0 ? "Add your first class!" : "Keep learning!"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-700">Completion Rate</CardTitle>
            <Trophy className="h-5 w-5 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-600">{completionRate}%</div>
            <p className="text-xs text-slate-600 mt-2">
              {stats.completedAssignments} of {stats.totalAssignments} done
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Your Progress
            </CardTitle>
            <CardDescription>Keep up the great work!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Assignment Completion</span>
                <span className="text-slate-600">{completionRate}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-slate-900">{stats.totalConversations}</div>
                <div className="text-sm text-slate-600 flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  AI Conversations
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-slate-900">{stats.recentNotes}</div>
                <div className="text-sm text-slate-600 flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Notes Created
                </div>
              </div>
            </div>

            {currentStreak >= 7 && (
              <div className="bg-gradient-to-r from-orange-100 to-red-100 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 text-white rounded-full p-2">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-orange-900">Week Streak Achievement!</div>
                    <div className="text-sm text-orange-700">You've studied for {currentStreak} days straight!</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/chat" className="block">
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Start AI Chat
              </Button>
            </Link>
            <Link href="/classes" className="block">
              <Button className="w-full justify-start" variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                View Classes
              </Button>
            </Link>
            <Link href="/chat" className="block">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Take Notes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest learning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                  <div className="bg-blue-100 rounded-full p-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">{activity.title}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(activity.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.activeClasses === 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Ready to start learning?</h3>
                <p className="text-slate-600 mt-1">Create your first class to begin your journey!</p>
              </div>
              <Link href="/classes">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Create Your First Class
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}