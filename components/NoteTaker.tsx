'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PenTool, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface NoteTakerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  classId: string;
  onSave: (file: File) => Promise<void>;
}

export function NoteTaker({ open, onOpenChange, userId, classId, onSave }: NoteTakerProps) {
  const [rawNotes, setRawNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleFinish = async () => {
    if (!rawNotes.trim()) return onOpenChange(false);
    setProcessing(true);

    try {
      // AI Summarization Call
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
          mode: 'solver',
          userId: userId,
          classId: classId
        }),
      });

      const data = await res.json();
      if (!data.response) throw new Error("AI processing failed");

      // Create Markdown File
      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `Notes_${dateStr}_${timeStr}.md`;
      
      const blob = new Blob([data.response], { type: 'text/markdown' });
      const file = new File([blob], filename, { type: 'text/markdown' });

      // Pass back to parent to upload
      await onSave(file);
      
      setRawNotes('');
      onOpenChange(false);
      toast.success("Notes saved and formatted!");

    } catch (e) {
      console.error(e);
      toast.error("Failed to process notes");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !processing && onOpenChange(o)}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-indigo-600" /> Live Note Taker
          </DialogTitle>
          <DialogDescription>
            Jot down raw notes here. AI will organize, summarize, and format them for you.
          </DialogDescription>
        </DialogHeader>
        
        <Textarea 
          value={rawNotes} 
          onChange={e => setRawNotes(e.target.value)} 
          placeholder="Type your notes here... (e.g. Prof said: Photosynthesis has 2 stages...)" 
          className="flex-1 resize-none p-6 font-mono text-base bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
        />
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={processing}>Cancel</Button>
          <Button onClick={handleFinish} disabled={!rawNotes.trim() || processing} className="bg-indigo-600 hover:bg-indigo-700 min-w-[140px]">
            {processing ? <><Loader2 className="animate-spin mr-2 w-4 h-4"/> Formatting...</> : <><CheckCircle className="w-4 h-4 mr-2"/> Finish & Save</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}