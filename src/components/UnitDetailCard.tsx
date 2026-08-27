import React, { useState } from 'react';
import { Home, Phone, Mail, FileText, Settings, User, Building, Users, Key, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react';
interface UnitDetailCardProps {
  store: any;
}

export function UnitDetailCard({ store }: UnitDetailCardProps) {
  const activeScheme = store.activeScheme;
  const activeUnits = store.units.filter((u: any) => u.schemeId === activeScheme.id);

  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);

  if (activeUnits.length === 0 || activeScheme.id === 'NO_SCHEME') {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center space-y-4 min-h-[350px]">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center">
          <Home size={32} />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">No Strata Units Registered</h3>
          <p className="text-xs text-gray-400 max-w-xs mt-1">
            Register your strata building scheme to populate and view unit matrix entries.
          </p>
        </div>
      </div>
    );
  }

  const currentUnit = activeUnits[selectedUnitIndex] || activeUnits[0];
  const unitMembers = store.members.filter(m => m.schemeId === activeScheme.id && m.unitId === currentUnit.unitId);

  return (
    <div className="bg-white rounded-3xl p-1 overflow-hidden shadow-sm border border-gray-100">
      
      {/* Unit Selector Tabs */}
      {activeUnits.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-gray-100 mb-2 px-4 pt-4">
          {activeUnits.map((u, index) => (
            <button
              key={u.unitId}
              onClick={() => setSelectedUnitIndex(index)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                selectedUnitIndex === index 
                  ? 'bg-[#121316] text-[#D8F235]' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {u.unitId}
            </button>
          ))}
        </div>
      )}

      {/* Header Profile Area */}
      <div className="bg-[#121316] rounded-[22px] p-6 text-white relative m-3">
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${unitMembers.length > 0 ? 'bg-[#6EE7B7] animate-pulse' : 'bg-gray-400'}`}></div>
          {unitMembers.length > 0 ? 'Occupied' : 'Vacant'}
        </div>
        
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B8CF8] to-[#6366F1] flex items-center justify-center shadow-lg">
            <Home size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{currentUnit.unitId}</h2>
            <div className="flex items-center gap-3 text-gray-400 text-sm mt-1">
              <span>Lot {currentUnit.lotNumber}</span>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span>Entitlement: {currentUnit.entitlement}</span>
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

      {/* Actors & Access Matrix */}
      <div className="p-5 space-y-4">
        
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Access Matrix</h3>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Live Sync</span>
        </div>

        {unitMembers.length > 0 ? (
          unitMembers.map(member => (
            <ActorSection 
              key={member.id}
              icon={<User size={18} />}
              role={member.role}
              name={member.name}
              email={member.email}
              color={
                member.role === 'Strata Admin' || member.role === 'Strata Manager'
                  ? 'bg-purple-50 text-purple-600 border-purple-100'
                  : member.role === 'Lot Owner'
                  ? 'bg-blue-50 text-blue-600 border-blue-100'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }
              verified={member.status === 'Active'}
              permissions={[
                { label: 'Noticeboard Access', active: true },
                { label: 'Maintenance Logging', active: member.role !== 'Tenant' },
                { label: 'Voting Rights (Ballots)', active: member.role === 'Lot Owner' || member.role === 'Strata Admin' },
              ]}
            />
          ))
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-xs text-gray-400 font-medium">No occupants linked to this unit lot.</span>
          </div>
        )}
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
