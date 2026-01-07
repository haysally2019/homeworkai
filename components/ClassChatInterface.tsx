'use client';

import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Camera, Send, Loader2, Sparkles, Bot, User } from 'lucide-react';
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
  const { user, refreshCredits, loading: authLoading } = useAuth();
  const supabase = createClient();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Conversation specific to this class
  useEffect(() => {
    if (!user || !classId) return;

    const loadConversation = async () => {
      // Try to find an existing "general" chat for this class (not tied to a specific assignment)
      // Note: We might need to update the schema to support class_id directly in conversations, 
      // but for now we can filter by metadata or a naming convention if schema isn't ready.
      // For MVP, we will treat this as a persistent "Class Chat" stored with a specific tag.
      
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
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

    const userMsg: Message = { role: 'user', content: input, image: selectedImage || undefined };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imgToSend = selectedImage;
    setSelectedImage(null);
    setLoading(true);

    try {
      let currentConvId = conversationId;
      
      // Create conversation if it doesn't exist
      if (!currentConvId) {
        const { data: newConv, error } = await (supabase as any)
          .from('conversations')
          .insert({ 
            user_id: user.id, 
            title: `Class Chat: ${className}`,
            // In a real prod schema, we'd add a 'class_id' column to conversations table
          })
          .select()
          .single();
          
        if (error) throw error;
        currentConvId = newConv.id;
        setConversationId(newConv.id);
      }

      // Handle Image Upload
      let imageUrl = null;
      if (imgToSend) {
        const filePath = `${user.id}/${currentConvId}/${Date.now()}.jpg`;
        const blob = await (await fetch(imgToSend)).blob();
        await supabase.storage.from('chat-images').upload(filePath, blob);
        const { data } = supabase.storage.from('chat-images').getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }

      // Save User Message
      await (supabase as any).from('messages').insert({
        conversation_id: currentConvId,
        role: 'user',
        content: userMsg.content,
        image_url: imageUrl
      });

      // API Call - PASSING CLASS ID for RAG
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userMsg.content,
          imageBase64: imgToSend,
          mode: 'tutor', // Class chat defaults to Tutor mode for deep learning
          userId: user.id,
          classId: classId, // <--- CRITICAL: Triggers Knowledge Base lookup
          context: `Subject: ${className}. Use the provided class notes and documents to answer.` 
        }),
      });

      if (res.status === 402) {
        setShowPaywall(true);
        setLoading(false);
        return;
      }

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
    <div className="flex flex-col h-full bg-slate-50 relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
            <Bot className="w-3 h-3 mr-1" /> Class AI
          </Badge>
          <span className="text-sm font-medium text-slate-600">Knowledge Base Active</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
            <Sparkles className="w-12 h-12 text-blue-300 mb-3" />
            <p className="text-slate-500 font-medium">Ask me anything about {className}</p>
            <p className="text-xs text-slate-400 mt-1">I have access to your notes & documents</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
            }`}>
              {m.image && <img src={m.image} alt="Upload" className="rounded-lg mb-2 max-h-48 object-cover bg-black/10" />}
              <MessageRenderer content={m.content} role={m.role} />
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-blue-700" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                </div>
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <Suspense fallback={null}><MathToolbar onInsert={handleInsertLatex} /></Suspense>
        <form onSubmit={handleSubmit} className="relative flex gap-2 mt-2">
          {selectedImage && (
            <div className="absolute bottom-full mb-2 left-0 bg-white p-2 rounded-xl shadow-lg border border-slate-200">
              <img src={selectedImage} alt="Preview" className="h-16 rounded-lg" />
              <button type="button" onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageCapture} className="hidden" />
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-blue-600">
            <Camera className="w-5 h-5" />
          </Button>
          <Input 
            ref={inputRef}
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder={`Ask about ${className}...`} 
            className="flex-1 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
          />
          <Button type="submit" disabled={loading || (!input && !selectedImage)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {showPaywall && <Suspense fallback={null}><PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} /></Suspense>}
    </div>
  );
}