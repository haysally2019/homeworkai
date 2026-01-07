'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PenTool, CheckCircle, Play, Mic, Square, Trash2 } from 'lucide-react';
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
  
  // Audio State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Audio Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/mp3' });
        setAudioBlob(blob);
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    chunksRef.current = [];
  };

  // --- Processing Logic ---
  const handleFormat = async () => {
    if (!rawNotes.trim() && !audioBlob) return toast.error("Please add some notes or record audio first.");
    
    setIsProcessing(true);
    setStep('preview');
    setGeneratedNotes(''); 
    
    abortControllerRef.current = new AbortController();

    try {
      // Convert Audio to Base64 if exists
      let audioBase64 = null;
      if (audioBlob) {
        audioBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(audioBlob);
        });
      }

      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `You are an expert academic note-taker.
TASK: Format these raw notes (and audio transcript if provided) into a clean Markdown study guide.

STRUCTURE:
# [Topic Name]
## 📝 Executive Summary
(50-word summary of core concepts)

## 🔑 Key Concepts
(List key terms and definitions)

## 📚 Detailed Notes
(Cleaned up bullet points from the raw notes and audio)

RAW NOTES:
${rawNotes}`,
          audioBase64, // Send the audio
          mode: 'solver',
          userId,
          classId,
          stream: true
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
    
    // Reset Everything
    setRawNotes('');
    setGeneratedNotes('');
    setAudioBlob(null);
    setStep('input');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!isProcessing) {
        onOpenChange(o);
        if (!o) {
          setStep('input'); 
          setGeneratedNotes('');
          setAudioBlob(null);
          setIsRecording(false);
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
            {step === 'input' ? 'Record a lecture or type notes.' : 'Review your study guide before saving.'}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'input' ? (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Audio Recorder Controls */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              {!isRecording && !audioBlob && (
                <Button onClick={startRecording} variant="outline" className="border-red-200 hover:bg-red-50 text-red-600">
                  <Mic className="w-4 h-4 mr-2" /> Record Lecture
                </Button>
              )}
              
              {isRecording && (
                <Button onClick={stopRecording} className="bg-red-600 hover:bg-red-700 animate-pulse text-white">
                  <Square className="w-4 h-4 mr-2" /> Stop Recording
                </Button>
              )}

              {audioBlob && (
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 bg-white border px-3 py-2 rounded-md text-sm text-slate-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Audio Recorded ({(audioBlob.size / 1024 / 1024).toFixed(1)} MB)
                  </div>
                  <Button size="icon" variant="ghost" onClick={clearAudio} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <Textarea 
              value={rawNotes} 
              onChange={e => setRawNotes(e.target.value)} 
              placeholder="Type notes here while listening... (optional)" 
              className="flex-1 resize-none p-6 font-mono text-base bg-white border-slate-200 focus-visible:ring-indigo-500"
            />
          </div>
        ) : (
          <div className="flex-1 bg-slate-50 border rounded-md p-6 overflow-y-auto whitespace-pre-wrap font-mono text-sm">
            {generatedNotes || <div className="flex items-center gap-2 text-indigo-600"><Loader2 className="w-4 h-4 animate-spin"/> AI is listening and writing...</div>}
          </div>
        )}
        
        <DialogFooter className="gap-2">
          {step === 'input' ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleFormat} disabled={(!rawNotes.trim() && !audioBlob) || isRecording} className="bg-indigo-600 hover:bg-indigo-700">
                <Play className="w-4 h-4 mr-2" /> Generate Study Guide
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