'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Sparkles, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface NoteTakerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  userId: string;
  onNoteSaved?: () => void;
}

export function NoteTaker({ open, onOpenChange, classId, userId, onNoteSaved }: NoteTakerProps) {
  const [title, setTitle] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    if (!rawNotes.trim()) {
      toast.error('Please write some notes first');
      return;
    }

    setIsSaving(true);
    try {
      const generatedTitle = title.trim() || `Notes - ${new Date().toLocaleDateString()}`;

      const response = await fetch('/api/notes/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          userId,
          title: generatedTitle,
          rawNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save notes');
      }

      toast.success('Notes saved and summarized!');

      setTitle('');
      setRawNotes('');
      onOpenChange(false);

      if (onNoteSaved) {
        onNoteSaved();
      }
    } catch (error: any) {
      console.error('Error saving notes:', error);
      toast.error(error.message || 'Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-[700px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Take Class Notes
          </DialogTitle>
          <DialogDescription>
            Write your notes below. AI will automatically format and summarize them for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Title (optional)</label>
            <Input
              placeholder="e.g., Lecture 5: Calculus Derivatives"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <Textarea
              placeholder="Start typing your notes here... Write freely, AI will format and organize them for you."
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              disabled={isSaving}
              className="min-h-[300px] resize-none font-mono text-sm"
            />
            <p className="text-xs text-slate-500">
              {rawNotes.length} characters
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-700">
              Your notes will be automatically formatted, organized, and summarized using AI when you save.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !rawNotes.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving & Summarizing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Notes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
