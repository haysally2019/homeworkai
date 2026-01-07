'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Plus, FileText, CheckCircle2, GraduationCap, Loader2, Wand2, MessageSquare } from 'lucide-react';
import { MaterialsTab } from '@/components/class-tabs/MaterialsTab';
import { ClassChatInterface } from '@/components/ClassChatInterface'; // Import the new component
import { MessageRenderer } from '@/components/MessageRenderer';
import { useAuth } from '@/lib/auth-context';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const PaywallModal = lazy(() => import('@/components/PaywallModal').then(m => ({ default: m.PaywallModal })));

export default function ClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user, refreshCredits } = useAuth();
  
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
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

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (!classData) return null;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => router.push('/classes')}>
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: classData.color || '#3b82f6' }} />
            {classData.name}
          </h1>
          <p className="text-sm text-slate-500">{classData.code} • {classData.semester}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6 max-w-7xl mx-auto w-full">
        <Tabs defaultValue="chat" className="h-full flex flex-col">
          <TabsList className="bg-white border border-slate-200 p-1 mb-6 w-fit shadow-sm rounded-xl">
            <TabsTrigger value="chat" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 flex items-center gap-2 rounded-lg">
                <MessageSquare className="w-4 h-4" /> Class Chat
            </TabsTrigger>
            <TabsTrigger value="materials" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 flex items-center gap-2 rounded-lg">
                <BookOpen className="w-4 h-4" /> Materials
            </TabsTrigger>
            <TabsTrigger value="grader" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 flex items-center gap-2 rounded-lg">
                <GraduationCap className="w-4 h-4" /> Essay Grader
            </TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 flex items-center gap-2 rounded-lg">
                <FileText className="w-4 h-4" /> Assignments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 m-0 h-full">
             <ClassChatInterface classId={classData.id} className={classData.name} />
          </TabsContent>

          <TabsContent value="materials" className="flex-1 m-0 h-full overflow-y-auto">
            <MaterialsTab classId={classData.id} />
          </TabsContent>

          <TabsContent value="grader" className="flex-1 m-0 h-full overflow-y-auto">
             <div className="max-w-4xl mx-auto space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">AI Essay Grader</h2>
                  <p className="text-slate-600">
                    Paste your draft below. Altus will check your thesis, structure, and grammar, then assign a grade.
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 h-[600px]">
                  <div className="flex flex-col gap-4 h-full">
                    <Textarea 
                      placeholder="Paste your essay here..." 
                      className="flex-1 resize-none p-4 text-base leading-relaxed bg-white border-slate-200 focus-visible:ring-blue-500"
                      value={essayText}
                      onChange={(e) => setEssayText(e.target.value)}
                    />
                    <Button 
                      onClick={handleGradeEssay} 
                      disabled={isGrading || !essayText.trim()}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg h-12"
                    >
                      {isGrading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Grading...</>
                      ) : (
                        <><Wand2 className="mr-2 h-4 w-4" /> Grade My Essay</>
                      )}
                    </Button>
                  </div>

                  <div className="h-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    {gradingResult ? (
                      <div className="prose prose-sm max-w-none prose-headings:font-bold prose-h1:text-2xl prose-p:text-slate-600">
                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                          <CheckCircle2 className="text-green-500 w-6 h-6" />
                          <span className="font-bold text-lg text-slate-900">Grading Complete</span>
                        </div>
                        <MessageRenderer content={gradingResult} role="assistant" />
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                          <FileText className="w-8 h-8 opacity-50" />
                        </div>
                        <p>Your feedback will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="assignments" className="flex-1 m-0">
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p>Assignments list coming soon...</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard')}>
                <Plus className="mr-2 h-4 w-4" /> Create Assignment
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showPaywall && (
        <Suspense fallback={null}>
          <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
        </Suspense>
      )}
    </div>
  );
}