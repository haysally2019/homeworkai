'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CheckCircle, Circle, Calendar, ArrowLeft, BookOpen, Sparkles, Loader2, FileText, Clock, Upload, File, Trash2, Layers, HelpCircle, PenTool } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
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
  const { assignments, isLoading: assignmentsLoading, mutate: mutateAssignments } = useAssignments(classId);
  const { documents, isLoading: documentsLoading, mutate: mutateDocuments } = useDocuments(classId);

  const [uploadingFile, setUploadingFile] = useState(false);

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

  // Note Taker State
  const [showNoteTaker, setShowNoteTaker] = useState(false);
  const [rawNotes, setRawNotes] = useState('');
  const [processingNotes, setProcessingNotes] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user]);

  const addAssignment = async () => {
    if (!newAssign.title) {
      toast.error("Please enter a title");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!user) return;

      await createAssignment(classId, {
        title: newAssign.title,
        due_date: newAssign.due_date || null,
        type: newAssign.type,
        user_id: user.id,
        completed: false
      });

      mutateAssignments();

      toast.success("Assignment added successfully");
      setShowAssignModal(false);
      setNewAssign({ title: '', due_date: '', type: 'Homework' });
    } catch (error: any) {
      console.error('Error adding assignment:', error);
      toast.error(error.message || "Failed to save assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComplete = async (e: React.MouseEvent, aid: string, current: boolean) => {
    e.stopPropagation();

    const previousAssignments = assignments;
    mutateAssignments(
      (assignments as any[]).map((a: any) => a.id === aid ? { ...a, completed: !current } : a) as any,
      { revalidate: false }
    );

    try {
      await updateAssignment(classId, aid, { completed: !current });
    } catch (error) {
      mutateAssignments(previousAssignments as any, { revalidate: false });
      toast.error("Failed to update status");
    }
  };

  // -------------------------------------------------------------------------
  // UPDATED FILE UPLOAD LOGIC
  // -------------------------------------------------------------------------

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // VALIDATION ONLY APPLIES TO MANUAL UPLOADS
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported for upload');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    await processAndUploadFile(file);
    e.target.value = ''; // Reset input
  };

  // Shared function: removed validation to allow Markdown from Note Taker
  const processAndUploadFile = async (file: File) => {
    setUploadingFile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const classId = Array.isArray(id) ? id[0] : id;
      const filePath = `${session.user.id}/${classId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('class-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: insertedDoc, error: dbError } = await (supabase as any)
        .from('class_documents')
        .insert([{
          class_id: classId,
          user_id: session.user.id,
          filename: file.name,
          file_path: filePath,
          file_type: file.type, // 'text/markdown' for notes, 'application/pdf' for uploads
          file_size: file.size,
          processing_status: 'pending'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success('Document saved successfully! Processing started.');
      mutateDocuments();

      // Trigger embedding generation
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId: insertedDoc.id }),
      }).catch(err => console.error('Error triggering processing:', err));

    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to save document');
      throw error; // Rethrow to let caller know
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return;

    const previousDocuments = documents;
    mutateDocuments(
      (documents as any[]).filter((d: any) => d.id !== docId) as any,
      { revalidate: false }
    );

    try {
      await deleteDocumentAction(classId, docId, filePath);
      toast.success('Document deleted');
    } catch (error: any) {
      console.error('Error deleting document:', error);
      mutateDocuments(previousDocuments as any, { revalidate: false });
      toast.error('Failed to delete document');
    }
  };

  const handleFinishNotes = async () => {
    if (!rawNotes.trim()) {
      setShowNoteTaker(false);
      return;
    }

    setProcessingNotes(true);
    try {
      // 1. Send raw notes to AI for cleaning
      // Use SOLVER mode to force action (formatting) rather than tutoring
      const res = await fetch('/api/solve', {
        method: 'POST',
        body: JSON.stringify({
          text: `TASK: Reformat the following class notes into clean Markdown.
          
INSTRUCTIONS:
- Fix typos and grammar.
- Use # Headings, - Bullet points, and **Bold** for key terms.
- Do NOT add conversational text like "Here are your notes". Just output the notes.

RAW NOTES:
${rawNotes}`,
          mode: 'solver', 
          userId: user?.id,
          classId: classId
        }),
      });

      const data = await res.json();
      if (!data.response) throw new Error("Failed to process notes");

      // 2. Create a File object from the AI response
      const noteContent = `# Class Notes: ${new Date().toLocaleDateString()}\n\n${data.response}`;
      const blob = new Blob([noteContent], { type: 'text/markdown' });
      // Create a friendly filename
      const filename = `Notes_${new Date().toLocaleDateString().replace(/\//g, '-')}.md`;
      
      const file = new File([blob], filename, { type: 'text/markdown' });

      // 3. Upload using refactored logic
      await processAndUploadFile(file);
      
      setRawNotes('');
      setShowNoteTaker(false);
      // Toast success is already handled in processAndUploadFile

    } catch (error) {
      console.error(error);
      toast.error("Failed to process notes");
    } finally {
      setProcessingNotes(false);
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
    setFlashcards([]);
    setQuizQuestions([]);

    const selectedTitles = (assignments as any[])
      .filter((a: any) => selectedForStudy.includes(a.id))
      .map((a: any) => `${a.title} (${a.type || 'Homework'})`)
      .join(', ');

    try {
      let prompt = '';
      if (studyMode === 'flashcards') {
        prompt = `Generate exactly 10 flashcards for the following topics/assignments: ${selectedTitles}.
Return ONLY a valid JSON array in this exact format (no markdown, no code blocks):
[{"question": "...", "answer": "..."}]`;
      } else {
        prompt = `Generate exactly 8 multiple choice quiz questions for: ${selectedTitles}.
Return ONLY a valid JSON array in this exact format (no markdown, no code blocks):
[{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}]`;
      }

      const res = await fetch('/api/solve', {
        method: 'POST',
        body: JSON.stringify({
          text: prompt,
          mode: 'tutor',
          userId: user?.id,
          classId: classId
        }),
      });

      const data = await res.json();
      if (data.response) {
        try {
          let jsonStr = data.response.trim();
          jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          const parsed = JSON.parse(jsonStr);
          studyMode === 'flashcards' ? setFlashcards(parsed) : setQuizQuestions(parsed);
        } catch (parseError) {
          toast.error("Failed to parse study material.");
        }
      }
    } catch (e) {
      toast.error("Failed to generate study material");
    } finally {
      setGeneratingGuide(false);
    }
  };

  if (authLoading || (classLoading && !classData)) {
    return (
      <div className="h-full flex flex-col bg-slate-50 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || !classData) return null;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="h-48 bg-white border-b border-slate-200 p-8 flex flex-col justify-end relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: (classData as any)?.color }} />
        <Button variant="ghost" onClick={() => router.push('/classes')} className="absolute top-6 left-6 text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Classes
        </Button>
        <h1 className="text-4xl font-bold text-slate-900">{(classData as any)?.name}</h1>
        <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
          <span className="bg-slate-100 px-2 py-1 rounded text-xs uppercase tracking-wider text-slate-600">{(classData as any)?.code}</span>
          <span>•</span>
          <span>{(classData as any)?.semester}</span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full">
        <Tabs defaultValue="assignments" className="w-full h-full flex flex-col">
          <TabsList className="bg-white border border-slate-200 p-1 mb-6 w-fit">
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="materials">
              <FileText className="w-4 h-4 mr-2" /> Materials
            </TabsTrigger>
            <TabsTrigger value="examprep" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
              <Sparkles className="w-4 h-4 mr-2" /> Exam Prep
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
              {(assignments as any[]).map((a: any) => (
                <Card 
                  key={a.id} 
                  onClick={() => setSelectedAssignment(a)}
                  className="p-4 flex items-center gap-4 bg-white border-slate-200 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                >
                  <button onClick={(e) => toggleComplete(e, a.id, a.completed)} className="shrink-0 focus:outline-none">
                    {a.completed ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-slate-300 group-hover:text-blue-500" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${a.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{a.title}</h3>
                      <Badge variant="secondary" className="text-[10px] h-5 px-2 font-normal">{a.type}</Badge>
                    </div>
                    {a.due_date && (
                      <div className={`flex items-center text-xs ${getDueDateColor(a.due_date, a.completed)}`}>
                        <Calendar className="w-3 h-3 mr-1" /> {new Date(a.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4 flex-1">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Class Materials</h2>
                <p className="text-sm text-slate-500 mt-1">Upload syllabi, notes, and study materials</p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowNoteTaker(true)} 
                  variant="outline"
                  className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <PenTool className="w-4 h-4 mr-2" /> Live Notes
                </Button>

                <label htmlFor="file-upload">
                  <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={uploadingFile}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {uploadingFile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Upload PDF</>}
                  </Button>
                </label>
                <input id="file-upload" type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
              </div>
            </div>

            {documents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-xl border-2 border-slate-200 border-dashed">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-emerald-300" />
                </div>
                <p className="text-lg font-medium text-slate-600 mb-2">No materials uploaded yet</p>
                <p className="text-sm text-slate-500 mb-4 max-w-md text-center">
                  Upload your syllabus, class notes, or study materials to get AI responses tailored to your professor's teaching style
                </p>
              </div>
            )}

            <div className="grid gap-3">
              {(documents as any[]).map((doc: any) => (
                <Card key={doc.id} className="p-4 flex items-center gap-4 bg-white border-slate-200 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <File className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-800 truncate">{doc.filename}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">{new Date(doc.upload_date).toLocaleDateString()}</span>
                      <Badge variant="outline" className={doc.processing_status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50'}>
                        {doc.processing_status}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id, doc.file_path)} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </div>

            {documents.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">AI-Enhanced Learning</h4>
                    <p className="text-sm text-blue-700">
                      Your uploaded materials are being processed and will be used to provide context-aware responses when you ask questions or solve problems in this class.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="examprep" className="flex-1 flex flex-col md:flex-row gap-6 h-full min-h-[500px]">
            {/* ... Same Exam Prep UI as before ... */}
            <Card className="w-full md:w-80 bg-white border-slate-200 p-4 flex flex-col h-full">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" /> Select Material
                </h3>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2">
                  <Button variant={studyMode === 'flashcards' ? 'default' : 'outline'} size="sm" onClick={() => setStudyMode('flashcards')} className={studyMode === 'flashcards' ? 'bg-emerald-600' : ''}>
                    <Layers className="w-3 h-3 mr-1" /> Cards
                  </Button>
                  <Button variant={studyMode === 'quiz' ? 'default' : 'outline'} size="sm" onClick={() => setStudyMode('quiz')} className={studyMode === 'quiz' ? 'bg-blue-600' : ''}>
                    <HelpCircle className="w-3 h-3 mr-1" /> Quiz
                  </Button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
                {(assignments as any[]).map((a: any) => (
                  <div key={a.id} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100">
                    <Checkbox id={`study-${a.id}`} checked={selectedForStudy.includes(a.id)} onCheckedChange={() => toggleStudySelection(a.id)} />
                    <label htmlFor={`study-${a.id}`} className="text-sm font-medium cursor-pointer flex-1 truncate">{a.title}</label>
                  </div>
                ))}
              </div>
              <Button onClick={generateStudyGuide} disabled={selectedForStudy.length === 0 || generatingGuide} className="w-full bg-purple-600 hover:bg-purple-700">
                {generatingGuide ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" /> Generate</>}
              </Button>
            </Card>

            <Card className="flex-1 bg-white border-slate-200 p-6 overflow-hidden min-h-[500px]">
              {!flashcards.length && !quizQuestions.length && !generatingGuide && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8">
                  <Sparkles className="w-12 h-12 mb-4 text-slate-200" />
                  <p>Select assignments to generate study materials.</p>
                </div>
              )}
              {generatingGuide && <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>}
              {flashcards.length > 0 && studyMode === 'flashcards' && <FlashcardViewer flashcards={flashcards} onRegenerate={generateStudyGuide} isGenerating={generatingGuide} />}
              {quizQuestions.length > 0 && studyMode === 'quiz' && <QuizViewer questions={quizQuestions} onRegenerate={generateStudyGuide} isGenerating={generatingGuide} />}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Note Taker Modal */}
      <Dialog open={showNoteTaker} onOpenChange={(open) => !processingNotes && setShowNoteTaker(open)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-blue-600" /> Live Note Taker
            </DialogTitle>
            <DialogDescription>
              Take raw notes here. When you finish, AI will clean, format, and save them to your Class Materials.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 py-4">
            <Textarea 
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Start typing your notes here... don't worry about formatting!"
              className="h-full resize-none text-base p-6 leading-relaxed font-mono bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNoteTaker(false)} disabled={processingNotes}>
              Cancel
            </Button>
            <Button onClick={handleFinishNotes} disabled={!rawNotes.trim() || processingNotes} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
              {processingNotes ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" /> Finish & Save</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Assignment Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="bg-white sm:max-w-[425px]">
          <DialogHeader><DialogTitle>New Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
               <label className="text-sm font-medium">Title</label>
               <Input value={newAssign.title} onChange={e => setNewAssign({...newAssign, title: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-sm font-medium">Type</label>
                 <Select onValueChange={(val) => setNewAssign({...newAssign, type: val})} defaultValue="Homework">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Homework">Homework</SelectItem>
                    <SelectItem value="Quiz">Quiz</SelectItem>
                    <SelectItem value="Exam">Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-medium">Due Date</label>
                 <Input type="date" value={newAssign.due_date} onChange={e => setNewAssign({...newAssign, due_date: e.target.value})} />
              </div>
            </div>
            <Button onClick={addAssignment} disabled={isSubmitting} className="w-full bg-blue-600 mt-4">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Detail Sheet */}
      <Sheet open={!!selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-white">
          <SheetHeader className="mb-6">
            <SheetTitle>{selectedAssignment?.title}</SheetTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{selectedAssignment?.type}</Badge>
              {selectedAssignment?.due_date && <span className="text-sm text-slate-500">Due {new Date(selectedAssignment.due_date).toLocaleDateString()}</span>}
            </div>
          </SheetHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 cursor-pointer hover:border-blue-500" onClick={() => router.push(`/chat?mode=solver&assignmentId=${selectedAssignment.id}&context=${encodeURIComponent(selectedAssignment?.title)}`)}>
                  <div className="font-medium text-sm text-blue-600 mb-1">Solver Mode</div>
                  <div className="text-xs text-slate-500">Step-by-step help</div>
                </Card>
                <Card className="p-4 cursor-pointer hover:border-purple-500" onClick={() => router.push(`/chat?mode=tutor&assignmentId=${selectedAssignment.id}&context=${encodeURIComponent(selectedAssignment?.title)}`)}>
                  <div className="font-medium text-sm text-purple-600 mb-1">Tutor Mode</div>
                  <div className="text-xs text-slate-500">Concept breakdown</div>
                </Card>
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
  if (diffDays < 0) return 'text-red-500 font-medium';
  if (diffDays <= 2) return 'text-orange-500 font-medium';
  return 'text-slate-500';
}