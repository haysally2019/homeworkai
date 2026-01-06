'use client';

import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, BookOpen, Trophy, TrendingUp, MessageSquare, FileText, Calendar, Zap, Target, Award, Sparkles, Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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

interface ClassWithAssignments {
  id: string;
  name: string;
  totalAssignments: number;
  completedAssignments: number;
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
  const [classProgress, setClassProgress] = useState<ClassWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        const [classesRes, assignmentsRes, notesRes, conversationsRes] = await Promise.all([
          (supabase as any).from('classes').select('id, name').eq('user_id', user.id),
          (supabase as any).from('assignments').select('id, completed, class_id').eq('user_id', user.id),
          (supabase as any).from('notes').select('id, created_at, title').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
          (supabase as any).from('conversation_history').select('id').eq('user_id', user.id),
        ]);

        const completedCount = assignmentsRes.data?.filter((a: any) => a.completed).length || 0;

        setStats({
          activeClasses: classesRes.data?.length || 0,
          totalAssignments: assignmentsRes.data?.length || 0,
          completedAssignments: completedCount,
          recentNotes: notesRes.data?.length || 0,
          totalConversations: conversationsRes.data?.length || 0,
        });

        const classProgressData = classesRes.data?.map((cls: any) => {
          const classAssignments = assignmentsRes.data?.filter((a: any) => a.class_id === cls.id) || [];
          const completed = classAssignments.filter((a: any) => a.completed).length;
          return {
            id: cls.id,
            name: cls.name,
            totalAssignments: classAssignments.length,
            completedAssignments: completed,
          };
        }).filter((cls: ClassWithAssignments) => cls.totalAssignments > 0).slice(0, 3) || [];

        setClassProgress(classProgressData);

