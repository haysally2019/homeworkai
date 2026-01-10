'use client';

import Link from 'next/link';
import { 
  SocialProofSection, 
  FeaturesSection, 
  HowItWorksSection, 
  ReviewsSection, 
  FAQSection,
  PricingSection,
  CTASection
} from './LandingSections'; 
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  Menu,
  Bot
} from 'lucide-react';
import { useState } from 'react';

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-full overflow-y-auto bg-white scroll-smooth font-sans selection:bg-blue-100">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          
          {/* LOGO UPDATE: Text Only */}
          <Link href="/" className="flex items-center gap-2 group">
             <span className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">LockIn AI</span>
          </Link>
          
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
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu className="w-6 h-6 text-slate-600" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 lg:pt-32">
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Hero Content */}
            <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0 flex-1 space-y-8">
              <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50/50 px-4 py-1.5 text-sm font-medium text-blue-700 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <Sparkles className="mr-2 h-4 w-4 fill-blue-700/20" />
                <span>Now powered by Google Gemini</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Your GPA, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Supercharged.
                </span>
              </h1>
              
              <p className="text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Stop stressing over assignments. LockIn AI uses advanced models to solve problems, grade essays, and organize your study notes—instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Button asChild size="lg" className="w-full sm:w-auto h-14 px-10 text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1">
                  <Link href="/signup">
                    Start Learning Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-14 px-10 text-lg rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                  <Link href="#features">
                    See Features
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 5 Free credits daily
                </div>
              </div>
            </div>

            {/* Hero Visual - Mockup */}
            <div className="flex-1 w-full max-w-lg lg:max-w-xl relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
               {/* Decorative blobs */}
               <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl -z-10 animate-pulse" />
               <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-400/30 rounded-full blur-3xl -z-10" />

               {/* Interface Mockup */}
               <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
                 {/* Window Header */}
                 <div className="bg-slate-50 border-b border-slate-100 p-3 flex items-center gap-2">
                   <div className="flex gap-1.5">
                     <div className="w-3 h-3 rounded-full bg-red-400" />
                     <div className="w-3 h-3 rounded-full bg-amber-400" />
                     <div className="w-3 h-3 rounded-full bg-green-400" />
                   </div>
                   <div className="mx-auto text-xs font-medium text-slate-400">LockIn AI Tutor</div>
                 </div>

                 {/* Chat Content */}
                 <div className="p-6 space-y-4">
                   {/* User Message */}
                   <div className="flex justify-end">
                     <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm py-3 px-4 max-w-[85%] shadow-md text-sm">
                       <p>Can you explain the derivative of ln(x)? I'm stuck.</p>
                     </div>
                   </div>

                   {/* AI Message */}
                   <div className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                       <Bot className="w-5 h-5 text-indigo-600" />
                     </div>
                     <div className="bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl rounded-bl-sm py-3 px-4 shadow-sm text-sm w-full">
                       <p className="font-semibold text-slate-900 mb-1">Sure! Here is the step-by-step:</p>
                       <p className="mb-2">The derivative of the natural logarithm function is simply the reciprocal of x.</p>
                       <div className="bg-white border border-slate-200 rounded p-2 font-mono text-xs text-slate-600 mb-2">
                         d/dx [ln(x)] = 1/x
                       </div>
                       <p className="text-xs text-slate-500">Would you like to see a practice problem?</p>
                     </div>
                   </div>

                   {/* Floating Elements */}
                   <div className="absolute -right-6 top-20 bg-white p-3 rounded-xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce duration-[3000ms]">
                      <div className="bg-green-100 p-2 rounded-lg text-green-600 font-bold">A+</div>
                      <div className="text-xs font-semibold text-slate-700">Essay Graded<br/><span className="text-slate-400 font-normal">Just now</span></div>
                   </div>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      <SocialProofSection />
      
      {/* Comparison Section */}
      <section className="py-20 bg-white">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Stop studying the hard way</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Old Way */}
            <div className="p-8 md:p-10 rounded-3xl bg-slate-50 border border-slate-100 opacity-70 hover:opacity-100 transition-opacity">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg"><XCircle className="w-6 h-6" /></div>
                The Old Way
              </h3>
              <ul className="space-y-4 text-slate-600">
                <li className="flex gap-3"><XCircle className="w-5 h-5 text-red-400 shrink-0" /> Googling similar problems for hours</li>
                <li className="flex gap-3"><XCircle className="w-5 h-5 text-red-400 shrink-0" /> Notes scattered across 5 notebooks</li>
                <li className="flex gap-3"><XCircle className="w-5 h-5 text-red-400 shrink-0" /> Getting stuck at 2 AM with no help</li>
              </ul>
            </div>

            {/* The LockIn Way */}
            <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 relative shadow-lg">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg shadow-md"><CheckCircle2 className="w-6 h-6" /></div>
                The LockIn Way
              </h3>
              <ul className="space-y-4 text-slate-700 font-medium">
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" /> Instant solutions with detailed logic</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" /> AI that knows your specific syllabus</li>
                <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" /> 24/7 AI Tutor that never sleeps</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <HowItWorksSection />
      <FeaturesSection />
      <ReviewsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               {/* Footer Logo: Text Only */}
               <span className="text-lg font-bold text-white tracking-tight">LockIn AI</span>
            </div>
            <div className="flex gap-8 text-sm font-medium">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <div className="text-sm">© {new Date().getFullYear()} LockIn Learning Inc.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}