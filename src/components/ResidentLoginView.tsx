import React, { useState } from 'react';
import { Building, User, Users, ShieldCheck, ArrowRight, Key, Mail, Lock, Plus } from 'lucide-react';

interface ResidentLoginViewProps {
  onLoginSuccess: (
    role: string, 
    name: string, 
    siteInfo?: { id: string; name: string; lots: number }
  ) => void;
  onAdminLogin: () => void;
  onBack: () => void;
}

export function ResidentLoginView({ onLoginSuccess, onAdminLogin, onBack }: ResidentLoginViewProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<string>('Lot Owner');
  const [email, setEmail] = useState('mike@owner.com');
  const [password, setPassword] = useState('••••••••');
  const [fullName, setFullName] = useState('Mike Davies');
  const [unitNo, setUnitNo] = useState('Unit 10');

  // Site creation fields
  const [createSite, setCreateSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState('Sunset Duplex');
  const [newSiteId, setNewSiteId] = useState('SP101');
  const [newSiteLots, setNewSiteLots] = useState(2);

  const handleQuickFill = (persona: 'sarah' | 'michael' | 'emma') => {
    setAuthMode('signup');
    setCreateSite(true);
    if (persona === 'sarah') {
      setFullName('Sarah Jones');
      setEmail('sarah.jones@duplex.com');
      setSelectedRole('Strata Admin');
      setUnitNo('Unit 1');
      setNewSiteName('Sunset Duplex');
      setNewSiteId('SP101');
      setNewSiteLots(2);
    } else if (persona === 'michael') {
      setFullName('Michael Chen');
      setEmail('michael.chen@coronation.com');
      setSelectedRole('Strata Admin');
      setUnitNo('Unit 3');
      setNewSiteName('Coronation Townhouses');
      setNewSiteId('SP102');
      setNewSiteLots(4);
    } else if (persona === 'emma') {
      setFullName('Emma Wilson');
      setEmail('emma.wilson@cavaller.com');
      setSelectedRole('Strata Manager');
      setUnitNo('Cavaller HQ');
      setNewSiteName('Cavaller Apartments');
      setNewSiteId('SP103');
      setNewSiteLots(32);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'signup') {
      onLoginSuccess(
        selectedRole, 
        fullName,
        createSite ? { id: newSiteId, name: newSiteName, lots: Number(newSiteLots) } : undefined
      );
    } else {
      // Simulate standard login fills
      if (email === 'admin@smartlot.com') {
        onAdminLogin();
      } else {
        const loginRole = selectedRole;
        const loginName = selectedRole === 'Lot Owner' ? 'Mike Davies' : selectedRole === 'Tenant' ? 'John Smith' : 'Lisa Ray';
        onLoginSuccess(loginRole, loginName);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F4F6F9] p-4 font-sans">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[620px] border border-gray-100">
        
        {/* Left Visual Branding Panel */}
        <div className="w-full md:w-5/12 bg-[#121316] p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <svg 
              onClick={onBack}
              className="w-12 h-12 shrink-0 cursor-pointer hover:scale-105 transition-all" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              title="Back to Landing Page"
            >
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#D8F235" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
            </svg>

            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#D8F235]">SmartLot Strata</span>
              <h1 className="text-3xl font-bold tracking-tight mt-1">Strata Portal</h1>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Log service requests, manage scheme members, assign role permissions, and vote on community decisions.
              </p>
            </div>

            {/* Quick Simulation Personas Box */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D8F235] block">
                Simulate Foundation Journeys
              </span>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('sarah')}
                  className="w-full text-left bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Sarah Jones <span className="text-gray-400 font-normal">(Duplex Setup SP101)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('michael')}
                  className="w-full text-left bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Michael Chen <span className="text-gray-400 font-normal">(Coronation Setup SP102)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('emma')}
                  className="w-full text-left bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Emma Wilson <span className="text-gray-400 font-normal">(Cavaller Setup SP103)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-3 pt-8 border-t border-white/10 text-xs text-gray-400">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldCheck size={16} className="text-[#D8F235]" /> Verified Compliance & Scheme Isolation
            </div>
            <div>Secure tenant & strata manager authentication matrix.</div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 p-10 flex flex-col justify-center max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {authMode === 'signin' ? 'Sign In to SmartLot' : 'Create Account'}
            </h2>

            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${authMode === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${authMode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Sign Up
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role Selection Tabs */}
            <div>
              <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">Select Your Classification</label>
              <div className="grid grid-cols-3 gap-2">
                <RoleOption title="Lot Owner" desc="Off-site Owner" selected={selectedRole === 'Lot Owner'} onClick={() => setSelectedRole('Lot Owner')} />
                <RoleOption title="Strata Manager" desc="Strata Administration" selected={selectedRole === 'Strata Manager'} onClick={() => setSelectedRole('Strata Manager')} />
                <RoleOption title="Strata Admin" desc="Scheme Owner Admin" selected={selectedRole === 'Strata Admin'} onClick={() => setSelectedRole('Strata Admin')} />
              </div>
            </div>

            {authMode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none font-semibold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Unit Number</label>
                    <input
                      type="text"
                      required
                      value={unitNo}
                      onChange={e => setUnitNo(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none font-semibold text-gray-900"
                    />
                  </div>
                </div>

                {/* Site Creation Option */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={createSite} 
                      onChange={e => setCreateSite(e.target.checked)}
                      className="rounded border-gray-300 text-[#121316] focus:ring-black"
                    />
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                      <Plus size={14} className="text-[#8B8CF8]" /> Create a new Strata Site / Scheme
                    </span>
                  </label>

                  {createSite && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200/60">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Scheme Name</label>
                        <input
                          type="text"
                          required
                          value={newSiteName}
                          onChange={e => setNewSiteName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs outline-none font-bold text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Plan ID (e.g. SP101)</label>
                        <input
                          type="text"
                          required
                          value={newSiteId}
                          onChange={e => setNewSiteId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs outline-none font-bold text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Lots Count</label>
                        <input
                          type="number"
                          required
                          value={newSiteLots}
                          onChange={e => setNewSiteLots(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs outline-none font-bold text-gray-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none font-semibold text-gray-900"
              />
              {authMode === 'signin' && (
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Simulate Web Admin by logging in with <span className="font-bold text-gray-600">admin@smartlot.com</span>
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none font-semibold text-gray-900"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#121316] hover:bg-black text-white rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] cursor-pointer mt-4"
            >
              <span>{authMode === 'signin' ? `Log In as ${selectedRole}` : `Create ${selectedRole} Account`}</span>
              <ArrowRight size={18} className="text-[#D8F235]" />
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full text-gray-500 hover:text-black hover:bg-gray-100 border border-gray-200 shadow-sm py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-3"
            >
              ← Back to Home Page
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

function RoleOption({ title, desc, selected, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
        selected ? 'border-[#121316] bg-[#121316]/5 ring-1 ring-[#121316] font-bold text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
    >
      <div className="text-xs font-bold">{title}</div>
      <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{desc}</div>
    </button>
  );
}
