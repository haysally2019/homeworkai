'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Brain, 
  ShieldCheck, 
  FileText,
  Sparkles,
  Zap,
  Check,
  Camera,
  Library,
  GraduationCap,
  Crown,
  Clock
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// --- SOCIAL PROOF ---
export function SocialProofSection() {
  const universities = [
    'Harvard', 'Stanford', 'MIT', 'Berkeley', 'Oxford', 
    'Cambridge', 'Yale', 'Princeton', 'Columbia', 'UCLA'
  ];

  return (
    <section className="py-10 border-y border-slate-100 bg-slate-50/50 overflow-hidden">
      <div className="container px-4 mx-auto mb-6">
        <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest">
          Trusted by top students worldwide
        </p>
      </div>
      
      {/* Infinite Marquee */}
      <div className="relative flex overflow-x-hidden group">
        <div className="animate-marquee whitespace-nowrap flex gap-16 px-8">
          {[...universities, ...universities].map((uni, i) => (
            <div key={i} className="flex items-center gap-2 text-xl font-bold font-serif text-slate-300 select-none">
              <GraduationCap className="w-6 h-6" /> {uni}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- HOW IT WORKS (Value Ladder) ---
export function HowItWorksSection() {
  const steps = [
    {
      icon: <Camera className="w-6 h-6 text-white" />,
      title: "1. Capture",
      desc: "Snap a photo of your homework or upload a PDF syllabus.",
      color: "bg-blue-500"
    },
    {
      icon: <Brain className="w-6 h-6 text-white" />,
      title: "2. Analyze",
      desc: "Our AI breaks down the problem step-by-step, not just the answer.",
      color: "bg-indigo-500"
    },
    {
      icon: <Library className="w-6 h-6 text-white" />,
      title: "3. Master",
      desc: "Save to your class notebook and chat with the AI to study later.",
      color: "bg-purple-500"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How LockIn AI works</h2>
          <p className="text-lg text-slate-600">Three simple steps to go from "confused" to "confident".</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10" />

          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className={`w-24 h-24 rounded-3xl ${step.color} shadow-xl shadow-blue-900/5 flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300`}>
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-500 max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- FEATURES (Benefit Grid) ---
export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-slate-50">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-blue-600 uppercase bg-blue-100 rounded-full">
            Features
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Everything you need to <span className="text-blue-600">ace the semester</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Brain className="w-6 h-6 text-white" />}
            color="bg-purple-600"
            title="AI Problem Solver"
            desc="Stuck on Calc II? Snap a photo. LockIn AI identifies the problem and teaches you the methodology, not just the solution."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6 text-white" />}
            color="bg-blue-600"
            title="Essay Grader"
            desc="Before you submit, get an unbiased letter grade. We check for clarity, argumentation, and grammar instantly."
          />
          <FeatureCard 
            icon={<FileText className="w-6 h-6 text-white" />}
            color="bg-emerald-500"
            title="Context-Aware Notes"
            desc="LockIn AI organizes your work by Class. It remembers your previous questions and builds a custom study guide for you."
          />
        </div>
      </div>
    </section>
  );
}

// --- PRICING (MATCHING SYSTEM PAYWALL) ---
export function PricingSection() {
  return (
    <section className="py-20 bg-white border-t border-slate-100">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Plans that fit your semester</h2>
          <p className="text-lg text-slate-600">Start for free. Upgrade for unlimited power.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-start">
          
          {/* 1. Free */}
          <Card className="border-slate-200 shadow-sm hover:border-blue-200 transition-all">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-700">Starter</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">$0</span>
              </div>
              <CardDescription>Daily help</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-slate-600">
                  <Check className="w-4 h-4 text-green-500 shrink-0" /> 5 AI Credits / Day
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Check className="w-4 h-4 text-green-500 shrink-0" /> Basic Solver
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* 2. Monthly */}
          <Card className="border-slate-200 shadow-sm hover:border-blue-300 transition-all">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" /> Monthly
              </CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">$9.99</span>
                <span className="text-slate-500 text-sm">/mo</span>
              </div>
              <CardDescription>Flexible learning</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-slate-600">
                  <Check className="w-4 h-4 text-blue-500 shrink-0" /> Unlimited Credits
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Check className="w-4 h-4 text-blue-500 shrink-0" /> Step-by-step Logic
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Check className="w-4 h-4 text-blue-500 shrink-0" /> Cancel anytime
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                <Link href="/signup">Select Monthly</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* 3. Semester Pass (HIGHLIGHT) */}
          <Card className="border-blue-500 shadow-xl ring-1 ring-blue-500 relative transform md:-translate-y-2 bg-blue-50/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-md whitespace-nowrap">
              MOST POPULAR
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-blue-700">
                <GraduationCap className="w-5 h-5" /> Semester
              </CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">$24.99</span>
                <span className="text-slate-500 text-sm">/one-time</span>
              </div>
              <CardDescription className="text-blue-600/80 font-medium">Valid for 4 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" /> All Pro Features
                </li>
                <li className="flex items-center gap-2 text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" /> Exam Prep Generator
                </li>
                <li className="flex items-center gap-2 text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" /> No recurring fees
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                <Link href="/signup">Get Semester Pass</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* 4. Annual */}
          <Card className="border-slate-200 shadow-sm hover:border-purple-300 transition-all">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-500" /> Annual
              </CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">$39.99</span>
                <span className="text-slate-500 text-sm">/yr</span>
              </div>
              <CardDescription>Best long-term value</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-slate-600">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" /> Save 65% vs Monthly
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" /> Beta Feature Access
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <Check className="w-4 h-4 text-purple-500 shrink-0" /> Priority Support
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200">
                <Link href="/signup">Select Annual</Link>
              </Button>
            </CardFooter>
          </Card>

        </div>
      </div>
    </section>
  );
}

// --- TESTIMONIALS ---
export function ReviewsSection() {
  return (
    <section id="reviews" className="py-20 bg-slate-50">
      <div className="container px-4 mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Loved by thousands</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <TestimonialCard 
            quote="I was failing Calculus II until I started using LockIn AI. The step-by-step breakdown is a lifesaver."
            author="Sarah J."
            role="Engineering Major"
            uni="MIT"
          />
          <TestimonialCard 
            quote="The essay grader is better than my actual TA. It caught errors that would have cost me points."
            author="Michael T."
            role="History Major"
            uni="Stanford"
          />
          <TestimonialCard 
            quote="I love that it organizes everything by class. It knows my syllabus, so the answers are relevant."
            author="Jessica K."
            role="Pre-Med"
            uni="UCLA"
          />
        </div>
      </div>
    </section>
  );
}

// --- FAQ (UPDATED) ---
export function FAQSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container px-4 mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full space-y-4">
          <FAQItem 
            question="What is the Semester Pass?"
            answer="The Semester Pass is a one-time payment of $24.99 that gives you full Pro access for 4 months. It's perfect for students who want coverage for a single term without worrying about recurring monthly subscriptions."
          />
          <FAQItem 
            question="Is LockIn AI really free?"
            answer="Yes! Our Free Starter plan gives you 5 AI credits every single day. This is enough for a few homework problems or quick questions. Credits reset at midnight."
          />
          <FAQItem 
            question="Can I cancel my subscription?"
            answer="Absolutely. If you choose the Monthly plan, you can cancel anytime from your settings. The Semester and Annual passes are one-time payments that simply expire at the end of their term—no cancellation needed."
          />
          <FAQItem 
            question="Does it work for advanced math?"
            answer="Yes. LockIn AI is powered by Google Gemini, capable of solving complex Calculus, Linear Algebra, Organic Chemistry, and Physics problems with high accuracy."
          />
        </Accordion>
      </div>
    </section>
  );
}

