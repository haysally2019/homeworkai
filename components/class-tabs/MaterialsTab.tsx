'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Upload, File, Trash2, PenTool, FileText, X, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useDocuments, deleteDocument as deleteDocumentAction } from '@/hooks/use-classes';
import { NoteTaker } from '@/components/NoteTaker';
import { MessageRenderer } from '@/components/MessageRenderer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function MaterialsTab({ classId, userId }: { classId: string, userId: string }) {
  const { documents, mutate: mutateDocuments, isLoading } = useDocuments(classId);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showNoteTaker, setShowNoteTaker] = useState(false);
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [loadingNotes, setLoadingNotes] = useState(true);
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
      const { error } = await supabase.from('class_notes').delete().eq('id', noteId);
      if (error) throw error;
      setSavedNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success('Note deleted');
    } catch (e) { toast.error('Delete failed'); }
  };

  useEffect(() => { fetchNotes(); }, [classId, userId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') return toast.error('Only PDF files are supported');
    if (file.size > 10 * 1024 * 1024) return toast.error('File size must be less than 10MB');
    await processAndUploadFile(file);
    e.target.value = '';
  };

  const processAndUploadFile = async (file: File) => {
    setUploadingFile(true);
    try {
      const sanitizedName = file.name.replace(/[:\/]/g, '-').replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/${classId}/${Date.now()}_${sanitizedName}`;
      const { error: uploadError } = await supabase.storage.from('class-documents').upload(filePath, file);
      if (uploadError) throw new Error("Upload failed");

      const { data: insertedDoc, error: dbError } = await (supabase as any)
        .from('class_documents')
        .insert([{ class_id: classId, user_id: userId, filename: file.name, file_path: filePath, file_type: file.type, file_size: file.size, processing_status: 'pending' }])
        .select().single();

      if (dbError) throw dbError;
      mutateDocuments();
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: insertedDoc.id }),
      });
    } catch (error: any) { toast.error(error.message); } finally { setUploadingFile(false); }
  };

  const handleDelete = async (docId: string, filePath: string) => {
    if (!confirm('Delete this document?')) return;
    try { await deleteDocumentAction(classId, docId, filePath); mutateDocuments(); toast.success('Document deleted'); } catch (e) { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-8">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Class Materials</h2>
          <p className="text-sm text-slate-500">Manage your notes and uploaded documents</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button onClick={() => setShowNoteTaker(true)} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <PenTool className="w-4 h-4 mr-2" /> New Note
          </Button>
          <label className="flex-1 sm:flex-none">
            <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
            <Button variant="outline" disabled={uploadingFile} className="w-full bg-white">
              {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2" /> Upload PDF</>}
            </Button>
          </label>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Notes */}
        {savedNotes.map((note: any) => (
          <Card key={note.id} className="group relative bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-48" onClick={() => setSelectedNote(note)}>
            <div className="h-1.5 w-full bg-blue-500" />
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-300 hover:text-slate-600" onClick={e => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h4 className="font-bold text-slate-900 line-clamp-2 mb-1">{note.title}</h4>
              <p className="text-xs text-slate-500 line-clamp-2 flex-1">{note.summary || "No summary available"}</p>
              <div className="pt-3 mt-auto border-t border-slate-50 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                {new Date(note.created_at).toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}

        {/* Documents */}
        {documents?.map((doc: any) => (
          <Card key={doc.id} className="group relative bg-white border-slate-200 hover:border-red-300 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-48">
            <div className="h-1.5 w-full bg-red-500" />
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-red-50 rounded-lg text-red-600">
                  <File className="w-5 h-5" />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, doc.file_path); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <h4 className="font-bold text-slate-900 line-clamp-2 mb-1 break-all">{doc.filename}</h4>
              <div className="mt-auto flex items-center justify-between">
                 <Badge variant="outline" className={`text-[10px] h-5 ${doc.processing_status === 'completed' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
                  {doc.processing_status === 'completed' ? 'Ready' : 'Processing'}
                </Badge>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{new Date(doc.upload_date).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        ))}

        {/* Empty State */}
        {documents?.length === 0 && savedNotes.length === 0 && !isLoading && !loadingNotes && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Upload className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No materials yet</h3>
            <p className="text-slate-500 max-w-sm mt-1">Upload course documents or take notes to build your knowledge base.</p>
          </div>
        )}
      </div>

      <NoteTaker open={showNoteTaker} onOpenChange={setShowNoteTaker} userId={userId} classId={classId} onSave={fetchNotes} />

      <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-white">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-slate-900">{selectedNote?.title}</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedNote(null)} className="h-8 w-8 rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-slate-500 mt-1">{selectedNote?.summary}</p>
          </DialogHeader>
          <ScrollArea className="flex-1 p-8 bg-white">
            <div className="prose prose-slate max-w-none mx-auto">
              {selectedNote?.formatted_notes && <MessageRenderer content={selectedNote.formatted_notes} />}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}