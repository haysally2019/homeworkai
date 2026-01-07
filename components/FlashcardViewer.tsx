'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  onRegenerate: () => void;
  isGenerating: boolean;
}

export function FlashcardViewer({ flashcards, onRegenerate, isGenerating }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [copied, setCopied] = useState(false);

  const nextCard = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  // Export for Anki (CSV)
  const downloadCSV = () => {
    const headers = 'Question,Answer\n';
    const csv = flashcards.map(f => `"${f.question.replace(/"/g, '""')}","${f.answer.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'homeworkai_study_deck.csv';
    a.click();
    toast.success("Downloaded! Import this into Anki.");
  };

  // Copy for Quizlet (Tab Separated)
  const copyForQuizlet = () => {
    const text = flashcards.map(f => `${f.question}\t${f.answer}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied! Paste directly into Quizlet.");
  };

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Flashcards ({flashcards.length})</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadCSV} title="Export to Anki">
            <Download className="w-4 h-4 mr-2" /> Anki
          </Button>
          <Button variant="outline" size="sm" onClick={copyForQuizlet} title="Copy for Quizlet">
            {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
            Quizlet
          </Button>
          <Button variant="ghost" size="icon" onClick={onRegenerate} disabled={isGenerating}>
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="flex-1 perspective-1000 relative group cursor-pointer" onClick={() => setShowAnswer(!showAnswer)}>
        <div className={`w-full h-full absolute transition-all duration-500 preserve-3d ${showAnswer ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-8 bg-white border-2 border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
            <div className="text-center">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4 block">Question</span>
              <p className="text-xl md:text-2xl font-medium text-slate-800">{flashcards[currentIndex]?.question}</p>
            </div>
          </Card>

          {/* Back */}
          <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-8 bg-blue-50 border-2 border-blue-100">
            <div className="text-center">
              <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold mb-4 block">Answer</span>
              <p className="text-xl md:text-2xl font-medium text-blue-900">{flashcards[currentIndex]?.answer}</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-center items-center gap-4 mt-6">
        <Button variant="outline" onClick={prevCard}>Previous</Button>
        <span className="text-sm font-medium text-slate-500">{currentIndex + 1} / {flashcards.length}</span>
        <Button variant="outline" onClick={nextCard}>Next</Button>
      </div>
      
      <p className="text-center text-xs text-slate-400 mt-4">Tap card to flip</p>
    </div>
  );
}