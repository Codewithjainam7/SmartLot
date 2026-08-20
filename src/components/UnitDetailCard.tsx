import React, { useState } from 'react';
import { Home, Phone, Mail, FileText, Settings, User, Building, Users, Key, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react';

export function UnitDetailCard() {
  return (
    <div className="bg-white rounded-3xl p-1 overflow-hidden shadow-sm border border-gray-100">
      {/* Header Profile Area */}
      <div className="bg-[#121316] rounded-[22px] p-6 text-white relative">
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#6EE7B7] animate-pulse"></div>
          Occupied
        </div>
        
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B8CF8] to-[#6366F1] flex items-center justify-center shadow-lg">
            <Home size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Unit 10</h2>
            <div className="flex items-center gap-3 text-gray-400 text-sm mt-1">
              <span>Lot 10</span>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span>Entitlement: 12.5%</span>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span className="text-[#D8F235] font-medium">Clear Account</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <QuickAction icon={<Phone size={16} />} label="Call" />
          <QuickAction icon={<Mail size={16} />} label="Message" />
          <QuickAction icon={<FileText size={16} />} label="Bylaws" />
          <QuickAction icon={<Settings size={16} />} label="Settings" />
        </div>
      </div>

      {/* Actors & RBAC Matrix */}
      <div className="p-5 space-y-4">
        
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Access Matrix</h3>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Live Sync</span>
        </div>

        {/* Actor 1: Owner */}
        <ActorSection 
          icon={<User size={18} />}
          role="Off-Site Lot Owner"
          name="Mike Davies"
          email="mike@owner.com"
          color="bg-blue-50 text-blue-600 border-blue-100"
          permissions={[
            { label: 'Levies & Financials', active: true },
            { label: 'Voting Rights (Ballots)', active: true },
            { label: 'Maintenance Requests', active: false },
          ]}
        />

        {/* Actor 2: Residents */}
        <ActorSection 
          icon={<Users size={18} />}
          role="On-Site Residents (Tenants)"
          name="Lisa Ray & John Smith"
          email="lisa@unit10.com"
          color="bg-emerald-50 text-emerald-600 border-emerald-100"
          verified
          permissions={[
            { label: 'Noticeboard Access', active: true },
            { label: 'Maintenance Logging', active: true },
            { label: 'Voting Rights', active: false, locked: true },
          ]}
        />

        {/* Actor 3: Property Manager */}
        <ActorSection 
          icon={<Building size={18} />}
          role="Managing Agent"
          name="Sarah Palmer"
          email="sarah.p@raywhite.com.au"
          agency="RayWhite Prestige"
          color="bg-purple-50 text-purple-600 border-purple-100"
          permissions={[
            { label: 'Lease Term Updates', active: true },
            { label: 'Authorized Entry (Keys)', active: true },
          ]}
        />
      </div>
    </div>
  );
}

function QuickAction({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex flex-col items-center gap-1.5 group">
      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-[#D8F235] group-hover:text-[#121316] transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-medium text-gray-400 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}

function ActorSection({ icon, role, name, email, agency, color, permissions, verified }: any) {
  return (
    <div className="border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors bg-gray-50/30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${color}`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{role}</span>
              {verified && <CheckCircle2 size={12} className="text-[#059669]" />}
            </div>
            <div className="font-bold text-gray-900 mt-0.5">{name}</div>
            <div className="text-xs text-gray-500">{email} {agency && `• ${agency}`}</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2 mt-2 pt-3 border-t border-gray-100">
        {permissions.map((perm: any, idx: number) => (
          <PermissionToggle key={idx} label={perm.label} initialActive={perm.active} locked={perm.locked} />
        ))}
      </div>
    </div>
  );
}

function PermissionToggle({ label, initialActive, locked }: { key?: React.Key, label: string, initialActive: boolean, locked?: boolean }) {
  const [active, setActive] = useState(initialActive);
  
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2">
        <Key size={12} className={active ? 'text-[#8B8CF8]' : 'text-gray-400'} />
        <span className={`text-xs font-medium ${active ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
      </div>
      <button 
        onClick={() => !locked && setActive(!active)}
        className={`transition-colors ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${active ? 'text-[#8B8CF8]' : 'text-gray-300'}`}
        disabled={locked}
      >
        {active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
      </button>
    </div>
  );
}
