import React, { useState } from 'react';
import { Building, Users, ShieldAlert, ArrowRight, X, Link as LinkIcon, Check } from 'lucide-react';

export function OnboardingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#121316]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Panel */}
        <div className="w-full md:w-1/3 bg-[#F2F4F8] p-8 flex flex-col">
          <div className="w-12 h-12 rounded-2xl bg-[#D8F235] flex items-center justify-center text-[#121316] mb-6">
            <Building size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">New Scheme</h2>
          <p className="text-sm text-gray-500 mb-8">Select your provisioning pathway to set up a new building.</p>

          <div className="space-y-3 mt-auto">
            <PathwayTab 
              icon={<Users size={18} />} 
              title="Self-Serve" 
              desc="Committee & Owners" 
              active={activeTab === 1} 
              onClick={() => { setActiveTab(1); setIsSuccess(false); }} 
            />
            <PathwayTab 
              icon={<Building size={18} />} 
              title="Agency Provision" 
              desc="Strata Managers" 
              active={activeTab === 2} 
              onClick={() => { setActiveTab(2); setIsSuccess(false); }} 
            />
            <PathwayTab 
              icon={<ShieldAlert size={18} />} 
              title="Super Admin" 
              desc="Platform Direct" 
              active={activeTab === 3} 
              onClick={() => { setActiveTab(3); setIsSuccess(false); }} 
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-10 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>

          {!isSuccess ? (
            <div className="h-full flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-300">
              {activeTab === 1 && (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B8CF8]/10 text-[#6366F1] text-xs font-bold uppercase tracking-wider mb-6 w-fit">
                    Free Community Setup
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">Register Your Strata</h3>
                  
                  <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Strata Plan Number" placeholder="e.g. SP 12345" />
                      <Input label="Total Lots" type="number" placeholder="e.g. 12" />
                    </div>
                    <Input label="Building Address" placeholder="123 Example Street, Sydney NSW 2000" />
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100 mt-4">
                      <div className="text-blue-500"><Users size={24} /></div>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">You will be set as Building Admin</p>
                        <p className="text-xs text-blue-700 mt-0.5">You can transfer this role later if a Strata Manager is hired.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 2 && (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121316]/5 text-[#121316] text-xs font-bold uppercase tracking-wider mb-6 w-fit">
                    Professional Agency
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">Portfolio Addition</h3>
                  
                  <div className="space-y-4 mb-8">
                    <Input label="Strata Plan Number" placeholder="e.g. SP 98765" />
                    <Input label="Agency License ID" placeholder="LIC-XXXX-YYYY" />
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Upload Unit Roster (CSV)</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer">
                        <FileTextIcon />
                        <p className="text-sm font-medium mt-2 text-gray-600">Drag & Drop roster file</p>
                        <p className="text-xs">or click to browse</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 3 && (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B6B]/10 text-[#EF4444] text-xs font-bold uppercase tracking-wider mb-6 w-fit">
                    System Override
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">Direct Provisioning</h3>
                  
                  <div className="space-y-4 mb-8">
                    <Input label="Strata Plan Number" placeholder="Target Scheme ID" />
                    <Input label="Target Owner Email" placeholder="admin@building.com" />
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 mt-4">
                      <p className="text-sm font-semibold text-red-900">Immediate Ownership Transfer</p>
                      <p className="text-xs text-red-700 mt-0.5">This bypasses standard verification checks. Ensure the target email is correct.</p>
                    </div>
                  </div>
                </>
              )}

              <button 
                onClick={() => setIsSuccess(true)}
                className="w-full bg-[#121316] hover:bg-black text-white rounded-2xl py-4 font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
              >
                Provision Scheme <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-[#D8F235] rounded-full flex items-center justify-center text-[#121316] mb-6 shadow-[0_0_40px_rgba(216,242,53,0.3)]">
                <Check size={40} strokeWidth={3} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Scheme Provisioned</h3>
              <p className="text-gray-500 mb-8 max-w-sm">
                The building has been successfully configured. You can now invite residents to join.
              </p>

              <div className="w-full max-w-sm bg-[#F2F4F8] p-4 rounded-2xl flex items-center justify-between border border-gray-200 mb-8">
                <div className="truncate text-sm font-medium text-gray-700">smartlot.io/join/SP12345</div>
                <button className="flex items-center gap-2 text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700 transition-colors">
                  <LinkIcon size={14} /> Copy
                </button>
              </div>

              <button 
                onClick={onClose}
                className="w-full max-w-sm bg-[#121316] hover:bg-black text-white rounded-2xl py-4 font-semibold text-sm transition-all"
              >
                Enter Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PathwayTab({ icon, title, desc, active, onClick }: { icon: React.ReactNode, title: string, desc: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${
        active 
          ? 'bg-white shadow-sm border border-gray-200 ring-1 ring-gray-900/5' 
          : 'hover:bg-gray-200/50 text-gray-500'
      }`}
    >
      <div className={`${active ? 'text-[#8B8CF8]' : 'text-gray-400'}`}>
        {icon}
      </div>
      <div>
        <div className={`font-semibold text-sm ${active ? 'text-gray-900' : ''}`}>{title}</div>
        <div className="text-xs mt-0.5">{desc}</div>
      </div>
    </button>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-2 ml-1">{label}</label>
      <input 
        className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#8B8CF8]/20 focus:border-[#8B8CF8] transition-all outline-none text-sm placeholder-gray-400"
        {...props}
      />
    </div>
  );
}

function FileTextIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <line x1="10" y1="9" x2="8" y2="9"></line>
    </svg>
  );
}
