'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Camera, Send, Loader2, LayoutDashboard, History } from 'lucide-react';
import { MessageRenderer } from '@/components/MessageRenderer';
import { PaywallModal } from '@/components/PaywallModal';
import { MathToolbar } from '@/components/MathToolbar';
import { toast } from 'sonner';

type Message = { role: 'user' | 'assistant'; content: string; image?: string; };

export default function ChatPage() {
  const { user, credits, isPro, refreshCredits, loading: authLoading } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Params
  const assignmentId = searchParams.get('assignmentId');
  const contextParam = searchParams.get('context');
  const initialMode = searchParams.get('mode') as 'solver' | 'tutor' || 'solver';

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'solver' | 'tutor'>(initialMode);
  const [showPaywall, setShowPaywall] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load Conversation History and Class Context
  useEffect(() => {
    if (!user) return;

    const loadConversation = async () => {
      // 1. If we have an assignment ID, try to find an existing conversation and get classId
      if (assignmentId) {
        const { data: assignment } = await (supabase as any)
          .from('assignments')
          .select('class_id')
          .eq('id', assignmentId)
          .maybeSingle();

        if (assignment) {
          setClassId(assignment.class_id);
        }

        const { data: existingConv } = await (supabase as any)
          .from('conversations')
          .select('id')
          .eq('assignment_id', assignmentId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingConv) {
          setConversationId(existingConv.id);
          // Load messages
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
      }
    };

    loadConversation();
  }, [user, assignmentId]);

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

  const handleInsertLatex = (latex: string, cursorOffset?: number) => {
    if (!inputRef.current) return;

    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;
    const currentText = input;

    const before = currentText.substring(0, start);
    const after = currentText.substring(end);
    const newText = before + latex + after;

    setInput(newText);

    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = start + latex.length + (cursorOffset || 0);
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
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
      // 1. Ensure Conversation Exists
      let currentConvId = conversationId;
      if (!currentConvId) {
        const title = contextParam || (userMsg.content.slice(0, 30) + '...') || 'New Chat';
        const { data: newConv, error: convError } = await (supabase as any)
          .from('conversations')
          .insert({
            user_id: user.id,
            assignment_id: assignmentId || null,
            title: title
          })
          .select()
          .single();

        if (convError) throw convError;
        currentConvId = newConv.id;
        setConversationId(newConv.id);
      }

      // 2. Upload Image to Storage if present
      let imageUrl = null;
      if (imgToSend) {
        try {
          const base64Data = imgToSend.split(',')[1];
          const mimeType = imgToSend.split(',')[0].split(':')[1].split(';')[0];
          const extension = mimeType.split('/')[1];

          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });

          const fileName = `${Date.now()}.${extension}`;
          const filePath = `${user.id}/${currentConvId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('chat-images')
            .upload(filePath, blob);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('chat-images')
            .getPublicUrl(filePath);

          imageUrl = urlData.publicUrl;
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          toast.error('Failed to upload image');
        }
      }

      // 3. Save User Message with Image URL
      await (supabase as any).from('messages').insert({
        conversation_id: currentConvId,
        role: 'user',
        content: userMsg.content,
        image_url: imageUrl
      });

      // 4. Call AI with classId for RAG
      const res = await fetch('/api/solve', {
        method: 'POST',
        body: JSON.stringify({
          text: userMsg.content,
          imageBase64: imgToSend,
          mode,
          userId: user.id,
          context: contextParam,
          classId: classId
        }),
      });

      // --- HANDLE OUT OF CREDITS ---
      if (res.status === 402) { 
        setShowPaywall(true); 
        setLoading(false); 
        // Remove the user message we just optimistically added if it failed? 
        // Or leave it. Usually leaving it is fine so they can retry.
        return; 
      }
      
      const data = await res.json();

      // 5. Save AI Response
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        await (supabase as any).from('messages').insert({
            conversation_id: currentConvId,
            role: 'assistant',
            content: data.response
        });
        await refreshCredits();

        // Show streak reward notification
        if (data.streakRewardAwarded && data.streakBonus > 0) {
          toast.success(`🔥 ${data.currentStreak}-Day Streak! You earned ${data.streakBonus} bonus credits!`, {
            duration: 5000,
          });
        }
      } else {
        throw new Error("No response from AI");
      }

    } catch (err) {
      console.error(err);
      toast.error("Failed to process message");
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return <div className="h-full flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 flex items-center gap-2">
            {contextParam ? (
              <>
                 <span className="truncate max-w-[200px]">{contextParam}</span>
                 <Badge variant="outline" className="text-[10px] font-normal text-slate-500">Assignment Chat</Badge>
              </>
            ) : (
              "Homework Helper"
            )}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            Powered by Gemini 2.0 <span className="w-1.5 h-1.5 rounded-full bg-green-500"/>
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setMode('solver')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'solver' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Solver
            </button>
            <button
              onClick={() => setMode('tutor')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'tutor' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tutor
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pb-32">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <LayoutDashboard className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {contextParam ? `Start working on ${contextParam}` : "How can I help today?"}
            </h2>
            <p className="text-slate-500 max-w-md">
              {conversationId ? "Previous conversation loaded." : "Ask a question to start a new thread for this assignment."}
            </p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
              m.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
            }`}>
              {m.image && (
                <>
                  <div className="text-xs opacity-50 mb-1 flex items-center gap-1">
                    <Camera className="w-3 h-3"/> Image
                  </div>
                  <img
                    src={m.image}
                    alt="Upload"
                    className="rounded-lg mb-3 max-h-60 object-cover bg-black/10 w-full"
                  />
                </>
              )}

              <MessageRenderer content={m.content} role={m.role} />
            </div>
          </div>
        ))}
        {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-slate-500">Altus is thinking...</span>
              </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <div className="absolute bottom-0 w-full bg-white/80 backdrop-blur border-t border-slate-200">
        <MathToolbar onInsert={handleInsertLatex} />
        <div className="p-4">
          <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto flex gap-3 items-end">
          {selectedImage && (
            <div className="absolute bottom-16 left-0 bg-white p-2 rounded-xl shadow-lg border border-slate-200 animate-in slide-in-from-bottom-2">
              <img src={selectedImage} alt="Preview" className="h-20 rounded-lg" />
              <button type="button" onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm">✕</button>
            </div>
          )}
          
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageCapture} className="hidden" />
          
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-xl h-12 w-12 shrink-0 border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
            <Camera className="w-5 h-5" />
          </Button>
          
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={mode === 'solver' ? "Ask a question..." : "What are you stuck on?"}
            className="h-12 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-blue-500 focus-visible:bg-white transition-all text-base"
          />
          
          <Button type="submit" disabled={loading || (!input && !selectedImage)} className="h-12 w-12 rounded-xl shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200">
            <Send className="w-5 h-5" />
          </Button>
        </form>
        </div>
      </div>

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}