'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MathSymbol {
  display: string;
  latex: string;
  description: string;
  cursorOffset?: number;
}

const mathSymbols: MathSymbol[] = [
  { display: '√', latex: '\\sqrt{}', description: 'Square root', cursorOffset: -1 },
  { display: 'ⁿ√', latex: '\\sqrt[]{}', description: 'Nth root', cursorOffset: -3 },
  { display: 'x²', latex: '^2', description: 'Squared' },
  { display: 'xⁿ', latex: '^{}', description: 'Power', cursorOffset: -1 },
  { display: '½', latex: '\\frac{}{}', description: 'Fraction', cursorOffset: -3 },
  { display: '∫', latex: '\\int ', description: 'Integral' },
  { display: '∑', latex: '\\sum ', description: 'Summation' },
  { display: '∏', latex: '\\prod ', description: 'Product' },
  { display: 'π', latex: '\\pi', description: 'Pi' },
  { display: '∞', latex: '\\infty', description: 'Infinity' },
  { display: '≤', latex: '\\leq ', description: 'Less than or equal' },
  { display: '≥', latex: '\\geq ', description: 'Greater than or equal' },
  { display: '≠', latex: '\\neq ', description: 'Not equal' },
  { display: '±', latex: '\\pm ', description: 'Plus minus' },
  { display: '×', latex: '\\times ', description: 'Multiply' },
  { display: '÷', latex: '\\div ', description: 'Divide' },
  { display: 'α', latex: '\\alpha', description: 'Alpha' },
  { display: 'β', latex: '\\beta', description: 'Beta' },
  { display: 'θ', latex: '\\theta', description: 'Theta' },
  { display: 'Δ', latex: '\\Delta', description: 'Delta' },
  { display: 'lim', latex: '\\lim_{}', description: 'Limit', cursorOffset: -1 },
  { display: '∂', latex: '\\partial ', description: 'Partial derivative' },
];

interface MathToolbarProps {
  onInsert: (latex: string, cursorOffset?: number) => void;
}

export function MathToolbar({ onInsert }: MathToolbarProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          <span className="text-xs font-medium text-slate-500 mr-2 shrink-0">Math:</span>
          <TooltipProvider delayDuration={100}>
            {mathSymbols.map((symbol, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onInsert(symbol.latex, symbol.cursorOffset)}
                    className="h-8 min-w-[32px] px-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-medium shrink-0"
                  >
                    {symbol.display}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {symbol.description}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
