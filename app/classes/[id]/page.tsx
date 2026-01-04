'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CheckCircle, Circle, Calendar, ArrowLeft, BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageRenderer } from '@/components/MessageRenderer';

export default function ClassDetail() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  
  // Data State
  const [classData, setClassData] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newAssign, setNewAssign] = useState({ title: '', due_date: '', type: 'Homework' });
  
  // Exam Prep State
  const [selectedForStudy, setSelectedForStudy] = useState<string[]>([]);
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [studyGuide, setStudyGuide] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      const load = async () => {
        setLoading(true);
        try {
          const classId = Array.isArray(id) ? id[0] : id;
          const { data: cls, error: clsError } = await supabase.from('classes').select('*').eq('id', classId).maybeSingle();
          const { data: asg, error: asgError } = await supabase.from('assignments').select('*').eq('class_id', classId).order('due_date');

          if (clsError) console.error('Error fetching class:', clsError);
          if (asgError) console.error('Error fetching assignments:', asgError);

          setClassData(cls);
          if (asg) setAssignments(asg);
        } catch (error) {
          console.error('Exception loading class data:', error);
        } finally {
          setLoading(false);
        }
      };
      load();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [id, authLoading, user]);

  const addAssignment = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const classId = Array.isArray(id) ? id[0] : id;
    
    // Note: Ensure the 'type' column exists in your database or this will ignore the field
    await (supabase as any).from('assignments').insert([{
      title: newAssign.title,
      due_date: newAssign.due_date || null,
      type: newAssign.type,
      class_id: classId,
      user_id: session.user.id,
      completed: false
    }]);
    
    setShowAssignModal(false);
    window.location.reload();
  };

  const toggleComplete = async (aid: string, current: boolean) => {
    await (supabase as any).from('assignments').update({ completed: !current }).eq('id', aid);
    setAssignments(assignments.map(a => a.id === aid ? { ...a, completed: !current } : a));
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
          mode: 'tutor', // Using tutor mode for a more educational output
          userId: user?.id 
        }),
      });
      
      const data = await res.json();
      if (data.response) {
        setStudyGuide(data.response);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingGuide(false);
    }
  };

  if (authLoading || (loading && !classData)) {
    return (
      <div className="h-full flex flex-col bg-slate-50">
        <div className="h-48 bg-white border-b border-slate-200 p-8 flex flex-col justify-end relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-200 animate-pulse" />
          <Button variant="ghost" onClick={() => router.push('/classes')} className="absolute top-6 left-6 text-slate-500">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="h-10 bg-slate-200 rounded w-1/2 mb-2 animate-pulse" />
          <div className="h-6 bg-slate-200 rounded w-1/3 animate-pulse" />
        </div>
        <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-6 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 bg-white border-slate-200 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-3/4" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || !classData) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="h-48 bg-white border-b border-slate-200 p-8 flex flex-col justify-end relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: classData.color }} />
        <Button variant="ghost" onClick={() => router.push('/classes')} className="absolute top-6 left-6 text-slate-500">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-4xl font-bold text-slate-900">{classData.name}</h1>
        <p className="text-slate-500 mt-2 font-medium">{classData.code} • {classData.semester}</p>
      </div>

      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <Tabs defaultValue="assignments" className="w-full">
          <TabsList className="bg-white border border-slate-200 p-1 mb-6">
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="examprep" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <Sparkles className="w-4 h-4 mr-2" /> 
              Exam Prep
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">Tasks</h2>
              <Button onClick={() => setShowAssignModal(true)} size="sm" className="bg-blue-600">
                <Plus className="w-4 h-4 mr-2" /> Add Assignment
              </Button>
            </div>

            {assignments.length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
                No assignments yet. Add one to get started!
              </div>
            )}

            {assignments.map(a => (
              <Card key={a.id} className="p-4 flex items-center gap-4 bg-white border-slate-200 hover:shadow-md transition-shadow group">
                <button onClick={() => toggleComplete(a.id, a.completed)}>
                  {a.completed ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-slate-300 group-hover:text-blue-500" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium ${a.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{a.title}</h3>
                    {a.type && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-2">
                        {a.type}
                      </Badge>
                    )}
                  </div>
                  {a.due_date && (
                    <div className="flex items-center text-xs text-slate-500">
                      <Calendar className="w-3 h-3 mr-1" /> {new Date(a.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="examprep" className="h-[calc(100vh-300px)] flex flex-col md:flex-row gap-6">
            {/* Sidebar: Assignment Selection */}
            <Card className="w-full md:w-1/3 bg-white border-slate-200 p-4 flex flex-col">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  Select Material
                </h3>
                <p className="text-xs text-slate-500">Choose assignments to include in your study guide.</p>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
                {assignments.length === 0 && <p className="text-sm text-slate-400 italic">No assignments available.</p>}
                {assignments.map(a => (
                  <div key={a.id} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100">
                    <Checkbox 
                      id={`study-${a.id}`} 
                      checked={selectedForStudy.includes(a.id)}
                      onCheckedChange={() => toggleStudySelection(a.id)}
                    />
                    <label
                      htmlFor={`study-${a.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {a.title}
                    </label>
                    <Badge variant="outline" className="text-[10px]">{a.type || 'HW'}</Badge>
                  </div>
                ))}
              </div>

              <Button 
                onClick={generateStudyGuide} 
                disabled={selectedForStudy.length === 0 || generatingGuide}
                className="w-full bg-purple-600 hover:bg-purple-700"
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
            <Card className="flex-1 bg-white border-slate-200 p-6 overflow-y-auto">
              {!studyGuide && !generatingGuide && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                  <Sparkles className="w-12 h-12 mb-4 text-slate-200" />
                  <p>Select assignments on the left and click Generate<br/>to create a personalized AI study guide.</p>
                </div>
              )}
              {generatingGuide && (
                <div className="h-full flex flex-col items-center justify-center text-purple-600">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="animate-pulse font-medium">Analyzing assignments...</p>
                </div>
              )}
              {studyGuide && (
                <div className="max-w-3xl mx-auto">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800">Study Guide</h2>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">AI Generated</Badge>
                  </div>
                  <MessageRenderer content={studyGuide} />
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>New Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
               <label className="text-sm font-medium">Title</label>
               <Input placeholder="E.g. Calculus Chapter 1" value={newAssign.title} onChange={e => setNewAssign({...newAssign, title: e.target.value})} />
            </div>
            
            <div className="space-y-2">
               <label className="text-sm font-medium">Type</label>
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
               <label className="text-sm font-medium">Due Date</label>
               <Input type="date" value={newAssign.due_date} onChange={e => setNewAssign({...newAssign, due_date: e.target.value})} />
            </div>

            <Button onClick={addAssignment} className="w-full bg-blue-600 mt-2">Add Task</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}