'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Brain, 
  Sparkles, 
  ArrowRight, 
  GraduationCap, 
  CheckCircle2, 
  XCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function LandingPage() {
  return (
    <div className="h-full overflow-y-auto bg-white scroll-smooth font-sans selection:bg-blue-100">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20">
              A
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Altus</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</a>
            <a href="#reviews" className="hover:text-blue-600 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              Log in
            </Link>
            <Link href="/signup">
              <Button className="rounded-full bg-slate-900 hover:bg-slate-800 text-white px-6 shadow-xl shadow-slate-900/10 transition-all hover:scale-105 active:scale-95">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50/50 px-4 py-1.5 text-sm font-medium text-blue-700 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <Sparkles className="mr-2 h-4 w-4 fill-blue-700/20" />
              <span>Now powered by Google Gemini 2.0</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Your GPA, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Supercharged by AI.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Stop stressing over assignments. Altus solves problems, grades essays, and organizes your notes—instantly and accurately.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-10 text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1">
                  Start Learning for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full h-14 px-10 text-lg rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                  See How It Works
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 pt-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Free daily credits
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Verified accuracy
              </div>
            </div>
          </div>
        </div>
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-50 to-white rounded-[100%] blur-3xl -z-10 opacity-60" />
      </section>

      {/* Social Proof */}
      <section className="py-8 border-y border-slate-100 bg-slate-50/50">
        <div className="container px-4 mx-auto">
          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
            Trusted by students at
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale mix-blend-multiply">
            {['Harvard', 'Stanford', 'MIT', 'Berkeley', 'Oxford', 'Cambridge'].map((uni) => (
              <div key={uni} className="flex items-center gap-2 text-xl font-bold font-serif text-slate-800">
                <GraduationCap className="w-6 h-6" /> {uni}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section (Pain vs Gain) */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why students switch to Altus</h2>
            <p className="text-lg text-slate-500">Stop doing things the hard way.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Old Way */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <XCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">The Old Way</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3 text-slate-600">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  Searching hours for similar problems online
                </li>
                <li className="flex gap-3 text-slate-600">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  Unorganized notes scattered across notebooks
                </li>
                <li className="flex gap-3 text-slate-600">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  Guessing if your essay is good enough
                </li>
                <li className="flex gap-3 text-slate-600">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  Getting stuck at 2 AM with no help
                </li>
              </ul>
            </div>

            {/* The Altus Way */}
            <div className="p-8 rounded-3xl bg-blue-50 border border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                RECOMMENDED
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-600/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">The Altus Way</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  Instant step-by-step solutions for any problem
                </li>
                <li className="flex gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  AI that knows your specific class context
                </li>
                <li className="flex gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  Detailed essay grading and feedback instantly
                </li>
                <li className="flex gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  24/7 AI Tutor that never gets tired
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 md:py-24 bg-slate-50">
        <div className="container px-4 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to <span className="text-blue-600">ace the semester</span>
            </h2>
            <p className="text-lg text-slate-600">
              One platform. Three powerful tools. Zero distractions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Brain className="w-8 h-8 text-white" />}
              color="bg-purple-600"
              title="AI Problem Solver"
              desc="Snap a photo of your math, physics, or chemistry homework. Get a detailed, step-by-step explanation, not just the answer."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-white" />}
              color="bg-blue-600"
              title="Essay Grader"
              desc="Don't submit your first draft. Paste your essay and get an instant letter grade with specific tips to improve your thesis and grammar."
            />
            <FeatureCard 
              icon={<FileText className="w-8 h-8 text-white" />}
              color="bg-emerald-500"
              title="Smart Notebooks"
              desc="Organize your learning by class. Upload your syllabus and notes so the AI understands exactly what you're studying."
            />
          </div>

          <div className="mt-12 text-center">
            <Link href="/signup">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 py-6 text-lg shadow-lg transition-transform hover:scale-105">
                Create Your Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="py-16 md:py-24 bg-white">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Loved by thousands of students</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="I was failing Calculus II until I started using Altus. The step-by-step breakdown is literally a lifesaver."
              author="Sarah J."
              role="Engineering Major"
              rating={5}
            />
            <TestimonialCard 
              quote="The essay grader is better than my actual TA. It caught thesis errors that would have cost me a letter grade."
              author="Michael T."
              role="History Major"
              rating={5}
            />
            <TestimonialCard 
              quote="I love that it organizes everything by class. It knows my syllabus, so the answers are actually relevant."
              author="Jessica K."
              role="Pre-Med"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-100">
        <div className="container px-4 mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Frequently Asked Questions</h2>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            <FAQItem 
              question="Is Altus really free?"
              answer="Yes! You can sign up and start using Altus for free immediately. We provide a generous daily credit allowance that refreshes every single day, perfect for most homework needs."
            />
            <FAQItem 
              question="Does it work for advanced math?"
              answer="Absolutely. Altus is powered by Google Gemini 2.0, capable of solving complex Calculus, Linear Algebra, Statistics, and Physics problems with high accuracy."
            />
            <FAQItem 
              question="Can it read my handwriting?"
              answer="Yes. Just snap a photo of your handwritten notes or homework problems, and our vision AI will transcribe and solve them instantly."
            />
            <FAQItem 
              question="How is this different from ChatGPT?"
              answer="Altus is designed specifically for students. We have dedicated modes for Solving, Tutoring, and Grading. Plus, we organize your chats by Class, so the AI has context from your actual course materials."
            />
          </Accordion>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 md:py-20 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="container px-4 mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to boost your grades?
          </h2>
          <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of students who are saving time and learning faster with Altus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg rounded-full shadow-2xl border-2 border-transparent hover:border-blue-200 transition-all hover:scale-105">
                Get Started for Free
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-200 opacity-80">
            No credit card required • Instant access
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">A</div>
               <span className="font-bold text-white text-xl">Altus</span>
            </div>
            <div className="text-sm">
              © {new Date().getFullYear()} Altus Learning Inc. All rights reserved.
            </div>
            <div className="flex gap-8 text-sm font-medium">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, color, title, desc }: any) {
  return (
    <Card className="border-slate-200 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full">
      <CardContent className="pt-8 p-8">
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg shadow-black/5 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{title}</h3>
        <p className="text-slate-600 leading-relaxed text-lg">{desc}</p>
      </CardContent>
    </Card>
  );
}

function TestimonialCard({ quote, author, role, rating }: any) {
  return (
    <Card className="border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all duration-300">
      <CardContent className="p-8 space-y-4">
        <div className="flex gap-1">
          {[...Array(rating)].map((_, i) => (
            <Sparkles key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
          ))}
        </div>
        <p className="text-slate-700 leading-relaxed italic">"{quote}"</p>
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
    <AccordionItem value={question} className="border border-slate-200 bg-white rounded-xl px-4 data-[state=open]:border-blue-200 data-[state=open]:shadow-sm transition-all">
      <AccordionTrigger className="text-left font-semibold text-slate-900 hover:text-blue-600 py-4 text-lg">
        {question}
      </AccordionTrigger>
      <AccordionContent className="text-slate-600 pb-4 text-base leading-relaxed">
        {answer}
      </AccordionContent>
    </AccordionItem>
  );
}