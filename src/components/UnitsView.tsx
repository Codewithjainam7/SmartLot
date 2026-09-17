// @smartlot/component
﻿import React, { useState } from 'react';
import { UnitData } from '../store/smartLotStore';
import { dispatchMemberInviteEmail } from '../services/emailService';
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
    
    // Dispatch onboarding invitation email
    dispatchMemberInviteEmail({
      toEmail: newResidentEmail.trim(),
      toName: newResidentName.trim(),
      role: 'On-Site Resident',
      schemeName: currentUnit?.schemeId || 'SmartLot Scheme',
      schemeId: currentUnit?.schemeId || 'SP101',
      lotNumber: currentUnit?.unitId || 'Unit 1',
    }).catch(err => console.warn('Unit invite email note:', err));

    onAddResident(currentUnit.unitId, newResidentName, newResidentEmail);
    setNewResidentName('');
    setNewResidentEmail('');
    setIsAddResidentOpen(false);
  };

  return (
    <div className="flex-1 p-3.5 sm:p-6 md:p-8 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8 space-y-4 sm:space-y-8 overflow-y-auto h-full bg-[#F4F6F9] dark:bg-[#0a0a0f]">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1121]/5 text-[#0B1121] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            Multi-Actor Identity Architecture
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Units & Occupant Directory</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Each physical lot supports 3 distinct mapped actors with independent login credentials.</p>
        </div>

        <button
          onClick={() => setIsAddResidentOpen(true)}
          className="bg-[#0B1121] dark:bg-[#00D4B2]/10 dark:border dark:border-[#00D4B2]/20 hover:bg-black dark:hover:bg-[#00D4B2]/20 text-white dark:text-[#00D4B2] px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer w-full sm:w-auto min-h-[44px]"
        >
          <Plus size={18} className="text-[#00D4B2]" /> Add Resident Login
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        
        {/* Left Column: Unit Selection Grid / Mobile Horizontal Swipe Strip */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">All Physical Lots</h3>
            <span className="text-[11px] text-gray-400 lg:hidden">Swipe to switch lot</span>
          </div>
          
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible no-scrollbar touch-pan-x gap-2 lg:gap-0 lg:space-y-2 pb-1 lg:pb-0">
            {units.map(u => (
              <button
                key={u.unitId}
                data-id={`unit-${u.unitId}`}
                aria-label={`Select unit ${u.unitId} (Lot ${u.lotNumber})`}
                onClick={() => setSelectedUnit(u)}
                className={`flex-shrink-0 lg:w-full flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all cursor-pointer select-none active:scale-95 min-w-[200px] lg:min-w-0 ${
                  currentUnit.unitId === u.unitId ? 'bg-[#0B1121] dark:bg-white/10 text-white dark:text-[#00D4B2] border-black dark:border-[#00D4B2]/30 shadow-md font-bold' : 'bg-gray-50 dark:bg-[#1a1d27]/40 text-gray-900 dark:text-white font-semibold hover:text-black dark:hover:text-[#00D4B2]'
                }`}
              >
                <div className="text-left">
                  <div className="text-sm sm:text-base font-bold">{u.unitId} (Lot {u.lotNumber})</div>
                  <div className={`text-[11px] sm:text-xs mt-0.5 ${currentUnit.unitId === u.unitId ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                    Entitlement: {u.entitlement} • {u.actors.length} Actors
                  </div>
                </div>
                <span className={`text-[9px] sm:text-[10px] font-bold uppercase px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ml-2 ${
                  currentUnit.unitId === u.unitId ? 'bg-[#00D4B2] text-[#0B1121]' : 'bg-emerald-100 dark:bg-emerald-950/20 text-[#10B981]'
                }`}>
                  {u.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Detailed Actor Cards for Selected Unit */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-gray-100 dark:border-white/5 shadow-sm space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3 sm:pb-4 gap-2 sm:gap-0">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Active Unit Profile</span>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{currentUnit.unitId} • Lot {currentUnit.lotNumber}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddResidentOpen(true)}
                className="bg-[#00D4B2]/10 hover:bg-emerald-100 text-[#10B981] border border-[#00D4B2]/30 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px] active:scale-95"
              >
                <Plus size={14} /> Add Occupant
              </button>
            </div>
          </div>

          {/* Mapped Actors List */}
          <div className="space-y-3 sm:space-y-4">
            {currentUnit.actors.map(actor => (
              <div key={actor.id} className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-[#1a1d27]/50 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border shadow-sm shrink-0 ${
                      actor.role === 'Lot Owner' ? 'bg-[#0055FF]/10 text-[#0033CC] border-blue-200' :
                      actor.role === 'On-Site Resident' ? 'bg-[#00D4B2]/10 text-[#10B981] border-[#00D4B2]/30' :
                      'bg-purple-50 text-purple-600 border-purple-200'
                    }`}>
                      {actor.role === 'Lot Owner' && <User size={20} />}
                      {actor.role === 'On-Site Resident' && <Users size={20} />}
                      {actor.role === 'Property Agent' && <Building2 size={20} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[10px] sm:text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{actor.role}</span>
                        {actor.verified && <CheckCircle2 size={13} className="text-[#10B981]" />}
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{actor.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{actor.email} {actor.agency && `• ${actor.agency}`}</p>
                    </div>
                  </div>

                  {actor.role === 'On-Site Resident' && (
                    <button
                      onClick={() => onOffboardActor(currentUnit.unitId, actor.id)}
                      className="bg-[#FF4757]/10 hover:bg-[#FF4757]/20 text-[#FF6B6B] border border-[#FF4757]/30 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer min-h-[38px] active:scale-95 w-full sm:w-auto"
                      title="Revoke active JWT tokens & offboard tenant while preserving historical logs"
                    >
                      <UserX size={14} /> Offboard Tenant
                    </button>
                  )}
                </div>

                {/* Permissions matrix */}
                <div className="pt-2.5 sm:pt-3 border-t border-gray-200 dark:border-white/8 flex flex-wrap gap-1.5 sm:gap-2">
                  {actor.permissions.map((perm, idx) => (
                    <span 
                      key={idx}
                      className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 ${
                        perm.active ? 'bg-white dark:bg-[#121316] border border-gray-200 dark:border-white/8 text-gray-800 dark:text-gray-200 shadow-sm' : 'bg-gray-100 dark:bg-[#1a1d27] text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      <Key size={11} className={perm.active ? 'text-[#0055FF]' : 'text-gray-400 dark:text-gray-500'} />
                      {perm.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Add Resident Modal (Bottom Sheet on Mobile) */}
      {isAddResidentOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-[#0B1121]/40 backdrop-blur-sm" onClick={() => setIsAddResidentOpen(false)} />
          <div className="relative bg-white dark:bg-[#0d1117] w-full sm:max-w-md border dark:border-white/5 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsAddResidentOpen(false)} className="absolute top-5 sm:top-6 right-5 sm:right-6 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center">
              <X size={18} />
            </button>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">Add Resident Login</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 sm:mb-6">Create sub-occupant login credentials mapped to {currentUnit.unitId}.</p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Resident Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Citizen"
                  value={newResidentName}
                  onChange={e => setNewResidentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-[#1a1d27] text-sm outline-none text-gray-900 dark:text-white"
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
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-[#1a1d27] text-sm outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button type="button" onClick={() => setIsAddResidentOpen(false)} className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 cursor-pointer min-h-[44px] active:scale-95 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#0B1121] dark:bg-[#00D4B2]/10 dark:border dark:border-[#00D4B2]/20 hover:bg-black dark:hover:bg-[#00D4B2]/20 text-white dark:text-[#00D4B2] text-xs font-bold transition-all cursor-pointer min-h-[44px] active:scale-95">
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
// Animation: Floor Plan Grid Item Zoom