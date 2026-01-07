'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  Zap, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  GraduationCap,
  MessageSquare,
  FileText,
  ShieldCheck
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="h-full overflow-y-auto bg-slate-50 scroll-smooth">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/20">
              A
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Altus</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-blue-600">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 md:pt-24 pb-16">
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              <span>Now with AI-Powered Study Guides</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Master Your Coursework <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                In Seconds, Not Hours
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              The all-in-one AI academic assistant. Snap a photo of any problem, generate instant notes, and create study guides automatically.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-12 px-8 text-base bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-900/20">
                  Start Learning for Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full h-12 px-8 text-base bg-white">
                  See How It Works
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-500 pt-2">
              No credit card required · 5 Free credits daily
            </p>
          </div>
        </div>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-slate-200 bg-white/50">
        <div className="container px-4 md:px-6 mx-auto">
          <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">
            Trusted by students from top universities
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {['Harvard', 'Stanford', 'MIT', 'Berkeley', 'Oxford'].map((uni) => (
              <div key={uni} className="text-xl font-bold text-slate-400 flex items-center gap-2">
                <GraduationCap className="w-6 h-6" /> {uni}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-32">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to <span className="text-blue-600">excel</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Stop juggling multiple apps. Altus brings solving, note-taking, and studying into one powerful platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Brain className="w-10 h-10 text-white" />}
              color="bg-purple-600"
              title="AI Problem Solver"
              desc="Stuck on homework? Upload a photo or type your question. Get step-by-step explanations, not just the answer."
            />
            <FeatureCard 
              icon={<FileText className="w-10 h-10 text-white" />}
              color="bg-blue-600"
              title="Smart Note Taker"
              desc="Organize your thoughts with our rich text editor. AI automatically enhances your notes and generates summaries."
            />
            <FeatureCard 
              icon={<Zap className="w-10 h-10 text-white" />}
              color="bg-amber-500"
              title="Instant Flashcards"
              desc="Turn your class notes and assignments into study decks instantly. Prepare for exams 10x faster."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                Your personal AI Tutor, <br />
                available 24/7.
              </h2>
              <div className="space-y-6">
                <Step 
                  number="01" 
                  title="Upload or Ask" 
                  desc="Upload your assignment PDF, paste a question, or snap a photo of your textbook."
                />
                <Step 
                  number="02" 
                  title="Get Intelligent Analysis" 
                  desc="Our advanced AI breaks down complex concepts into simple, understandable steps."
                />
                <Step 
                  number="03" 
                  title="Master the Material" 
                  desc="Generate practice quizzes and study guides from your content to lock in the knowledge."
                />
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
              <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
                {/* Mock Chat Interface */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">AI</div>
                    <div className="bg-slate-700 rounded-2xl rounded-tl-none p-3 text-sm text-slate-200">
                      To solve this calculus problem, let's use the Chain Rule. First, identify the inner function...
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center font-bold text-xs">You</div>
                    <div className="bg-blue-600 rounded-2xl rounded-tr-none p-3 text-sm text-white">
                      Can you explain why we multiply by the derivative of the inner function?
                    </div>
                  </div>
                   <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">AI</div>
                    <div className="bg-slate-700 rounded-2xl rounded-tl-none p-3 text-sm text-slate-200">
                      Great question! Think of it like peeling an onion. We need to account for the rate of change of the outer layer relative to the inner layer...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32">
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, Student-Friendly Pricing</h2>
            <p className="text-slate-600">Start for free, upgrade when you need more power.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Free Plan */}
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Free Starter</CardTitle>
                <div className="text-3xl font-bold mt-2">$0 <span className="text-lg font-normal text-slate-500">/mo</span></div>
                <p className="text-sm text-slate-500">Perfect for trying it out</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> 5 Credits per day
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Basic AI Solver
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> 1 Class Notebook
                  </li>
                </ul>
                <Link href="/signup">
                  <Button variant="outline" className="w-full">Sign Up Free</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-blue-200 bg-blue-50/50 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-900">Pro Student</CardTitle>
                <div className="text-3xl font-bold mt-2 text-blue-900">$9.99 <span className="text-lg font-normal text-blue-600">/mo</span></div>
                <p className="text-sm text-blue-600">For serious academic success</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" /> <span className="font-bold">Unlimited</span> AI Credits
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" /> Advanced Models (Gemini 2.0)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" /> Unlimited Classes & Notes
                  </li>
                   <li className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" /> Priority Support
                  </li>
                </ul>
                <Link href="/signup">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/10">Upgrade to Pro</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">A</div>
               <span className="font-bold text-slate-900">Altus</span>
            </div>
            <div className="text-sm text-slate-500">
              © {new Date().getFullYear()} Altus Learning Inc. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">Terms</a>
              <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, color, title, desc }: any) {
  return (
    <Card className="border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
      <CardContent className="pt-6">
        <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

function Step({ number, title, desc }: any) {
  return (
    <div className="flex gap-4">
      <div className="text-2xl font-bold text-blue-500 opacity-50 font-mono">{number}</div>
      <div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}