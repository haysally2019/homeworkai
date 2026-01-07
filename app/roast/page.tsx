'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Flame, Send, StopCircle, Sparkles, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { MessageRenderer } from '@/components/MessageRenderer';

export default function RoastPage() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleRoast = async () => {
    if (!input.trim() || isStreaming) return;
    setResult('');
    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: input,
          mode: 'roast',
          userId: user?.id,
          stream: true
        }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) throw new Error(res.statusText);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setResult(prev => prev + chunk);
      }

    } catch (e: any) {
      if (e.name !== 'AbortError') toast.error("Roast failed (maybe it was too hot?)");
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-full mb-4">
            <Flame className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Roast My Essay</h1>
          <p className="text-slate-500">Paste your draft. Get a grade, a roast, and a reality check.</p>
        </div>

        {/* Input Area */}
        <Card className="p-6 shadow-md border-orange-100">
          <Textarea 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste your essay here..."
            className="min-h-[200px] text-base mb-4 resize-y"
            disabled={isStreaming}
          />
          <div className="flex justify-end">
            {isStreaming ? (
              <Button onClick={() => abortControllerRef.current?.abort()} variant="destructive">
                <StopCircle className="w-4 h-4 mr-2" /> Stop
              </Button>
            ) : (
              <Button onClick={handleRoast} className="bg-orange-600 hover:bg-orange-700 text-white font-bold">
                <Flame className="w-4 h-4 mr-2" /> Roast Me
              </Button>
            )}
          </div>
        </Card>

        {/* Result Area */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-6 md:p-8 bg-white border-2 border-orange-100 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600" />
              
              <div className="flex items-center gap-2 mb-6 text-orange-700 font-bold uppercase tracking-wider text-xs">
                <AlertTriangle className="w-4 h-4" /> Brutal Feedback Incoming
              </div>

              <div className="prose prose-orange max-w-none">
                <MessageRenderer content={result} />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}