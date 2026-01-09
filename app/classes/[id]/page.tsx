'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  BookOpen, 
  GraduationCap, 
  Loader2, 
  MessageSquare, 
  CalendarCheck, 
  FileText,
  CheckCircle2,
  PenTool 
} from 'lucide-react';
import { ClassChatInterface } from '@/components/ClassChatInterface';
import { MessageRenderer } from '@/components/MessageRenderer';
import { useAuth } from '@/lib/auth-context';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// OPTIMIZATION: Keep lazy loading but improve loading UX
const MaterialsTab = lazy(() => import('@/components/class-tabs/MaterialsTab').then(mod => ({ default: mod.MaterialsTab })));
const NotesTab = lazy(() => import('@/components/class-tabs/NotesTab').then(mod => ({ default: mod.NotesTab })));
const AssignmentsTab = lazy(() => import('@/components/class-tabs/AssignmentsTab').then(mod => ({ default: mod.AssignmentsTab })));
const PaywallModal = lazy(() => import('@/components/PaywallModal').then(m => ({ default: m.PaywallModal })));

// Helper for the loading state - simpler to avoid layout shift
const TabLoading = () => (
  <div className="flex h-full min-h-[200px] items-center justify-center text-slate-400">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      <p className="text-sm font-medium">Loading...</p>
    </div>
  </div>
);

export default function ClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user, refreshCredits, credits, isPro } = useAuth();
  
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // State for rendering control
  // Initialize visitedTabs with the DEFAULT tab so it renders immediately
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['chat']));
  const [activeTab, setActiveTab] = useState('chat');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Add to visited set immediately to trigger the lazy render
    setVisitedTabs((prev) => {
      if (prev.has(value)) return prev;
      const newSet = new Set(prev);
      newSet.add(value);
      return newSet;
    });
  };

  // Grading State
  const [essayText, setEssayText] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const fetchClass = async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching class:', error);
        router.push('/classes');
        return;
      }
      setClassData(data);
      setLoading(false);
    };

    fetchClass();
  }, [params.id, router]);

  const handleGradeEssay = async () => {
    if (!essayText.trim() || !user) return;

    if (!isPro && credits <= 0) {
      setShowPaywall(true);
      return;
    }

    setIsGrading(true);
    setGradingResult(null);

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: essayText,
          mode: 'grader',
          userId: user.id,
          context: `Class: ${classData.name} (${classData.code})`,
        }),
      });

      if (res.status === 402) {
        setShowPaywall(true);
        setIsGrading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGradingResult(data.response);
      await refreshCredits();
      toast.success('Essay graded successfully!');

    } catch (error: any) {
      toast.error(error.message || 'Failed to grade essay');
    } finally {
      setIsGrading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!classData) return null;

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 shrink-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/classes')} className="hover:bg-slate-100 rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: classData.color || '#3b82f6' }} />
              {classData.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium">{classData.code}</p>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
        <div className="px-4 md:px-6 py-2 bg-white border-b border-slate-200 shrink-0 overflow-x-auto z-20 relative shadow-sm">
          <TabsList className="bg-slate-100 p-1 w-full sm:w-auto grid grid-cols-5 sm:flex rounded-lg min-w-[320px]">
            <TabsTrigger value="chat" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-xs md:text-sm px-3">
                <MessageSquare className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-xs md:text-sm px-3">
                <PenTool className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-xs md:text-sm px-3">
                <BookOpen className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Docs</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-xs md:text-sm px-3">
                <CalendarCheck className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="grader" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-xs md:text-sm px-3">
                <GraduationCap className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Grader</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden relative bg-slate-50/50">
          
          {/* Chat Tab - Always mounted for instant access */}
          <div className={cn("h-full m-0 flex-col", activeTab === "chat" ? "flex" : "hidden")}>
             <ClassChatInterface classId={classData.id} className={classData.name} />
          </div>

          {/* Notes Tab - Lazy loaded, then kept alive via CSS */}
          <div className={cn("h-full m-0 p-4 md:p-6 overflow-y-auto", activeTab === "notes" ? "block" : "hidden")}>
            {visitedTabs.has('notes') && (
              <div className="max-w-6xl mx-auto h-full">
                <Suspense fallback={<TabLoading />}>
                  <NotesTab classId={classData.id} userId={user?.id || ''} />
                </Suspense>
              </div>
            )}
          </div>

          {/* Materials Tab */}
          <div className={cn("h-full m-0 p-4 md:p-6 overflow-y-auto", activeTab === "materials" ? "block" : "hidden")}>
            {visitedTabs.has('materials') && (
              <div className="max-w-6xl mx-auto h-full">
                <Suspense fallback={<TabLoading />}>
                  <MaterialsTab classId={classData.id} userId={user?.id || ''} />
                </Suspense>
              </div>
            )}
          </div>

          {/* Assignments Tab */}
          <div className={cn("h-full m-0 p-4 md:p-6 overflow-y-auto", activeTab === "assignments" ? "block" : "hidden")}>
            {visitedTabs.has('assignments') && (
              <div className="max-w-5xl mx-auto h-full">
                <Suspense fallback={<TabLoading />}>
                  <AssignmentsTab classId={classData.id} userId={user?.id || ''} />
                </Suspense>
              </div>
            )}
          </div>

          {/* Grader Tab */}
          <div className={cn("h-full m-0 p-4 md:p-6 overflow-y-auto", activeTab === "grader" ? "block" : "hidden")}>
             {visitedTabs.has('grader') && (
               <div className="max-w-5xl mx-auto h-full flex flex-col">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-6 h-6 text-blue-600" />
                      Essay Grader
                    </h2>
                    <p className="text-slate-500">Get instant feedback on your writing before submitting.</p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0">
                    <div className="flex flex-col gap-4 h-full min-h-[400px]">
                      <Textarea 
                        placeholder="Paste your essay here..." 
                        className="flex-1 resize-none p-4 text-base leading-relaxed bg-white border-slate-200 focus-visible:ring-blue-500 shadow-sm rounded-xl"
                        value={essayText}
                        onChange={(e) => setEssayText(e.target.value)}
                      />
                      <Button 
                        onClick={handleGradeEssay} 
                        disabled={isGrading || !essayText.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md h-12 text-lg font-medium"
                      >
                        {isGrading ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</>
                        ) : (
                          'Grade My Essay'
                        )}
                      </Button>
                    </div>

                    <div className="h-full min-h-[400px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      {gradingResult ? (
                        <div className="prose prose-sm max-w-none prose-headings:font-bold prose-h1:text-2xl prose-p:text-slate-600">
                          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-lg text-slate-900">Feedback Report</span>
                          </div>
                          <MessageRenderer content={gradingResult} role="assistant" />
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-50">
                          <FileText className="w-16 h-16" />
                          <p className="font-medium">Feedback will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
               </div>
             )}
          </div>
        </div>
      </Tabs>

      {showPaywall && (
        <Suspense fallback={null}>
          <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
        </Suspense>
      )}
    </div>
  );
}