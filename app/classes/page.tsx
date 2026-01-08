'use client';

import { useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useClasses, createClass, deleteClass } from '@/hooks/use-classes';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, BookOpen, GraduationCap, ChevronRight, MoreVertical, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const PaywallModal = lazy(() => import('@/components/PaywallModal').then(m => ({ default: m.PaywallModal })));

export default function ClassesPage() {
  const router = useRouter();
  const { user, isPro } = useAuth();
  const { classes, isLoading, mutate } = useClasses(user?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', code: '', color: '#3b82f6' });
  const [creating, setCreating] = useState(false);

  const classCount = classes?.length || 0;

  const handleCreateClick = () => {
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
      await createClass(user.id, newClass);
      setIsDialogOpen(false);
      setNewClass({ name: '', code: '', color: '#3b82f6' });
      toast.success('Class created successfully');
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClass = async (e: React.MouseEvent, classId: string) => {
    e.stopPropagation(); // Prevent card click
    if (!user || !confirm('Are you sure you want to delete this class? All data will be lost.')) return;
    
    try {
        await deleteClass(user.id, classId);
        toast.success('Class deleted');
        mutate();
    } catch (error) {
        toast.error('Failed to delete class');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Classes</h1>
            <p className="mt-1 text-slate-500">Manage your courses and learning materials.</p>
          </div>
          <Button onClick={handleCreateClick} size="lg" className="bg-blue-600 font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow-md transition-all">
            <Plus className="mr-2 h-5 w-5" /> 
            Add New Class
          </Button>
        </div>

        {/* Free Plan Limit Banner (Clean Design) */}
        {!isPro && classCount > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm text-orange-800">
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-700">!</span>
              Free plan limit reached ({classCount}/1 class).
            </span>
            <button onClick={() => setShowPaywall(true)} className="font-semibold underline hover:text-orange-900">
              Upgrade to Pro
            </button>
          </div>
        )}

        {/* Content Grid */}
        {classCount === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-24 text-center shadow-sm">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
              <BookOpen className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">No classes yet</h3>
            <p className="mt-2 max-w-md text-slate-500">
              Create your first class to start tracking assignments, taking smart notes, and using AI tutors.
            </p>
            <Button onClick={handleCreateClick} variant="outline" className="mt-8 border-slate-200 hover:bg-slate-50 hover:text-blue-600">
              Create your first class
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {classes?.map((cls: any) => (
              <Card 
                key={cls.id} 
                className="group relative cursor-pointer overflow-hidden border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                onClick={() => router.push(`/classes/${cls.id}`)}
              >
                {/* Decorative Top Bar */}
                <div className="h-2 w-full" style={{ backgroundColor: cls.color }} />
                
                <CardHeader className="pt-6 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105" style={{ backgroundColor: `${cls.color}15` }}>
                      <GraduationCap className="h-6 w-6" style={{ color: cls.color }} />
                    </div>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                                onClick={(e) => handleDeleteClass(e, cls.id)} 
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Class
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="mt-4 text-xl font-bold text-slate-900">{cls.name}</CardTitle>
                  <div className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {cls.code}
                  </div>
                </CardHeader>

                <CardContent className="pb-6">
                   <p className="text-sm text-slate-400">View notes, docs & chat</p>
                </CardContent>

                <div className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            ))}
            
            {/* "Add Class" Ghost Card */}
            <button
               onClick={handleCreateClick}
               className="group flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all hover:border-blue-400 hover:bg-blue-50/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-110">
                <Plus className="h-6 w-6 text-blue-500" />
              </div>
              <span className="mt-4 font-medium text-slate-600 group-hover:text-blue-600">Add Another Class</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>
              Enter the details for your new course.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input 
                id="name"
                placeholder="e.g. Advanced Calculus" 
                value={newClass.name}
                onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Course Code</Label>
              <Input 
                id="code"
                placeholder="e.g. MATH 301" 
                value={newClass.code}
                onChange={(e) => setNewClass({...newClass, code: e.target.value})}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Color Tag</Label>
              <div className="flex gap-3">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                  <button
                    key={color}
                    onClick={() => setNewClass({...newClass, color})}
                    className={`h-8 w-8 rounded-full shadow-sm transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${newClass.color === color ? 'ring-2 ring-slate-900 ring-offset-2 scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateClass} disabled={creating || !newClass.name || !newClass.code} className="bg-blue-600 hover:bg-blue-700">
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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