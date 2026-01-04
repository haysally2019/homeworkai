'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check } from 'lucide-react';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

export function PaywallModal({ open, onClose }: PaywallModalProps) {
  const handleUpgrade = () => {
    window.location.href = 'https://buy.stripe.com/placeholder';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">
            Limit Reached
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            You've used all your free credits. Upgrade to Pro for unlimited access!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-emerald-500/30">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-emerald-500">$49.99</span>
              <span className="text-gray-400">/semester</span>
            </div>

            <ul className="space-y-3">
              {[
                'Unlimited problem solving',
                'Access to Solver & Tutor modes',
                'Image upload support',
                'Step-by-step explanations',
                'LaTeX math rendering',
                'Priority support',
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Button
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-6"
        >
          Get Semester Pass
        </Button>

        <Button
          onClick={onClose}
          variant="ghost"
          className="w-full text-gray-400 hover:text-white"
        >
          Maybe later
        </Button>
      </DialogContent>
    </Dialog>
  );
}
