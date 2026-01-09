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
  MessageSquare,
  Library,
  GraduationCap
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
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How Altus works</h2>
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
            desc="Stuck on Calc II? Snap a photo. Altus identifies the problem and teaches you the methodology, not just the solution."
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
            desc="Altus organizes your work by Class. It remembers your previous questions and builds a custom study guide for you."
          />
        </div>
      </div>
    </section>
  );
}

// --- PRICING (Psychological Anchoring) ---
export function PricingSection() {
  return (
    <section className="py-20 bg-white border-t border-slate-100">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple, student-friendly pricing</h2>
          <p className="text-lg text-slate-600">Start for free. Upgrade when you need superpowers.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <Card className="border-slate-200 shadow-none hover:border-blue-200 transition-all relative overflow-hidden">
             <div className="h-2 bg-slate-500 w-full" />
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Free Starter</CardTitle>
              <CardDescription>Perfect for daily homework help</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-slate-900">$0</span>
                <span className="text-slate-500">/forever</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-700">
                  <Check className="w-5 h-5 text-green-500 shrink-0" /> 5 AI Credits daily
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <Check className="w-5 h-5 text-green-500 shrink-0" /> Basic Problem Solver
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <Check className="w-5 h-5 text-green-500 shrink-0" /> 1 Class Notebook
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full h-12 text-lg">
                <Link href="/signup">Get Started Free</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Tier - Highlighted */}
          <Card className="border-blue-200 shadow-xl shadow-blue-900/5 relative overflow-hidden transform md:-translate-y-4">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
            <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 w-full" />
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-900">Altus Pro</CardTitle>
              <CardDescription>For serious students aiming for an A</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-slate-900">$9</span>
                <span className="text-slate-500">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="p-1 bg-blue-100 rounded-full"><Zap className="w-3 h-3 text-blue-600" /></div>
                  Unlimited AI Credits
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <Check className="w-5 h-5 text-blue-600 shrink-0" /> Smart Essay Grader
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <Check className="w-5 h-5 text-blue-600 shrink-0" /> Unlimited Class Notebooks
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <Check className="w-5 h-5 text-blue-600 shrink-0" /> Priority Support
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
                <Link href="/signup">Start Free Trial</Link>
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
            quote="I was failing Calculus II until I started using Altus. The step-by-step breakdown is a lifesaver."
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

// --- FAQ ---
export function FAQSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container px-4 mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full space-y-4">
          <FAQItem 
            question="Is Altus really free?"
            answer="Yes! You can sign up and start using Altus for free immediately with a daily credit allowance. No credit card required."
          />
          <FAQItem 
            question="Does it work for advanced math?"
            answer="Absolutely. Altus is powered by Google Gemini, capable of solving complex Calculus, Linear Algebra, Organic Chemistry, and Physics problems."
          />
          <FAQItem 
            question="How is this different from ChatGPT?"
            answer="Altus is purpose-built for students. We have dedicated modes for visual problem solving and strict grading rubrics. Plus, we organize your chats into 'Classes' so the AI retains context for the whole semester."
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
          Join thousands of students who are saving time and learning faster with Altus.
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