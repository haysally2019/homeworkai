'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

type Class = { id: string; name: string; code: string; color: string; semester: string; };

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', color: '#3b82f6', semester: '' });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchClasses(); }, []);

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').order('created_at', { ascending: false });
    if (data) setClasses(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('classes').insert([{ ...formData, user_id: session.user.id }]);
    setShowDialog(false);
    fetchClasses();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (confirm('Delete this class?')) {
      await supabase.from('classes').delete().eq('id', id);
      fetchClasses();
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Academic Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your courses and assignments</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Class
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
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