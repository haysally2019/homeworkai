'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Zap, Loader2, GraduationCap, Crown } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaywallModal({ open, onOpenChange }: PaywallModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          returnUrl: window.location.href, // Return to current page after payment
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Monthly',
      price: '$9.99',
      period: '/mo',
      icon: Zap,
      features: ['Unlimited AI Solves', 'Gemini 2.0 Access', 'Step-by-step logic'],
      popular: true,
      action: handleUpgrade,
    },
    {
      name: 'Semester Pass',
      price: '$24.99', 
      period: '/one-time',
      icon: GraduationCap,
      features: ['Valid for 4 Months', 'Exam Prep Generator', 'Priority Support', 'One-time payment'],
      popular: false,
      action: () => toast.info("Coming soon!"), // Placeholder for future one-time product
    },
    {
      name: 'Annual',
      price: '$39.99',
      period: '/year',
      icon: Crown,
      features: ['Best Value (Save 65%)', 'All Pro features', 'Beta access to new tools'],
      popular: false,
      action: () => toast.info("Coming soon!"),
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-slate-50 border-slate-200">
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-3xl font-bold text-slate-900">
            Unlock Unlimited Learning
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-lg">
            Get 100% accurate, unlimited homework help with our smartest AI.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`relative rounded-2xl p-6 border ${
                plan.popular 
                  ? 'bg-white border-blue-500 shadow-xl ring-1 ring-blue-500' 
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                  MOST POPULAR
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${plan.popular ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                  <plan.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{plan.name}</h3>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-slate-500 text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                onClick={plan.action}
                disabled={loading}
                variant={plan.popular ? 'default' : 'outline'}
                className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-200 text-slate-700'}`}
              >
                {loading && plan.popular ? <Loader2 className="w-4 h-4 animate-spin"/> : `Choose ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}