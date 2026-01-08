'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PenTool, FileText, Trash2, MoreVertical, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { NoteTaker } from '@/components/NoteTaker';
import { MessageRenderer } from '@/components/MessageRenderer';

export function NotesTab({ classId, userId }: { classId: string, userId: string }) {
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const [showNoteTaker, setShowNoteTaker] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchNotes = async () => {
    if (!classId || !userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('class_notes')
      .select('*')
      .eq('class_id', classId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) setSavedNotes(data);
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, [classId, userId]);

  const deleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      const { error } = await supabase.from('class_notes').delete().eq('id', noteId);
      if (error) throw error;
      setSavedNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success('Note deleted');
    } catch (e) { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Class Notes</h2>
          <p className="text-sm text-slate-500">Create and study your AI-enhanced notes</p>
        </div>
        <Button onClick={() => setShowNoteTaker(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <PenTool className="w-4 h-4 mr-2" /> New Note
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {savedNotes.map((note: any) => (
          <Card 
            key={note.id} 
            className="group relative bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-52" 
            onClick={() => setSelectedNote(note)}
          >
            <div className="h-1.5 w-full bg-blue-500" />
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-300 hover:text-slate-600" onClick={e => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h4 className="font-bold text-slate-900 line-clamp-2 mb-1">{note.title}</h4>
              <p className="text-xs text-slate-500 line-clamp-2 flex-1">{note.summary || "No summary available"}</p>
              <div className="pt-3 mt-auto border-t border-slate-50 flex items-center text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(note.created_at).toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}

        {savedNotes.length === 0 && !loading && (
          <button 
            onClick={() => setShowNoteTaker(true)}
            className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-blue-300 transition-all group"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
              <PenTool className="w-8 h-8 text-slate-300 group-hover:text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Create your first note</h3>
            <p className="text-slate-500 max-w-sm mt-1">Start typing to build your class knowledge base.</p>
          </button>
        )}
      </div>

      <NoteTaker open={showNoteTaker} onOpenChange={setShowNoteTaker} userId={userId} classId={classId} onSave={fetchNotes} />

      <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-white">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold text-slate-900">{selectedNote?.title}</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedNote(null)} className="h-8 w-8 rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-slate-500 mt-1">{selectedNote?.summary}</p>
          </DialogHeader>
          <ScrollArea className="flex-1 p-8 bg-white">
            <div className="prose prose-slate max-w-none mx-auto">
              {selectedNote?.formatted_notes && <MessageRenderer content={selectedNote.formatted_notes} />}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}