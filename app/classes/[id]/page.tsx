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
import { MessageRenderer } from '@/components/MessageRenderer';
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

  // Fetch notes
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

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
  const [viewingNote, setViewingNote] = useState<any | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user]);

  // Load notes
  useEffect(() => {
    if (!user || !classId) return;
    const loadNotes = async () => {
      setLoadingNotes(true);
      try {
        const { data, error } = await (supabase as any)
          .from('class_notes')
          .select('*')
          .eq('class_id', classId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setNotes(data);
        }
      } catch (e) {
        console.error('Failed to load notes:', e);
      } finally {
        setLoadingNotes(false);
      }
    };
    loadNotes();
  }, [user, classId]);

  // --- Assignments Logic ---

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

  // --- File Upload Logic (Split for Validation) ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 1. STRICT VALIDATION for Manual Uploads
    if (file.type !== 'application/pdf') {
      return toast.error('Only PDF files are supported for manual upload');
    }
    if (file.size > 10 * 1024 * 1024) {
      return toast.error('File size must be less than 10MB');
    }

    // 2. Proceed to Upload
    await processAndUploadFile(file);
    e.target.value = ''; // Reset input
  };

  // Core function: Uploads file to Storage & DB (Bypasses validation for AI Notes)
  const processAndUploadFile = async (file: File) => {
    setUploadingFile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Sanitize filename to avoid Storage errors
      const sanitizedName = file.name.replace(/[:\/]/g, '-').replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${session.user.id}/${classId}/${Date.now()}_${sanitizedName}`;

      // 1. Upload to Storage (Explicit Content-Type is crucial for Markdown)
      const { error: uploadError } = await supabase.storage
        .from('class-documents')
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      // 2. Add to Database
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

      toast.success('Saved! AI processing started.');
      mutateDocuments(); // Immediate UI update

      // 3. Trigger Backend Processing
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

  // --- Note Taker Logic ---

  const handleFinishNotes = async () => {
    if (!rawNotes.trim()) return setShowNoteTaker(false);
    setProcessingNotes(true);

    try {
      // 1. AI Formatting and Summarization
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `You are an expert academic note-taker.
TASK: Format these raw notes into a clean Markdown study guide AND provide a brief summary.

STRUCTURE:
# [Topic Name]

## 📝 Summary
[Write a concise 2-3 sentence summary of the key points]

## 🔑 Key Concepts
- **Term 1**: Definition
- **Term 2**: Definition

## 📚 Detailed Notes
[Organized bullet points from the raw notes]

## 💡 Key Takeaways
- Important point 1
- Important point 2

RAW NOTES:
${rawNotes}`,
          mode: 'solver',
          userId: user?.id,
          classId: classId
        }),
      });

      const data = await res.json();
      if (!data.response) throw new Error("AI processing failed");

      // 2. Extract summary from the formatted notes
      const formattedNotes = data.response;
      const summaryMatch = formattedNotes.match(/##\s*📝\s*Summary\s*\n([\s\S]*?)(?=\n##|$)/i);
      const summary = summaryMatch
        ? summaryMatch[1].trim()
        : rawNotes.slice(0, 200) + '...';

      // 3. Extract title from the formatted notes
      const titleMatch = formattedNotes.match(/^#\s*(.+)$/m);
      const title = titleMatch
        ? titleMatch[1].trim()
        : `Notes - ${new Date().toLocaleDateString()}`;

      // 4. Save to database
      const { error: insertError } = await (supabase as any)
        .from('class_notes')
        .insert({
          class_id: classId,
          user_id: user?.id,
          title: title,
          raw_notes: rawNotes,
          formatted_notes: formattedNotes,
          summary: summary
        });

      if (insertError) throw insertError;

      toast.success("Notes saved successfully!");

      // 5. Refresh notes list
      const { data: updatedNotes } = await (supabase as any)
        .from('class_notes')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (updatedNotes) setNotes(updatedNotes);

      setRawNotes('');
      setShowNoteTaker(false);

    } catch (e: any) {
      console.error('Note save error:', e);
      toast.error(e.message || "Failed to save notes");
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

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      const { error } = await (supabase as any)
        .from('class_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success('Note deleted');
      setViewingNote(null);
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  // --- Exam Prep Logic ---

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
      {/* Header */}
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

          {/* MATERIALS TAB */}
          <TabsContent value="materials" className="flex-1 overflow-y-auto space-y-4">
            <div className="grid gap-4">
              {/* Quick Action Card */}
              <Card onClick={() => setShowNoteTaker(true)} className="p-6 bg-gradient-to-r from-blue-50 to-sky-50 border-blue-100 cursor-pointer hover:shadow-md transition-all flex items-center justify-between group">
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

              {/* Notes Section */}
              {notes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                    <PenTool className="w-4 h-4" /> Your Notes
                  </h3>
                  {notes.map((note: any) => (
                    <Card
                      key={note.id}
                      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer border-l-4 border-l-blue-500"
                      onClick={() => setViewingNote(note)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded flex items-center justify-center bg-blue-100 text-blue-600 shrink-0">
                          <PenTool className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 mb-1">{note.title}</h4>
                          <p className="text-sm text-slate-600 line-clamp-2">{note.summary}</p>
                          <span className="text-xs text-slate-400 mt-2 block">
                            {new Date(note.created_at).toLocaleDateString()} at {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          className="text-slate-400 hover:text-red-600 shrink-0"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <div className="flex justify-end">
                <label>
                  <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                  <Button variant="outline" disabled={uploadingFile}>
                    {uploadingFile ? <Loader2 className="animate-spin mr-2"/> : <Upload className="mr-2 h-4 w-4"/>} Upload PDF
                  </Button>
                </label>
              </div>

              {/* Document List */}
              {documents && documents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Documents
                  </h3>
                  {documents.map((doc: any) => (
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
              )}
            </div>
          </TabsContent>

          {/* ASSIGNMENTS TAB */}
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

          {/* EXAM PREP TAB */}
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

      {/* NOTE TAKER MODAL */}
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

      {/* ADD ASSIGNMENT MODAL */}
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

      {/* VIEW NOTE MODAL */}
      <Sheet open={!!viewingNote} onOpenChange={(open) => !open && setViewingNote(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          {viewingNote && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold pr-8">{viewingNote.title}</SheetTitle>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>{new Date(viewingNote.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{new Date(viewingNote.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Summary Card */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Summary
                  </h3>
                  <p className="text-slate-700">{viewingNote.summary}</p>
                </Card>

                {/* Formatted Notes */}
                <div className="prose prose-sm max-w-none">
                  <div className="bg-white p-6 rounded-lg border">
                    <MessageRenderer content={viewingNote.formatted_notes} role="assistant" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteNote(viewingNote.id)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Note
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewingNote(null)}
                    className="ml-auto"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function getDueDateColor(dateStr: string, completed: boolean) {
  if (completed) return 'text-slate-400';
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));
  return days < 0 ? 'text-red-500' : days <= 2 ? 'text-orange-500' : 'text-slate-500';
}