'use client';

import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, BookOpen, Trophy, TrendingUp, MessageSquare, FileText, Calendar, Zap, GraduationCap, ArrowRight, Brain, Sparkles, Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Lazy load the Paywall to ensure fast dashboard initial load
const PaywallModal = lazy(() => import('@/components/PaywallModal').then(m => ({ default: m.PaywallModal })));

// TYPES
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
  const supabase = createClient();
  
  // Initialize with null to show skeletons initially, not 0
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[] | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Run queries in parallel but don't block the UI rendering
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
      }
    };

    fetchDashboardData();
  }, [user]);

  // Helpers
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  const getUserName = () => user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
  const getSchoolName = () => user?.user_metadata?.school || 'University';
  const getCurrentDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Calculations
  const completionRate = (stats?.totalAssignments || 0) > 0
    ? Math.round(((stats?.completedAssignments || 0) / (stats?.totalAssignments || 1)) * 100)
    : 0;

  // RENDER: No global loading check. We render the layout immediately.
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-slate-50 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{getCurrentDate()}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{getUserName()}</span>
          </h1>
          <div className="flex items-center gap-2 text-slate-600 mt-1">
             <GraduationCap className="w-5 h-5 text-blue-500" />
             <span className="font-medium">{getSchoolName()}</span>
          </div>
        </div>
        {!isPro && (
          <Button 
            onClick={() => setShowPaywall(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-105 transition-all rounded-full px-6"
          >
            <Zap className="w-4 h-4 mr-2 fill-white" /> Upgrade to Pro
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Daily Streak" 
          value={currentStreak !== undefined ? `${currentStreak} days` : null}
          subtext={currentStreak === longestStreak && currentStreak > 0 ? "🔥 Personal best!" : `Best: ${longestStreak || 0} days`}
          icon={<Flame className="h-5 w-5 text-orange-600" />}
          gradient="from-orange-50 to-red-50"
          borderColor="border-orange-100"
        />
        <StatCard 
          title="Credits Available" 
          value={credits !== undefined ? credits.toString() : null}
          subtext={isPro ? "Unlimited Access" : "Resets daily at midnight"}
          icon={<Zap className="h-5 w-5 text-blue-600" />}
          gradient="from-blue-50 to-indigo-50"
          borderColor="border-blue-100"
        />
        <StatCard 
          title="Active Classes" 
          value={stats?.activeClasses.toString()}
          subtext="Current semester"
          icon={<BookOpen className="h-5 w-5 text-emerald-600" />}
          gradient="from-emerald-50 to-teal-50"
          borderColor="border-emerald-100"
        />
        <StatCard 
          title="Completion Rate" 
          value={stats ? `${completionRate}%` : null}
          subtext={stats ? `${stats.completedAssignments} / ${stats.totalAssignments} tasks done` : "Calculating..."}
          icon={<Trophy className="h-5 w-5 text-purple-600" />}
          gradient="from-purple-50 to-pink-50"
          borderColor="border-purple-100"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Progress & Activity */}
        <div className="xl:col-span-2 space-y-8">
          {/* Progress Section */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-white/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Learning Velocity
                  </CardTitle>
                  <CardDescription>Your weekly task completion momentum</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">{stats ? `${completionRate}%` : <Skeleton className="h-8 w-16 ml-auto" />}</div>
                  <div className="text-xs text-slate-500">Overall Progress</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-slate-500">Keep completing assignments to boost your rating!</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {stats ? stats.totalConversations : <Skeleton className="h-8 w-12 mx-auto" />}
                    </div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">AI Sessions</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {stats ? stats.recentNotes : <Skeleton className="h-8 w-12 mx-auto" />}
                    </div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Study Notes</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader className="border-b border-slate-100 bg-white/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!recentActivity ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{activity.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-slate-300 hover:text-blue-600">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p>No recent activity. Time to start studying!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-amber-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>Jump straight into learning</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 p-4 pt-0">
              <Link href="/chat?mode=solver" className="col-span-2">
                <ActionCard 
                  icon={<Brain className="w-6 h-6 text-white" />}
                  title="AI Solver"
                  desc="Get instant step-by-step help"
                  color="bg-gradient-to-br from-blue-500 to-indigo-600"
                  textColor="text-white"
                />
              </Link>
              <Link href="/chat?mode=tutor">
                <ActionCard 
                  icon={<Sparkles className="w-5 h-5 text-purple-600" />}
                  title="AI Tutor"
                  desc="Concept guide"
                  color="bg-purple-50 border-purple-100"
                  textColor="text-purple-900"
                  hoverColor="group-hover:bg-purple-100"
                />
              </Link>
              <Link href="/classes">
                <ActionCard 
                  icon={<BookOpen className="w-5 h-5 text-emerald-600" />}
                  title="Classes"
                  desc="Manage tasks"
                  color="bg-emerald-50 border-emerald-100"
                  textColor="text-emerald-900"
                  hoverColor="group-hover:bg-emerald-100"
                />
              </Link>
              <Link href="/chat" className="col-span-2">
                 <Button variant="outline" className="w-full justify-start h-12 text-slate-600 border-dashed border-2 hover:border-slate-400 hover:text-slate-900 hover:bg-slate-50">
                    <Plus className="w-4 h-4 mr-2" /> Create New Note
                 </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Motivational Banner */}
          {currentStreak > 2 && (
             <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 p-6 text-white shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-white/20 transition-all" />
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-2">
                   <Flame className="w-6 h-6 animate-pulse" />
                   <span className="font-bold text-lg">On Fire!</span>
                 </div>
                 <p className="text-orange-50 font-medium leading-relaxed">
                   You've maintained a {currentStreak}-day streak. Keep it up for 3 more days to earn a bonus!
                 </p>
               </div>
             </div>
          )}
        </div>
      </div>

      {showPaywall && (
        <Suspense fallback={null}>
          <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
        </Suspense>
      )}
    </div>
  );
}

// SKELETON-AWARE COMPONENTS
function StatCard({ title, value, subtext, icon, gradient, borderColor }: any) {
  return (
    <Card className={cn(
      "border transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
      `bg-gradient-to-br ${gradient} ${borderColor}`
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-slate-600 tracking-wide uppercase">{title}</span>
          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100/50">
            {icon}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold text-slate-900 tracking-tight">
            {value !== null && value !== undefined ? value : <Skeleton className="h-9 w-24" />}
          </div>
          <p className="text-xs font-medium text-slate-500">{subtext}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({ icon, title, desc, color, textColor, hoverColor }: any) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:shadow-md cursor-pointer border h-full flex flex-col justify-center",
      color,
      hoverColor
    )}>
      <div className="mb-3 w-fit rounded-lg p-0">{icon}</div>
      <div className={cn("font-bold text-sm mb-0.5", textColor)}>{title}</div>
      {desc && <div className={cn("text-xs opacity-80", textColor)}>{desc}</div>}
    </div>
  );
}