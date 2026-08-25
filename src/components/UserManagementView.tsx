import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Member, MemberRole, AdditionalOccupant } from '../store/smartLotStore';
import { CustomSelect, SelectOption } from './core/CustomSelect';
import { CustomCheckbox } from './core/CustomCheckbox';
import { GlowSubmitButton } from './core/GlowSubmitButton';
import { 
  MorphingPopover, 
  MorphingPopoverTrigger, 
  MorphingPopoverContent,
  useMorphingPopover
} from './core/morphing-popover';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Building2, 
  Home, 
  X, 
  Send,
  Trash2,
  CheckCircle2,
  User,
  Plus,
  UserCheck,
  UserCircle2
} from 'lucide-react';

interface UserManagementViewProps {
  members: Member[];
  onAddMember: (data: {
    name: string;
    email: string;
    phone: string;
    role: MemberRole;
    unitId: string;
    lotNumber: number;
    hasCoOwner?: boolean;
    coOwnerName?: string;
    coOwnerEmail?: string;
    additionalOccupants?: AdditionalOccupant[];
  }) => void;
  onUpdateStatus: (memberId: string, status: 'Active' | 'Invited' | 'Restricted') => void;
  onDeleteMember: (memberId: string) => void;
  activeSchemeId: string;
  rolePermissions: Record<string, { label: string; active: boolean; locked?: boolean }[]>;
  onTogglePermission: (role: string, permissionLabel: string) => void;
}

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'Lot Owner', label: 'Lot Owner', description: 'Property Owner (Levies, Financials & Voting)' },
  { value: 'Resident', label: 'Resident (Owner-Occupier)', description: 'On-site resident access & request logging' },
  { value: 'Tenant', label: 'Tenant (Renter)', description: 'Renter access (Request logging, No voting)' },
  { value: 'Committee Member', label: 'Committee Member', description: 'Elected governance & quote approval rights' },
  { value: 'Strata Manager', label: 'Strata Manager', description: 'Portfolio administration & scheme setup' },
  { value: 'Building Manager', label: 'Building Manager', description: 'On-site work order management' },
];

const OCCUPANT_ROLE_OPTIONS: SelectOption[] = [
  { value: 'Resident', label: 'Resident Occupant', description: 'On-site resident living in lot' },
  { value: 'Tenant', label: 'Tenant (Renter)', description: 'Sub-lease tenant access' },
  { value: 'Family Member', label: 'Family Member', description: 'Immediate family occupant' },
  { value: 'Co-Owner', label: 'Co-Owner / Partner', description: 'Joint title owner' },
];

