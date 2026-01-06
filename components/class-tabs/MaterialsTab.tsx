'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Upload, File, Trash2, PenTool, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDocuments, deleteDocument as deleteDocumentAction } from '@/hooks/use-classes';
import { NoteTaker } from '@/components/NoteTaker';
import { MessageRenderer } from '@/components/MessageRenderer';

export function MaterialsTab({ classId, userId }: { classId: string, userId: string }) {
  const { documents, mutate: mutateDocuments, isLoading } = useDocuments(classId);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showNoteTaker, setShowNoteTaker] = useState(false);
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const supabase = createClient();

  const fetchNotes = async () => {
    if (!classId || !userId) return;
    setLoadingNotes(true);
    const { data, error } = await supabase
      .from('class_notes')
      .select('*')
      .eq('class_id', classId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) setSavedNotes(data);
    setLoadingNotes(false);
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      const { error } = await supabase
        .from('class_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setSavedNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success('Note deleted');
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  useEffect(() => {
    fetchNotes();
    checkProStatus();
  }, [classId, userId]);

  const checkProStatus = async () => {
    const { data } = await supabase
      .from('users_credits')
      .select('is_pro')
      .eq('id', userId)
      .maybeSingle();
    setIsPro((data as any)?.is_pro || false);
  };

  const handleOpenNoteTaker = () => {
    if (!isPro && savedNotes.length >= 2) {
      toast.error('Free users can save up to 2 notes per class. Upgrade to Pro for unlimited notes.');
      return;
    }
    setShowNoteTaker(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      const sanitizedName = file.name.replace(/[:\/]/g, '-').replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/${classId}/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('class-documents')
        .upload(filePath, file, {
          contentType: file.type || 'text/markdown',
          upsert: false
        });

      if (uploadError) {
        console.error("Storage Error:", uploadError);
        throw new Error("Failed to upload file to storage. Check bucket permissions.");
      }

      const { data: insertedDoc, error: dbError } = await (supabase as any)
        .from('class_documents')
        .insert([{
          class_id: classId,
          user_id: userId,
          filename: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          processing_status: 'pending'
        }])
        .select().single();

      if (dbError) throw dbError;

      mutateDocuments();

      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId: insertedDoc.id }),
      });

    } catch (error: any) {
      toast.error(error.message || 'Failed to save document');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDelete = async (docId: string, filePath: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await deleteDocumentAction(classId, docId, filePath);
      mutateDocuments();
      toast.success('Document deleted');
    } catch (e) { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Class Materials</h2>
          <p className="text-sm text-slate-500">Upload notes or start a live session</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={handleOpenNoteTaker}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <PenTool className="w-4 h-4 mr-2" /> Live Notes {!isPro && `(${Math.max(0, 2 - savedNotes.length)} left)`}
          </Button>
          <label className="flex-1 sm:flex-none">
            <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
            <Button variant="outline" disabled={uploadingFile} className="w-full">
              {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Upload PDF</>}
            </Button>
          </label>
        </div>
      </div>

      <div className="grid gap-3">
        {documents?.length === 0 && savedNotes.length === 0 && !isLoading && !loadingNotes && (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Upload className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No materials yet</p>
            <p className="text-xs text-slate-400">Upload a PDF or start taking notes</p>
          </div>
        )}

        {savedNotes.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 px-1">Your Notes</h3>
            {savedNotes.map((note: any) => (
              <Card key={note.id} className="p-3 flex items-center gap-3 hover:border-blue-200 transition-all group bg-white cursor-pointer" onClick={() => setSelectedNote(note)}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate text-sm">{note.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{note.summary}</p>
                  <span className="text-[10px] text-slate-400">{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                  className="h-8 w-8 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4"/>
                </Button>
              </Card>
            ))}
          </div>
        )}

        {documents?.length > 0 && savedNotes.length > 0 && (
          <h3 className="text-sm font-semibold text-slate-700 px-1 mt-4">Uploaded Documents</h3>
        )}

        {documents?.map((doc: any) => (
          <Card key={doc.id} className="p-3 flex items-center gap-3 hover:border-slate-300 transition-all group bg-white">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-red-600">
              <File className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 truncate text-sm">{doc.filename}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-400">{new Date(doc.upload_date).toLocaleDateString()}</span>
                <Badge variant="outline" className={`text-[10px] h-4 px-1 ${doc.processing_status === 'completed' ? 'text-emerald-600 border-emerald-200' : 'text-amber-600 border-amber-200'}`}>
                  {doc.processing_status === 'completed' ? 'Ready' : 'Processing'}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id, doc.file_path)} className="h-8 w-8 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-4 h-4"/>
            </Button>
          </Card>
        ))}
      </div>

      <NoteTaker
        open={showNoteTaker}
        onOpenChange={setShowNoteTaker}
        userId={userId}
        classId={classId}
        onSave={fetchNotes}
      />

      <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl">{selectedNote?.title}</DialogTitle>
                <p className="text-sm text-slate-500 mt-2">{selectedNote?.summary}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedNote?.created_at && new Date(selectedNote.created_at).toLocaleString()}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedNote(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="prose prose-slate max-w-none">
              {selectedNote?.formatted_notes && <MessageRenderer content={selectedNote.formatted_notes} />}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
