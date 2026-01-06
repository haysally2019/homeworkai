'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CheckCircle, Circle, Calendar, ArrowLeft, BookOpen, Sparkles, Loader2, FileText, Upload, File, Trash2, Layers, HelpCircle, PenTool, FileEdit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FlashcardViewer } from '@/components/FlashcardViewer';
import { QuizViewer } from '@/components/QuizViewer';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useClass, useAssignments, useDocuments, createAssignment, updateAssignment, deleteDocument as deleteDocumentAction } from '@/hooks/use-classes';

export default function ClassDetail() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();

  const classId = Array.isArray(id) ? id[0] : id;

  const { classData, isLoading: classLoading } = useClass(classId);
  const { assignments, mutate: mutateAssignments } = useAssignments(classId);
  const { documents, mutate: mutateDocuments } = useDocuments(classId);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [newAssign, setNewAssign] = useState({ title: '', due_date: '', type: 'Homework' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exam Prep
  const [selectedForStudy, setSelectedForStudy] = useState<string[]>([]);
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [studyMode, setStudyMode] = useState<'flashcards' | 'quiz'>('flashcards');
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  // Note Taker
  const [showNoteTaker, setShowNoteTaker] = useState(false);
  const [rawNotes, setRawNotes] = useState('');
  const [processingNotes, setProcessingNotes] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user]);

  // --- Assignments ---
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

  // --- File Upload & Notes ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Manual upload validation
    if (file.type !== 'application/pdf') {
      return toast.error('Only PDF files are supported for manual upload');
    }
    if (file.size > 10 * 1024 * 1024) {
      return toast.error('File size must be less than 10MB');
    }

    await processAndUploadFile(file);
    e.target.value = ''; 
  };

  const processAndUploadFile = async (file: File) => {
    setUploadingFile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Sanitize filename
      const sanitizedName = file.name.replace(/[:\/]/g, '-').replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${session.user.id}/${classId}/${Date.now()}_${sanitizedName}`;

      // 1. Upload
      const { error: uploadError } = await supabase.storage
        .from('class-documents')
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      // 2. DB Insert
      const { data: insertedDoc, error: dbError } = await (supabase as any)
        .from('class_documents')
        .insert([{
          class_id: classId,
          user_id: session.user.id,
          filename: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          processing_status: 'pending'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success('Saved! Processing...');
      mutateDocuments();

      // 3. Trigger Processing
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId: insertedDoc.id }),
      });

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFinishNotes = async () => {
    if (!rawNotes.trim()) return setShowNoteTaker(false);
    setProcessingNotes(true);

    try {
      // 1. AI Summarization
      const res = await fetch('/api/solve', {
        method: 'POST',
        body: JSON.stringify({
          text: `You are an expert academic note-taker.
TASK: Format these raw notes into a clean Markdown study guide.

STRUCTURE:
# [Topic Name]
## 📝 Executive Summary
(50-word summary of core concepts)

## 🔑 Key Concepts
(List key terms and definitions)

## 📚 Detailed Notes
(Cleaned up bullet points)

RAW NOTES:
${rawNotes}`,
          mode: 'solver', // Use 'solver' to force output generation
          userId: user?.id,
          classId: classId
        }),
      });

      const data = await res.json();
      if (!data.response) throw new Error("AI processing failed");

      // 2. Create File
      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `Notes_${dateStr}_${timeStr}.md`;
      
      const blob = new Blob([data.response], { type: 'text/markdown' });
      const file = new File([blob], filename, { type: 'text/markdown' });

      // 3. Upload (Bypasses manual validation)
      await processAndUploadFile(file);
      
      setRawNotes('');
      setShowNoteTaker(false);

    } catch (e) {
      toast.error("Failed to save notes");
    } finally {
      setProcessingNotes(false);
    }
  };

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (!confirm('Delete this?')) return;
    try {
      await deleteDocumentAction(classId, docId, filePath);
      mutateDocuments();
      toast.success('Deleted');
    } catch (e) { toast.error('Delete failed'); }
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
      <div className="bg-white border-b border-slate-200 p-8 pt-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: (classData as any)?.color }} />
        <Button variant="ghost" onClick={() => router.push('/classes')} className="absolute top-4 left-4 text-slate-500"><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
        <h1 className="text-3xl font-bold text-slate-900">{(classData as any)?.name}</h1>
        <p className="text-slate-500 font-medium">{(classData as any)?.code}</p>
      </div>

      <div className="flex-1 overflow-hidden p-6 max-w-5xl mx-auto w-full">
        <Tabs defaultValue="materials" className="h-full flex flex-col">
          <TabsList className="bg-white border p-1 mb-4 w-fit">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="examprep">Exam Prep</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="flex-1 overflow-y-auto space-y-4">
            <div className="grid gap-4">
              <Card onClick={() => setShowNoteTaker(true)} className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 cursor-pointer hover:shadow-md transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                    <FileEdit className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 text-lg">Start Class Notes</h3>
                    <p className="text-blue-700 text-sm">AI will summarize and format them instantly.</p>
                  </div>
                </div>
                <Button className="bg-blue-600 group-hover:bg-blue-700">Open Note Taker</Button>
              </Card>

              <div className="flex justify-end">
                <label>
                  <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                  <Button variant="outline" disabled={uploadingFile}>
                    {uploadingFile ? <Loader2 className="animate-spin mr-2"/> : <Upload className="mr-2 h-4 w-4"/>} Upload PDF
                  </Button>
                </label>
              </div>

              {documents?.map((doc: any) => (
                <Card key={doc.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded flex items-center justify-center ${doc.file_type === 'text/markdown' ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}>
                    <File className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{doc.filename}</h4>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={doc.processing_status === 'completed' ? 'default' : 'outline'} className={doc.processing_status === 'completed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'text-slate-500'}>
                        {doc.processing_status === 'completed' ? 'Ready' : 'Processing...'}
                      </Badge>
                      <span className="text-xs text-slate-400 self-center">{new Date(doc.upload_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument(doc.id, doc.file_path)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-between">
              <h2 className="font-bold text-lg">Tasks</h2>
              <Button onClick={() => setShowAssignModal(true)} size="sm"><Plus className="mr-2 h-4 w-4"/> Add</Button>
            </div>
            {assignments?.map((a: any) => (
              <Card key={a.id} className="p-4 flex gap-3 items-center">
                <button onClick={(e) => toggleComplete(e, a.id, a.completed)}>
                  {a.completed ? <CheckCircle className="text-emerald-500"/> : <Circle className="text-slate-300"/>}
                </button>
                <div className="flex-1">
                  <p className={`font-medium ${a.completed && 'line-through text-slate-400'}`}>{a.title}</p>
                  <p className="text-xs text-slate-500">{a.type} • Due {new Date(a.due_date).toLocaleDateString()}</p>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="examprep" className="flex-1 flex gap-6 h-full">
            <Card className="w-80 p-4 h-full flex flex-col bg-slate-50">
              <h3 className="font-bold mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4"/> Select Content</h3>
              <div className="flex-1 overflow-y-auto space-y-2">
                {assignments?.map((a: any) => (
                  <div key={a.id} className="flex gap-2 items-center">
                    <Checkbox checked={selectedForStudy.includes(a.id)} onCheckedChange={() => toggleStudySelection(a.id)}/>
                    <span className="text-sm truncate">{a.title}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button variant={studyMode === 'flashcards' ? 'default' : 'outline'} onClick={() => setStudyMode('flashcards')}>Cards</Button>
                <Button variant={studyMode === 'quiz' ? 'default' : 'outline'} onClick={() => setStudyMode('quiz')}>Quiz</Button>
              </div>
              <Button className="w-full mt-2" onClick={generateStudyGuide} disabled={generatingGuide || !selectedForStudy.length}>
                {generatingGuide ? <Loader2 className="animate-spin"/> : "Generate"}
              </Button>
            </Card>
            <div className="flex-1 bg-white rounded-xl border p-6 overflow-y-auto">
              {flashcards.length > 0 && studyMode === 'flashcards' && <FlashcardViewer flashcards={flashcards} onRegenerate={generateStudyGuide} isGenerating={generatingGuide} />}
              {quizQuestions.length > 0 && studyMode === 'quiz' && <QuizViewer questions={quizQuestions} onRegenerate={generateStudyGuide} isGenerating={generatingGuide} />}
              {!flashcards.length && !quizQuestions.length && <div className="h-full flex items-center justify-center text-slate-400">Select assignments to start studying</div>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showNoteTaker} onOpenChange={(o) => !processingNotes && setShowNoteTaker(o)}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Live Note Taker</DialogTitle>
            <DialogDescription>Jot down raw notes. AI will format and summarize them.</DialogDescription>
          </DialogHeader>
          <Textarea 
            value={rawNotes} 
            onChange={e => setRawNotes(e.target.value)} 
            placeholder="Type your notes here..." 
            className="flex-1 resize-none p-4 font-mono text-base"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNoteTaker(false)}>Cancel</Button>
            <Button onClick={handleFinishNotes} disabled={processingNotes}>
              {processingNotes ? <><Loader2 className="animate-spin mr-2"/> Processing</> : "Format & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Title" value={newAssign.title} onChange={e => setNewAssign({...newAssign, title: e.target.value})} />
            <Select value={newAssign.type} onValueChange={v => setNewAssign({...newAssign, type: v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="Homework">Homework</SelectItem>
                <SelectItem value="Exam">Exam</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={newAssign.due_date} onChange={e => setNewAssign({...newAssign, due_date: e.target.value})} />
            <Button onClick={addAssignment} disabled={isSubmitting} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getDueDateColor(dateStr: string, completed: boolean) {
  if (completed) return 'text-slate-400';
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));
  return days < 0 ? 'text-red-500' : days <= 2 ? 'text-orange-500' : 'text-slate-500';
}