        const activities: RecentActivity[] = notesRes.data?.slice(0, 5).map((note: any) => ({
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {getUserName()}!
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            Here's your learning progress overview
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="relative overflow-hidden border-orange-200/60 bg-white hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 opacity-50 group-hover:opacity-70 transition-opacity" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-3 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-700">Current Streak</CardTitle>
              <div className="bg-orange-100 p-2 rounded-lg">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold text-orange-600 mb-1">{currentStreak}</div>
              <p className="text-xs font-medium text-slate-600">
                {currentStreak === longestStreak && currentStreak > 0 ? (
                  <span className="flex items-center gap-1 text-orange-700">
                    <Award className="h-3 w-3" /> Personal best!
                  </span>
                ) : (
                  `Best: ${longestStreak} days`
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-blue-200/60 bg-white hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-50 group-hover:opacity-70 transition-opacity" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-3 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-700">Daily Credits</CardTitle>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold text-blue-600 mb-1">{isPro ? '∞' : credits}</div>
              <p className="text-xs font-medium text-slate-600">
                {isPro ? (
                  <span className="flex items-center gap-1 text-blue-700">
                    <Sparkles className="h-3 w-3" /> Pro member
                  </span>
                ) : (
                  `${credits} of 5 remaining`
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-emerald-200/60 bg-white hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-green-50 opacity-50 group-hover:opacity-70 transition-opacity" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-3 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-700">Active Classes</CardTitle>
              <div className="bg-emerald-100 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold text-emerald-600 mb-1">{stats.activeClasses}</div>
              <p className="text-xs font-medium text-slate-600">
                {stats.activeClasses === 0 ? "Start your first" : `${stats.totalAssignments} total tasks`}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-violet-200/60 bg-white hover:shadow-xl transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-fuchsia-50 opacity-50 group-hover:opacity-70 transition-opacity" />
            <CardHeader className="relative flex flex-row items-center justify-between pb-3 space-y-0">
              <CardTitle className="text-sm font-semibold text-slate-700">Completion</CardTitle>
              <div className="bg-violet-100 p-2 rounded-lg">
                <Trophy className="h-5 w-5 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-bold text-violet-600 mb-1">{completionRate}%</div>
              <p className="text-xs font-medium text-slate-600">
                {stats.completedAssignments} of {stats.totalAssignments} done
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <Card className="lg:col-span-2 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Your Progress
                  </CardTitle>
                  <CardDescription className="mt-1">Track your learning journey</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {stats.totalAssignments > 0 ? (
                <>
                  <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        Overall Completion
                      </span>
                      <span className="text-lg font-bold text-blue-600">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-full transition-all duration-700 ease-out shadow-sm"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-600">
                      {stats.completedAssignments} completed out of {stats.totalAssignments} assignments
                    </p>
                  </div>

                  {classProgress.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-700">Class Progress</h4>
                      {classProgress.map((cls) => {
                        const classRate = cls.totalAssignments > 0
                          ? Math.round((cls.completedAssignments / cls.totalAssignments) * 100)
                          : 0;
                        return (
                          <Link key={cls.id} href={`/classes/${cls.id}`}>
                            <div className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-900 group-hover:text-blue-700 transition-colors">{cls.name}</span>
                                <span className="text-sm font-semibold text-slate-600">{classRate}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                                  style={{ width: `${classRate}%` }}
                                />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-slate-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Target className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-600 mb-4">No assignments yet. Create a class to get started!</p>
                  <Link href="/classes">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Class
                    </Button>
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-100 p-1.5 rounded-lg">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Conversations</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900">{stats.totalConversations}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-emerald-100 p-1.5 rounded-lg">
                      <FileText className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Notes</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900">{stats.recentNotes}</div>
                </div>
              </div>

              {currentStreak >= 7 && (
                <div className="bg-gradient-to-r from-orange-50 via-red-50 to-orange-50 border-2 border-orange-300 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl p-2.5 shadow-md">
                      <Flame className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-bold text-orange-900 text-base">Week Streak Unlocked!</div>
                      <div className="text-sm text-orange-700">You've studied for {currentStreak} days straight. Keep it up!</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4 lg:space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/chat" className="block">
                  <Button className="w-full justify-start h-11 text-sm font-medium hover:scale-[1.02] transition-transform" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2.5" />
                    Start AI Chat
                  </Button>
                </Link>
                <Link href="/classes" className="block">
                  <Button className="w-full justify-start h-11 text-sm font-medium hover:scale-[1.02] transition-transform" variant="outline">
                    <BookOpen className="h-4 w-4 mr-2.5" />
                    View All Classes
                  </Button>
                </Link>
                <Link href="/chat" className="block">
                  <Button className="w-full justify-start h-11 text-sm font-medium hover:scale-[1.02] transition-transform" variant="outline">
                    <FileText className="h-4 w-4 mr-2.5" />
                    Take Notes
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {currentStreak > 0 && (
              <Card className="border-orange-200 shadow-sm bg-gradient-to-br from-orange-50/50 to-red-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Flame className="h-5 w-5 text-orange-600" />
                    Streak Motivation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-3xl font-bold text-orange-600">{currentStreak}</div>
                        <div className="text-xs text-slate-600 font-medium">Current Streak</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-400">{longestStreak}</div>
                        <div className="text-xs text-slate-500 font-medium">Best Streak</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(7)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 h-2 rounded-full transition-all duration-300",
                            i < currentStreak ? "bg-orange-500" : "bg-slate-200"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-600">
                      {currentStreak >= 7
                        ? "Amazing! You're on fire!"
                        : `${7 - currentStreak} more days to weekly goal`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {recentActivity.length > 0 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest learning activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                    <div className="bg-blue-100 rounded-lg p-2.5">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{activity.title}</div>
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
          <Card className="border-blue-200 shadow-sm bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-4">
                <div className="bg-blue-100 rounded-full p-5 w-20 h-20 mx-auto flex items-center justify-center shadow-sm">
                  <BookOpen className="h-9 w-9 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Ready to start learning?</h3>
                  <p className="text-slate-600 mt-2 text-sm">Create your first class to begin tracking your progress and assignments.</p>
                </div>
                <Link href="/classes">
                  <Button className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Class
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
