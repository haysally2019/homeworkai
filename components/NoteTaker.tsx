'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PenTool, CheckCircle, Play } from 'lucide-react';
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
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFormat = async () => {
    if (!rawNotes.trim()) return;
    
    setIsProcessing(true);
    setStep('preview');
    setGeneratedNotes(''); // Clear previous
    
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          userId,
          classId,
          stream: true // Stream enabled
        }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) throw new Error("Processing failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setGeneratedNotes(prev => prev + chunk);
      }

    } catch (e: any) {
      if (e.name !== 'AbortError') toast.error("Failed to process notes");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveFinal = async () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `Notes_${dateStr}_${timeStr}.md`;
    
    const blob = new Blob([generatedNotes], { type: 'text/markdown' });
    const file = new File([blob], filename, { type: 'text/markdown' });

    await onSave(file);
    
    setRawNotes('');
    setGeneratedNotes('');
    setStep('input');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!isProcessing) {
        onOpenChange(o);
        if (!o) {
          setStep('input'); // Reset on close
          setGeneratedNotes('');
        }
      }
    }}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-indigo-600" /> 
            {step === 'input' ? 'Live Note Taker' : 'AI Formatting Preview'}
          </DialogTitle>
          <DialogDescription>
            {step === 'input' ? 'Jot down raw notes. AI will clean them up.' : 'Review your notes before saving.'}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'input' ? (
          <Textarea 
            value={rawNotes} 
            onChange={e => setRawNotes(e.target.value)} 
            placeholder="Type raw notes here... don't worry about formatting!" 
            className="flex-1 resize-none p-6 font-mono text-base bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
          />
        ) : (
          <div className="flex-1 bg-slate-50 border rounded-md p-6 overflow-y-auto whitespace-pre-wrap font-mono text-sm">
            {generatedNotes || <span className="text-slate-400 animate-pulse">Thinking...</span>}
          </div>
        )}
        
        <DialogFooter className="gap-2">
          {step === 'input' ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleFormat} disabled={!rawNotes.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                <Play className="w-4 h-4 mr-2" /> Process Notes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('input')} disabled={isProcessing}>Back to Edit</Button>
              <Button onClick={handleSaveFinal} disabled={isProcessing || !generatedNotes} className="bg-emerald-600 hover:bg-emerald-700">
                {isProcessing ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <CheckCircle className="w-4 h-4 mr-2"/>}
                Save to Class
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}