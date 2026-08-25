import React from 'react';
import { Building2, Shield, Users, Layers, Layout, ArrowRight, CheckCircle2, ShieldCheck, HelpCircle, Activity } from 'lucide-react';

interface LandingPageViewProps {
  onSelectPersona: (personaId: 'sarah_jones' | 'michael_chen' | 'emma_wilson' | 'web_admin' | 'guest') => void;
}

export function LandingPageView({ onSelectPersona }: LandingPageViewProps) {
  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans flex flex-col pt-24 relative overflow-hidden">
      
      {/* Background patterns */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#D8F235]/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl -z-10" />

      {/* Floating Capsule Navbar */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl bg-white/70 backdrop-blur-xl border border-gray-200/80 rounded-full px-6 py-3 flex items-center justify-between shadow-lg z-50 transition-all duration-300">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#D8F235" />
            <path d="M2 12L12 17L22 12" stroke="#121316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
            <path d="M2 17L12 22L22 17" stroke="#121316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          </svg>
          <span className="text-base font-bold tracking-tight text-gray-900">SmartLot</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onSelectPersona('guest')}
            className="bg-[#121316] hover:bg-black text-[#D8F235] hover:text-white px-5 py-2 rounded-full font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-8 max-w-7xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm text-[#121316] text-xs font-bold uppercase tracking-wider">
          <ShieldCheck size={14} className="text-emerald-500" /> Compliant with Australian Strata Legislation
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto font-sans">
          The Strata Management Platform for Modern Schemes
        </h1>
        <p className="text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
          From self-managed duplexes to multi-unit apartment complexes. Manage common property defects, coordinate committee voting, and delegate access permissions without manager overhead.
        </p>
      </section>

      {/* Magic UI Bento Grid Feature Showcase */}
      <section className="px-8 pb-16 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Large Feature */}
          <div className="md:col-span-2 bg-[#121316] text-white p-8 rounded-3xl border border-gray-800 shadow-xl flex flex-col justify-between min-h-[280px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D8F235]/5 rounded-bl-full -z-10 group-hover:scale-115 transition-transform" />
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#D8F235] tracking-widest">Maintenance Control</span>
              <h3 className="text-2xl font-bold mt-2">Common Property Dispatch</h3>
              <p className="text-sm text-gray-400 mt-2 max-w-md">
                Log building defects, track vendor work orders, and issue site access PINs. Automatic notification updates are sent to verified lot occupants instantly.
              </p>
            </div>
            <div className="flex items-center gap-4 pt-6 border-t border-white/5 mt-6 text-xs text-gray-400 font-semibold">
              <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#D8F235]" /> Instant dispatch</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#D8F235]" /> Track expenditure limits</div>
            </div>
          </div>

          {/* Card 2: Small Feature */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-md flex flex-col justify-between min-h-[280px]">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#8B8CF8] tracking-widest">Voting & Governance</span>
              <h3 className="text-xl font-bold text-gray-900 mt-2">Ballot Resolutions</h3>
              <p className="text-xs text-gray-500 mt-2">
                Elected committee members can verify quotes and cast votes online, with full audit trails that satisfy statutory quorum targets.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-100 text-xs font-bold text-gray-700">
              Meets NSW & VIC regulations
            </div>
          </div>

          {/* Card 3: Small Feature */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-md flex flex-col justify-between min-h-[280px]">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#8B8CF8] tracking-widest">Multi-Site Operations</span>
              <h3 className="text-xl font-bold text-gray-900 mt-2">Portfolio Switcher</h3>
              <p className="text-xs text-gray-500 mt-2">
                Strata managers can coordinate multiple separate strata schemes with one unified login. Context dashboards update automatically.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-100 text-xs font-bold text-gray-700">
              Toggle between sites instantly
            </div>
          </div>

          {/* Card 4: Large Feature */}
          <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-gray-200/80 shadow-md flex flex-col justify-between min-h-[280px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -z-10 group-hover:scale-105 transition-transform" />
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#8B8CF8] tracking-widest">Occupant Directories</span>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">Multi-Occupant Lot Mapping</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-md">
                Map co-owners, tenants, and family members to individual lot numbers. Update permissions dynamically so tenants don't access financials or cast committee votes.
              </p>
            </div>
            <div className="flex items-center gap-4 pt-6 border-t border-gray-100 mt-6 text-xs text-gray-500 font-semibold">
              <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Verify tenant leases</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Granular roles switcher</div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="px-8 pb-20 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900">Choose Your Setup Journey</h2>
          <p className="text-sm text-gray-500 mt-2">Select a scheme model below to explore its simulation dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Duplex Plan Card */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between hover:scale-[1.01] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D8F235]/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#D8F235]/20 text-[#121316] flex items-center justify-center mb-6">
                <Building2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Duplex Model</h3>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-extrabold">Self-Managed Strata</p>
              <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                Simplified two-lot configuration. Allows owners to log defects and verify shared decisions directly.
              </p>
              <div className="mt-6 space-y-2 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#121316]" /> Auto-grant Strata Admin role
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#121316]" /> Co-owner setup invites
                </div>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <button 
                onClick={() => onSelectPersona('sarah_jones')}
                className="w-full bg-[#121316] hover:bg-black text-white py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Simulate Sarah Jones</span>
                <ArrowRight size={14} className="text-[#D8F235]" />
              </button>
              <p className="text-[10px] text-center text-gray-400 font-bold">Creates Sunset Duplex (SP101)</p>
            </div>
          </div>

          {/* Townhouse Plan Card */}
          <div className="bg-[#121316] text-white rounded-3xl p-8 border border-gray-800 shadow-2xl hover:shadow-3xl transition-all flex flex-col justify-between hover:scale-[1.01] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D8F235]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#D8F235] text-[#121316] flex items-center justify-center mb-6">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Townhouse Model</h3>
              <p className="text-xs text-[#D8F235] mt-1 uppercase tracking-wider font-extrabold">Elected Committee (3-12 Lots)</p>
              <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                Features committee controls to approve quotes and coordinate with an external strata manager.
              </p>
              <div className="mt-6 space-y-2 border-t border-white/10 pt-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D8F235]" /> Strata Admin setup controls
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D8F235]" /> Strata manager delegation
                </div>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <button 
                onClick={() => onSelectPersona('michael_chen')}
                className="w-full bg-[#D8F235] hover:bg-white text-[#121316] py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span className="font-bold">Simulate Michael Chen</span>
                <ArrowRight size={14} className="text-[#121316]" />
              </button>
              <p className="text-[10px] text-center text-gray-400 font-bold">Creates Coronation (SP102)</p>
            </div>
          </div>

          {/* Apartment Plan Card */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between hover:scale-[1.01] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D8F235]/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#D8F235]/20 text-[#121316] flex items-center justify-center mb-6">
                <Layers size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Apartment Model</h3>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-extrabold">Professional Strata Management</p>
              <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                Full dashboard for building managers. Includes active work order routing and resident permission checks.
              </p>
              <div className="mt-6 space-y-2 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#121316]" /> Strata Manager interface
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#121316]" /> Role permissions switches
                </div>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <button 
                onClick={() => onSelectPersona('emma_wilson')}
                className="w-full bg-[#121316] hover:bg-black text-white py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Simulate Emma Wilson</span>
                <ArrowRight size={14} className="text-[#D8F235]" />
              </button>
              <p className="text-[10px] text-center text-gray-400 font-bold">Creates Cavaller (SP103)</p>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-[#121316] text-gray-500 text-xs border-t border-white/5 text-center">
        <p>© 2026 SmartLot Strata OS. All transactions are logged in accordance with state strata management regulations.</p>
      </footer>
    </div>
  );
}
