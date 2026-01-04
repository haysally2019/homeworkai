'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Zap, Crown, GraduationCap } from 'lucide-react';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

export function PaywallModal({ open, onClose }: PaywallModalProps) {
  
  const handleCheckout = (link: string) => {
    window.location.href = link;
  };

  const plans = [
    {
      name: 'Monthly',
      price: '$9.99',
      period: '/mo',
      icon: Zap,
      link: 'https://buy.stripe.com/monthly_placeholder',
      features: ['50 Deep Solves/mo', 'Basic Tutor Mode', 'Step-by-step logic'],
      popular: false,
    },
    {
      name: 'Semester Pass',
      price: '$39.99',
      period: '/one-time',
      icon: GraduationCap,
      link: 'https://buy.stripe.com/semester_placeholder',
      features: ['Unlimited Deep Solves', 'Exam Prep Generator', 'Priority Support', 'Valid for 4 months'],
      popular: true,
      color: 'blue',
    },
    {
      name: 'Annual',
      price: '$79.99',
      period: '/year',
      icon: Crown,
      link: 'https://buy.stripe.com/annual_placeholder',
      features: ['Best Value', 'All Pro features', 'Beta access to new tools'],
      popular: false,
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-slate-50 border-slate-200">
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-3xl font-bold text-slate-900">
            Unlock Your Grade Potential
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-lg">
            Choose the plan that fits your study schedule.
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
                onClick={() => handleCheckout(plan.link)}
                variant={plan.popular ? 'default' : 'outline'}
                className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-200 text-slate-700'}`}
              >
                Choose {plan.name}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}