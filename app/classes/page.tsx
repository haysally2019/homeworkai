'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { useClasses, createClass, deleteClass } from '@/hooks/use-classes';
import { toast } from 'sonner';

type Class = { id: string; name: string; code: string; color: string; semester: string; };

export default function ClassesPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', color: '#3b82f6', semester: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading, isPro } = useAuth();
  const { classes, isLoading, mutate } = useClasses(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const newClass = await createClass(user.id, formData);

      mutate([newClass, ...(classes || [])] as any, { revalidate: false });

      setShowDialog(false);
      setFormData({ name: '', code: '', color: '#3b82f6', semester: '' });
      toast.success('Class created successfully');
    } catch (error: any) {
      console.error('Error creating class:', error);
      if (error.message?.includes('Free users can only create 1 class')) {
        toast.error('Free users can only create 1 class. Upgrade to Pro for unlimited classes.');
      } else {
        toast.error('Failed to create class');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !confirm('Delete this class?')) return;

    const previousClasses = classes;
    mutate((classes as any[])?.filter((c: any) => c.id !== id) as any, { revalidate: false });

    try {
      await deleteClass(user.id, id);
      toast.success('Class deleted');
    } catch (error) {
      console.error('Error deleting class:', error);
      mutate(previousClasses as any, { revalidate: false });
      toast.error('Failed to delete class');
    }
  };

  if (authLoading) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Academic Dashboard</h1>
              <p className="text-slate-500 mt-1">Manage your courses and assignments</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-slate-200 bg-white animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-slate-200 rounded w-1/3 mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Academic Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your courses and assignments</p>
            {!isPro && classes && classes.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">Free plan: {classes.length}/1 class used</p>
            )}
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Class
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes?.map((cls: Class) => (
            <Card 
              key={cls.id} 
              onClick={() => router.push(`/classes/${cls.id}`)}
              className="group cursor-pointer hover:shadow-lg transition-all border-slate-200 bg-white hover:border-blue-300 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: cls.color }} />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-800">{cls.name}</CardTitle>
                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded mt-2 inline-block">
                      {cls.code}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => handleDelete(cls.id, e)} className="text-slate-400 hover:text-red-500 -mt-2 -mr-2">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-slate-400">{cls.semester}</span>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
          
          <button 
            onClick={() => setShowDialog(true)}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group h-[180px]"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium text-slate-600 group-hover:text-blue-700">Add New Class</span>
          </button>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Calculus II" /></div>
            <div><Label>Code</Label><Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="MATH 201" /></div>
            <div><Label>Semester</Label><Input value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} placeholder="Spring 2026" /></div>
            <div><Label>Color Tag</Label><div className="flex gap-2"><Input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-12 p-1" /></div></div>
            <DialogFooter><Button type="submit" className="bg-blue-600">Create Class</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}