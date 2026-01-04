'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  Circle,
  Camera,
  Send,
  Loader2,
} from 'lucide-react';
import { MessageRenderer } from '@/components/MessageRenderer';
import { PaywallModal } from '@/components/PaywallModal';

type Class = {
  id: string;
  name: string;
  code: string;
  color: string;
  semester: string;
  description: string | null;
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
};

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  assignment_id: string | null;
};

export default function ClassDetailPage() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [classData, setClassData] = useState<Class | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'solver' | 'tutor'>('solver');
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [credits, setCredits] = useState<number>(0);
  const [isPro, setIsPro] = useState(false);

  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    due_date: '',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
    fetchClassData();
    fetchAssignments();
    fetchConversations();
    fetchCredits();
  }, [classId]);

  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation);
    }
  }, [currentConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    }
  };

  const fetchClassData = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (data) {
      setClassData(data);
    }
  };

  const fetchAssignments = async () => {
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('class_id', classId)
      .order('due_date', { ascending: true });

    if (data) {
      setAssignments(data);
    }
  };

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('class_id', classId)
      .order('updated_at', { ascending: false });

    if (data) {
      setConversations(data);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        image: msg.image_url || undefined,
      })));
    }
  };

  const fetchCredits = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('users_credits')
      .select('credits, is_pro')
      .eq('id', session.user.id)
      .maybeSingle();

    if (data) {
      setCredits(data.credits);
      setIsPro(data.is_pro);
    }
  };

  const handleOpenAssignmentDialog = (assignment?: Assignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setAssignmentForm({
        title: assignment.title,
        description: assignment.description || '',
        due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().split('T')[0] : '',
      });
    } else {
      setEditingAssignment(null);
      setAssignmentForm({
        title: '',
        description: '',
        due_date: '',
      });
    }
    setShowAssignmentDialog(true);
  };

  const handleCloseAssignmentDialog = () => {
    setShowAssignmentDialog(false);
    setEditingAssignment(null);
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const assignmentData = {
      ...assignmentForm,
      due_date: assignmentForm.due_date ? new Date(assignmentForm.due_date).toISOString() : null,
    };

    if (editingAssignment) {
      const { error } = await supabase
        .from('assignments')
        .update(assignmentData)
        .eq('id', editingAssignment.id);

      if (!error) {
        fetchAssignments();
        handleCloseAssignmentDialog();
      }
    } else {
      const { error } = await supabase
        .from('assignments')
        .insert([{
          ...assignmentData,
          user_id: session.user.id,
          class_id: classId,
        }]);

      if (!error) {
        fetchAssignments();
        handleCloseAssignmentDialog();
      }
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (!error) {
        fetchAssignments();
      }
    }
  };

  const handleToggleComplete = async (assignment: Assignment) => {
    const { error } = await supabase
      .from('assignments')
      .update({ completed: !assignment.completed })
      .eq('id', assignment.id);

    if (!error) {
      fetchAssignments();
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

  const handleStartNewConversation = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('conversations')
      .insert([{
        user_id: session.user.id,
        class_id: classId,
        assignment_id: selectedAssignment,
        title: 'New Conversation',
      }])
      .select()
      .single();

    if (data && !error) {
      setCurrentConversation(data.id);
      setMessages([]);
      fetchConversations();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() && !selectedImage) return;

    if (!currentConversation) {
      await handleStartNewConversation();
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

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

    await supabase
      .from('messages')
      .insert([{
        conversation_id: currentConversation,
        role: 'user',
        content: userMessage.content,
        image_url: capturedImage,
      }]);

    const conversationHistory = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', currentConversation)
      .order('created_at', { ascending: true });

    const contextMessages = conversationHistory.data?.map(msg => ({
      role: msg.role,
      content: msg.content,
    })) || [];

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
          userId: session.user.id,
          context: contextMessages,
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

      await supabase
        .from('messages')
        .insert([{
          conversation_id: currentConversation,
          role: 'assistant',
          content: data.response,
        }]);

      if (messages.length === 0) {
        const title = userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : '');
        await supabase
          .from('conversations')
          .update({ title })
          .eq('id', currentConversation);
        fetchConversations();
      }
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

  if (!classData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <header className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/classes')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: classData.color }}
            >
              <span className="text-lg font-bold text-white">
                {classData.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{classData.name}</h1>
              <p className="text-xs text-gray-400">{classData.code}</p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {isPro ? '✨ Pro' : `${credits} credits`}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-gray-800 overflow-y-auto bg-gray-900/50">
          <Tabs defaultValue="assignments" className="w-full">
            <TabsList className="w-full bg-gray-800 border-b border-gray-700">
              <TabsTrigger value="assignments" className="flex-1">Assignments</TabsTrigger>
              <TabsTrigger value="conversations" className="flex-1">History</TabsTrigger>
            </TabsList>

            <TabsContent value="assignments" className="p-4 space-y-3">
              <Button
                onClick={() => handleOpenAssignmentDialog()}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>

              {assignments.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">
                  No assignments yet
                </p>
              ) : (
                assignments.map((assignment) => (
                  <Card
                    key={assignment.id}
                    className={`bg-gray-800 border-gray-700 cursor-pointer transition-colors ${
                      selectedAssignment === assignment.id ? 'border-emerald-500' : ''
                    }`}
                    onClick={() => setSelectedAssignment(assignment.id === selectedAssignment ? null : assignment.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(assignment);
                          }}
                          className="mt-1"
                        >
                          {assignment.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-500" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${assignment.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                            {assignment.title}
                          </p>
                          {assignment.due_date && (
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(assignment.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAssignmentDialog(assignment);
                            }}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAssignment(assignment.id);
                            }}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="conversations" className="p-4 space-y-3">
              <Button
                onClick={handleStartNewConversation}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>

              {conversations.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">
                  No conversations yet
                </p>
              ) : (
                conversations.map((conv) => (
                  <Card
                    key={conv.id}
                    className={`bg-gray-800 border-gray-700 cursor-pointer hover:border-gray-600 transition-colors ${
                      currentConversation === conv.id ? 'border-emerald-500' : ''
                    }`}
                    onClick={() => setCurrentConversation(conv.id)}
                  >
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-white truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conv.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50">
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
            {selectedAssignment && (
              <span className="text-xs text-emerald-500">
                Assignment Context Active
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length === 0 && (
                <Card className="bg-gray-900/50 border-gray-800 p-8 text-center">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    {classData.name}
                  </h2>
                  <p className="text-gray-400 mb-4">
                    {selectedAssignment
                      ? 'Working on selected assignment'
                      : 'Start a conversation about this class'}
                  </p>
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
                  placeholder="Ask a question..."
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
        </div>
      </div>

      <Dialog open={showAssignmentDialog} onOpenChange={handleCloseAssignmentDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? 'Edit Assignment' : 'New Assignment'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingAssignment ? 'Update assignment details' : 'Create a new assignment for this class'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAssignment}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title" className="text-gray-300">
                  Title
                </Label>
                <Input
                  id="title"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="e.g., Homework 5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-300">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="e.g., Problems 1-15 from Chapter 7"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="due_date" className="text-gray-300">
                  Due Date (Optional)
                </Label>
                <Input
                  id="due_date"
                  type="date"
                  value={assignmentForm.due_date}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseAssignmentDialog}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingAssignment ? 'Save Changes' : 'Create Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </div>
  );
}
