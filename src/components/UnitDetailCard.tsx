// @smartlot/component
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Home, 
  Phone, 
  Mail, 
  FileText, 
  Settings, 
  User, 
  Building, 
  Users, 
  Key, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle2, 
  Plus, 
  Trash2,
  X,
  ArrowRight
} from 'lucide-react';

import { getDefaultPermissionsForRole } from '../store/smartLotStore';

interface UnitDetailCardProps {
  store: any;
}

export function UnitDetailCard({ store }: UnitDetailCardProps) {
  const activeScheme = store.activeScheme;
  const activeUnits = store.units.filter((u: any) => u.schemeId === activeScheme.id);

  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);

  // Edit Lot Modal states
  const [showEditLotModal, setShowEditLotModal] = useState(false);
  const [editEntitlement, setEditEntitlement] = useState('50%');
  const [editStatus, setEditStatus] = useState<'Occupied' | 'Vacant'>('Vacant');

  // Add Occupant Modal states
  const [showAddOccupantModal, setShowAddOccupantModal] = useState(false);
  const [newActorName, setNewActorName] = useState('');
  const [newActorEmail, setNewActorEmail] = useState('');
  const [newActorPhone, setNewActorPhone] = useState('');
  const [newActorRole, setNewActorRole] = useState<'Lot Owner' | 'On-Site Resident' | 'Tenant'>('On-Site Resident');

  if (activeUnits.length === 0 || activeScheme.id === 'NO_SCHEME') {
    return (
      <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center space-y-4 min-h-[350px]">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 flex items-center justify-center">
          <Home size={32} />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No Strata Units Registered</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mt-1">
            Register your strata building scheme to populate and view unit matrix entries.
          </p>
        </div>
      </div>
    );
  }

  const currentUnit = activeUnits[selectedUnitIndex] || activeUnits[0];
  const rawUnitMembers = store.members.filter((m: any) => 
    m.schemeId === activeScheme.id && 
    currentUnit && m.unitId === currentUnit.unitId &&
    !['Strata Manager', 'Strata Admin', 'Building Manager'].includes(m.role)
  );
  // Deduplicate by email â€” if same person appears with multiple roles, keep only one entry
  const seenEmails = new Set<string>();
  const unitMembers = rawUnitMembers.filter((m: any) => {
    const key = (m.email || m.name || '').toLowerCase();
    if (seenEmails.has(key)) return false;
    seenEmails.add(key);
    return true;
  });

  // Permissions gate — Strata Managers / Admins ALWAYS have management access
  const isManagerOrAdmin = (store.activeRoles || []).some((r: string) => ['Strata Manager', 'Strata Admin', 'Strata Plan Admin', 'Building Manager', 'Super Admin'].includes(r)) || 
    ['Strata Manager', 'Strata Admin', 'Super Admin'].includes(store.activePersona?.role) || 
    store.activePersona?.isSystemAdmin;

  const canManage = isManagerOrAdmin || store.hasPermission('Role & Permission Setup') || store.hasPermission('Review & Edit Request Fields');

  const handleEditLotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (store.updateUnitMetadata) {
      store.updateUnitMetadata(activeScheme.id, currentUnit.unitId, editEntitlement, editStatus);
    }
    setShowEditLotModal(false);
  };

  const handleAddOccupantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (store.onboardActor) {
      store.onboardActor(
        activeScheme.id, 
        currentUnit.unitId, 
        newActorName,
        newActorEmail,
        newActorRole,
        newActorPhone
      );
    } else if (store.addResidentToUnit) {
      // Fallback for older method if onboardActor doesn't exist
      store.addResidentToUnit(
        activeScheme.id, 
        currentUnit.unitId, 
        newActorName,
        newActorEmail,
        newActorRole,
        newActorPhone
      );
    }

    // Reset fields
    setNewActorName('');
    setNewActorEmail('');
    setNewActorPhone('');
    setNewActorRole('On-Site Resident');
    setShowAddOccupantModal(false);
  };

  const handleOffboard = (actorName: string, email: string) => {
    const confirmed = window.confirm(`Are you sure you want to offboard ${actorName}?`);
    if (!confirmed) return;

    // Find in current unit actors
    const matchedActor = currentUnit.actors?.find((a: any) => a.name === actorName || a.email === email);
    if (matchedActor && store.offboardActor) {
      store.offboardActor(activeScheme.id, currentUnit.unitId, matchedActor.id);
    } else {
      // Fallback: directly remove from members store
      store.setMembers((prev: any[]) => prev.filter(m => !(m.name === actorName && m.schemeId === activeScheme.id)));
    }
  };

  return (
    <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-1 overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
      
      {/* Unit Selector Tabs */}
      {activeUnits.length > 1 && (
        <div className="flex flex-col gap-1.5 px-4 pt-4 mb-2">
          <label className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Select Lot / Unit</label>
          <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-gray-100 dark:border-white/5">
            {activeUnits.map((u: any, index: number) => (
              <button
                key={u.unitId}
                onClick={() => setSelectedUnitIndex(index)}
                className={`relative px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors border ${
                  selectedUnitIndex === index 
                    ? 'bg-[#0B1121] dark:bg-[#00D4B2]/10 text-[#00D4B2] border-[#00D4B2]/30 shadow-sm' 
                    : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 border-transparent dark:border-white/5'
                }`}
              >
                {u.unitId}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header Profile Area */}
      <div className="bg-[#0B1121] dark:bg-gradient-to-br dark:from-[#0d1117] dark:to-[#161b22] rounded-[22px] p-6 text-white relative m-3 border border-transparent dark:border-[#00D4B2]/10 overflow-hidden">
        {/* Subtle glow in dark mode */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D4B2]/0 via-transparent to-[#0055FF]/0 dark:from-[#00D4B2]/5 dark:via-transparent dark:to-[#0055FF]/5 pointer-events-none rounded-[22px]" />
        
        <div className="absolute top-4 right-4 bg-white/10 dark:bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-transparent dark:border-white/5 z-10">
          <div className={`w-1.5 h-1.5 rounded-full ${unitMembers.length > 0 ? 'bg-[#6EE7B7] animate-pulse' : 'bg-gray-400'}`}></div>
          {unitMembers.length > 0 ? 'Occupied' : 'Vacant'}
        </div>
        
        <div className="flex items-start gap-4 mb-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#0F172A] dark:bg-[#1a1d27] flex items-center justify-center shadow-lg border dark:border-white/5">
            <Home size={32} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight">{currentUnit.unitId}</h2>
              {canManage && (
                <button
                  type="button"
                  onClick={() => {
                    setEditEntitlement(currentUnit.entitlement);
                    setEditStatus(currentUnit.status);
                    setShowEditLotModal(true);
                  }}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer border border-transparent dark:border-white/5"
                  title="Edit Lot Metadata"
                >
                  <Settings size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 text-gray-450 dark:text-gray-400 text-sm mt-1">
              <span>Lot {currentUnit.lotNumber}</span>
              <span className="w-1 h-1 rounded-full bg-gray-600 dark:bg-gray-500"></span>
              <span>Entitlement: {currentUnit.entitlement}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 relative z-10">
          <QuickAction icon={<Phone size={16} />} label="Call" />
          <QuickAction icon={<Mail size={16} />} label="Message" />
          <QuickAction icon={<FileText size={16} />} label="Documents" />
        </div>
      </div>

      {/* Actors & Access Matrix */}
      <div className="p-5 space-y-4">
        
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white dark:text-white uppercase tracking-wider">Access Matrix</h3>
          {canManage && (
            <button
              onClick={() => {
                setNewActorName('');
                setNewActorEmail('');
                setNewActorPhone('');
                setNewActorRole('On-Site Resident');
                setShowAddOccupantModal(true);
              }}
              className="text-xs font-bold bg-[#0B1121] dark:bg-white dark:text-[#0b1121] hover:bg-black dark:hover:bg-gray-100 text-[#00D4B2] px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus size={14} /> Add Occupant
            </button>
          )}
        </div>

        {unitMembers.length > 0 ? (
          unitMembers.map((member: any) => (
            <ActorSection 
              key={member.id}
              icon={<User size={18} />}
              role={member.role}
              name={member.name}
              email={member.email}
              phone={member.phone}
              color={
                member.role === 'Strata Admin' || member.role === 'Strata Manager'
                  ? 'bg-[#0055FF]/10 text-[#0055FF] border-[#0055FF]/20'
                  : member.role === 'Lot Owner'
                  ? 'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/20'
                  : 'bg-[#00D4B2]/10 text-[#00A38C] border-[#00D4B2]/20'
              }
              verified={member.status === 'Active'}
              canManage={canManage}
              isSelf={member.name === store.activePersona.name}
              onOffboard={() => handleOffboard(member.name, member.email)}
              permissions={(store.rolePermissions[activeScheme.id]?.[member.role] || getDefaultPermissionsForRole(member.role))
                .filter((p: any) => ['Submit Request', 'Cast Vote', 'Add Comment on request', 'View Final Vote Result'].includes(p.label))
                .map((p: any) => {
                  const override = member.individualPermissions?.find((op: any) => op.label === p.label);
                  return {
                    label: p.label,
                    locked: p.locked,
                    active: override ? override.active : p.active
                  };
                })
              }
              onTogglePermission={(label: string) => {
                if (store.toggleIndividualPermission) {
                  store.toggleIndividualPermission(member.id, label);
                }
              }}
            />
          ))
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">No occupants linked to this unit lot.</span>
          </div>
        )}
      </div>

      {/* MODAL 1: Edit Lot Details */}
      <AnimatePresence>
        {showEditLotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0B1121]/75 backdrop-blur-md"
              onClick={() => setShowEditLotModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-[#0B1121] text-white w-full max-w-md rounded-[32px] p-8 border border-white/10 shadow-2xl relative z-10 space-y-6 overflow-hidden"
            >
              <button 
                type="button"
                onClick={() => setShowEditLotModal(false)}
                className="absolute top-6 right-6 text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/5 z-50"
              >
                <X size={16} />
              </button>

              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-[#00D4B2] tracking-widest uppercase bg-[#00D4B2]/10 px-2.5 py-0.5 rounded-full border border-[#00D4B2]/25 inline-block">
                  Metadata Editor
                </span>
                <h3 className="text-xl font-bold text-white mt-1">Edit {currentUnit.unitId} Details</h3>
              </div>

              <form onSubmit={handleEditLotSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Strata Entitlement %</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 50%"
                    value={editEntitlement}
                    onChange={e => setEditEntitlement(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white text-sm outline-none font-bold placeholder:text-gray-600 dark:text-gray-300 focus:border-[#00D4B2] focus:bg-white/10 focus:ring-2 focus:ring-[#00D4B2]/25 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Occupancy Status</label>
                  <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 text-center">
                    {(['Occupied', 'Vacant'] as const).map(status => {
                      const isActive = editStatus === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setEditStatus(status)}
                          className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive ? 'bg-[#00D4B2] text-[#0B1121] shadow' : 'text-gray-400 dark:text-gray-500 hover:text-white'
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#00D4B2] hover:bg-[#00A38C] text-[#0B1121] py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg mt-2"
                >
                  <span>Save Changes</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Add Occupant */}
      <AnimatePresence>
        {showAddOccupantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0B1121]/75 backdrop-blur-md"
              onClick={() => setShowAddOccupantModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-[#0B1121] text-white w-full max-w-md rounded-[32px] p-8 border border-white/10 shadow-2xl relative z-10 space-y-5 overflow-hidden"
            >
              <button 
                type="button"
                onClick={() => setShowAddOccupantModal(false)}
                className="absolute top-6 right-6 text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/5 z-50"
              >
                <X size={16} />
              </button>

              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-[#00D4B2] tracking-widest uppercase bg-[#00D4B2]/10 px-2.5 py-0.5 rounded-full border border-[#00D4B2]/25 inline-block">
                  Roster Enroller
                </span>
                <h3 className="text-xl font-bold text-white mt-1">Register Occupant: {currentUnit.unitId}</h3>
              </div>

              <form onSubmit={handleAddOccupantSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newActorName}
                    onChange={e => setNewActorName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white text-xs outline-none font-bold placeholder:text-gray-600 dark:text-gray-300 focus:border-[#00D4B2] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={newActorEmail}
                    onChange={e => setNewActorEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white text-xs outline-none font-bold placeholder:text-gray-600 dark:text-gray-300 focus:border-[#00D4B2] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
                  <input 
                    type="text"
                    placeholder="e.g. 0400 123 456"
                    value={newActorPhone}
                    onChange={e => setNewActorPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white text-xs outline-none font-bold placeholder:text-gray-600 dark:text-gray-300 focus:border-[#00D4B2] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Classification / Relationship</label>
                  <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/5 text-center">
                    {(['Lot Owner', 'On-Site Resident', 'Tenant'] as const).map(role => {
                      const isActive = newActorRole === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setNewActorRole(role)}
                          className={`py-1.5 rounded-xl text-[9px] font-bold uppercase transition-all cursor-pointer ${
                            isActive ? 'bg-[#00D4B2] text-[#0B1121] shadow' : 'text-gray-400 dark:text-gray-500 hover:text-white'
                          }`}
                        >
                          {role.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Property Agent classification removed */}

                <button
                  type="submit"
                  className="w-full bg-[#00D4B2] hover:bg-[#00A38C] text-[#0B1121] py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg mt-2"
                >
                  <span>Register on Site Roster</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function QuickAction({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="flex flex-col items-center gap-1.5 group cursor-pointer">
      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-[#00D4B2] group-hover:text-[#0B1121] transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}

function ActorSection({ icon, role, name, email, phone, agency, color, permissions, verified, canManage, onOffboard, isSelf, onTogglePermission }: any) {
  return (
    <div className="border border-gray-100 dark:border-white/5 rounded-2xl p-4 hover:border-gray-200 dark:hover:border-gray-700 transition-colors bg-gray-50/30 dark:bg-white/[0.02]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${color}`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">{role}</span>
              {verified && <CheckCircle2 size={12} className="text-[#059669]" />}
            </div>
            <div className="font-bold text-gray-900 dark:text-white dark:text-white mt-0.5">{name} {isSelf && <span className="ml-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 dark:text-gray-300">You</span>}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">{email} {phone && `• ${phone}`} {agency && `• Agency: ${agency}`}</div>
          </div>
        </div>

        {canManage && !isSelf && (
          <button
            onClick={onOffboard}
            className="p-2 rounded-xl border border-[#FF4757]/20 text-[#FF4757] hover:text-white hover:bg-[#FF4757] hover:border-red-500 transition-all cursor-pointer"
            title="Offboard Occupant"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      
      <div className="space-y-2 mt-2 pt-3 border-t border-gray-100 dark:border-white/5">
        {permissions.map((perm: any, idx: number) => (
          <PermissionToggle 
            key={idx} 
            label={perm.label} 
            active={perm.active} 
            locked={perm.locked} 
            onToggle={() => {
              if (onTogglePermission) onTogglePermission(perm.label);
            }} 
          />
        ))}
      </div>
    </div>
  );
}

function PermissionToggle({ label, active, locked, onToggle }: { key?: React.Key, label: string, active: boolean, locked?: boolean, onToggle?: () => void }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2">
        <Key size={12} className={active ? 'text-[#0055FF] dark:text-[#00D4B2]' : 'text-gray-400 dark:text-gray-500'} />
        <span className={`text-xs font-medium ${active ? 'text-gray-900 dark:text-white dark:text-white' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>{label}</span>
      </div>
      <button 
        onClick={() => !locked && onToggle && onToggle()}
        className={`transition-colors ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${active ? 'text-[#0055FF] dark:text-[#00D4B2]' : 'text-gray-300 dark:text-gray-600 dark:text-gray-300'}`}
        disabled={locked}
      >
        {active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
      </button>
    </div>
  );
}

// Subcomponent: Unit Details & Occupant Roster
// Animation: Resident Roster Accordion Expand