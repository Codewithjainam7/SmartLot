import React, { useState } from 'react';
import { UnitData } from '../store/smartLotStore';
import { AnimatedBackground } from './core/animated-background';
import { 
  User, 
  Users, 
  Building2, 
  Plus, 
  UserX, 
  CheckCircle2, 
  Key, 
  X
} from 'lucide-react';

interface UnitsViewProps {
  units: UnitData[];
  onAddResident: (unitId: string, name: string, email: string) => void;
  onOffboardActor: (unitId: string, actorId: string) => void;
}

export function UnitsView({ units, onAddResident, onOffboardActor }: UnitsViewProps) {
  const [selectedUnit, setSelectedUnit] = useState<UnitData>(units[0] || null);
  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false);
  const [newResidentName, setNewResidentName] = useState('');
  const [newResidentEmail, setNewResidentEmail] = useState('');

  const currentUnit = units.find(u => u.unitId === selectedUnit?.unitId) || units[0];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResidentName || !newResidentEmail) return;
    onAddResident(currentUnit.unitId, newResidentName, newResidentEmail);
    setNewResidentName('');
    setNewResidentEmail('');
    setIsAddResidentOpen(false);
  };

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-full bg-[#F4F6F9] dark:bg-[#0a0a0f]">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1121]/5 text-[#0B1121] text-xs font-bold uppercase tracking-wider mb-2">
            Multi-Actor Identity Architecture
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Units & Occupant Directory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Each physical lot supports 3 distinct mapped actors with independent login credentials.</p>
        </div>

        <button
          onClick={() => setIsAddResidentOpen(true)}
          className="bg-[#0B1121] dark:bg-[#00D4B2]/10 dark:border dark:border-[#00D4B2]/20 hover:bg-black dark:hover:bg-[#00D4B2]/20 text-white dark:text-[#00D4B2] px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-105 cursor-pointer"
        >
          <Plus size={18} className="text-[#00D4B2]" /> Add Resident Login
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Unit Selection Grid */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0d1117] rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">All Physical Lots</h3>
          
          <div className="space-y-2">
            <AnimatedBackground enableHover className="rounded-2xl bg-gray-200/60">
              {units.map(u => (
                <button
                  key={u.unitId}
                  data-id={`unit-${u.unitId}`}
                  onClick={() => setSelectedUnit(u)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer ${
                    currentUnit.unitId === u.unitId ? 'bg-[#0B1121] dark:bg-white/10 text-white dark:text-[#00D4B2] border-black dark:border-[#00D4B2]/30 shadow-md font-bold' : 'text-gray-900 dark:text-white dark:text-white font-semibold hover:text-black dark:hover:text-[#00D4B2]'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-base font-bold">{u.unitId} (Lot {u.lotNumber})</div>
                    <div className={`text-xs mt-0.5 ${currentUnit.unitId === u.unitId ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>
                      Entitlement: {u.entitlement} • {u.actors.length} Mapped Actors
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    currentUnit.unitId === u.unitId ? 'bg-[#00D4B2] text-[#0B1121]' : 'bg-emerald-100 dark:bg-emerald-950/20 text-[#10B981]'
                  }`}>
                    {u.status}
                  </span>
                </button>
              ))}
            </AnimatedBackground>
          </div>
        </div>

        {/* Right Column: Detailed Actor Cards for Selected Unit */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0d1117] rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 dark:border-white/5 pb-4">
            <div>
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Active Unit Profile</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentUnit.unitId} • Lot {currentUnit.lotNumber}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddResidentOpen(true)}
                className="bg-[#00D4B2]/10 hover:bg-emerald-100 text-[#10B981] border border-[#00D4B2]/30 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} /> Add Occupant
              </button>
            </div>
          </div>

          {/* Mapped Actors List */}
          <div className="space-y-4">
            {currentUnit.actors.map(actor => (
              <div key={actor.id} className="p-6 rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-[#1a1d27]/50 dark:bg-white/[0.02] space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                      actor.role === 'Lot Owner' ? 'bg-[#0055FF]/10 text-[#0033CC] border-blue-200' :
                      actor.role === 'On-Site Resident' ? 'bg-[#00D4B2]/10 text-[#10B981] border-[#00D4B2]/30' :
                      'bg-purple-50 text-purple-600 border-purple-200'
                    }`}>
                      {actor.role === 'Lot Owner' && <User size={24} />}
                      {actor.role === 'On-Site Resident' && <Users size={24} />}
                      {actor.role === 'Property Agent' && <Building2 size={24} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{actor.role}</span>
                        {actor.verified && <CheckCircle2 size={14} className="text-[#10B981]" />}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">{actor.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{actor.email} {actor.agency && `• ${actor.agency}`}</p>
                    </div>
                  </div>

                  {actor.role === 'On-Site Resident' && (
                    <button
                      onClick={() => onOffboardActor(currentUnit.unitId, actor.id)}
                      className="bg-[#FF4757]/10 hover:bg-[#FF4757]/20 text-[#FF6B6B] border border-[#FF4757]/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Revoke active JWT tokens & offboard tenant while preserving historical logs"
                    >
                      <UserX size={14} /> Offboard Tenant
                    </button>
                  )}
                </div>

                {/* Permissions matrix */}
                <div className="pt-3 border-t border-gray-200 dark:border-white/8 dark:border-white/8 flex flex-wrap gap-2">
                  {actor.permissions.map((perm, idx) => (
                    <span 
                      key={idx}
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                        perm.active ? 'bg-white border border-gray-200 dark:border-white/8 text-gray-800 shadow-sm' : 'bg-gray-100 dark:bg-[#1a1d27] text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      <Key size={12} className={perm.active ? 'text-[#0055FF]' : 'text-gray-400 dark:text-gray-500'} />
                      {perm.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Add Resident Modal */}
      {isAddResidentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0B1121]/40 backdrop-blur-sm" onClick={() => setIsAddResidentOpen(false)} />
          <div className="relative bg-white dark:bg-[#0d1117] w-full max-w-md border dark:border-white/5 rounded-3xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsAddResidentOpen(false)} className="absolute top-6 right-6 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Add Resident Login</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-6">Create sub-occupant login credentials mapped to {currentUnit.unitId}.</p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Resident Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Citizen"
                  value={newResidentName}
                  onChange={e => setNewResidentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-[#1a1d27] text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Resident Email</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={newResidentEmail}
                  onChange={e => setNewResidentEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-[#1a1d27] text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsAddResidentOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#0B1121] dark:bg-[#00D4B2]/10 dark:border dark:border-[#00D4B2]/20 hover:bg-black dark:hover:bg-[#00D4B2]/20 text-white dark:text-[#00D4B2] text-xs font-bold transition-all cursor-pointer">
                  Send Activation Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}



// Subcomponent: Units & Lots Grid