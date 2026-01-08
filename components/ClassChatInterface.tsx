'use client';

import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Send, Loader2, Sparkles, Bot, Paperclip } from 'lucide-react';
import { MessageRenderer } from '@/components/MessageRenderer';
import { toast } from 'sonner';

const PaywallModal = lazy(() => import('@/components/PaywallModal').then(m => ({ default: m.PaywallModal })));
const MathToolbar = lazy(() => import('@/components/MathToolbar').then(m => ({ default: m.MathToolbar })));

type Message = { role: 'user' | 'assistant'; content: string; image?: string; };

interface ClassChatInterfaceProps {
  classId: string;
  className: string;
}

export function ClassChatInterface({ classId, className }: ClassChatInterfaceProps) {
  const { user, refreshCredits, credits, isPro } = useAuth(); // Added credits & isPro
  const supabase = createClient();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !classId) return;
    const loadConversation = async () => {
      const { data: existingConv } = await (supabase as any)
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', `Class Chat: ${className}`) 
        .maybeSingle();

      if (existingConv) {
        setConversationId(existingConv.id);
        const { data: msgs } = await (supabase as any)
          .from('messages')
          .select('*')
          .eq('conversation_id', existingConv.id)
          .order('created_at', { ascending: true });

        if (msgs) {
          setMessages(msgs.map((m: any) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
            image: m.image_url || undefined
          })));
        }
      }
    };
    loadConversation();
  }, [user, classId, className]);

  useEffect(() => { 
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleInsertLatex = (latex: string) => {
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart || 0;
    const newText = input.substring(0, start) + latex + input.substring(inputRef.current.selectionEnd || 0);
    setInput(newText);
    inputRef.current.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;
    if (!user) return;

    // LOGIC: Check credits BEFORE sending request
    if (!isPro && credits <= 0) {
      setShowPaywall(true);
      return;
    }

    const userMsg: Message = { role: 'user', content: input, image: selectedImage || undefined };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imgToSend = selectedImage;
    setSelectedImage(null);
    setLoading(true);

    try {
      let currentConvId = conversationId;
      if (!currentConvId) {
        const { data: newConv, error } = await (supabase as any)
          .from('conversations')
          .insert({ user_id: user.id, title: `Class Chat: ${className}` }).select().single();
        if (error) throw error;
        currentConvId = newConv.id;
        setConversationId(newConv.id);
      }

      let imageUrl = null;
      if (imgToSend) {
        const filePath = `${user.id}/${currentConvId}/${Date.now()}.jpg`;
        const blob = await (await fetch(imgToSend)).blob();
        await supabase.storage.from('chat-images').upload(filePath, blob);
        const { data } = supabase.storage.from('chat-images').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }

      await (supabase as any).from('messages').insert({
        conversation_id: currentConvId,
        role: 'user',
        content: userMsg.content,
        image_url: imageUrl
      });

      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userMsg.content,
          imageBase64: imgToSend,
          mode: 'tutor',
          userId: user.id,
          classId: classId,
          context: `Subject: ${className}. Use the provided class notes and documents to answer.` 
        }),
      });

      // Keep server-side check as a fallback
      if (res.status === 402) { setShowPaywall(true); setLoading(false); return; }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        await (supabase as any).from('messages').insert({
            conversation_id: currentConvId,
            role: 'assistant',
            content: data.response
        });
        await refreshCredits();
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative min-h-0">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-slate-900/5 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
          <Sparkles className="w-3 h-3 text-blue-600" />
          <span className="text-xs font-semibold text-slate-700">Knowledge Base Active</span>
        </div>
      </div>

      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Class AI Assistant</h3>
            <p className="text-slate-500 max-w-xs mt-2">I have access to all your notes and documents for {className}. Ask me anything!</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm mt-1">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm text-sm md:text-base leading-relaxed ${
              m.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm'
            }`}>
              {m.image && <img src={m.image} alt="Upload" className="rounded-lg mb-3 max-h-60 object-cover bg-black/5" />}
              <MessageRenderer content={m.content} role={m.role} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
              </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <Suspense fallback={null}><MathToolbar onInsert={handleInsertLatex} /></Suspense>
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
            {selectedImage && (
              <div className="absolute bottom-full mb-4 left-0 bg-white p-2 rounded-xl shadow-xl border border-slate-100">
                <img src={selectedImage} alt="Preview" className="h-24 rounded-lg object-cover" />
                <button type="button" onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-500 transition-colors">×</button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageCapture} className="hidden" />
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl h-10 w-10">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input 
              ref={inputRef}
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Ask a question about this class..." 
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 px-2 h-10 text-slate-800 placeholder:text-slate-400"
            />
            <Button type="submit" disabled={loading || (!input && !selectedImage)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 w-10 p-0 shadow-sm shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {showPaywall && <Suspense fallback={null}><PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} /></Suspense>}
    </div>
  );
}