// --- FINAL CTA ---
export function CTASection() {
  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden">
       {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[50%] -left-[20%] w-[70%] h-[70%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[50%] -right-[20%] w-[70%] h-[70%] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="container px-4 mx-auto relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
          Ready to boost your GPA?
        </h2>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          Join thousands of students who are saving time and learning faster with LockIn AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="h-14 px-8 text-lg bg-white text-slate-900 hover:bg-blue-50 hover:text-blue-700">
            <Link href="/signup">Get Started for Free</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-700 text-white hover:bg-slate-800 hover:text-white bg-transparent">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// --- HELPERS ---

function FeatureCard({ icon, color, title, desc }: any) {
  return (
    <Card className="border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group h-full">
      <CardContent className="pt-8 p-8">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg transform group-hover:-translate-y-1 transition-transform`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 text-lg leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

function TestimonialCard({ quote, author, role, uni }: any) {
  return (
    <Card className="border-slate-100 bg-white hover:shadow-lg transition-all duration-300">
      <CardContent className="p-8 space-y-6">
        <div className="flex justify-between items-start">
           <div className="flex gap-1">
            {[...Array(5)].map((_, i) => <Sparkles key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
           </div>
           <span className="text-xs font-serif font-bold text-slate-300 uppercase tracking-widest">{uni}</span>
        </div>
        <p className="text-slate-700 italic text-lg leading-relaxed">"{quote}"</p>
        <div className="flex items-center gap-3 pt-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold">
                {author[0]}
            </div>
            <div>
                <p className="font-bold text-slate-900">{author}</p>
                <p className="text-sm text-slate-500">{role}</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FAQItem({ question, answer }: any) {
  return (
    <AccordionItem value={question} className="border border-slate-200 bg-slate-50 rounded-xl px-4 data-[state=open]:bg-white data-[state=open]:shadow-sm transition-all">
      <AccordionTrigger className="text-left font-semibold text-slate-900 hover:text-blue-600 py-4 text-lg">
        {question}
      </AccordionTrigger>
      <AccordionContent className="text-slate-600 pb-4 text-base leading-relaxed">
        {answer}
      </AccordionContent>
    </AccordionItem>
  );
}