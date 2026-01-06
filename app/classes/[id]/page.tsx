'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CheckCircle, Circle, Calendar, ArrowLeft, BookOpen, Sparkles, Loader2, FileText, Clock, Upload, File, Trash2, Layers, HelpCircle, PenTool, FileEdit } from 'lucide-react';
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const processAndUploadFile = async (file: File) => {
    setUploadingFile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const classId = Array.isArray(id) ? id[0] : id;
      
      // Sanitized filename to prevent upload errors
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${session.user.id}/${classId}/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('class-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type // Ensure content type is passed explicitly
        });

      if (uploadError) throw uploadError;

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
      throw error;
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
      // Improved Prompt for better cleanup and summary
      const res = await fetch('/api/solve', {
        method: 'POST',
        body: JSON.stringify({
          text: `You are an expert academic note-taker.
TASK: Transform the user's raw notes into a beautiful, study-ready Markdown document.

REQUIREMENTS:
1. **Executive Summary**: Begin with a '## 📝 Summary' section summarizing the core concepts (approx 50 words).
2. **Structure**: Organize content into logical sections with clear Headers (##, ###).
3. **Key Terms**: Bold **definitions** and **important terms**.
4. **Readability**: Convert messy lists into clean bullet points. Fix grammar/typos.
5. **Formatting**: Use > blockquotes for crucial "Remember this" points. Do NOT include any conversational intro/outro.

RAW NOTES:
${rawNotes}`,
          mode: 'solver', // Solver mode ensures direct execution of the task
          userId: user?.id,
          classId: classId
        }),
      });

      const data = await res.json();
      if (!data.response) throw new Error("Failed to process notes");

      // Robust Filename Generation
      const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `Notes_${dateStr}_${timeStr}.md`;
      
      // Create file with explicit type
      const noteContent = `# Class Notes: ${new Date().toLocaleDateString()}\n\n${data.response}`;
      const blob = new Blob([noteContent], { type: 'text/markdown' });
      const file = new File([blob], filename, { type: 'text/markdown' });

      await processAndUploadFile(file);
      
      setRawNotes('');
      setShowNoteTaker(false);
      // Toast success handled in processAndUploadFile

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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border border-indigo-500"
                >
                  <PenTool className="w-4 h-4 mr-2" /> Open Note Taker
                </Button>

                <label htmlFor="file-upload">
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={uploadingFile}
                    className="border-slate-200 hover:bg-slate-50"
                  >
                    {uploadingFile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Upload PDF</>}
                  </Button>
                </label>
                <input id="file-upload" type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
              </div>
            </div>

            {/* Quick Action Card for Empty State or Top of List */}
            <div className="grid gap-3">
              <Card 
                className="p-4 bg-indigo-50 border-indigo-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
                onClick={() => setShowNoteTaker(true)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <FileEdit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-indigo-900">Start Taking Notes</h3>
                    <p className="text-xs text-indigo-600">Use AI to capture, format, and summarize your lecture notes instantly.</p>
                  </div>
                </div>
                <ArrowLeft className="w-5 h-5 text-indigo-400 rotate-180 group-hover:translate-x-1 transition-transform" />
              </Card>

              {(documents as any[]).map((doc: any) => (
                <Card key={doc.id} className="p-4 flex items-center gap-4 bg-white border-slate-200 hover:shadow-md transition-all">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${doc.file_type === 'text/markdown' ? 'bg-purple-100' : 'bg-slate-100'}`}>
                    <File className={`w-5 h-5 ${doc.file_type === 'text/markdown' ? 'text-purple-600' : 'text-slate-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-800 truncate">{doc.filename}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">{new Date(doc.upload_date).toLocaleDateString()}</span>
                      <Badge variant="outline" className={doc.processing_status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50'}>
                        {doc.processing_status}
                      </Badge>
                      {doc.file_type === 'text/markdown' && <Badge variant="secondary" className="text-[10px] h-5">AI Notes</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id, doc.file_path)} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </div>

            {documents.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p>No uploaded documents yet.</p>
              </div>
            )}
          </TabsContent>

          {/* ... Exam Prep Content (No Changes) ... */}
          <TabsContent value="examprep" className="flex-1 flex flex-col md:flex-row gap-6 h-full min-h-[500px]">
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
        <DialogContent className="max-w-4xl h-[80vh]