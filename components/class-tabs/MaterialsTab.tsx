'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, File, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDocuments, deleteDocument as deleteDocumentAction } from '@/hooks/use-classes';

export function MaterialsTab({ classId, userId }: { classId: string, userId: string }) {
  const { documents, mutate: mutateDocuments, isLoading } = useDocuments(classId);
  const [uploadingFile, setUploadingFile] = useState(false);
  const supabase = createClient();

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
      toast.success('Document uploaded successfully');
    } catch (error: any) { toast.error(error.message); } finally { setUploadingFile(false); }
  };

  const handleDelete = async (docId: string, filePath: string) => {
    if (!confirm('Delete this document?')) return;
    try { await deleteDocumentAction(classId, docId, filePath); mutateDocuments(); toast.success('Document deleted'); } catch (e) { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Class Documents</h2>
          <p className="text-sm text-slate-500">Upload syllabus, slides, and readings</p>
        </div>
        <label className="w-full sm:w-auto">
          <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
          <Button disabled={uploadingFile} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploadingFile ? 'Uploading...' : 'Upload PDF'}
          </Button>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {documents?.map((doc: any) => (
          <Card key={doc.id} className="group relative bg-white border-slate-200 hover:border-red-300 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-40">
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
              <h4 className="font-bold text-slate-900 line-clamp-1 mb-1 break-all text-sm">{doc.filename}</h4>
              <div className="mt-auto flex items-center justify-between">
                 <Badge variant="outline" className={`text-[10px] h-5 ${doc.processing_status === 'completed' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
                  {doc.processing_status === 'completed' ? 'Ready' : 'Processing'}
                </Badge>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{new Date(doc.upload_date).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        ))}

        {documents?.length === 0 && !isLoading && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Upload className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No documents yet</h3>
            <p className="text-slate-500 max-w-sm mt-1">Upload course PDFs to build your knowledge base.</p>
          </div>
        )}
      </div>
    </div>
  );
}