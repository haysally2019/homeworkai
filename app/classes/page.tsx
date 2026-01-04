'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, BookOpen, Trash2, Edit2, ArrowLeft, MessageSquare } from 'lucide-react';

type Class = {
  id: string;
  name: string;
  code: string;
  color: string;
  semester: string;
  description: string | null;
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    color: '#10b981',
    semester: '',
    description: '',
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
    fetchClasses();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    }
  };

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setClasses(data);
    }
  };

  const handleOpenDialog = (classItem?: Class) => {
    if (classItem) {
      setEditingClass(classItem);
      setFormData({
        name: classItem.name,
        code: classItem.code,
        color: classItem.color,
        semester: classItem.semester,
        description: classItem.description || '',
      });
    } else {
      setEditingClass(null);
      setFormData({
        name: '',
        code: '',
        color: '#10b981',
        semester: '',
        description: '',
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingClass(null);
    setFormData({
      name: '',
      code: '',
      color: '#10b981',
      semester: '',
      description: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingClass) {
      const { error } = await supabase
        .from('classes')
        .update(formData)
        .eq('id', editingClass.id);

      if (!error) {
        fetchClasses();
        handleCloseDialog();
      }
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('classes')
        .insert([{ ...formData, user_id: session.user.id }]);

      if (!error) {
        fetchClasses();
        handleCloseDialog();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this class? This will also delete all assignments and conversations associated with it.')) {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (!error) {
        fetchClasses();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <header className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/chat')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">My Classes</h1>
              <p className="text-xs text-gray-400">Organize your coursework</p>
            </div>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {classes.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800 p-8 text-center">
            <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No classes yet
            </h2>
            <p className="text-gray-400 mb-4">
              Start by adding your first class to organize your coursework
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Class
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classItem) => (
              <Card
                key={classItem.id}
                className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: classItem.color }}
                      />
                      <div>
                        <CardTitle className="text-white text-lg">
                          {classItem.name}
                        </CardTitle>
                        <p className="text-sm text-gray-400">{classItem.code}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 mb-4">{classItem.semester}</p>
                  {classItem.description && (
                    <p className="text-sm text-gray-300 mb-4">{classItem.description}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/classes/${classItem.id}`)}
                      className="flex-1 bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(classItem)}
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(classItem.id)}
                      className="bg-gray-800 border-gray-700 hover:bg-red-900 text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingClass ? 'Update class information' : 'Create a new class to organize your coursework'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">
                  Class Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="e.g., Calculus II"
                  required
                />
              </div>
              <div>
                <Label htmlFor="code" className="text-gray-300">
                  Class Code
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="e.g., MATH 2414"
                  required
                />
              </div>
              <div>
                <Label htmlFor="semester" className="text-gray-300">
                  Semester
                </Label>
                <Input
                  id="semester"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="e.g., Spring 2024"
                  required
                />
              </div>
              <div>
                <Label htmlFor="color" className="text-gray-300">
                  Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10 bg-gray-800 border-gray-700"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 bg-gray-800 border-gray-700 text-white"
                    placeholder="#10b981"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-300">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="e.g., Covers integration, series, and differential equations"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingClass ? 'Save Changes' : 'Create Class'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
