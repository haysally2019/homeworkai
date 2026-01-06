'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PenTool, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface NoteTakerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  classId: string;
  onSave: () => void;
}

export function NoteTaker({ open, onOpenChange, userId, classId, onSave }: NoteTakerProps) {
  const [rawNotes, setRawNotes] = useState('');
  const [title, setTitle] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleFinish = async () => {
    if (!rawNotes.trim()) return onOpenChange(false);
    setProcessing(true);

    try {
      const res = await fetch('/api/notes/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          classId,
          title: title.trim() || `Notes - ${new Date().toLocaleDateString()}`,
          rawNotes,
        }),
      });

      const data = await res.json();

      if (res.status === 402) {
        toast.error(data.error || 'You have reached the maximum number of notes for free users');
        return;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to save notes');
      }

      setRawNotes('');
      setTitle('');
      onOpenChange(false);
      onSave();
      toast.success("Notes saved and formatted!");

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to process notes");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !processing && onOpenChange(o)}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-blue-600" /> Live Note Taker
          </DialogTitle>
          <DialogDescription>
            Jot down raw notes here. AI will organize, summarize, and format them for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="note-title" className="text-sm font-medium">Title (optional)</Label>
            <Input
              id="note-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Lecture 5 - Cell Biology"
              className="mt-1"
              disabled={processing}
            />
          </div>
          <div className="flex-1 flex flex-col">
            <Label htmlFor="note-content" className="text-sm font-medium mb-1">Notes</Label>
            <Textarea
              id="note-content"
              value={rawNotes}
              onChange={e => setRawNotes(e.target.value)}
              placeholder="Type your notes here... (e.g. Prof said: Photosynthesis has 2 stages...)"
              className="flex-1 resize-none p-6 font-mono text-base bg-slate-50 border-slate-200 focus-visible:ring-blue-500 min-h-[400px]"
              disabled={processing}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={processing}>Cancel</Button>
          <Button onClick={handleFinish} disabled={!rawNotes.trim() || processing} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
            {processing ? <><Loader2 className="animate-spin mr-2 w-4 h-4"/> Formatting...</> : <><CheckCircle className="w-4 h-4 mr-2"/> Finish & Save</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}