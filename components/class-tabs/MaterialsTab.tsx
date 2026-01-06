'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, File, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function MaterialsTab({ documents, classId, onUpdate }: { documents: any[], classId: string, onUpdate: () => void }) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const filePath = `${session.user.id}/${classId}/${Date.now()}_${file.name}`;
      
      // 1. Upload to Storage
      await supabase.storage.from('class-documents').upload(filePath, file);
      
      // 2. Insert to DB
      const { data: doc, error } = await supabase.from('class_documents').insert({
        class_id: classId,
        user_id: session.user.id,
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        processing_status: 'pending' // Important for your RAG pipeline
      }).select().single();

      if (error) throw error;

      // 3. Trigger Embedding Generation (Your Edge Function)
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ documentId: doc.id })
      });

      toast.success("Material added!");
      onUpdate(); // Refresh the list
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Class Materials</h2>
        <div className="relative">
            <input type="file" accept=".pdf" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
            <Button className="bg-emerald-600">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-2"/> Upload PDF</>}
            </Button>
        </div>
      </div>

      {/* List Documents */}
      {documents.map(doc => (
        <Card key={doc.id} className="p-4 flex items-center gap-4">
           <div className="bg-red-50 w-10 h-10 rounded flex items-center justify-center"><File className="text-red-500 w-5 h-5"/></div>
           <div className="flex-1">
             <div className="font-medium">{doc.filename}</div>
             <div className="flex gap-2 mt-1">
                <Badge variant={doc.processing_status === 'completed' ? 'default' : 'secondary'}>
                    {doc.processing_status}
                </Badge>
             </div>
           </div>
        </Card>
      ))}
    </div>
  );
}