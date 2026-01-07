'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Trash2, ArrowRight, BookOpen, GraduationCap, MoreVertical, Calendar } from 'lucide-react';
import { useClasses, createClass, deleteClass } from '@/hooks/use-classes';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

    if (!formData.name || !formData.code) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const newClass = await createClass(user.id, formData);
      mutate([newClass, ...(classes || [])] as any, { revalidate: false });
      setShowDialog(false);
      setFormData({ name: '', code: '', color: '#3b82f6', semester: '' });
      toast.success('Class created successfully');
    } catch (error: any) {
      if (error.message?.includes('Free users can only create 1 class')) {
        toast.error('Free Limit Reached', { description: 'Upgrade to Pro to create unlimited classes.' });
      } else {
        toast.error('Failed to create class');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Are you sure you want to delete this class? All associated data will be removed.')) return;
    const previousClasses = classes;
    mutate((classes as any[])?.filter((c: any) => c.id !== id) as any, { revalidate: false });
    try {
      await deleteClass(user.id, id);
      toast.success('Class deleted');
    } catch (error) {
      mutate(previousClasses as any, { revalidate: false });
      toast.error('Failed to delete class');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-full bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              My Classes
            </h1>
            <p className="text-slate-500 text-lg">Manage your courses, assignments, and study materials.</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all hover:scale-105">
            <Plus className="w-4 h-4 mr-2" /> Add New Class
          </Button>
        </div>

        {/* Classes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes?.map((cls: any) => (
            <Card 
              key={cls.id} 
              onClick={() => router.push(`/classes/${cls.id}`)}
              className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200 bg-white relative overflow-hidden"
            >
              {/* Color Strip */}
              <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: cls.color || '#3b82f6' }} />
              
              <CardHeader className="pb-3 pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                      {cls.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                        {cls.code}
                      </span>
                      {cls.semester && (
                        <span className="text-xs text-slate-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" /> {cls.semester}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 -mt-2 -mr-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(cls.id); }} className="text-red-600 focus:text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Class
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                   <div className="flex -space-x-2">
                      {/* Placeholder for future "student avatars" or similar visuals if expanded */}
                      <div className="w-8 h-8 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                   </div>
                   <div className="flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                     View Class <ArrowRight className="w-4 h-4 ml-1" />
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Add Class Empty State / Button */}
          <button 
            onClick={() => setShowDialog(true)}
            className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all group p-6"
          >
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 group-hover:scale-110 transition-all">
              <Plus className="w-7 h-7 text-slate-400 group-hover:text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600 group-hover:text-blue-700">Create New Class</h3>
            <p className="text-sm text-slate-400 mt-1">Add a course to start tracking</p>
          </button>
        </div>
        
        {!isPro && classes && classes.length > 0 && (
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-700 text-sm border border-orange-200">
              <span className="font-semibold">Free Plan Limit:</span> {classes.length} / 1 class used
              <Button variant="link" onClick={() => router.push('/dashboard')} className="h-auto p-0 text-orange-800 underline ml-1">Upgrade for unlimited</Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Class Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogDescription>
              Enter the details for your new course.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Calculus II" 
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Course Code</Label>
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})} 
                  placeholder="e.g. MATH 201" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input 
                  id="semester" 
                  value={formData.semester} 
                  onChange={e => setFormData({...formData, semester: e.target.value})} 
                  placeholder="e.g. Spring 2026" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color Tag</Label>
              <div className="flex items-center gap-3">
                <Input 
                  id="color" 
                  type="color" 
                  value={formData.color} 
                  onChange={e => setFormData({...formData, color: e.target.value})} 
                  className="w-12 h-10 p-1 cursor-pointer" 
                />
                <span className="text-sm text-slate-500">Pick a color to identify this class</span>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Class'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}