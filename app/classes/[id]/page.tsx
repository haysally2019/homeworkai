'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CheckCircle, Circle, Calendar, ArrowLeft, BookOpen, Sparkles, Loader2, Layers, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FlashcardViewer } from '@/components/FlashcardViewer';
import { QuizViewer } from '@/components/QuizViewer';
import { toast } from 'sonner';
import { useClass, useAssignments, createAssignment, updateAssignment } from '@/hooks/use-classes';
import { MaterialsTab } from '@/components/class-tabs/MaterialsTab';

export default function ClassDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const classId = Array.isArray(id) ? id[0] : id;

  const { classData, isLoading: classLoading } = useClass(classId);
  const { assignments, mutate: mutateAssignments } = useAssignments(classId);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [newAssign, setNewAssign] = useState({ title: '', due_date: '', type: 'Homework' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exam Prep State
  const [selectedForStudy, setSelectedForStudy] = useState<string[]>([]);
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [studyMode, setStudyMode] = useState<'flashcards' | 'quiz'>('flashcards');
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user]);

  const addAssignment = async () => {
    if (!newAssign.title) return toast.error("Please enter a title");
    setIsSubmitting(true);
    try {
      await createAssignment(classId, {
        title: newAssign.title,
        due_date: newAssign.due_date || null,
        type: newAssign.type,
        user_id: user?.id,
        completed: false
      });
      mutateAssignments();
      toast.success("Assignment added");
      setShowAssignModal(false);
      setNewAssign({ title: '', due_date: '', type: 'Homework' });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComplete = async (e: React.MouseEvent, aid: string, current: boolean) => {
    e.stopPropagation();
    try {
      await updateAssignment(classId, aid, { completed: !current });
      mutateAssignments();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const toggleStudySelection = (aid: string) => {
    setSelectedForStudy(prev => prev.includes(aid) ? prev.filter(id => id !== aid) : [...prev, aid]);
  };

  const generateStudyGuide = async () => {
    setGeneratingGuide(true);
    setFlashcards([]);
    setQuizQuestions([]);
    try {
      const selectedTitles = (assignments as any[]).filter(a => selectedForStudy.includes(a.id)).map(a => a.title).join(', ');
      const prompt = studyMode === 'flashcards' 
        ? `Generate 10 flashcards for: ${selectedTitles}. Return JSON: [{"question": "...", "answer": "..."}]`
        : `Generate 8 quiz questions for: ${selectedTitles}. Return JSON: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}]`;
      
      const res = await fetch('/api/solve', {
        method: 'POST',
        body: JSON.stringify({ text: prompt, mode: 'solver', userId: user?.id, classId })
      });
      const data = await res.json();
      const parsed = JSON.parse(data.response.replace(/```json|```/g, ''));
      studyMode === 'flashcards' ? setFlashcards(parsed) : setQuizQuestions(parsed);
    } catch (e) { toast.error("Generation failed"); }
    finally { setGeneratingGuide(false); }
  };

  if (authLoading || (classLoading && !classData)) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!user || !classData) return null;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-6 md:p-8 pt-10 md:pt-12 relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: (classData as any)?.color }} />
        <Button variant="ghost" onClick={() => router.push('/classes')} className="absolute top-4 left-4 text-slate-500 hover:text-slate-800"><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mt-2">{(classData as any)?.name}</h1>
          <p className="text-slate-500 font-medium">{(classData as any)?.code}</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 md:p-6 max-w-5xl mx-auto w-full">
        <Tabs defaultValue="materials" className="h-full flex flex-col">
          <TabsList className="bg-white border p-1 mb-4 w-full md:w-fit grid grid-cols-3 md:flex">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="assignments">Tasks</TabsTrigger>
            <TabsTrigger value="examprep">Study</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="flex-1 overflow-y-auto min-h-0">
            <MaterialsTab classId={classId} userId={user.id} />
          </TabsContent>

          <TabsContent value="assignments" className="flex-1 overflow-y-auto space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-slate-800">Assignments</h2>
              <Button onClick={() => setShowAssignModal(true)} size="sm"><Plus className="mr-2 h-4 w-4"/> Add Task</Button>
            </div>
            <div className="grid gap-3 pb-8">
              {assignments?.length === 0 && <div className="text-center py-8 text-slate-400">No tasks yet.</div>}
              {assignments?.map((a: any) => (
                <Card key={a.id} className="p-4 flex gap-3 items-center hover:border-slate-300 transition-colors" onClick={() => setSelectedAssignment(a)}>
                  <button onClick={(e) => toggleComplete(e, a.id, a.completed)}>
                    {a.completed ? <CheckCircle className="text-emerald-500 w-6 h-6"/> : <Circle className="text-slate-300 w-6 h-6 hover:text-blue-500"/>}
                  </button>
                  <div className="flex-1 cursor-pointer">
                    <p className={`font-medium ${a.completed && 'line-through text-slate-400'}`}>{a.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] h-5">{a.type}</Badge>
                      {a.due_date && <span className="text-xs text-slate-500 flex items-center"><Calendar className="w-3 h-3 mr-1"/>{new Date(a.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="examprep" className="flex-1 flex flex-col md:flex-row gap-6 h-full min-h-0">
            <Card className="w-full md:w-72 p-4 h-fit md:h-full flex flex-col bg-slate-50 border-slate-200">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-800"><BookOpen className="w-4 h-4 text-purple-600"/> Select Content</h3>
              <div className="flex-1 overflow-y-auto space-y-2 max-h-[30vh] md:max-h-none mb-4 md:mb-0">
                {assignments?.map((a: any) => (
                  <div key={a.id} className="flex gap-2 items-center p-2 rounded hover:bg-slate-100">
                    <Checkbox id={`s-${a.id}`} checked={selectedForStudy.includes(a.id)} onCheckedChange={() => toggleStudySelection(a.id)}/>
                    <label htmlFor={`s-${a.id}`} className="text-sm truncate cursor-pointer flex-1">{a.title}</label>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant={studyMode === 'flashcards' ? 'default' : 'outline'} onClick={() => setStudyMode('flashcards')} className={studyMode === 'flashcards' ? 'bg-purple-600' : ''}><Layers className="w-4 h-4 mr-2"/>Cards</Button>
                  <Button size="sm" variant={studyMode === 'quiz' ? 'default' : 'outline'} onClick={() => setStudyMode('quiz')} className={studyMode === 'quiz' ? 'bg-blue-600' : ''}><HelpCircle className="w-4 h-4 mr-2"/>Quiz</Button>
                </div>
                <Button className="w-full bg-slate-900" onClick={generateStudyGuide} disabled={generatingGuide || !selectedForStudy.length}>
                  {generatingGuide ? <Loader2 className="animate-spin mr-2 w-4 h-4"/> : <><Sparkles className="w-4 h-4 mr-2"/> Generate Guide</>}
                </Button>
              </div>
            </Card>
            
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 md:p-6 overflow-y-auto shadow-sm">
              {flashcards.length > 0 && studyMode === 'flashcards' && <FlashcardViewer flashcards={flashcards} onRegenerate={generateStudyGuide} isGenerating={generatingGuide} />}
              {quizQuestions.length > 0 && studyMode === 'quiz' && <QuizViewer questions={quizQuestions} onRegenerate={generateStudyGuide} isGenerating={generatingGuide} />}
              {!flashcards.length && !quizQuestions.length && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Sparkles className="w-12 h-12 mb-4 text-slate-200" />
                  <p>Select assignments to generate study materials</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input placeholder="Assignment Title" value={newAssign.title} onChange={e => setNewAssign({...newAssign, title: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <Select value={newAssign.type} onValueChange={v => setNewAssign({...newAssign, type: v})}>
                <SelectTrigger><SelectValue placeholder="Type"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Homework">Homework</SelectItem>
                  <SelectItem value="Quiz">Quiz</SelectItem>
                  <SelectItem value="Exam">Exam</SelectItem>
                  <SelectItem value="Project">Project</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={newAssign.due_date} onChange={e => setNewAssign({...newAssign, due_date: e.target.value})} />
            </div>
            <Button onClick={addAssignment} disabled={isSubmitting} className="w-full">Save Task</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
        <SheetContent>
          <SheetHeader className="mb-4">
            <SheetTitle>{selectedAssignment?.title}</SheetTitle>
            <Badge variant="outline" className="w-fit">{selectedAssignment?.type}</Badge>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 cursor-pointer hover:bg-blue-50 border-blue-100 group" onClick={() => router.push(`/chat?mode=solver&assignmentId=${selectedAssignment.id}`)}>
              <Sparkles className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform"/>
              <div className="font-bold text-sm text-blue-900">Solver</div>
              <div className="text-xs text-blue-700">Get answers</div>
            </Card>
            <Card className="p-4 cursor-pointer hover:bg-purple-50 border-purple-100 group" onClick={() => router.push(`/chat?mode=tutor&assignmentId=${selectedAssignment.id}`)}>
              <BookOpen className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform"/>
              <div className="font-bold text-sm text-purple-900">Tutor</div>
              <div className="text-xs text-purple-700">Learn concepts</div>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}