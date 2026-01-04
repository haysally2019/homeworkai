'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CheckCircle, Circle, Calendar, ArrowLeft, BookOpen, Sparkles, Loader2, FileText, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageRenderer } from '@/components/MessageRenderer';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'sonner';

export default function ClassDetail() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  
  // Data State
  const [classData, setClassData] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal & Sheet State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [newAssign, setNewAssign] = useState({ title: '', due_date: '', type: 'Homework' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Exam Prep State
  const [selectedForStudy, setSelectedForStudy] = useState<string[]>([]);
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [studyGuide, setStudyGuide] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadClassData();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [id, authLoading, user]);

  const loadClassData = async () => {
    setLoading(true);
    try {
      const classId = Array.isArray(id) ? id[0] : id;
      const { data: cls, error: clsError } = await supabase.from('classes').select('*').eq('id', classId).maybeSingle();
      const { data: asg, error: asgError } = await supabase.from('assignments').select('*').eq('class_id', classId).order('due_date', { ascending: true });

      if (clsError) throw clsError;
      if (asgError) throw asgError;

      setClassData(cls);
      if (asg) setAssignments(asg);
    } catch (error: any) {
      console.error('Error loading class data:', error);
      toast.error('Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const addAssignment = async () => {
    if (!newAssign.title) {
      toast.error("Please enter a title");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const classId = Array.isArray(id) ? id[0] : id;
      
      const { error } = await supabase.from('assignments').insert([{
        title: newAssign.title,
        due_date: newAssign.due_date || null,
        type: newAssign.type,
        class_id: classId,
        user_id: session.user.id,
        completed: false
      }]);

      if (error) throw error;

      toast.success("Assignment added successfully");
      setShowAssignModal(false);
      setNewAssign({ title: '', due_date: '', type: 'Homework' });
      loadClassData(); 
    } catch (error: any) {
      console.error('Error adding assignment:', error);
      toast.error(error.message || "Failed to save assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComplete = async (e: React.MouseEvent, aid: string, current: boolean) => {
    e.stopPropagation(); 
    try {
      const { error } = await supabase.from('assignments').update({ completed: !current }).eq('id', aid);
      if (error) throw error;
      setAssignments(assignments.map(a => a.id === aid ? { ...a, completed: !current } : a));
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const toggleStudySelection = (aid: string) => {
    setSelectedForStudy(prev => 
      prev.includes(aid) ? prev.filter(id => id !== aid) : [...prev, aid]
    );
  };

  const generateStudyGuide = async () => {
    if (selectedForStudy.length === 0) return;
    setGeneratingGuide(true);
    setStudyGuide(null);

    const selectedTitles = assignments
      .filter(a => selectedForStudy.includes(a.id))
      .map(a => `${a.title} (${a.type || 'Homework'})`)
      .join(', ');

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        body: JSON.stringify({ 
          text: `Create a comprehensive exam preparation guide for the following topics/assignments: ${selectedTitles}. Include key definitions, potential quiz questions, and a summary of concepts. Format nicely in Markdown.`, 
          mode: 'tutor',
          userId: user?.id 
        }),
      });
      
      const data = await res.json();
      if (data.response) {
        setStudyGuide(data.response);
      } else {
        throw new Error("No response from AI");
      }
    } catch (e) {
      toast.error("Failed to generate study guide");
    } finally {
      setGeneratingGuide(false);
    }
  };

  if (authLoading || (loading && !classData)) {
    return (
      <div className="h-full flex flex-col bg-slate-50">
        <div className="h-48 bg-white border-b border-slate-200 p-8 flex flex-col justify-end relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-200 animate-pulse" />
          <Button variant="ghost" disabled className="absolute top-6 left-6 text-slate-400">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="h-10 bg-slate-200 rounded w-1/2 mb-2 animate-pulse" />
          <div className="h-6 bg-slate-200 rounded w-1/3 animate-pulse" />
        </div>
        <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 bg-white border-slate-200 animate-pulse h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || !classData) return null;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="h-48 bg-white border-b border-slate-200 p-8 flex flex-col justify-end relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: classData.color }} />
        <Button variant="ghost" onClick={() => router.push('/classes')} className="absolute top-6 left-6 text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Classes
        </Button>
        <h1 className="text-4xl font-bold text-slate-900">{classData.name}</h1>
        <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
          <span className="bg-slate-100 px-2 py-1 rounded text-xs uppercase tracking-wider text-slate-600">{classData.code}</span>
          <span>•</span>
          <span>{classData.semester}</span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full">
        <Tabs defaultValue="assignments" className="w-full h-full flex flex-col">
          <TabsList className="bg-white border border-slate-200 p-1 mb-6 w-fit">
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="examprep" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
              <Sparkles className="w-4 h-4 mr-2" /> 
              Exam Prep
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">Tasks</h2>
              <Button onClick={() => setShowAssignModal(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Add Assignment
              </Button>
            </div>

            {assignments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-xl border-2 border-slate-200 border-dashed">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-slate-300" />
                </div>
                <p>No assignments yet.</p>
                <Button variant="link" onClick={() => setShowAssignModal(true)} className="text-blue-600">Add your first one</Button>
              </div>
            )}

            <div className="grid gap-3">
              {assignments.map(a => (
                <Card 
                  key={a.id} 
                  onClick={() => setSelectedAssignment(a)}
                  className="p-4 flex items-center gap-4 bg-white border-slate-200 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                >
                  <button 
                    onClick={(e) => toggleComplete(e, a.id, a.completed)}
                    className="shrink-0 focus:outline-none"
                  >
                    {a.completed ? 
                      <CheckCircle className="w-6 h-6 text-emerald-500 hover:text-emerald-600 transition-colors" /> : 
                      <Circle className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    }
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium truncate ${a.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {a.title}
                      </h3>
                      {a.type && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-2 font-normal">
                          {a.type}
                        </Badge>
                      )}
                    </div>
                    {a.due_date && (
                      <div className={`flex items-center text-xs ${getDueDateColor(a.due_date, a.completed)}`}>
                        <Calendar className="w-3 h-3 mr-1" /> 
                        {new Date(a.due_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="examprep" className="flex-1 flex flex-col md:flex-row gap-6 h-full min-h-[500px]">
            {/* Sidebar: Assignment Selection */}
            <Card className="w-full md:w-80 bg-white border-slate-200 p-4 flex flex-col h-full">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  Select Material
                </h3>
                <p className="text-xs text-slate-500 mt-1">Choose assignments to include in your study guide.</p>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
                {assignments.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">No assignments available.</p>}
                {assignments.map(a => (
                  <div key={a.id} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                    <Checkbox 
                      id={`study-${a.id}`} 
                      checked={selectedForStudy.includes(a.id)}
                      onCheckedChange={() => toggleStudySelection(a.id)}
                    />
                    <label
                      htmlFor={`study-${a.id}`}
                      className="text-sm font-medium leading-none cursor-pointer flex-1 truncate"
                    >
                      {a.title}
                    </label>
                    <Badge variant="outline" className="text-[10px] shrink-0">{a.type || 'HW'}</Badge>
                  </div>
                ))}
              </div>

              <Button 
                onClick={generateStudyGuide} 
                disabled={selectedForStudy.length === 0 || generatingGuide}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              >
                {generatingGuide ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Generate Study Guide
                  </>
                )}
              </Button>
            </Card>

            {/* Main: Study Guide Output */}
            <Card className="flex-1 bg-white border-slate-200 p-6 overflow-y-auto min-h-[500px]">
              {!studyGuide && !generatingGuide && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8">
                  <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-purple-200" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-600 mb-2">AI Exam Prep</h3>
                  <p className="max-w-sm mx-auto text-sm">Select relevant assignments from the left list and click "Generate" to create a custom study guide tailored to your material.</p>
                </div>
              )}
              {generatingGuide && (
                <div className="h-full flex flex-col items-center justify-center text-purple-600">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="animate-pulse font-medium">Analyzing your assignments...</p>
                </div>
              )}
              {studyGuide && (
                <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800">Study Guide</h2>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">AI Generated</Badge>
                  </div>
                  <MessageRenderer content={studyGuide} />
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Assignment Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="bg-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
               <label className="text-sm font-medium text-slate-700">Title <span className="text-red-500">*</span></label>
               <Input 
                 placeholder="E.g. Calculus Chapter 1 Exercises" 
                 value={newAssign.title} 
                 onChange={e => setNewAssign({...newAssign, title: e.target.value})}
                 className="col-span-3" 
               />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-700">Type</label>
                 <Select onValueChange={(val) => setNewAssign({...newAssign, type: val})} defaultValue="Homework">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Homework">Homework</SelectItem>
                    <SelectItem value="Quiz">Quiz</SelectItem>
                    <SelectItem value="Exam">Exam</SelectItem>
                    <SelectItem value="Project">Project</SelectItem>
                    <SelectItem value="Reading">Reading</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-700">Due Date</label>
                 <Input 
                   type="date" 
                   value={newAssign.due_date} 
                   onChange={e => setNewAssign({...newAssign, due_date: e.target.value})} 
                 />
              </div>
            </div>

            <Button onClick={addAssignment} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Assignment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Detail Sheet */}
      <Sheet open={!!selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-white">
          <SheetHeader className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-2xl font-bold text-slate-900">{selectedAssignment?.title}</SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{selectedAssignment?.type}</Badge>
                  {selectedAssignment?.due_date && (
                    <span className="text-sm text-slate-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Due {new Date(selectedAssignment.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <SheetDescription>
               Manage this assignment, track your progress, or use AI to help solve it.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
               <h4 className="font-semibold text-sm text-slate-900 mb-2">Status</h4>
               <div className="flex items-center gap-3">
                 <Button 
                    variant={selectedAssignment?.completed ? "outline" : "default"}
                    className={selectedAssignment?.completed ? "border-emerald-500 text-emerald-600 hover:bg-emerald-50" : "bg-emerald-600 hover:bg-emerald-700"}
                    onClick={(e) => {
                      if (selectedAssignment) {
                        toggleComplete(e, selectedAssignment.id, selectedAssignment.completed);
                        setSelectedAssignment({...selectedAssignment, completed: !selectedAssignment.completed});
                      }
                    }}
                 >
                   {selectedAssignment?.completed ? <><CheckCircle className="w-4 h-4 mr-2"/> Completed</> : "Mark as Complete"}
                 </Button>
               </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-slate-900">Need Help?</h4>
              <div className="grid grid-cols-2 gap-3">
                <Card 
                  className="p-4 hover:border-blue-500 cursor-pointer transition-colors group"
                  onClick={() => router.push(`/chat?mode=solver&assignmentId=${selectedAssignment.id}&context=${encodeURIComponent(selectedAssignment?.title)}`)}
                >
                  <div className="mb-2 bg-blue-100 w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="font-medium text-sm">Solve Problems</div>
                  <div className="text-xs text-slate-500">Get step-by-step solutions</div>
                </Card>

                <Card 
                  className="p-4 hover:border-purple-500 cursor-pointer transition-colors group"
                  onClick={() => router.push(`/chat?mode=tutor&assignmentId=${selectedAssignment.id}&context=${encodeURIComponent(selectedAssignment?.title)}`)}
                >
                  <div className="mb-2 bg-purple-100 w-8 h-8 rounded-lg flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="font-medium text-sm">Tutor Mode</div>
                  <div className="text-xs text-slate-500">Learn the concepts</div>
                </Card>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function getDueDateColor(dateStr: string, completed: boolean) {
  if (completed) return 'text-slate-400';
  const today = new Date();
  const due = new Date(dateStr);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays < 0) return 'text-red-500 font-medium'; // Overdue
  if (diffDays <= 2) return 'text-orange-500 font-medium'; // Due soon
  return 'text-slate-500';
}