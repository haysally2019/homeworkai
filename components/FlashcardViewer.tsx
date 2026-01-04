'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { MessageRenderer } from '@/components/MessageRenderer';

type Flashcard = {
  question: string;
  answer: string;
};

type FlashcardViewerProps = {
  flashcards: Flashcard[];
  onRegenerate?: () => void;
  isGenerating?: boolean;
};

export function FlashcardViewer({ flashcards, onRegenerate, isGenerating }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());

  if (flashcards.length === 0) {
    return null;
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;
  const masteredCount = masteredCards.size;

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMastered = () => {
    setMasteredCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentIndex)) {
        newSet.delete(currentIndex);
      } else {
        newSet.add(currentIndex);
      }
      return newSet;
    });
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCards(new Set());
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            {currentIndex + 1} / {flashcards.length}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {masteredCount} Mastered
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-slate-600 hover:text-slate-800"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          {onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isGenerating}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              New Set
            </Button>
          )}
        </div>
      </div>

      <div className="relative w-full h-2 bg-slate-200 rounded-full mb-6">
        <div
          className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center mb-6 perspective-1000">
        <div
          onClick={handleFlip}
          className={`relative w-full max-w-2xl h-80 cursor-pointer transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <Card
            className={`absolute inset-0 p-8 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 backface-hidden ${
              isFlipped ? 'invisible' : 'visible'
            }`}
          >
            <Badge className="mb-4 bg-blue-600">Question</Badge>
            <div className="text-center text-xl font-medium text-slate-800 px-6">
              <MessageRenderer content={currentCard.question} />
            </div>
            <p className="text-sm text-slate-400 mt-8">Click to reveal answer</p>
          </Card>

          <Card
            className={`absolute inset-0 p-8 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 backface-hidden ${
              isFlipped ? 'visible' : 'invisible'
            }`}
            style={{ transform: 'rotateY(180deg)' }}
          >
            <Badge className="mb-4 bg-emerald-600">Answer</Badge>
            <div className="text-center text-lg text-slate-700 px-6 overflow-y-auto max-h-full">
              <MessageRenderer content={currentCard.answer} />
            </div>
            <p className="text-sm text-slate-400 mt-8">Click to see question</p>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button
          variant={masteredCards.has(currentIndex) ? 'default' : 'outline'}
          onClick={handleMastered}
          className={
            masteredCards.has(currentIndex)
              ? 'flex-1 bg-emerald-600 hover:bg-emerald-700'
              : 'flex-1 border-emerald-600 text-emerald-600 hover:bg-emerald-50'
          }
        >
          {masteredCards.has(currentIndex) ? '✓ Mastered' : 'Mark as Mastered'}
        </Button>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          className="flex-1"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {currentIndex === flashcards.length - 1 && masteredCount === flashcards.length && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
          <p className="text-emerald-800 font-medium">
            🎉 Congratulations! You've mastered all {flashcards.length} flashcards!
          </p>
        </div>
      )}
    </div>
  );
}
