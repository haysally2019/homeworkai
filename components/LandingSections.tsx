'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Brain, 
  ShieldCheck, 
  FileText,
  Sparkles
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-slate-50">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Everything you need to <span className="text-blue-600">ace the semester</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Brain className="w-8 h-8 text-white" />}
            color="bg-purple-600"
            title="AI Problem Solver"
            desc="Snap a photo of your math, physics, or chemistry homework. Get a detailed explanation."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-8 h-8 text-white" />}
            color="bg-blue-600"
            title="Essay Grader"
            desc="Paste your essay and get an instant letter grade with specific tips to improve."
          />
          <FeatureCard 
            icon={<FileText className="w-8 h-8 text-white" />}
            color="bg-emerald-500"
            title="Smart Notebooks"
            desc="Organize your learning by class. The AI understands your specific course context."
          />
        </div>
      </div>
    </section>
  );
}

export function ReviewsSection() {
  return (
    <section id="reviews" className="py-16 md:py-24 bg-white">
      <div className="container px-4 mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Loved by thousands</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <TestimonialCard 
            quote="I was failing Calculus II until I started using Altus. The step-by-step breakdown is a lifesaver."
            author="Sarah J."
            role="Engineering Major"
          />
          <TestimonialCard 
            quote="The essay grader is better than my actual TA. It caught errors that would have cost me points."
            author="Michael T."
            role="History Major"
          />
          <TestimonialCard 
            quote="I love that it organizes everything by class. It knows my syllabus, so the answers are relevant."
            author="Jessica K."
            role="Pre-Med"
          />
        </div>
      </div>
    </section>
  );
}

export function FAQSection() {
  return (
    <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-100">
      <div className="container px-4 mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full space-y-4">
          <FAQItem 
            question="Is Altus really free?"
            answer="Yes! You can sign up and start using Altus for free immediately with a daily credit allowance."
          />
          <FAQItem 
            question="Does it work for advanced math?"
            answer="Absolutely. Altus is powered by Google Gemini, capable of solving complex Calculus, Linear Algebra, and Physics."
          />
          <FAQItem 
            question="How is this different from ChatGPT?"
            answer="Altus is designed for students. We have dedicated modes for Solving and Grading, plus we organize chats by Class context."
          />
        </Accordion>
      </div>
    </section>
  );
}

function FeatureCard({ icon, color, title, desc }: any) {
  return (
    <Card className="border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group h-full">
      <CardContent className="pt-8 p-8">
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 text-lg">{desc}</p>
      </CardContent>
    </Card>
  );
}

function TestimonialCard({ quote, author, role }: any) {
  return (
    <Card className="border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all">
      <CardContent className="p-8 space-y-4">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => <Sparkles key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
        </div>
        <p className="text-slate-700 italic">"{quote}"</p>
        <div className="pt-4 border-t border-slate-100">
          <p className="font-bold text-slate-900">{author}</p>
          <p className="text-sm text-slate-500">{role}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FAQItem({ question, answer }: any) {
  return (
    <AccordionItem value={question} className="border border-slate-200 bg-white rounded-xl px-4">
      <AccordionTrigger className="text-left font-semibold text-slate-900 hover:text-blue-600 py-4 text-lg">
        {question}
      </AccordionTrigger>
      <AccordionContent className="text-slate-600 pb-4 text-base">
        {answer}
      </AccordionContent>
    </AccordionItem>
  );
}