'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Camera, Send, Loader2, Menu, X } from 'lucide-react';
import { MessageRenderer } from '@/components/MessageRenderer';
import { PaywallModal } from '@/components/PaywallModal';
import { Card } from '@/components/ui/card';
import { Sidebar } from '@/components/Sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
};

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
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    setUser(session.user);
    await fetchCredits();
  };

  const fetchCredits = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('users_credits')
      .select('credits, is_pro')
      .eq('id', session.user.id)
      .maybeSingle();

    if (data) {
      setCredits(data.credits);
      setIsPro(data.is_pro);
    }
  };


  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      image: selectedImage || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const capturedImage = selectedImage;
    setSelectedImage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: userMessage.content,
          imageBase64: capturedImage,
          mode: mode,
          userId: user.id,
        }),
      });

      if (response.status === 402) {
        setShowPaywall(true);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCredits(data.remainingCredits);
      setIsPro(data.isPro);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
        <SheetContent side="left" className="p-0 w-64 bg-gray-950 border-gray-800">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileSidebar(true)}
                className="md:hidden text-gray-400 hover:text-white"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <span className="text-lg font-bold text-white">A</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Altus</h1>
                <p className="text-xs text-gray-400">
                  {isPro ? '✨ Pro' : `${credits} credits`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Label htmlFor="mode-toggle" className="text-sm text-gray-400">
                {mode === 'solver' ? '🎯 Solver' : '📚 Tutor'}
              </Label>
              <Switch
                id="mode-toggle"
                checked={mode === 'tutor'}
                onCheckedChange={(checked) => setMode(checked ? 'tutor' : 'solver')}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
            <p className="text-xs text-gray-500">
              {mode === 'solver' ? 'Get direct answers' : 'Learn step by step'}
            </p>
          </div>
        </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <Card className="bg-gray-900/50 border-gray-800 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">A</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Welcome to Altus
              </h2>
              <p className="text-gray-400 mb-4">
                Your AI-powered university study companion
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-left">
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-emerald-500 font-medium mb-1">🎯 Solver Mode</p>
                  <p className="text-gray-400">Get instant solutions with step-by-step explanations</p>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="text-emerald-500 font-medium mb-1">📚 Tutor Mode</p>
                  <p className="text-gray-400">Learn with guided questions and hints</p>
                </div>
              </div>
            </Card>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                {message.image && (
                  <img
                    src={message.image}
                    alt="User upload"
                    className="rounded-lg mb-2 max-w-full h-auto"
                  />
                )}
                <MessageRenderer content={message.content} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-100 rounded-2xl px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {selectedImage && (
            <div className="mb-3 relative inline-block">
              <img
                src={selectedImage}
                alt="Selected"
                className="h-20 rounded-lg border-2 border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />

            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="icon"
              className="shrink-0 bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400"
            >
              <Camera className="h-5 w-5" />
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or upload an image..."
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              disabled={loading}
            />

            <Button
              type="submit"
              size="icon"
              disabled={loading || (!input.trim() && !selectedImage)}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>

        <PaywallModal
          open={showPaywall}
          onClose={() => setShowPaywall(false)}
        />
      </div>
    </div>
  );
}
