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
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-full bg-[#F4F6F9]">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121316]/5 text-[#121316] text-xs font-bold uppercase tracking-wider mb-2">
            Multi-Actor Identity Architecture
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Units & Occupant Directory</h1>
          <p className="text-sm text-gray-500">Each physical lot supports 3 distinct mapped actors with independent login credentials.</p>
        </div>

        <button
          onClick={() => setIsAddResidentOpen(true)}
          className="bg-[#121316] hover:bg-black text-white px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-105 cursor-pointer"
        >
          <Plus size={18} className="text-[#D8F235]" /> Add Resident Login
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Unit Selection Grid */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">All Physical Lots</h3>
          
          <div className="space-y-2">
            <AnimatedBackground enableHover className="rounded-2xl bg-gray-200/60">
              {units.map(u => (
                <button
                  key={u.unitId}
                  data-id={`unit-${u.unitId}`}
                  onClick={() => setSelectedUnit(u)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer ${
                    currentUnit.unitId === u.unitId 
                      ? 'bg-[#121316] text-white shadow-md font-bold' 
                      : 'text-gray-900 font-semibold hover:text-black'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-base font-bold">{u.unitId} (Lot {u.lotNumber})</div>
                    <div className={`text-xs mt-0.5 ${currentUnit.unitId === u.unitId ? 'text-gray-300' : 'text-gray-500'}`}>
                      Entitlement: {u.entitlement} • {u.actors.length} Mapped Actors
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    currentUnit.unitId === u.unitId ? 'bg-[#D8F235] text-[#121316]' : 'bg-emerald-100 text-[#10B981]'
                  }`}>
                    {u.status}
                  </span>
                </button>
              ))}
            </AnimatedBackground>
          </div>
        </div>

        {/* Right Column: Detailed Actor Cards for Selected Unit */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Unit Profile</span>
              <h2 className="text-2xl font-bold text-gray-900">{currentUnit.unitId} • Lot {currentUnit.lotNumber}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddResidentOpen(true)}
                className="bg-emerald-50 hover:bg-emerald-100 text-[#10B981] border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} /> Add Occupant
              </button>
            </div>
          </div>

          {/* Mapped Actors List */}
          <div className="space-y-4">
            {currentUnit.actors.map(actor => (
              <div key={actor.id} className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                      actor.role === 'Lot Owner' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                      actor.role === 'On-Site Resident' ? 'bg-emerald-50 text-[#10B981] border-emerald-200' :
                      'bg-purple-50 text-purple-600 border-purple-200'
                    }`}>
                      {actor.role === 'Lot Owner' && <User size={24} />}
                      {actor.role === 'On-Site Resident' && <Users size={24} />}
                      {actor.role === 'Property Agent' && <Building2 size={24} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">{actor.role}</span>
                        {actor.verified && <CheckCircle2 size={14} className="text-[#10B981]" />}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">{actor.name}</h4>
                      <p className="text-xs text-gray-500">{actor.email} {actor.agency && `• ${actor.agency}`}</p>
                    </div>
                  </div>

                  {actor.role === 'On-Site Resident' && (
                    <button
                      onClick={() => onOffboardActor(currentUnit.unitId, actor.id)}
                      className="bg-red-50 hover:bg-red-100 text-[#FF6B6B] border border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Revoke active JWT tokens & offboard tenant while preserving historical logs"
                    >
                      <UserX size={14} /> Offboard Tenant
                    </button>
                  )}
                </div>

                {/* Permissions matrix */}
                <div className="pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                  {actor.permissions.map((perm, idx) => (
                    <span 
                      key={idx}
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                        perm.active ? 'bg-white border border-gray-200 text-gray-800 shadow-sm' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Key size={12} className={perm.active ? 'text-[#8B8CF8]' : 'text-gray-400'} />
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
          <div className="absolute inset-0 bg-[#121316]/40 backdrop-blur-sm" onClick={() => setIsAddResidentOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsAddResidentOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Add Resident Login</h3>
            <p className="text-xs text-gray-500 mb-6">Create sub-occupant login credentials mapped to {currentUnit.unitId}.</p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Resident Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Citizen"
                  value={newResidentName}
                  onChange={e => setNewResidentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Resident Email</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={newResidentEmail}
                  onChange={e => setNewResidentEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsAddResidentOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#121316] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer">
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
