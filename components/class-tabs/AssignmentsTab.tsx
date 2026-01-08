'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Plus, CheckCircle2, Clock, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Assignment {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  user_id: string;
  class_id: string;
}

export function AssignmentsTab({ classId, userId }: { classId: string, userId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchAssignments();
  }, [classId]);

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('class_id', classId)
      .order('due_date', { ascending: true });
    
    if (data) setAssignments(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmitting(true);

    try {
      const { data, error } = await (supabase as any)
        .from('assignments')
        .insert({
          title: newTitle,
          due_date: newDate || null,
          class_id: classId,
          user_id: userId,
          completed: false,
          type: 'homework' // default
        })
        .select()
        .single();

      if (error) throw error;

      setAssignments([...assignments, data]);
      setShowAddDialog(false);
      setNewTitle('');
      setNewDate('');
      toast.success('Assignment added');
    } catch (error) {
      toast.error('Failed to add assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, completed: !currentStatus } : a));

    const { error } = await (supabase as any)
      .from('assignments')
      .update({ completed: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
      fetchAssignments(); // Revert
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    setAssignments(prev => prev.filter(a => a.id !== id));
    await (supabase as any).from('assignments').delete().eq('id', id);
    toast.success('Assignment deleted');
  };

  const pending = assignments.filter(a => !a.completed);
  const completed = assignments.filter(a => a.completed);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Assignments</h2>
          <p className="text-sm text-slate-500">Track your homework and deadlines</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Assignment
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Pending Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> To Do ({pending.length})
          </h3>
          {pending.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 bg-white/50">
              No pending assignments. Great job!
            </div>
          ) : (
            <div className="grid gap-3">
              {pending.map((a) => (
                <AssignmentCard key={a.id} assignment={a} onToggle={toggleComplete} onDelete={deleteAssignment} />
              ))}
            </div>
          )}
        </div>

        {/* Completed Section */}
        {completed.length > 0 && (
          <div className="space-y-3 pt-6 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Completed ({completed.length})
            </h3>
            <div className="grid gap-3 opacity-60 hover:opacity-100 transition-opacity">
              {completed.map((a) => (
                <AssignmentCard key={a.id} assignment={a} onToggle={toggleComplete} onDelete={deleteAssignment} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Assignment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)} 
                placeholder="e.g. Calculus Midterm Study" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Input 
                type="date" 
                value={newDate} 
                onChange={e => setNewDate(e.target.value)} 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600">Add Assignment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssignmentCard({ assignment, onToggle, onDelete }: { assignment: Assignment, onToggle: any, onDelete: any }) {
  const isOverdue = !assignment.completed && assignment.due_date && new Date(assignment.due_date) < new Date() && new Date(assignment.due_date).toDateString() !== new Date().toDateString();

  return (
    <Card className={cn(
      "p-4 flex items-center gap-4 transition-all hover:shadow-md",
      assignment.completed ? "bg-slate-50 border-slate-100" : "bg-white border-slate-200",
      isOverdue && "border-red-200 bg-red-50/30"
    )}>
      <Checkbox 
        checked={assignment.completed} 
        onCheckedChange={() => onToggle(assignment.id, assignment.completed)}
        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
      />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-slate-900 truncate",
          assignment.completed && "text-slate-500 line-through"
        )}>
          {assignment.title}
        </p>
        {assignment.due_date && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs mt-1",
            isOverdue ? "text-red-600 font-medium" : "text-slate-500"
          )}>
            <Clock className="w-3.5 h-3.5" />
            {format(new Date(assignment.due_date), "MMM d, yyyy")}
            {isOverdue && " (Overdue)"}
          </div>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={() => onDelete(assignment.id)} className="text-slate-400 hover:text-red-600">
        <Trash2 className="w-4 h-4" />
      </Button>
    </Card>
  );
}