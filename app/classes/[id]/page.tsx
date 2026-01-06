'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CheckCircle, Circle, Calendar, ArrowLeft, BookOpen, Sparkles, Loader2, FileText, Clock, Upload, File, Trash2, Layers, HelpCircle, PenLine, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageRenderer } from '@/components/MessageRenderer';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { FlashcardViewer } from '@/components/FlashcardViewer';
import { QuizViewer } from '@/components/QuizViewer';
import { toast } from 'sonner';
import { useClass, useAssignments, useDocuments, useNotes, createAssignment, updateAssignment, deleteDocument as deleteDocumentAction, deleteNote as deleteNoteAction } from '@/hooks/use-classes';
import { NoteTaker } from '@/components/NoteTaker';

export default function ClassDetail() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();

  const classId = Array.isArray(id) ? id[0] : id;

  const { classData, isLoading: classLoading } = useClass(classId);
  const { assignments, isLoading: assignmentsLoading, mutate: mutateAssignments } = useAssignments(classId);
  const { documents, isLoading: documentsLoading, mutate: mutateDocuments } = useDocuments(classId);
  const { notes, isLoading: notesLoading, mutate: mutateNotes } = useNotes(classId);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [showNoteTaker, setShowNoteTaker] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [newAssign, setNewAssign] = useState({ title: '', due_date: '', type: 'Homework' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedForStudy, setSelectedForStudy] = useState<string[]>([]);
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [studyGuide, setStudyGuide] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<'flashcards' | 'quiz'>('flashcards');
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

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

      const newAssignmentData = await createAssignment(classId, {
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
      toast.error('Only PDF files are supported');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

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
          file_type: file.type,
          file_size: file.size,
          processing_status: 'pending'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success('Document uploaded successfully! Processing will begin shortly.');
      mutateDocuments();

      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId: insertedDoc.id }),
      }).catch(err => console.error('Error triggering processing:', err));

      e.target.value = '';
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to upload document');
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

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note? This cannot be undone.')) return;

    const previousNotes = notes;
    mutateNotes(
      (notes as any[]).filter((n: any) => n.id !== noteId) as any,
      { revalidate: false }
    );

    try {
      await deleteNoteAction(classId, noteId);
      toast.success('Note deleted');
    } catch (error: any) {
      console.error('Error deleting note:', error);
      mutateNotes(previousNotes as any, { revalidate: false });
      toast.error('Failed to delete note');
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

Return ONLY a valid JSON array in this exact format (no markdown, no code blocks, just pure JSON):
[
  {"question": "What is...", "answer": "..."},
  {"question": "Define...", "answer": "..."}
]

Make the questions clear and concise. Make the answers informative but not too long.`;
      } else {
        prompt = `Generate exactly 8 multiple choice quiz questions for the following topics/assignments: ${selectedTitles}.

Return ONLY a valid JSON array in this exact format (no markdown, no code blocks, just pure JSON):
[
  {
    "question": "What is...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "The correct answer is A because..."
  }
]

Ensure correctAnswer is the index (0-3) of the correct option.`;
      }

      const res = await fetch('/api/solve', {
        method: 'POST',
        body: JSON.stringify({
          text: prompt,
          mode: 'tutor',
          userId: user?.id,
          classId: Array.isArray(id) ? id[0] : id
        }),
      });

      const data = await res.json();
      if (data.response) {
        try {
          let jsonStr = data.response.trim();
          jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          jsonStr = jsonStr.replace(/^[^[\{]*/, '').replace(/[^}\]]*$/, '');

          const parsed = JSON.parse(jsonStr);

          if (studyMode === 'flashcards') {
            setFlashcards(parsed);
          } else {
            setQuizQuestions(parsed);
          }
        } catch (parseError) {
          console.error('Failed to parse JSON:', parseError, data.response);
          toast.error("Failed to parse study material. Please try again.");
        }
      } else {
        throw new Error("No response from AI");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate study material");
    } finally {
      setGeneratingGuide(false);
    }
  };

  if (authLoading || (classLoading && !classData)) {
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
              <FileText className="w-4 h-4 mr-2" />
              Materials
            </TabsTrigger>
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
              {(assignments as any[]).map((a: any) => (
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

          <TabsContent value="materials" className="space-y-4 flex-1">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Class Materials</h2>
                <p className="text-sm text-slate-500 mt-1">Upload documents and take notes for AI-enhanced help</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowNoteTaker(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <PenLine className="w-4 h-4 mr-2" /> Take Notes
                </Button>
                <label htmlFor="file-upload">
                  <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    size="sm"
                    disabled={uploadingFile}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {uploadingFile ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" /> Upload PDF</>
                    )}
                  </Button>
                </label>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {documents.length === 0 && notes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-xl border-2 border-slate-200 border-dashed">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-blue-300" />
                </div>
                <p className="text-lg font-medium text-slate-600 mb-2">No materials yet</p>
                <p className="text-sm text-slate-500 mb-4 max-w-md text-center">
                  Take notes during class or upload documents to get AI responses tailored to your coursework
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowNoteTaker(true)}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <PenLine className="w-4 h-4 mr-2" /> Take Notes
                  </Button>
                  <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    variant="outline"
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                  >
                    <Upload className="w-4 h-4 mr-2" /> Upload PDF
                  </Button>
                </div>
              </div>
            )}

            {notes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Class Notes
                </h3>
                {(notes as any[]).map((note: any) => (
                  <Card key={note.id} className="p-4 bg-white border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-800 mb-1">{note.title}</h3>
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">{note.summary}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {new Date(note.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {documents.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <File className="w-4 h-4 text-red-600" />
                  Documents
                </h3>
                {(documents as any[]).map((doc: any) => (
                  <Card key={doc.id} className="p-4 flex items-center gap-4 bg-white border-slate-200 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <File className="w-5 h-5 text-red-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-800 truncate">{doc.filename}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500">
                          {new Date(doc.upload_date).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            doc.processing_status === 'completed' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' :
                            doc.processing_status === 'processing' ? 'border-blue-500 text-blue-700 bg-blue-50' :
                            doc.processing_status === 'failed' ? 'border-red-500 text-red-700 bg-red-50' :
                            'border-orange-500 text-orange-700 bg-orange-50'
                          }
                        >
                          {doc.processing_status === 'completed' && '✓ Processed'}
                          {doc.processing_status === 'processing' && '⟳ Processing'}
                          {doc.processing_status === 'failed' && '✗ Failed'}
                          {doc.processing_status === 'pending' && '⏱ Pending'}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}

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
            {/* Sidebar: Assignment Selection */}
            <Card className="w-full md:w-80 bg-white border-slate-200 p-4 flex flex-col h-full">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  Select Material
                </h3>
                <p className="text-xs text-slate-500 mt-1">Choose assignments to include in your study material.</p>
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium text-slate-600 mb-2 block">Study Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={studyMode === 'flashcards' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStudyMode('flashcards')}
                    className={studyMode === 'flashcards' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  >
                    <Layers className="w-3 h-3 mr-1" />
                    Flashcards
                  </Button>
                  <Button
                    variant={studyMode === 'quiz' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStudyMode('quiz')}
                    className={studyMode === 'quiz' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    <HelpCircle className="w-3 h-3 mr-1" />
                    Quiz
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
                {assignments.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">No assignments available.</p>}
                {(assignments as any[]).map((a: any) => (
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
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate {studyMode === 'flashcards' ? 'Flashcards' : 'Quiz'}
                  </>
                )}
              </Button>
            </Card>

            {/* Main: Interactive Study Output */}
            <Card className="flex-1 bg-white border-slate-200 p-6 overflow-hidden min-h-[500px]">
              {!flashcards.length && !quizQuestions.length && !generatingGuide && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8">
                  <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-purple-200" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-600 mb-2">Interactive Exam Prep</h3>
                  <p className="max-w-sm mx-auto text-sm mb-4">
                    Select assignments and choose between flashcards or quiz mode to create personalized study materials.
                  </p>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      <span>Flashcards for memorization</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <HelpCircle className="w-4 h-4 text-blue-500" />
                      <span>Quiz to test knowledge</span>
                    </div>
                  </div>
                </div>
              )}
              {generatingGuide && (
                <div className="h-full flex flex-col items-center justify-center text-purple-600">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="animate-pulse font-medium">
                    Creating your {studyMode === 'flashcards' ? 'flashcards' : 'quiz'}...
                  </p>
                </div>
              )}
              {flashcards.length > 0 && studyMode === 'flashcards' && (
                <FlashcardViewer
                  flashcards={flashcards}
                  onRegenerate={generateStudyGuide}
                  isGenerating={generatingGuide}
                />
              )}
              {quizQuestions.length > 0 && studyMode === 'quiz' && (
                <QuizViewer
                  questions={quizQuestions}
                  onRegenerate={generateStudyGuide}
                  isGenerating={generatingGuide}
                />
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

      <NoteTaker
        open={showNoteTaker}
        onOpenChange={setShowNoteTaker}
        classId={classId}
        userId={user?.id || ''}
        onNoteSaved={() => mutateNotes()}
      />
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