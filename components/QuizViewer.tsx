'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { MessageRenderer } from '@/components/MessageRenderer';

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
};

type QuizViewerProps = {
  questions: QuizQuestion[];
  onRegenerate?: () => void;
  isGenerating?: boolean;
};

export function QuizViewer({ questions, onRegenerate, isGenerating }: QuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const score = answers.filter((ans, idx) => ans === questions[idx].correctAnswer).length;
  const isQuizComplete = currentIndex === questions.length - 1 && selectedAnswer !== null;

  const handleSelectAnswer = (optionIndex: number) => {
    if (selectedAnswer === null) {
      setSelectedAnswer(optionIndex);
      setShowExplanation(true);
      const newAnswers = [...answers];
      newAnswers[currentIndex] = optionIndex;
      setAnswers(newAnswers);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(answers[currentIndex + 1]);
      setShowExplanation(answers[currentIndex + 1] !== null);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAnswers(new Array(questions.length).fill(null));
  };

  const getOptionClassName = (optionIndex: number) => {
    if (selectedAnswer === null) {
      return 'border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer';
    }

    if (optionIndex === currentQuestion.correctAnswer) {
      return 'border-emerald-500 bg-emerald-50';
    }

    if (optionIndex === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer) {
      return 'border-red-500 bg-red-50';
    }

    return 'border-slate-200 opacity-50';
  };

  const getOptionIcon = (optionIndex: number) => {
    if (selectedAnswer === null) return null;

    if (optionIndex === currentQuestion.correctAnswer) {
      return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    }

    if (optionIndex === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Question {currentIndex + 1} / {questions.length}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Score: {score} / {answers.filter(a => a !== null).length}
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
            Restart
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
              New Quiz
            </Button>
          )}
        </div>
      </div>

      <div className="relative w-full h-2 bg-slate-200 rounded-full mb-6">
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <Card className="p-6 mb-6 bg-white border-slate-200">
        <div className="text-lg font-medium text-slate-800 mb-6">
          <MessageRenderer content={currentQuestion.question} />
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <Card
              key={index}
              onClick={() => handleSelectAnswer(index)}
              className={`p-4 transition-all ${getOptionClassName(index)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="text-slate-700 flex-1">
                    <MessageRenderer content={option} />
                  </div>
                </div>
                {getOptionIcon(index)}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {showExplanation && currentQuestion.explanation && (
        <Card className={`p-4 mb-6 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isCorrect ? 'bg-emerald-100' : 'bg-blue-100'
            }`}>
              {isCorrect ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <span className="text-blue-600 font-bold">i</span>
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-medium mb-1 ${isCorrect ? 'text-emerald-900' : 'text-blue-900'}`}>
                {isCorrect ? 'Correct!' : 'Explanation'}
              </h4>
              <div className={`text-sm ${isCorrect ? 'text-emerald-700' : 'text-blue-700'}`}>
                <MessageRenderer content={currentQuestion.explanation} />
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex gap-4 mt-auto">
        {!isQuizComplete && (
          <Button
            onClick={handleNext}
            disabled={selectedAnswer === null || currentIndex === questions.length - 1}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Next Question
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {isQuizComplete && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-900 mb-2">
              {Math.round((score / questions.length) * 100)}%
            </div>
            <p className="text-slate-600 mb-4">
              You got {score} out of {questions.length} questions correct
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              {onRegenerate && (
                <Button
                  onClick={onRegenerate}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate New Quiz
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
