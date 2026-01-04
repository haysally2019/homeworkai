'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Camera, Send, Loader2, Menu, LogOut, LayoutDashboard, Settings, User } from 'lucide-react';
import { MessageRenderer } from '@/components/MessageRenderer';
import { PaywallModal } from '@/components/PaywallModal';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

type Message = { role: 'user' | 'assistant'; content: string; image?: string; };

export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isPro, setIsPro] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'solver' | 'tutor'>('solver');
  const [showPaywall, setShowPaywall] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    setUser(session.user);
    const { data } = await supabase.from('users_credits').select('credits, is_pro').eq('id', session.user.id).maybeSingle();
    if (data) { setCredits(data.credits); setIsPro(data.is_pro); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const userMsg: Message = { role: 'user', content: input, image: selectedImage || undefined };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imgToSend = selectedImage;
    setSelectedImage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        body: JSON.stringify({ text: userMsg.content, imageBase64: imgToSend, mode, userId: user.id }),
      });

      if (res.status === 402) { setShowPaywall(true); setLoading(false); return; }
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      setCredits(data.remainingCredits);
      setIsPro(data.isPro);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  // --- UI COMPONENTS ---

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">A</div>
          <span className="font-bold text-xl text-slate-800">Altus</span>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-1">
        <Button variant="ghost" className="w-full justify-start gap-3 text-blue-600 bg-blue-50 font-medium">
          <LayoutDashboard className="w-5 h-5" /> New Chat
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:bg-slate-50">
          <User className="w-5 h-5" /> Profile
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:bg-slate-50">
          <Settings className="w-5 h-5" /> Settings
        </Button>
      </div>
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">Daily Credits</span>
            <span className="text-xs font-bold text-blue-600">{isPro ? '∞' : credits} left</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all" 
              style={{ width: isPro ? '100%' : `${(credits/3)*100}%` }} 
            />
          </div>
          {!isPro && (
            <Button size="sm" onClick={() => setShowPaywall(true)} className="w-full mt-3 bg-slate-900 text-white hover:bg-slate-800 text-xs h-8">
              Upgrade to Pro
            </Button>
          )}
        </div>
        <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50">
          <LogOut className="w-5 h-5" /> Sign Out
        </Button>
      </div>
    </div>
  );

  if (!user) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 h-full">
        <SidebarContent />
      </div>

      <div className="flex flex-col flex-1 h-full max-w-5xl mx-auto w-full">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden"><Menu className="w-5 h-5 text-slate-600" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72"><SidebarContent /></SheetContent>
            </Sheet>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800">Homework Helper</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                Powered by Gemini 2.5 <span className="w-1.5 h-1.5 rounded-full bg-green-500"/>
              </span>
            </div>
          </div>
          
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setMode('solver')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'solver' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Solver Mode
            </button>
            <button
              onClick={() => setMode('tutor')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'tutor' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tutor Mode
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <LayoutDashboard className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">How can I help today?</h2>
              <p className="text-slate-500 max-w-md">Upload a photo of a problem or type your question below. I can solve it directly or guide you through it.</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}>
                {m.image && <img src={m.image} alt="Upload" className="rounded-lg mb-3 max-h-60 object-cover bg-black/10" />}
                <MessageRenderer content={m.content} />
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
        <div className="p-4 bg-white border-t border-slate-200">
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