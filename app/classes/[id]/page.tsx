'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CheckCircle, Circle, Calendar, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ClassDetail() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const [classData, setClassData] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newAssign, setNewAssign] = useState({ title: '', due_date: '' });

  useEffect(() => {
    if (!authLoading && user) {
      const load = async () => {
        setLoading(true);
        const { data: cls } = await supabase.from('classes').select('*').eq('id', id).maybeSingle();
        const { data: asg } = await supabase.from('assignments').select('*').eq('class_id', id).order('due_date');
        setClassData(cls);
        if (asg) setAssignments(asg);
        setLoading(false);
      };
      load();
    }
  }, [id, authLoading, user]);

  const addAssignment = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('assignments').insert([{ ...newAssign, class_id: id, user_id: session.user.id }]);
    setShowAssignModal(false);
    window.location.reload(); // Simple reload to refresh list
  };

  const toggleComplete = async (aid: string, current: boolean) => {
    await supabase.from('assignments').update({ completed: !current }).eq('id', aid);
    setAssignments(assignments.map(a => a.id === aid ? { ...a, completed: !current } : a));
  };

  if (authLoading || loading || !classData) {
    return (
      <div className="h-full flex flex-col bg-slate-50">
        <div className="h-48 bg-white border-b border-slate-200 p-8 flex flex-col justify-end relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-200 animate-pulse" />
          <Button variant="ghost" onClick={() => router.push('/classes')} className="absolute top-6 left-6 text-slate-500">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="h-10 bg-slate-200 rounded w-1/2 mb-2 animate-pulse" />
          <div className="h-6 bg-slate-200 rounded w-1/3 animate-pulse" />
        </div>
        <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-6 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 bg-white border-slate-200 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-3/4" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="h-48 bg-white border-b border-slate-200 p-8 flex flex-col justify-end relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: classData.color }} />
        <Button variant="ghost" onClick={() => router.push('/classes')} className="absolute top-6 left-6 text-slate-500">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-4xl font-bold text-slate-900">{classData.name}</h1>
        <p className="text-slate-500 mt-2 font-medium">{classData.code} • {classData.semester}</p>
      </div>

      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <Tabs defaultValue="assignments" className="w-full">
          <TabsList className="bg-white border border-slate-200 p-1 mb-6">
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="resources" disabled>Resources (Coming Soon)</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">Tasks</h2>
              <Button onClick={() => setShowAssignModal(true)} size="sm" className="bg-blue-600">
                <Plus className="w-4 h-4 mr-2" /> Add Assignment
              </Button>
            </div>

            {assignments.length === 0 && (
              <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
                No assignments yet. Add one to get started!
              </div>
            )}

            {assignments.map(a => (
              <Card key={a.id} className="p-4 flex items-center gap-4 bg-white border-slate-200 hover:shadow-md transition-shadow">
                <button onClick={() => toggleComplete(a.id, a.completed)}>
                  {a.completed ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-slate-300" />}
                </button>
                <div className="flex-1">
                  <h3 className={`font-medium ${a.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{a.title}</h3>
                  {a.due_date && (
                    <div className="flex items-center text-xs text-slate-500 mt-1">
                      <Calendar className="w-3 h-3 mr-1" /> {new Date(a.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>New Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Assignment Title" value={newAssign.title} onChange={e => setNewAssign({...newAssign, title: e.target.value})} />
            <Input type="date" value={newAssign.due_date} onChange={e => setNewAssign({...newAssign, due_date: e.target.value})} />
            <Button onClick={addAssignment} className="w-full bg-blue-600">Add Task</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}