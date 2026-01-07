'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, StopCircle, ArrowLeft, Send, Image as ImageIcon, X } from 'lucide-react';
import { MessageRenderer } from '@/components/MessageRenderer';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string; // Preview image
}

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const mode = searchParams.get('mode') || 'solver';
  const contextTitle = searchParams.get('context');
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [credits, setCredits] = useState<string | number>('-');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("Image too large (Max 5MB)");
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isStreaming) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input,
      image: selectedImage || undefined
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const tempImage = selectedImage; // Keep ref for API
    setSelectedImage(null); // Clear UI
    setIsStreaming(true);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '' }]);

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userMsg.content || (tempImage ? "Analyze this image" : ""),
          imageBase64: tempImage, // Send base64 to API
          mode: mode,
          userId: user?.id,
          context: contextTitle,
          stream: true
        }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) throw new Error(res.statusText);

      // Update Credits
      const remaining = res.headers.get('X-Remaining-Credits');
      if (remaining) setCredits(remaining);

      // Read Stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No stream");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, content: m.content + chunk } : m
        ));
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error("Failed to generate response");
        console.error(error);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      toast.info("Stopped generation");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-slate-800 capitalize flex items-center gap-2">
              {mode} Mode
              {contextTitle && <span className="text-xs font-normal bg-slate-100 px-2 py-0.5 rounded text-slate-500 truncate max-w-[150px]">Ref: {contextTitle}</span>}
            </h1>
          </div>
        </div>
        <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {credits === 'Unlimited' ? '∞ Pro' : `${credits} Credits`}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden relative">
        <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <p>Ask a question or upload an image.</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
              }`}>
                {msg.image && (
                  <img src={msg.image} alt="Upload" className="max-w-full rounded-lg mb-2 max-h-[200px] object-cover" />
                )}
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <MessageRenderer content={msg.content} />
                )}
              </div>
            </div>
          ))}
          
          <div className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-2 relative w-fit">
            <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-slate-200" />
            <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="max-w-3xl mx-auto relative flex gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageSelect}
          />
          
          <Button variant="outline" size="icon" className="h-12 w-12 shrink-0" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="w-5 h-5 text-slate-500" />
          </Button>

          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={mode === 'solver' ? "Snap a math problem..." : "Upload notes to analyze..."}
            className="flex-1 py-6 text-base shadow-sm"
            disabled={isStreaming}
          />
          
          {isStreaming ? (
            <Button onClick={stopGeneration} size="icon" variant="destructive" className="h-12 w-12 shrink-0">
              <StopCircle className="w-5 h-5" />
            </Button>
          ) : (
            <Button onClick={handleSend} size="icon" className="h-12 w-12 shrink-0 bg-indigo-600 hover:bg-indigo-700">
              <Send className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}