export function UserManagementView({
  members,
  onAddMember,
  onUpdateStatus,
  onDeleteMember,
  activeSchemeId,
  rolePermissions,
  onTogglePermission,
}: UserManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'roster' | 'permissions'>('roster');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const filteredMembers = members.filter(m => {
    if (filterRole !== 'all' && m.role !== filterRole) return false;
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.unitId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-full bg-[#F4F6F9]">
      
      {/* Morphing Popover Wrapper */}
      <MorphingPopover>
        
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D8F235]/20 text-[#121316] text-xs font-bold uppercase tracking-wider mb-2">
              Scheme Administration • Multi-Occupant Onboarding Zone
            </div>
            <h1 className="text-2xl font-bold text-gray-900">User Management Directory</h1>
            <p className="text-sm text-gray-500">Manage Lot Owners, On-Site Residents, Tenants, and multiple occupants per physical lot.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-gray-150 p-1 rounded-2xl text-xs font-bold border border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'roster' ? 'bg-[#121316] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Member Roster
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('permissions')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'permissions' ? 'bg-[#121316] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Role Permissions
              </button>
            </div>

            {activeTab === 'roster' && (
              <MorphingPopoverTrigger>
                <div className="bg-[#121316] hover:bg-black text-white px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-105 cursor-pointer">
                  <UserPlus size={18} className="text-[#D8F235]" /> 
                  <span>Add New Member</span>
                </div>
              </MorphingPopoverTrigger>
            )}
          </div>
        </div>

        {/* Morphing Popover Content (Form Modal) */}
        <MorphingPopoverContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <AddMemberFormContent onAddMember={onAddMember} />
        </MorphingPopoverContent>

      </MorphingPopover>

      {activeTab === 'roster' ? (
        <>
          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            
            {/* Search Input */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-2xl text-xs flex-1 max-w-md">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or unit number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-gray-800 font-semibold"
              />
            </div>

            {/* Animated Role Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill label="All Roles" active={filterRole === 'all'} onClick={() => setFilterRole('all')} count={members.length} />
              <FilterPill label="Lot Owners" active={filterRole === 'Lot Owner'} onClick={() => setFilterRole('Lot Owner')} />
              <FilterPill label="Residents" active={filterRole === 'Resident'} onClick={() => setFilterRole('Resident')} />
              <FilterPill label="Tenants" active={filterRole === 'Tenant'} onClick={() => setFilterRole('Tenant')} />
              <FilterPill label="Committee" active={filterRole === 'Committee Member'} onClick={() => setFilterRole('Committee Member')} />
              <FilterPill label="Strata Manager" active={filterRole === 'Strata Manager'} onClick={() => setFilterRole('Strata Manager')} />
            </div>

          </div>

          {/* Member Roster Table with "Fading Slowly & Going Behind" Depth Animation */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Member Roster ({filteredMembers.length})</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-separate border-spacing-0">
                <thead>
                  <tr className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 border-b border-gray-100">Primary Member & Role</th>
                    <th className="py-3 px-4 border-b border-gray-100">Unit / Lot #</th>
                    <th className="py-3 px-4 border-b border-gray-100">Contact Info</th>
                    <th className="py-3 px-4 border-b border-gray-100">Mapped Occupants in Lot</th>
                    <th className="py-3 px-4 border-b border-gray-100">Status</th>
                    <th className="py-3 px-4 border-b border-gray-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-medium">
                  <AnimatePresence mode="popLayout">
                    {filteredMembers.map(m => (
                      <motion.tr 
                        key={m.id}
                        layout
                        initial={{ opacity: 0, scale: 0.97, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.94, 
                          y: 8, 
                          filter: 'blur(2px)' 
                        }}
                        transition={{ 
                          duration: 0.35, 
                          ease: [0.16, 1, 0.3, 1] 
                        }}
                        className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 outline-none"
                      >
                        <td className="py-4 px-4 border-b border-gray-100">
                          <div className="font-bold text-gray-900 text-sm">{m.name}</div>
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {m.role}
                          </span>
                        </td>

                        <td className="py-4 px-4 border-b border-gray-100">
                          <div className="font-bold text-gray-900">{m.unitId}</div>
                          <div className="text-[10px] text-gray-400 font-semibold">Lot {m.lotNumber}</div>
                        </td>

                        <td className="py-4 px-4 border-b border-gray-100 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-gray-700 font-semibold"><Mail size={12} className="text-gray-400" /> {m.email}</div>
                          <div className="flex items-center gap-1.5 text-gray-500"><Phone size={12} className="text-gray-400" /> {m.phone}</div>
                        </td>

                        <td className="py-4 px-4 border-b border-gray-100">
                          {m.additionalOccupants && m.additionalOccupants.length > 0 ? (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-[#8B8CF8] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                                {m.additionalOccupants.length} Extra Occupants
                              </span>
                              <div className="text-[11px] text-gray-600 truncate max-w-[180px]">
                                {m.additionalOccupants.map(o => o.name).join(', ')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">1 Occupant</span>
                          )}
                        </td>

                        <td className="py-4 px-4 border-b border-gray-100">
                          <MemberStatusBadge status={m.status} />
                        </td>

                        <td className="py-4 px-4 border-b border-gray-100 text-right space-x-2">
                          <button
                            onClick={() => setSelectedMember(m)}
                            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            View Details
                          </button>
                          {m.status === 'Active' ? (
                            <button
                              onClick={() => onUpdateStatus(m.id, 'Restricted')}
                              className="px-3 py-1.5 rounded-xl border border-red-200 text-xs font-bold text-red-500 hover:bg-red-50 cursor-pointer"
                            >
                              Restrict Access
                            </button>
                          ) : (
                            <button
                              onClick={() => onUpdateStatus(m.id, 'Active')}
                              className="px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Role Permissions Matrix Section */
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Scheme Role Permission Matrix</h3>
            <p className="text-xs text-gray-500 mt-1">Configure functional access controls for roles in Strata Plan {activeSchemeId}. Checked items indicate permitted actions.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(rolePermissions || {}).map(role => {
              const perms = rolePermissions[role] || [];
              return (
                <div key={role} className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="font-extrabold text-gray-900 text-sm">{role}</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-gray-250 text-gray-600 border border-gray-300">Role Profile</span>
                  </div>
                  <div className="space-y-4 pt-1">
                    {perms.map(p => (
                      <div key={p.label} className="flex items-center justify-between py-1">
                        <span className="text-xs font-bold text-gray-700">{p.label}</span>
                        {p.locked ? (
                          <span className="text-[10px] text-gray-400 font-extrabold bg-gray-200 px-2 py-0.5 rounded">Always On</span>
                        ) : (
                          <CustomCheckbox 
                            checked={p.active} 
                            onChange={() => onTogglePermission(role, p.label)} 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Member Details Drawer */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
              onClick={() => setSelectedMember(null)} 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%', opacity: 0.5, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="relative bg-white w-full max-w-md h-full shadow-2xl z-10 p-8 overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{selectedMember.id}</span>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h2>
                </div>
                <button onClick={() => setSelectedMember(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <MemberStatusBadge status={selectedMember.status} />
                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{selectedMember.role}</span>
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
                <div className="flex justify-between"><span className="text-gray-400 font-bold">Email:</span> <span className="font-bold text-gray-900">{selectedMember.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 font-bold">Phone:</span> <span className="font-semibold text-gray-700">{selectedMember.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 font-bold">Unit / Lot:</span> <span className="font-bold text-gray-900">{selectedMember.unitId} (Lot {selectedMember.lotNumber})</span></div>
                <div className="flex justify-between"><span className="text-gray-400 font-bold">Scheme ID:</span> <span className="font-bold text-[#8B8CF8]">{selectedMember.schemeId}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 font-bold">Joined:</span> <span className="text-gray-600">{selectedMember.joinedAt}</span></div>
              </div>

              {/* All Additional Mapped Occupants List */}
              {selectedMember.additionalOccupants && selectedMember.additionalOccupants.length > 0 && (
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl space-y-3 text-xs">
                  <div className="font-bold text-[#8B8CF8] uppercase text-[10px]">
                    Mapped Occupants in {selectedMember.unitId} ({selectedMember.additionalOccupants.length})
                  </div>
                  
                  <div className="space-y-2">
                    {selectedMember.additionalOccupants.map((occ, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-purple-100 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-900">{occ.name}</div>
                          <div className="text-[10px] text-gray-500">{occ.email}</div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-[#8B8CF8]">{occ.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-gray-100 space-y-2">
                <button
                  onClick={() => {
                    onDeleteMember(selectedMember.id);
                    setSelectedMember(null);
                  }}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={16} /> Delete Member Account
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Inner Form Content
function AddMemberFormContent({ onAddMember }: { onAddMember: any }) {
  const { setIsOpen } = useMorphingPopover();

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<MemberRole>('Resident');
  const [formUnit, setFormUnit] = useState('Unit 10');
  const [formLot, setFormLot] = useState(10);
  const [additionalOccupants, setAdditionalOccupants] = useState<{ id: string; name: string; email: string; role: 'Resident' | 'Tenant' | 'Family Member' | 'Co-Owner' }[]>([]);

  const handleAddOccupantRow = () => {
    setAdditionalOccupants(prev => [
      ...prev,
      { id: `occ-${Date.now()}-${prev.length}`, name: '', email: '', role: 'Resident' }
    ]);
  };

  const handleRemoveOccupantRow = (id: string) => {
    setAdditionalOccupants(prev => prev.filter(o => o.id !== id));
  };

  const handleOccupantChange = (id: string, field: 'name' | 'email' | 'role', val: string) => {
    setAdditionalOccupants(prev => prev.map(o => o.id === id ? { ...o, [field]: val } : o));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;
    onAddMember({
      name: formName,
      email: formEmail,
      phone: formPhone || '0400 000 000',
      role: formRole,
      unitId: formUnit,
      lotNumber: Number(formLot),
      additionalOccupants: additionalOccupants.filter(o => o.name.trim() && o.email.trim()),
    });
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <span className="text-xs font-extrabold text-[#8B8CF8] uppercase tracking-wider">Multi-Occupant Onboarding Zone</span>
          <h2 className="text-2xl font-bold text-gray-900">Add Member & Lot Occupants</h2>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        
        {/* Personal Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Primary Member Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Mike Davies"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white text-sm outline-none font-bold text-gray-900 shadow-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Primary Email Address</label>
            <input
              type="email"
              required
              placeholder="mike@owner.com"
              value={formEmail}
              onChange={e => setFormEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white text-sm outline-none font-bold text-gray-900 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Phone & Custom Dropdown Role Selector */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Phone Number</label>
            <input
              type="text"
              placeholder="0411 222 333"
              value={formPhone}
              onChange={e => setFormPhone(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white text-sm outline-none font-bold text-gray-900 shadow-sm transition-all"
            />
          </div>

          <CustomSelect
            label="Select User Role"
            options={ROLE_OPTIONS}
            value={formRole}
            onChange={val => setFormRole(val as MemberRole)}
          />
        </div>

        {/* Unit & Lot Number Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Unit / Apartment #</label>
            <input
              type="text"
              required
              placeholder="e.g. Unit 10"
              value={formUnit}
              onChange={e => setFormUnit(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white text-sm outline-none font-bold text-gray-900 shadow-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Lot Number</label>
            <input
              type="number"
              required
              value={formLot}
              onChange={e => setFormLot(Number(e.target.value))}
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white text-sm outline-none font-bold text-gray-900 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* ADDITIONAL OCCUPANTS SECTION */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#8B8CF8] tracking-wider">Multi-Occupant Lot Mapping</span>
              <h4 className="text-sm font-bold text-gray-900">Additional Lot Residents & Occupants</h4>
              <p className="text-[11px] text-gray-500">Map multiple co-owners, family members, or tenants living in {formUnit || 'this lot'}.</p>
            </div>

            <button
              type="button"
              onClick={handleAddOccupantRow}
              className="bg-[#121316] hover:bg-black text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Plus size={14} className="text-[#D8F235]" /> 
              <span>Add Additional Resident</span>
            </button>
          </div>

          {/* List of Additional Occupants */}
          <AnimatePresence>
            {additionalOccupants.length > 0 && (
              <div className="space-y-4 pt-1">
                {additionalOccupants.map((occ, idx) => (
                  <motion.div 
                    key={occ.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.94, filter: 'blur(2px)' }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="p-5 rounded-3xl border border-gray-200 bg-gray-50/80 shadow-sm space-y-3 relative"
                  >
                    <div className="flex items-center justify-between border-b border-gray-200/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#8B8CF8]/20 text-[#6366F1] flex items-center justify-center font-bold text-xs">
                          #{idx + 1}
                        </div>
                        <span className="text-xs font-bold text-gray-900">Occupant Details</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveOccupantRow(occ.id)}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border border-red-200 transition-colors cursor-pointer"
                      >
                        <X size={13} /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1 ml-1">Occupant Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lisa Ray"
                          value={occ.name}
                          onChange={e => handleOccupantChange(occ.id, 'name', e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-xs outline-none font-bold text-gray-900 shadow-sm focus:border-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1 ml-1">Occupant Email</label>
                        <input
                          type="email"
                          required
                          placeholder="lisa@unit10.com"
                          value={occ.email}
                          onChange={e => handleOccupantChange(occ.id, 'email', e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-xs outline-none font-bold text-gray-900 shadow-sm focus:border-gray-400"
                        />
                      </div>
                    </div>

                    <div className="pt-1">
                      <CustomSelect
                        label="Occupant Classification"
                        options={OCCUPANT_ROLE_OPTIONS}
                        value={occ.role}
                        onChange={val => handleOccupantChange(occ.id, 'role', val)}
                        direction="up"
                      />
                    </div>

                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Form Action Controls */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
          <button 
            type="button" 
            onClick={() => setIsOpen(false)} 
            className="px-5 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>

          <GlowSubmitButton 
            label="Send Invites to All Occupants"
            loadingLabel="Sending Invites..."
          />
        </div>

      </form>
    </div>
  );
}

function FilterPill({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
        active ? 'text-[#D8F235]' : 'text-gray-600 hover:text-gray-900 bg-gray-100/80 hover:bg-gray-200/80'
      }`}
    >
      {active && (
        <motion.div
          layoutId="active-role-pill-bg"
          className="absolute inset-0 bg-[#121316] rounded-full z-0 shadow-sm overflow-hidden"
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        />
      )}
      <span className="relative z-10">
        {label} {count !== undefined && `(${count})`}
      </span>
    </button>
  );
}

function MemberStatusBadge({ status }: { status: Member['status'] }) {
  switch (status) {
    case 'Active':
      return <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#10B981] text-[10px] font-extrabold uppercase">ACTIVE</span>;
    case 'Invited':
      return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">INVITED</span>;
    case 'Restricted':
      return <span className="px-3 py-1 rounded-full bg-red-100 text-[#FF6B6B] text-[10px] font-extrabold uppercase">RESTRICTED</span>;
  }
}
