'use client';

import { useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useClasses, createClass } from '@/hooks/use-classes'; // Fixed import
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, BookOpen, GraduationCap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const PaywallModal = lazy(() => import('@/components/PaywallModal').then(m => ({ default: m.PaywallModal })));

export default function ClassesPage() {
  const router = useRouter();
  const { user, isPro } = useAuth();
  
  // FIXED: Pass user?.id to the hook
  const { classes, isLoading, mutate } = useClasses(user?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', code: '', color: '#3b82f6' });
  const [creating, setCreating] = useState(false);

  // FIXED: Safely check length with optional chaining (?.) and fallback
  const classCount = classes?.length || 0;

  const handleCreateClick = () => {
    // Logic: Check limit before opening dialog
    if (!isPro && classCount >= 1) {
      setShowPaywall(true);
      return;
    }
    setIsDialogOpen(true);
  };

  const handleCreateClass = async () => {
    if (!newClass.name || !newClass.code || !user) return;
    setCreating(true);
    try {
      // FIXED: createClass is an async function, not from the hook
      await createClass(user.id, newClass);
      
      setIsDialogOpen(false);
      setNewClass({ name: '', code: '', color: '#3b82f6' });
      toast.success('Class created successfully');
      mutate(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Classes</h1>
          <p className="text-slate-500 mt-1">Manage your courses and assignments</p>
        </div>
        
        <Button onClick={handleCreateClick} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Class
        </Button>
      </div>

      {/* FIXED: Safe check for empty array */}
      {classCount === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No classes yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">Create your first class to start tracking assignments, notes, and getting AI help.</p>
          <Button onClick={handleCreateClick} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Create Class
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes?.map((cls: any) => (
            <Card 
              key={cls.id} 
              className="group hover:shadow-lg transition-all cursor-pointer border-slate-200 hover:border-blue-200"
              onClick={() => router.push(`/classes/${cls.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: cls.color }}>
                    <GraduationCap className="w-6 h-6" />
                  </div>
                </div>
                <CardTitle className="mt-3 text-xl">{cls.name}</CardTitle>
                <CardDescription className="font-mono text-xs bg-slate-100 w-fit px-2 py-1 rounded text-slate-600">{cls.code}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 line-clamp-2">
                  Click to view notes, assignments, and chat with AI about this class.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Class Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Class Name</Label>
              <Input 
                placeholder="e.g. Introduction to Psychology" 
                value={newClass.name}
                onChange={(e) => setNewClass({...newClass, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Course Code</Label>
              <Input 
                placeholder="e.g. PSY 101" 
                value={newClass.code}
                onChange={(e) => setNewClass({...newClass, code: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                  <button
                    key={color}
                    onClick={() => setNewClass({...newClass, color})}
                    className={`w-8 h-8 rounded-full transition-transform ${newClass.color === color ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateClass} disabled={creating || !newClass.name || !newClass.code}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paywall Modal */}
      {showPaywall && (
        <Suspense fallback={null}>
          <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
        </Suspense>
      )}
    </div>
  );
}