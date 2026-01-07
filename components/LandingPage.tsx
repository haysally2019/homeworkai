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
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" className="text-slate-600 hover:text-blue-600">Log in</Button></Link>
            <Link href="/signup"><Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 md:pt-24 pb-16">
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              <span>Powered by Google Gemini</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Master Your Coursework <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Without the Guesswork
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              The AI academic assistant that grades your essays, solves math problems step-by-step, and helps you study—verified for accuracy.
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
                  See Features
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-500 pt-2">No credit card required · 5 Free credits daily</p>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-32">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to <span className="text-blue-600">excel</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Stop second-guessing your work. Altus gives you the right answers and the feedback you need to improve.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Brain className="w-10 h-10 text-white" />}
              color="bg-purple-600"
              title="AI Problem Solver"
              desc="Snap a photo of any math or science problem. Get detailed, step-by-step solutions verified for accuracy."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-10 h-10 text-white" />}
              color="bg-blue-600"
              title="Essay Grader"
              desc="Get instant feedback on your papers before you submit. We check grammar, structure, and grading criteria."
            />
            <FeatureCard 
              icon={<Zap className="w-10 h-10 text-white" />}
              color="bg-amber-500"
              title="Zero Hallucinations"
              desc="Our advanced AI is grounded in factual databases to prevent made-up answers. If we don't know, we tell you."
            />
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
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Free Starter</CardTitle>
                <div className="text-3xl font-bold mt-2">$0 <span className="text-lg font-normal text-slate-500">/mo</span></div>
                <p className="text-sm text-slate-500">Perfect for trying it out</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 className="w-4 h-4 text-green-500" /> 5 Credits per day</li>
                  <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 className="w-4 h-4 text-green-500" /> Basic AI Solver</li>
                  <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 className="w-4 h-4 text-green-500" /> 1 Class Notebook</li>
                </ul>
                <Link href="/signup"><Button variant="outline" className="w-full">Sign Up Free</Button></Link>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-900">Pro Student</CardTitle>
                <div className="text-3xl font-bold mt-2 text-blue-900">$9.99 <span className="text-lg font-normal text-blue-600">/mo</span></div>
                <p className="text-sm text-blue-600">For serious academic success</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 className="w-4 h-4 text-blue-600" /> <span className="font-bold">Unlimited</span> AI Credits</li>
                  <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Powered by Google Gemini</li>
                  <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Essay Grading Mode</li>
                  <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Priority Support</li>
                </ul>
                <Link href="/signup"><Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/10">Upgrade to Pro</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">A</div>
             <span className="font-bold text-slate-900">Altus</span>
          </div>
          <div className="text-sm text-slate-500">© {new Date().getFullYear()} Altus Learning Inc.</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, color, title, desc }: any) {
  return (
    <Card className="border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
      <CardContent className="pt-6">
        <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>{icon}</div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}