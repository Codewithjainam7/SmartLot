import React, { useState } from 'react';
import { Building, User, Users, ShieldCheck, ArrowRight, Key, Mail, Lock } from 'lucide-react';

interface ResidentLoginViewProps {
  onLoginSuccess: (role: 'Lot Owner' | 'Resident' | 'Tenant', name: string) => void;
}

export function ResidentLoginView({ onLoginSuccess }: ResidentLoginViewProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<'Lot Owner' | 'Resident' | 'Tenant'>('Resident');
  const [email, setEmail] = useState('lisa@unit10.com');
  const [password, setPassword] = useState('••••••••');
  const [fullName, setFullName] = useState('Lisa Ray');
  const [unitNo, setUnitNo] = useState('Unit 10');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess(selectedRole, authMode === 'signup' ? fullName : (selectedRole === 'Lot Owner' ? 'Mike Davies' : selectedRole === 'Tenant' ? 'John Smith' : 'Lisa Ray'));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F4F6F9] p-4 font-sans">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[580px] border border-gray-100">
        
        {/* Left Visual Branding Panel */}
        <div className="w-full md:w-5/12 bg-[#121316] p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#D8F235] text-[#121316] flex items-center justify-center font-extrabold text-xl">
              SL
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#D8F235]">SmartLot Strata OS</span>
              <h1 className="text-3xl font-bold tracking-tight mt-1">Resident Portal</h1>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Log service requests, track maintenance status, view bylaws, and cast community votes seamlessly.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-3 pt-8 border-t border-white/10 text-xs text-gray-400">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ShieldCheck size={16} className="text-[#D8F235]" /> Instant Verification & Scheme Isolation
            </div>
            <div>Scoped to Strata Plan Number <span className="text-white font-bold">SP10482</span></div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 p-10 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {authMode === 'signin' ? 'Resident Sign In' : 'Create Resident Account'}
            </h2>

            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`px-3 py-1.5 rounded-lg transition-all ${authMode === 'signin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`px-3 py-1.5 rounded-lg transition-all ${authMode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
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
                <RoleOption title="Lot Owner" desc="Property Owner" selected={selectedRole === 'Lot Owner'} onClick={() => setSelectedRole('Lot Owner')} />
                <RoleOption title="Resident" desc="Owner-Occupier" selected={selectedRole === 'Resident'} onClick={() => setSelectedRole('Resident')} />
                <RoleOption title="Tenant" desc="Renter (No Voting)" selected={selectedRole === 'Tenant'} onClick={() => setSelectedRole('Tenant')} />
              </div>
            </div>

            {authMode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Unit Number</label>
                  <input
                    type="text"
                    required
                    value={unitNo}
                    onChange={e => setUnitNo(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none font-semibold"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#121316] hover:bg-black text-white rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] cursor-pointer mt-4"
            >
              <span>{authMode === 'signin' ? `Logs In as ${selectedRole}` : `Create ${selectedRole} Account`}</span>
              <ArrowRight size={18} className="text-[#D8F235]" />
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
        selected ? 'border-[#8B8CF8] bg-[#8B8CF8]/10 ring-1 ring-[#8B8CF8] font-bold text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
    >
      <div className="text-xs font-bold">{title}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{desc}</div>
    </button>
  );
}
