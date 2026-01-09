'use client';

import Link from 'next/link';
// We are now importing the standard named exports we just restored in Step 1
import { FeaturesSection, ReviewsSection, FAQSection } from './LandingSections'; 
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  ArrowRight, 
  GraduationCap, 
  CheckCircle2, 
  XCircle,
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100">
      
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
            <Link href="#features" className="hover:text-blue-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</Link>
            <Link href="#reviews" className="hover:text-blue-600 transition-colors">Reviews</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              Log in
            </Link>
            
            <Button asChild className="rounded-full bg-slate-900 hover:bg-slate-800 text-white px-6 shadow-xl shadow-slate-900/10 transition-all hover:scale-105 active:scale-95">
              <Link href="/signup">
                Sign Up Free
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50/50 px-4 py-1.5 text-sm font-medium text-blue-700 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <Sparkles className="mr-2 h-4 w-4 fill-blue-700/20" />
              <span>Now powered by Google Gemini</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Your GPA, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Supercharged by AI.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Stop stressing over assignments. Altus solves problems, grades essays, and organizes your notes—instantly.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-10 text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1">
                <Link href="/signup">
                  Start Learning for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-14 px-10 text-lg rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                <Link href="#features">
                  See How It Works
                </Link>
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 pt-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Free daily credits
              </div>
            </div>
          </div>
        </div>
        
        {/* Background gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-50 to-white rounded-[100%] blur-3xl -z-10 opacity-60" />
      </section>

      {/* Social Proof */}
      <section className="py-8 border-y border-slate-100 bg-slate-50/50">
        <div className="container px-4 mx-auto">
          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
            Trusted by students at
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale mix-blend-multiply">
            {['Harvard', 'Stanford', 'MIT', 'Berkeley', 'Oxford'].map((uni) => (
              <div key={uni} className="flex items-center gap-2 text-xl font-bold font-serif text-slate-800">
                <GraduationCap className="w-6 h-6" /> {uni}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why students switch to Altus</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Old Way */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg"><XCircle className="w-6 h-6" /></div>
                The Old Way
              </h3>
              <ul className="space-y-4 text-slate-600">
                <li className="flex gap-3"><XCircle className="w-5 h-5 text-red-400" /> Searching hours for similar problems</li>
                <li className="flex gap-3"><XCircle className="w-5 h-5 text-red-400" /> Unorganized notes everywhere</li>
                <li className="flex gap-3"><XCircle className="w-5 h-5 text-red-400" /> Getting stuck at 2 AM</li>
              </ul>
            </div>

            {/* The Altus Way */}
            <div className="p-8 rounded-3xl bg-blue-50 border border-blue-100 relative">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg"><CheckCircle2 className="w-6 h-6" /></div>
                The Altus Way
              </h3>
              <ul className="space-y-4 text-slate-700 font-medium">
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-600" /> Instant step-by-step solutions</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-600" /> AI that knows your syllabus</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-600" /> 24/7 AI Tutor support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <FeaturesSection />
      <ReviewsSection />
      <FAQSection />

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="container px-4 mx-auto text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="font-bold text-white text-xl">Altus</span>
            <div className="text-sm">© {new Date().getFullYear()} Altus Learning Inc.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}