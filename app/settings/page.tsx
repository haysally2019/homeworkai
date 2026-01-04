'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Zap, Crown, GraduationCap, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const { user, credits, isPro, loading } = useAuth();

  const handleCheckout = (link: string) => {
    window.location.href = link;
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/forever',
      icon: Zap,
      features: ['3 AI Solves/day', 'Basic Explanations', 'Community Support'],
      current: !isPro,
      action: null
    },
    {
      name: 'Semester Pass',
      price: '$24.99', // Updated Price
      period: '/one-time',
      icon: GraduationCap,
      link: 'https://buy.stripe.com/semester_placeholder', // REPLACE WITH YOUR LINK
      features: ['Unlimited Deep Solves', 'Tutor Mode Access', 'Exam Prep Tools', 'Valid for 4 months'],
      current: isPro,
      popular: true,
      action: 'Upgrade'
    },
    {
      name: 'Annual Pro',
      price: '$39.99',
      period: '/year',
      icon: Crown,
      link: 'https://buy.stripe.com/annual_placeholder', // REPLACE WITH YOUR LINK
      features: ['Best Value', 'All Pro features', 'Priority Support', 'Beta Access'],
      current: false,
      action: 'Upgrade'
    }
  ];

  if (loading) return <div className="h-full flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/></div>;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your account and subscription</p>
        </div>

        <div className="grid gap-8">
          {/* Account Info */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-slate-500">Email</span>
                <span className="text-slate-900">{user?.email}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-slate-500">Current Status</span>
                <div className="flex items-center gap-2">
                  <Badge variant={isPro ? "default" : "secondary"} className={isPro ? "bg-blue-600" : "bg-slate-200 text-slate-700"}>
                    {isPro ? 'Pro Member' : 'Free Plan'}
                  </Badge>
                  {!isPro && <span className="text-sm text-slate-500">({credits} credits left today)</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Section */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Subscription Plans</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card 
                  key={plan.name}
                  className={`relative border-2 ${
                    plan.current ? 'border-blue-600 bg-blue-50/50' : 
                    plan.popular ? 'border-blue-400 bg-white' : 'border-slate-200 bg-white'
                  }`}
                >
                  {plan.popular && !plan.current && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                      BEST VALUE
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-lg ${plan.current ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <plan.icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                    </div>
                    <div>
                      <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-slate-500 text-sm">{plan.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {plan.action && (
                      <Button 
                        onClick={() => handleCheckout(plan.link!)}
                        className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                      >
                        {plan.action}
                      </Button>
                    )}
                    {plan.current && (
                      <Button disabled variant="outline" className="w-full border-blue-200 text-blue-600 bg-blue-50">
                        Current Plan
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}