import React from 'react';
import { 
  Building2, 
  Shield, 
  Users, 
  Layers, 
  Layout, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  HelpCircle, 
  Activity, 
  Globe, 
  Scale,
  Sun,
  Moon,
  ShieldAlert
} from 'lucide-react';
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { SmartLotLogo } from './core/SmartLotLogo';

interface LandingPageViewProps {
  onSelectPersona: (personaId: 'sarah_jones' | 'michael_chen' | 'emma_wilson' | 'web_admin' | 'guest') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export function LandingPageView({ onSelectPersona, theme, setTheme }: LandingPageViewProps) {
  const testimonials = [
    {
      quote:
        "The attention to detail and compliance tracing has completely transformed our building's governance. This is exactly what we've been looking for.",
      name: "Sarah Chen",
      designation: "Strata Committee Secretary - Sydney",
      src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop",
    },
    {
      quote:
        "Implementation was seamless and the results exceeded our expectations. The multi-site switcher's flexibility is remarkable.",
      name: "Michael Rodriguez",
      designation: "Strata Manager at Zenith Portfolios",
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop",
    },
    {
      quote:
        "This platform has significantly improved our duplex management. The intuitive interface makes logging repair requests simple.",
      name: "Emily Watson",
      designation: "Duplex Owner - Melbourne",
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
    },
    {
      quote:
        "Outstanding transparency and robust auditing features. It's rare to find a strata OS that delivers on all its promises.",
      name: "James Kim",
      designation: "Elected Treasurer - Brisbane",
      src: "https://images.unsplash.com/photo-1636041293178-808a6762ab39?q=80&w=600&auto=format&fit=crop",
    },
    {
      quote:
        "The scalability and tenant directory mapping have been game-changing for our building managers. Highly recommend to any strata team.",
      name: "Lisa Thompson",
      designation: "Managing Director at Metro Strata Group",
      src: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=600&auto=format&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0B1121] text-gray-900 dark:text-white font-sans flex flex-col relative overflow-hidden selection:bg-[#00D4B2] selection:text-[#0B1121] transition-colors duration-300">
      
      {/* Background Ripple Effect covering the entire page dynamically using fixed positioning */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none flex justify-center overflow-hidden">
        <BackgroundRippleEffect rows={22} cols={45} cellSize={60} />
      </div>

      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#00D4B2]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-[#0055FF]/10 rounded-full blur-3xl pointer-events-none -z-10" />
 
      {/* Floating Premium Capsule Navbar */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl bg-white/80 dark:bg-[#121316]/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-full px-8 py-4 flex items-center justify-between shadow-lg z-50 transition-colors duration-300">
        <div 
          className="flex items-center cursor-pointer group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <SmartLotLogo className="h-8" textColor="text-gray-900 dark:text-white" />
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
          <a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
          <a href="#testimonials" className="hover:text-gray-900 dark:hover:text-white transition-colors">Testimonials</a>
          <a href="#compliance" className="hover:text-gray-900 dark:hover:text-white transition-colors">Compliance</a>
        </nav>

        <div className="flex items-center gap-3">
          {/* Light/Dark Mode Switcher Button */}
          <button 
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </button>

          <button 
            onClick={() => window.location.hash = '#/admin'}
            className="hidden lg:flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ShieldAlert size={14} /> System Console
          </button>

          <button 
            onClick={() => onSelectPersona('guest')}
            className="bg-[#0B1121] dark:bg-white dark:text-black hover:bg-black dark:hover:bg-gray-100 text-[#00D4B2] px-6 py-2.5 rounded-full font-black text-xs shadow-md transition-all hover:scale-[1.02] cursor-pointer"
          >
            Access Roster / Sign Up
          </button>
        </div>
      </header>

      {/* Hero Section with Interactive Background Ripple Effect */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 text-center overflow-hidden pt-20">
        {/* Foreground Content */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-8 mt-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs font-black uppercase tracking-widest">
            <ShieldCheck size={14} className="text-[#0055FF] dark:text-[#00D4B2] animate-pulse" /> NSW & VIC Strata Scheme Certified
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1] max-w-4xl mx-auto uppercase">
            The Strata Management <span className="text-[#0055FF] dark:text-[#00D4B2]">OS</span> for Modern Schemes
          </h1>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Take back control of common property. From self-managed duplex structures to multi-lot townhouse committees and apartment complexes.
          </p>
          <div className="flex flex-col items-center justify-center pt-4 gap-4">
            <button 
              onClick={() => onSelectPersona('guest')}
              className="w-full sm:w-auto bg-[#0B1121] dark:bg-white dark:text-black hover:bg-black dark:hover:bg-gray-100 text-[#00D4B2] dark:text-black px-10 py-4.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer shadow-lg shadow-[#0B1121]/10 dark:shadow-white/5"
            >
              <span>Get Started Now</span>
              <ArrowRight size={14} className="text-[#00D4B2] dark:text-black" />
            </button>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid with Clean Card Borders */}
      <section id="features" className="px-6 py-24 max-w-6xl mx-auto w-full relative z-10 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-[10px] font-extrabold uppercase text-[#0055FF] dark:text-[#00D4B2] tracking-widest bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-full">Core Architecture</span>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Advanced Strata Controls</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Engineered to comply with Australian state laws and self-management guidelines.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Primary Feature (Dark pop contrast card) */}
          <div className="md:col-span-2 bg-[#0B1121] text-white p-8 rounded-[32px] shadow-xl flex flex-col justify-between min-h-[300px] relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border border-transparent">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00D4B2]/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#00D4B2] tracking-widest">Maintenance Control</span>
              <h3 className="text-2xl font-bold mt-2 text-white">Common Property Dispatch</h3>
              <p className="text-sm text-gray-400 mt-2 max-w-md leading-relaxed">
                Log building defects, generate public guest links, track vendor quotes, and register work order expenses. Automated notices are sent to affected units instantly.
              </p>
            </div>
            <div className="flex items-center gap-4 pt-6 border-t border-white/5 mt-6 text-xs text-gray-500 font-semibold">
              <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#00D4B2]" /> Instant dispatch</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#00D4B2]" /> Expenditure limits mapping</div>
            </div>
          </div>

          {/* Card 2: Ballot Resolutions */}
          <div className="bg-white dark:bg-[#121316] border border-gray-200/80 dark:border-gray-800 hover:border-gray-950 dark:hover:border-white p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[300px] group">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#0055FF] dark:text-[#00D4B2] tracking-widest">Voting & Governance</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">Ballot Resolutions</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Elected committee members can verify quotes and register votes online, with full audit trail histories that satisfy statutory quorum targets.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-xs font-bold text-[#0055FF] dark:text-[#00D4B2]">
              Meets NSW & VIC regulations
            </div>
          </div>

          {/* Card 3: Switcher */}
          <div className="bg-white dark:bg-[#121316] border border-gray-200/80 dark:border-gray-800 hover:border-gray-950 dark:hover:border-white p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[300px] group">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#0055FF] dark:text-[#00D4B2] tracking-widest">Multi-Site Operations</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">Portfolio Switcher</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Professional managers can switch portfolios instantly. Switch roles dynamically and access noticeboards under distinct building scheme boundaries.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-xs font-bold text-[#0055FF] dark:text-[#00D4B2]">
              Toggle between sites instantly
            </div>
          </div>

          {/* Card 4: Directories */}
          <div className="md:col-span-2 bg-white dark:bg-[#121316] border border-gray-200/80 dark:border-gray-800 hover:border-gray-950 dark:hover:border-white p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 dark:bg-gray-900 rounded-bl-full pointer-events-none group-hover:scale-105 transition-transform" />
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#0055FF] dark:text-[#00D4B2] tracking-widest">Occupant Directories</span>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Occupant Access Directories</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md leading-relaxed">
                Map co-owners, tenants, and residents directly to individual lot titles. Sync access permissions live so tenants do not access levies or cast committee votes.
              </p>
            </div>
            <div className="flex items-center gap-4 pt-6 border-t border-gray-100 dark:border-gray-800 mt-6 text-xs text-gray-500 font-semibold">
              <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#0055FF] dark:text-[#00D4B2]" /> Live Sync access matrix</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#0055FF] dark:text-[#00D4B2]" /> Tenant lease verify</div>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Testimonials Section */}
      <section id="testimonials" className="px-6 py-24 bg-white dark:bg-[#121316] border-y border-gray-200/80 dark:border-gray-800 relative z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto w-full space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-extrabold uppercase text-[#0055FF] dark:text-[#00D4B2] tracking-widest bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-full">Community Trust</span>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 dark:text-white">What Our Clients Say</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Join thousands of modern Australian lot owners self-managing their sites successfully.</p>
          </div>
          
          <div className="relative z-20">
            <AnimatedTestimonials testimonials={testimonials} autoplay={true} />
          </div>
        </div>
      </section>

      {/* Compliance / Legislation Section */}
      <section id="compliance" className="px-6 py-24 max-w-5xl mx-auto w-full relative z-10 space-y-12">
        <div className="bg-white dark:bg-[#121316] border border-gray-200/80 dark:border-gray-800 rounded-[40px] p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 dark:bg-gray-900 rounded-bl-full pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                <Scale size={24} />
              </div>
              <h3 className="text-2xl md:text-3xl font-black uppercase text-gray-900 dark:text-white leading-tight">Legal & Compliance Integrity</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                SmartLot is constructed in accordance with the New South Wales (NSW) *Strata Schemes Management Act 2015* and the Victorian (VIC) *Owners Corporations Act 2006*.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl border border-gray-200/60 dark:border-gray-800 space-y-2">
                <div className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Secured Ballot Records</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Votes and resolution histories are cryptographically hashed and sealed for compliance audit trials.</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl border border-gray-200/60 dark:border-gray-800 space-y-2">
                <div className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">State Levy Auditing</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Integrated capital works fund reporting ensures proper disclosure statements during lot sales.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Page */}
      <footer className="bg-[#0B1121] border-t border-white/5 text-gray-400 relative z-10 pt-20 pb-10 px-6">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-4 col-span-1 md:col-span-1">
            <SmartLotLogo className="h-8" textColor="text-white" />
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              The modern strata operating system built to automate administration, common area maintenance, and legal voting.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Company</h4>
            <ul className="space-y-2.5 text-xs font-bold text-gray-500">
              <li><a href="#" className="hover:text-[#00D4B2] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[#00D4B2] transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-[#00D4B2] transition-colors">Compliance</a></li>
              <li><a href="#" className="hover:text-[#00D4B2] transition-colors">Support Helpdesk</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Platform</h4>
            <ul className="space-y-2.5 text-xs font-bold text-gray-500">
              <li><a href="#features" className="hover:text-white transition-colors">Defect Logging</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Governance Ballots</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Access Directories</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Compliance Auditing</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-widest">State Legislation</h4>
            <ul className="space-y-2.5 text-xs font-bold text-gray-500">
              <li><a href="#compliance" className="hover:text-white transition-colors">NSW SSMA 2015</a></li>
              <li><a href="#compliance" className="hover:text-white transition-colors">VIC Owners Corp Act 2006</a></li>
              <li><a href="#compliance" className="hover:text-white transition-colors">QLD BUGTA 1980</a></li>
              <li><a href="#compliance" className="hover:text-white transition-colors">Privacy Principles</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto w-full border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-gray-600 font-semibold uppercase tracking-wider">
          <div>
            © 2026 SmartLot Strata OS. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Australian Security Standards</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
