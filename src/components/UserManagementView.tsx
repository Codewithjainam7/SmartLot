// @smartlot/component
import React, { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Member, MemberRole, AdditionalOccupant, getDefaultPermissionsForRole } from '../store/smartLotStore';
import { dispatchMemberInviteEmail } from '../services/emailService';
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
  UserPlus, FileEdit, CheckCircle2, 
  Search, 
  Mail, 
  Phone, 
  X, 
  Trash2,
  Plus,
  Check,
  Shield,
  Lock,
  User,
  Edit3,
  Save,
  Home,
  Activity,
  RotateCcw,
  Users,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  Building2
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
  onUpdateMember?: (memberId: string, updates: Partial<Member>) => void;
  onUpdateStatus: (memberId: string, status: 'Active' | 'Invited' | 'Restricted') => void;
  onDeleteMember: (memberId: string) => void;
  activeSchemeId: string;
  activePersonaName: string;
  rolePermissions: Record<string, { label: string; active: boolean; locked?: boolean; comingSoon?: boolean }[]>;
  globalRolePermissions?: Record<string, { label: string; active: boolean; locked?: boolean; comingSoon?: boolean }[]>;
  onTogglePermission: (role: string, permissionLabel: string) => void;
  onToggleIndividualPermission?: (memberId: string, permissionLabel: string) => void;
}

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'Lot Owner', label: 'Lot Owner', description: 'Property Owner (Levies, Financials & Voting)' },
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
  onUpdateMember,
  onUpdateStatus,
  onDeleteMember,
  activeSchemeId,
  activePersonaName,
  rolePermissions,
  globalRolePermissions = {},
  onTogglePermission,
  onToggleIndividualPermission,
}: UserManagementViewProps) {

  const [activeTab, setActiveTab] = useState<'roster' | 'permissions'>('roster');
  const [permTab, setPermTab] = useState<'default' | 'individual'>('default');

  // Column-Specific Search & Filter States (Enterprise AG-Grid style matching Global Platform Directory)
  const [colSearchName, setColSearchName] = useState('');
  const [colFilterRole, setColFilterRole] = useState('ALL');
  const [colSearchUnit, setColSearchUnit] = useState('');
  const [colSearchContact, setColSearchContact] = useState('');
  const [colFilterStatus, setColFilterStatus] = useState('ALL');
  const [sortField, setSortField] = useState<'name' | 'role' | 'unitId' | 'email' | 'status' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<MemberRole>('Lot Owner');
  const [editUnitId, setEditUnitId] = useState('');
  const [editLotNumber, setEditLotNumber] = useState(1);
  const [editStatus, setEditStatus] = useState<'Active' | 'Invited' | 'Restricted'>('Active');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setEditName(m.name || '');
    setEditEmail(m.email || '');
    setEditPhone(m.phone || '');
    setEditRole(m.role || 'Lot Owner');
    setEditUnitId(m.unitId || '');
    setEditLotNumber(m.lotNumber || 1);
    setEditStatus(m.status || 'Active');
  };

  // Unit options for Edit Member Modal
  const editUnitOptions: SelectOption[] = useMemo(() => {
    const unitsMap = new Map<string, number>();

    if (members && members.length > 0) {
      members.forEach(m => {
        if (m.unitId && !m.role.includes('Manager') && !m.role.includes('Admin')) {
          const num = m.lotNumber || parseInt(m.unitId.replace(/\D/g, ''), 10) || 1;
          unitsMap.set(m.unitId, num);
        }
      });
    }

    for (let i = 1; i <= 24; i++) {
      if (!unitsMap.has(`Unit ${i}`)) {
        unitsMap.set(`Unit ${i}`, i);
      }
    }

    const list: SelectOption[] = Array.from(unitsMap.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([unit, lot]) => ({
        value: unit,
        label: `${unit} (Lot ${lot})`,
        description: `Physical Lot ${lot}`,
      }));

    if (editRole === 'Strata Manager' || editRole === 'Building Manager') {
      list.unshift({
        value: 'HQ / Management',
        label: 'HQ / Management Office',
        description: 'Strata Staff / HQ',
      });
    }

    return list;
  }, [members, editRole]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSavingEdit(true);
    try {
      if (onUpdateMember) {
        await onUpdateMember(editingMember.id, {
          name: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          role: editRole,
          unitId: editUnitId.trim(),
          lotNumber: Number(editLotNumber) || 1,
          status: editStatus,
        });
      }
      setEditingMember(null);
    } catch (err) {
      console.error('Failed to update member:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const [prefillLotData, setPrefillLotData] = useState<Member | null>(null);

  // Global handler for the Add Occupant button
  React.useEffect(() => {
    (window as any).handleOpenLotInvite = (m: Member) => {
      setPrefillLotData(m);
    };
    return () => {
      delete (window as any).handleOpenLotInvite;
    };
  }, []);

  // Find the active user's role in the current scheme
  const activeUser = members.find(m => m.name === activePersonaName);
  const activeUserRole = activeUser?.role || 'Resident';
  
  // All authorized users in Team Access can manage & invite members
  const canManageUsers = true;
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const handleSort = (field: 'name' | 'role' | 'unitId' | 'email' | 'status') => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleResetFilters = () => {
    setColSearchName('');
    setColFilterRole('ALL');
    setColSearchUnit('');
    setColSearchContact('');
    setColFilterStatus('ALL');
    setSortField(null);
    setSortDirection('asc');
  };

  const activeFiltersCount = [
    colSearchName.trim() !== '',
    colFilterRole !== 'ALL',
    colSearchUnit.trim() !== '',
    colSearchContact.trim() !== '',
    colFilterStatus !== 'ALL',
  ].filter(Boolean).length;

  const filteredMembers = useMemo(() => {
    return members
      .filter(m => {
        // Quick Role pill filter or column role filter (Managers matches Strata Manager or Building Manager)
        if (colFilterRole !== 'ALL') {
          if (colFilterRole === 'Strata Manager' || colFilterRole === 'Managers') {
            if (m.role !== 'Strata Manager' && m.role !== 'Building Manager') return false;
          } else if (m.role !== colFilterRole) {
            return false;
          }
        }

        // Column 1: Member Name / ID
        if (colSearchName.trim()) {
          const nameQ = colSearchName.toLowerCase().trim();
          const matchesNameOrId = (
            (m.name || '').toLowerCase().includes(nameQ) ||
            (m.id || '').toLowerCase().includes(nameQ)
          );
          if (!matchesNameOrId) return false;
        }

        // Column 2: Unit Search
        if (colSearchUnit.trim()) {
          const unitQ = colSearchUnit.toLowerCase().trim();
          const matchesUnit = (
            (m.unitId || '').toLowerCase().includes(unitQ) ||
            String(m.lotNumber ?? '').includes(unitQ)
          );
          if (!matchesUnit) return false;
        }

        // Column 3: Contact Search (Email or Phone)
        if (colSearchContact.trim()) {
          const contactQ = colSearchContact.toLowerCase().trim();
          const matchesContact = (
            (m.email || '').toLowerCase().includes(contactQ) ||
            (m.phone || '').toLowerCase().includes(contactQ)
          );
          if (!matchesContact) return false;
        }

        // Column 4: Status Filter
        if (colFilterStatus !== 'ALL') {
          if (m.status !== colFilterStatus) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (!sortField) return 0;
        const valA = (a[sortField] || '').toString().toLowerCase();
        const valB = (b[sortField] || '').toString().toLowerCase();
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    members,
    colSearchName,
    colFilterRole,
    colSearchUnit,
    colSearchContact,
    colFilterStatus,
    sortField,
    sortDirection
  ]);

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-full bg-[#F4F6F9] dark:bg-[#0a0a0f]">
      
      {/* Morphing Popover Wrapper */}
      <MorphingPopover>
        
        {/* Header with Title, Stats & Action Buttons (Identical to Admin View Global Directory) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-[#0d1117]/80 backdrop-blur-md p-5 rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#0055FF] to-[#00D4B2] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Users size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                    Team Access Directory
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0055FF]/10 dark:bg-[#00D4B2]/10 text-[#0055FF] dark:text-[#00D4B2] border border-[#0055FF]/20 dark:border-[#00D4B2]/20 text-[11px] font-extrabold font-mono">
                    {filteredMembers.length} of {members.length} Members
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Strata Plan {activeSchemeId} • Manage strata council, lot owners, tenants, and scheme credentials.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab switcher: Member Roster | Role Permissions */}
            <div className="flex bg-gray-100 dark:bg-[#1a1d27] p-1 rounded-2xl text-xs font-bold border border-gray-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'roster'
                    ? 'bg-white dark:bg-[#1e2436] text-[#0055FF] dark:text-[#00D4B2] shadow-xs border border-gray-200/60 dark:border-white/10 font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                Member Roster
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('permissions')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'permissions'
                    ? 'bg-white dark:bg-[#1e2436] text-[#0055FF] dark:text-[#00D4B2] shadow-xs border border-gray-200/60 dark:border-white/10 font-bold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                Role Permissions
              </button>
            </div>

            {activeTab === 'roster' && (
              <MorphingPopoverTrigger>
                <div 
                  onClick={() => setPrefillLotData(null)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <UserPlus size={15} /> 
                  <span>Invite Member</span>
                </div>
              </MorphingPopoverTrigger>
            )}
          </div>
        </div>

        {/* Morphing Popover Content (Form Modal) */}
        <MorphingPopoverContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <PopoverAddMemberWrapper 
            onAddMember={onAddMember} 
            activePersonaName={activePersonaName}
            activeSchemeId={activeSchemeId}
            members={members}
            prefillUnit={prefillLotData?.unitId}
            prefillLotNumber={prefillLotData?.lotNumber}
          />
        </MorphingPopoverContent>

      </MorphingPopover>

      <AnimatePresence mode="wait">
        {activeTab === 'roster' ? (
          <motion.div 
            key="roster"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Quick Role Filter Preset Pills Row (identical to Admin Global Directory) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100/80 dark:bg-[#121622] rounded-2xl border border-gray-200/80 dark:border-white/5">
                {[
                  { label: 'All Roles', value: 'ALL', count: members.length },
                  { label: 'Managers', value: 'Strata Manager', count: members.filter(m => m.role === 'Strata Manager' || m.role === 'Building Manager').length },
                  { label: 'Committee', value: 'Committee Member', count: members.filter(m => m.role === 'Committee Member').length },
                  { label: 'Lot Owners', value: 'Lot Owner', count: members.filter(m => m.role === 'Lot Owner').length },
                  { label: 'Tenants', value: 'Tenant', count: members.filter(m => m.role === 'Tenant').length },
                ].map(tab => {
                  const isActive = tab.value === 'Strata Manager' 
                    ? (colFilterRole === 'Strata Manager' || colFilterRole === 'Managers' || colFilterRole === 'Building Manager')
                    : colFilterRole === tab.value;
                  return (
                    <button
                      key={tab.label}
                      type="button"
                      onClick={() => {
                        if (tab.value === 'Strata Manager') {
                          setColFilterRole(isActive ? 'ALL' : 'Strata Manager');
                        } else {
                          setColFilterRole(isActive && tab.value !== 'ALL' ? 'ALL' : tab.value);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-white dark:bg-[#1e2436] text-[#0055FF] dark:text-[#00D4B2] shadow-xs border border-gray-200/60 dark:border-white/10'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive 
                          ? 'bg-[#0055FF]/10 dark:bg-[#00D4B2]/15 text-[#0055FF] dark:text-[#00D4B2]' 
                          : 'bg-gray-200/70 dark:bg-white/5 text-gray-500 dark:text-gray-400'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-red-500/20 shadow-xs"
                >
                  <RotateCcw size={12} /> Clear Filters ({activeFiltersCount})
                </button>
              )}
            </div>

            {/* Member Roster AG Grid */}
            <MemberRosterGrid
              members={filteredMembers}
              allMembersCount={members.length}
              activePersonaName={activePersonaName}
              activeSchemeId={activeSchemeId}
              onViewDetails={setSelectedMember}
              onEditMember={handleOpenEdit}
              onUpdateStatus={onUpdateStatus}
              onDeleteMember={onDeleteMember}
              colSearchName={colSearchName}
              setColSearchName={setColSearchName}
              colFilterRole={colFilterRole}
              setColFilterRole={setColFilterRole}
              colSearchUnit={colSearchUnit}
              setColSearchUnit={setColSearchUnit}
              colSearchContact={colSearchContact}
              setColSearchContact={setColSearchContact}
              colFilterStatus={colFilterStatus}
              setColFilterStatus={setColFilterStatus}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              activeFiltersCount={activeFiltersCount}
              onResetFilters={handleResetFilters}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="permissions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-[#121316] rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6"
          >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Scheme Role Permission Matrix</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure access controls for Strata Plan {activeSchemeId}. Checked = permitted. Locked = fixed by system.</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Permission Mode Tabs */}
              <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                <button 
                  onClick={() => setPermTab('default')}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${permTab === 'default' ? 'bg-white dark:bg-[#1a1d27] shadow-sm text-gray-900 dark:text-white border border-gray-200 dark:border-white/10' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Default Permissions
                </button>
                <button 
                  onClick={() => setPermTab('individual')}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${permTab === 'individual' ? 'bg-white dark:bg-[#1a1d27] shadow-sm text-gray-900 dark:text-white border border-gray-200 dark:border-white/10' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  Individual Overrides
                </button>
              </div>

              <span className="text-[10px] font-black bg-[#0055FF]/10 text-[#0055FF] border border-[#0055FF]/20 px-3 py-1.5 rounded-full uppercase tracking-widest shrink-0">
                Module 1 Scope
              </span>
            </div>
          </div>
          
          {permTab === 'default' ? (
            <div className="overflow-x-auto rounded-3xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#0d1117] shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
              {(() => {
                const ROLES_ORDER = ['Strata Manager', 'Strata Admin', 'Building Manager', 'Committee Member', 'Lot Owner', 'Resident', 'Tenant', 'Service Provider'];
                const CATEGORY_MAP = [
                  { name: '1. Request Submission', perms: ['Submit Request', 'Add Comment on request'] },
                  { name: '2. Request Review & Approval', perms: ['View Requests', 'Filter & Sort Requests', 'Review & Edit Request Fields', 'Approve / Reject Requests'] },
                  { name: '3. Voting Management', perms: ['Create Voting/Motion', 'Publish Motion', 'Cast Vote', 'View Voting Dashboard', 'View Voting Comment/Discussion', 'Add Voting Comment', 'View Final Vote Result'] },
                  { name: '4. Vendor Management & Selection', perms: ['Request Quotes from Vendors', 'Submit Quote', 'View & Compare Quotes', 'Raise Quote Poll', 'Vote in Quote Poll', 'Assign Selected Vendor'] },
                  { name: '5. Work order Execution', perms: ['Upload PO Document', 'Begin / Progress Task', 'Upload Completion Evidence', 'Mark Task as Completed', 'Task Archive / Review'] },
                  { name: '6. Emergency Requests', perms: ['Create and Submit Emergency Request', 'Fast-track to Task Execution'] },
                  { name: '7. System / Admin Functions', perms: ['Role & Permission Setup', 'Module Level Access Management'] }
                ];
                
                const activePerms = (() => {
                  const m: Record<string, any> = {};
                  ROLES_ORDER.forEach(r => {
                    const defaultPerms = getDefaultPermissionsForRole(r);
                    const globalPerms = globalRolePermissions[r] || defaultPerms;
                    // rolePermissions[r] overrides globalPerms
                    const schemePerms = (rolePermissions && rolePermissions[r]) ? rolePermissions[r] : [];
                    
                    if (schemePerms.length > 0) {
                      m[r] = schemePerms;
                    } else {
                      m[r] = globalPerms.map(p => ({ ...p }));
                    }
                  });
                  return m;
                })();

                return (
                  <table className="w-full text-left border-collapse text-sm min-w-max">
                    <thead>
                      <tr className="bg-gray-50/80 dark:bg-[#1a1d27]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5">
                        <th className="p-5 font-black text-[11px] uppercase tracking-widest text-gray-900 dark:text-white sticky left-0 bg-gray-100 dark:bg-[#1a1d27] z-20 w-72 border-r border-gray-200 dark:border-white/5">Feature / Role Access</th>
                        {ROLES_ORDER.map(role => (
                          <th key={role} className="p-5 font-bold text-gray-900 dark:text-white text-center min-w-[140px] whitespace-nowrap">
                            {role}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {CATEGORY_MAP.map(cat => (
                        <React.Fragment key={cat.name}>
                          <tr className="bg-gray-50 dark:bg-[#00D4B2]/5 border-b border-gray-200 dark:border-white/5">
                            <td colSpan={ROLES_ORDER.length + 1} className="p-3 px-5 font-black text-gray-800 dark:text-[#00D4B2] text-[10px] uppercase tracking-widest sticky left-0 z-10 bg-gray-100 dark:bg-[#0B1121] border-r border-gray-200 dark:border-white/5">
                              {cat.name}
                            </td>
                          </tr>
                          {cat.perms.map(permName => (
                            <tr key={permName} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                              <td className="p-3.5 px-5 text-gray-700 dark:text-gray-300 text-xs font-semibold sticky left-0 bg-white dark:bg-[#0d1117] group-hover:bg-gray-50 dark:group-hover:bg-[#141820] z-10 border-r border-gray-100 dark:border-white/5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_10px_-2px_rgba(0,0,0,0.2)] transition-colors">
                                {permName}
                              </td>
                              {ROLES_ORDER.map(role => {
                                const rolePerms = activePerms[role] || [];
                                const permObj = rolePerms.find(p => p.label === permName);
                                if (!permObj) return <td key={role} className="p-3.5 text-center text-gray-300 dark:text-gray-600 border-r border-gray-50 dark:border-white/[0.02] last:border-0">-</td>;
                                return (
                                  <td key={role} className="p-3.5 text-center border-r border-gray-50 dark:border-white/[0.02] last:border-0">
                                    <div className="flex justify-center">
                                      {permObj.locked ? (
                                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">Locked</span>
                                      ) : (
                                        <CustomCheckbox
                                          checked={permObj.active}
                                          onChange={() => onTogglePermission(role, permName)}
                                        />
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMembers.map(member => {
                const perms = (rolePermissions && rolePermissions[member.role] && rolePermissions[member.role].length > 0)
                  ? rolePermissions[member.role]
                  : (globalRolePermissions && globalRolePermissions[member.role] && globalRolePermissions[member.role].length > 0)
                    ? globalRolePermissions[member.role]
                    : getDefaultPermissionsForRole(member.role);
                
                return (
                  <div key={member.id} className="bg-white dark:bg-[#0d1117] rounded-3xl p-7 border border-[#00D4B2]/20 dark:border-[#00D4B2]/15 shadow-xl dark:shadow-[0_8px_30px_rgba(0,212,178,0.06)] space-y-5 transition-all hover:shadow-[0_12px_40px_rgba(0,212,178,0.12)] hover:-translate-y-1">
                    <div className="flex flex-col border-b border-gray-100 dark:border-white/5 pb-4 gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-gray-900 dark:text-white text-base">{member.name}</span>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#00D4B2]/10 dark:bg-[#00D4B2]/20 text-[#00D4B2] border border-[#00D4B2]/20 shadow-[0_0_10px_rgba(0,212,178,0.1)]">Individual</span>
                      </div>
                      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 self-start">{member.role}</span>
                    </div>
                    
                    <div className="space-y-5 pt-1">
                      {(() => {
                        const CATEGORY_MAP = [
                          { name: '1. Request Submission', icon: <FileEdit size={12} />, perms: ['Submit Request', 'Add Comment on request'] },
                          { name: '2. Request Review & Approval', icon: <CheckCircle2 size={12} />, perms: ['View Requests', 'Filter & Sort Requests', 'Review & Edit Request Fields', 'Approve / Reject Requests'] },
                          { name: '3. Voting Management', icon: <CheckCircle2 size={12} />, perms: ['Create Voting/Motion', 'Publish Motion', 'Cast Vote', 'View Voting Dashboard', 'View Voting Comment/Discussion', 'Add Voting Comment', 'View Final Vote Result'] },
                          { name: '4. Vendor Management & Selection', icon: <CheckCircle2 size={12} />, perms: ['Request Quotes from Vendors', 'Submit Quote', 'View & Compare Quotes', 'Raise Quote Poll', 'Vote in Quote Poll', 'Assign Selected Vendor'] },
                          { name: '5. Work order Execution', icon: <CheckCircle2 size={12} />, perms: ['Upload PO Document', 'Begin / Progress Task', 'Upload Completion Evidence', 'Mark Task as Completed', 'Task Archive / Review'] },
                          { name: '6. Emergency Requests', icon: <CheckCircle2 size={12} />, perms: ['Create and Submit Emergency Request', 'Fast-track to Task Execution'] },
                          { name: '7. System / Admin Functions', icon: <CheckCircle2 size={12} />, perms: ['Role & Permission Setup', 'Module Level Access Management'] }
                        ];

                        return CATEGORY_MAP.map(cat => {
                          const catPerms = perms.filter(p => cat.perms.includes(p.label));
                          if (catPerms.length === 0) return null;
                          return (
                            <div key={cat.name} className="pt-4 first:pt-0 border-t border-gray-100 dark:border-white/5 first:border-t-0 space-y-2.5">
                              <div className="flex items-center gap-2 mb-3 text-[#00D4B2] dark:text-[#00D4B2] opacity-90">
                                {cat.icon}
                                <span className="text-[10px] font-black uppercase tracking-widest">{cat.name}</span>
                              </div>
                              {catPerms.map(p => {
                                const override = member.individualPermissions?.find(op => op.label === p.label);
                                const isChecked = override ? override.active : p.active;
                                const isModified = !!override;
                                
                                return (
                                  <div key={p.label} className="flex items-center justify-between py-1 group">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-semibold leading-tight transition-colors ${isModified ? 'text-[#00D4B2]' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {p.label}
                                      </span>
                                      {isModified && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#00D4B2] shadow-[0_0_6px_#00D4B2]" title="Overridden from default" />
                                      )}
                                    </div>
                                    {p.locked ? (
                                      <span className="text-[9px] font-extrabold bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 px-2 py-1 rounded-md uppercase tracking-widest">Locked</span>
                                    ) : (
                                      <CustomCheckbox
                                        checked={isChecked}
                                        onChange={() => onToggleIndividualPermission?.(member.id, p.label)}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
        )}
      </AnimatePresence>

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
              className="relative bg-white dark:bg-[#121316] w-full max-w-md h-full shadow-2xl z-10 p-8 overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{selectedMember.id}</span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedMember.name}</h2>
                </div>
                <button onClick={() => setSelectedMember(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <MemberStatusBadge status={selectedMember.status} />
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">{selectedMember.role}</span>
              </div>

              <div className="space-y-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs">
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500 font-bold">Email:</span> <span className="font-bold text-gray-900 dark:text-white">{selectedMember.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500 font-bold">Phone:</span> <span className="font-semibold text-gray-700">{selectedMember.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500 font-bold">Unit / Lot:</span> <span className="font-bold text-gray-900 dark:text-white">{selectedMember.unitId} (Lot {selectedMember.lotNumber})</span></div>
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500 font-bold">Scheme ID:</span> <span className="font-bold text-[#0055FF]">{selectedMember.schemeId}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 dark:text-gray-500 font-bold">Joined:</span> <span className="text-gray-600">{selectedMember.joinedAt}</span></div>
              </div>

              {/* All Additional Mapped Occupants List */}
              {selectedMember.additionalOccupants && selectedMember.additionalOccupants.length > 0 && (
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl space-y-3 text-xs">
                  <div className="font-bold text-[#0055FF] uppercase text-[10px]">
                    Mapped Occupants in {selectedMember.unitId} ({selectedMember.additionalOccupants.length})
                  </div>
                  
                  <div className="space-y-2">
                    {selectedMember.additionalOccupants.map((occ, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-purple-100 dark:border-purple-900 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{occ.name}</div>
                          <div className="text-[10px] text-gray-500">{occ.email}</div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-[#0055FF]">{occ.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Occupant Action */}
              {['Lot Owner', 'Strata Manager', 'Building Manager'].includes(selectedMember.role) && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if ((window as any).handleOpenLotInvite) {
                        (window as any).handleOpenLotInvite(selectedMember);
                      }
                      setSelectedMember(null); // Close the drawer
                    }}
                    className="w-full bg-[#0055FF] hover:bg-[#0044cc] text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:scale-[1.02]"
                  >
                    <UserPlus size={18} /> Invite Occupant to Lot {selectedMember.lotNumber}
                  </button>
                </div>
              )}

              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <button
                  onClick={() => {
                    onDeleteMember(selectedMember.id);
                    setSelectedMember(null);
                  }}
                  className="w-full bg-[#FF4757]/10 hover:bg-[#FF4757]/20 text-[#FF4757] border border-[#FF4757]/30 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={16} /> Delete Member Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Standalone Add Occupant Modal (Synced with Lot) */}
      <AnimatePresence>
        {prefillLotData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setPrefillLotData(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0d1117] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 p-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
                <div>
                  <span className="text-xs font-extrabold text-[#0055FF] uppercase tracking-wider">Lot-Synced Onboarding</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Occupant to Lot {prefillLotData.lotNumber}</h2>
                </div>
                <button onClick={() => setPrefillLotData(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <AddMemberFormContent 
                onAddMember={(data: any) => {
                  onAddMember(data);
                  setPrefillLotData(null);
                }} 
                activePersonaName={activePersonaName}
                activeSchemeId={activeSchemeId}
                members={members}
                prefillUnit={prefillLotData.unitId}
                prefillLotNumber={prefillLotData.lotNumber}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Standalone Edit Member Modal */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSavingEdit && setEditingMember(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0d1117] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 p-6 overflow-hidden z-10"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#0055FF]/10 dark:bg-[#00D4B2]/10 text-[#0055FF] dark:text-[#00D4B2] flex items-center justify-center">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">Edit Member Details</h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Modify email, phone, role, unit, and account status</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingMember(null)} 
                  disabled={isSavingEdit}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <User size={13} className="text-gray-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-[#161a26] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                      <Mail size={13} className="text-gray-400" /> Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      placeholder="e.g. user@strata.com"
                      className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-[#161a26] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                      <Phone size={13} className="text-gray-400" /> Phone Number
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder="e.g. 0400 123 456"
                      className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-[#161a26] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                      <Shield size={13} className="text-gray-400" /> Scheme Role
                    </label>
                    <CustomSelect
                      options={[
                        { value: 'Lot Owner', label: 'Lot Owner' },
                        { value: 'Tenant', label: 'Tenant (Renter)' },
                        { value: 'Committee Member', label: 'Committee Member' },
                        { value: 'Strata Manager', label: 'Strata Manager' },
                        { value: 'Building Manager', label: 'Building Manager' }
                      ]}
                      value={editRole}
                      onChange={val => setEditRole(val as MemberRole)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                      <Activity size={13} className="text-gray-400" /> Status
                    </label>
                    <CustomSelect
                      options={[
                        { value: 'Active', label: 'Active' },
                        { value: 'Invited', label: 'Invited' },
                        { value: 'Restricted', label: 'Restricted' }
                      ]}
                      value={editStatus}
                      onChange={val => setEditStatus(val as any)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <CustomSelect
                      label="Unit / Apartment #"
                      options={editUnitOptions}
                      value={editUnitId}
                      onChange={val => {
                        setEditUnitId(val);
                        if (val === 'HQ / Management') {
                          setEditLotNumber(1);
                        } else {
                          const match = val.match(/\d+/);
                          if (match) setEditLotNumber(parseInt(match[0], 10));
                        }
                      }}
                      placeholder="Select Unit..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                      <Home size={13} className="text-gray-400" /> Lot Number
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editLotNumber}
                      onChange={e => setEditLotNumber(parseInt(e.target.value) || 1)}
                      className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-[#161a26] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to permanently delete member ${editName || 'this user'} from scheme ${activeSchemeId}?`)) {
                        onDeleteMember(editingMember.id);
                        setEditingMember(null);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors border border-red-500/20"
                  >
                    <Trash2 size={13} />
                    <span>Delete Member</span>
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEditingMember(null)}
                      disabled={isSavingEdit}
                      className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="px-5 py-2.5 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      <Save size={14} />
                      <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ──────────────── AG Grid Member Roster ───────────────────────────────────────────────

interface MemberRosterGridProps {
  members: Member[];
  allMembersCount: number;
  activePersonaName: string;
  activeSchemeId: string;
  onViewDetails: (m: Member) => void;
  onEditMember: (m: Member) => void;
  onUpdateStatus: (id: string, status: 'Active' | 'Invited' | 'Restricted') => void;
  onDeleteMember: (id: string) => void;
  colSearchName: string;
  setColSearchName: (val: string) => void;
  colFilterRole: string;
  setColFilterRole: (val: string) => void;
  colSearchUnit: string;
  setColSearchUnit: (val: string) => void;
  colSearchContact: string;
  setColSearchContact: (val: string) => void;
  colFilterStatus: string;
  setColFilterStatus: (val: string) => void;
  sortField: 'name' | 'role' | 'unitId' | 'email' | 'status' | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'name' | 'role' | 'unitId' | 'email' | 'status') => void;
  activeFiltersCount: number;
  onResetFilters: () => void;
}

const ROLE_FILTER_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'Strata Manager', label: 'Strata Manager' },
  { value: 'Building Manager', label: 'Building Manager' },
  { value: 'Committee Member', label: 'Committee' },
  { value: 'Lot Owner', label: 'Lot Owner' },
  { value: 'Tenant', label: 'Tenant' },
];

const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Invited', label: 'Invited' },
  { value: 'Restricted', label: 'Restricted' },
];

function MemberRosterGrid({ 
  members, 
  allMembersCount,
  activePersonaName, 
  activeSchemeId, 
  onViewDetails, 
  onEditMember, 
  onUpdateStatus, 
  onDeleteMember,
  colSearchName,
  setColSearchName,
  colFilterRole,
  setColFilterRole,
  colSearchUnit,
  setColSearchUnit,
  colSearchContact,
  setColSearchContact,
  colFilterStatus,
  setColFilterStatus,
  sortField,
  sortDirection,
  onSort,
  activeFiltersCount,
  onResetFilters
}: MemberRosterGridProps) {
  const roleColors: Record<string, string> = {
    'Lot Owner':        'bg-[#0055FF]/10 text-[#0055FF] border-[#0055FF]/20',
    'Resident':         'bg-[#00D4B2]/10 text-[#00D4B2] border-[#00D4B2]/20',
    'Tenant':           'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/20',
    'Committee Member': 'bg-[#7C3AED]/10 text-[#a78bfa] border-[#7C3AED]/20',
    'Strata Manager':   'bg-[#00D4B2]/10 text-[#00D4B2] border-[#00D4B2]/20',
    'Building Manager': 'bg-[#0055FF]/10 text-[#6699ff] border-[#0055FF]/20',
    'Strata Admin':     'bg-white/10 text-gray-300 border-gray-600',
  };

  return (
    <div className="bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/30 overflow-hidden w-full">
      <div className="overflow-x-auto w-full min-h-[440px]">
        <table className="w-full text-left text-xs border-collapse font-sans table-auto">
          <thead>
            {/* AG-GRID PRIMARY COLUMN HEADER ROW */}
            <tr className="bg-gray-100/90 dark:bg-[#151a28] text-gray-700 dark:text-gray-200 font-black uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-white/10 select-none">
              {/* Col 0: Index */}
              <th className="py-3.5 px-2.5 w-10 text-center border-r border-gray-200 dark:border-white/10 text-gray-400">
                #
              </th>

              {/* Col 1: Member Name & ID */}
              <th className="py-3.5 px-3.5 w-[22%] border-r border-gray-200 dark:border-white/10">
                <div 
                  onClick={() => onSort('name')}
                  className="flex items-center justify-between gap-1 cursor-pointer hover:text-[#0055FF] dark:hover:text-[#00D4B2] transition-colors"
                  title="Click to sort by Name"
                >
                  <span className="flex items-center gap-1.5">
                    <Users size={13} className="text-gray-400" /> Member Details
                  </span>
                  <span className="text-gray-400">
                    {sortField === 'name' ? (
                      sortDirection === 'asc' ? <ArrowUp size={12} className="text-[#0055FF] dark:text-[#00D4B2]" /> : <ArrowDown size={12} className="text-[#0055FF] dark:text-[#00D4B2]" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30" />
                    )}
                  </span>
                </div>
              </th>

              {/* Col 2: Role */}
              <th className="py-3.5 px-3.5 w-[14%] border-r border-gray-200 dark:border-white/10">
                <div 
                  onClick={() => onSort('role')}
                  className="flex items-center justify-between gap-1 cursor-pointer hover:text-[#0055FF] dark:hover:text-[#00D4B2] transition-colors"
                  title="Click to sort by Role"
                >
                  <span className="flex items-center gap-1.5">
                    <Shield size={13} className="text-gray-400" /> Role
                  </span>
                  <span className="text-gray-400">
                    {sortField === 'role' ? (
                      sortDirection === 'asc' ? <ArrowUp size={12} className="text-[#0055FF] dark:text-[#00D4B2]" /> : <ArrowDown size={12} className="text-[#0055FF] dark:text-[#00D4B2]" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30" />
                    )}
                  </span>
                </div>
              </th>

              {/* Col 3: Unit / Lot */}
              <th className="py-3.5 px-3 w-[12%] border-r border-gray-200 dark:border-white/10">
                <div 
                  onClick={() => onSort('unitId')}
                  className="flex items-center justify-between gap-1 cursor-pointer hover:text-[#0055FF] dark:hover:text-[#00D4B2] transition-colors"
                  title="Click to sort by Unit"
                >
                  <span className="flex items-center gap-1.5">
                    <Home size={13} className="text-gray-400" /> Unit / Lot
                  </span>
                  <span className="text-gray-400">
                    {sortField === 'unitId' ? (
                      sortDirection === 'asc' ? <ArrowUp size={12} className="text-[#0055FF] dark:text-[#00D4B2]" /> : <ArrowDown size={12} className="text-[#0055FF] dark:text-[#00D4B2]" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30" />
                    )}
                  </span>
                </div>
              </th>

              {/* Col 4: Contact Details (Email + Phone) */}
              <th className="py-3.5 px-3.5 w-[20%] border-r border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-1.5">
                  <Mail size={13} className="text-gray-400" /> Contact Details
                </div>
              </th>

              {/* Col 5: Occupants */}
              <th className="py-3.5 px-3 w-[10%] border-r border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-gray-400" /> Occupants
                </div>
              </th>

              {/* Col 6: Status */}
              <th className="py-3.5 px-3 w-[10%] border-r border-gray-200 dark:border-white/10">
                <div 
                  onClick={() => onSort('status')}
                  className="flex items-center justify-between gap-1 cursor-pointer hover:text-[#0055FF] dark:hover:text-[#00D4B2] transition-colors"
                  title="Click to sort by Status"
                >
                  <span className="flex items-center gap-1.5">
                    <Activity size={13} className="text-gray-400" /> Status
                  </span>
                  <span className="text-gray-400">
                    {sortField === 'status' ? (
                      sortDirection === 'asc' ? <ArrowUp size={12} className="text-[#0055FF] dark:text-[#00D4B2]" /> : <ArrowDown size={12} className="text-[#0055FF] dark:text-[#00D4B2]" />
                    ) : (
                      <ArrowUpDown size={11} className="opacity-30" />
                    )}
                  </span>
                </div>
              </th>

              {/* Col 7: Actions */}
              <th className="py-3.5 px-3 text-right w-[12%]">
                <span>Actions</span>
              </th>
            </tr>

            {/* AG-GRID INLINE FILTER ROW */}
            <tr className="bg-gray-50/95 dark:bg-[#181d2c] border-b border-gray-200 dark:border-white/10">
              {/* Col 0: Index Filter Space */}
              <th className="py-2 px-2 text-center border-r border-gray-200 dark:border-white/10">
                <Filter size={11} className="mx-auto text-gray-400" />
              </th>

              {/* Col 1: Name / ID Search Input */}
              <th className="py-2 px-2 border-r border-gray-200 dark:border-white/10">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Filter name/ID..."
                    value={colSearchName}
                    onChange={e => setColSearchName(e.target.value)}
                    className="w-full h-8 pl-2.5 pr-5 rounded-lg bg-white dark:bg-[#0e121d] border border-gray-200 dark:border-white/15 text-[11px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2] transition-all font-normal shadow-2xs"
                  />
                  {colSearchName ? (
                    <button
                      type="button"
                      onClick={() => setColSearchName('')}
                      className="absolute right-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  ) : (
                    <span className="absolute right-2 text-gray-400 text-[10px] pointer-events-none">▼</span>
                  )}
                </div>
              </th>

              {/* Col 2: Role Dropdown Filter (NO Resident!) */}
              <th className="py-2 px-2 border-r border-gray-200 dark:border-white/10 overflow-visible">
                <CustomSelect
                  size="sm"
                  options={ROLE_FILTER_OPTIONS}
                  value={colFilterRole}
                  onChange={setColFilterRole}
                  placeholder="All Roles"
                />
              </th>

              {/* Col 3: Unit / Lot Filter */}
              <th className="py-2 px-2 border-r border-gray-200 dark:border-white/10">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Filter unit..."
                    value={colSearchUnit}
                    onChange={e => setColSearchUnit(e.target.value)}
                    className="w-full h-8 pl-2.5 pr-5 rounded-lg bg-white dark:bg-[#0e121d] border border-gray-200 dark:border-white/15 text-[11px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2] transition-all font-normal shadow-2xs"
                  />
                  {colSearchUnit ? (
                    <button
                      type="button"
                      onClick={() => setColSearchUnit('')}
                      className="absolute right-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  ) : (
                    <span className="absolute right-2 text-gray-400 text-[10px] pointer-events-none">▼</span>
                  )}
                </div>
              </th>

              {/* Col 4: Contact Details Filter */}
              <th className="py-2 px-2 border-r border-gray-200 dark:border-white/10">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Filter email/phone..."
                    value={colSearchContact}
                    onChange={e => setColSearchContact(e.target.value)}
                    className="w-full h-8 pl-2.5 pr-5 rounded-lg bg-white dark:bg-[#0e121d] border border-gray-200 dark:border-white/15 text-[11px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2] transition-all font-normal shadow-2xs"
                  />
                  {colSearchContact ? (
                    <button
                      type="button"
                      onClick={() => setColSearchContact('')}
                      className="absolute right-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  ) : (
                    <span className="absolute right-2 text-gray-400 text-[10px] pointer-events-none">▼</span>
                  )}
                </div>
              </th>

              {/* Col 5: Occupants Filter Space */}
              <th className="py-2 px-2 border-r border-gray-200 dark:border-white/10 text-center text-gray-400 text-[10px]">
                -
              </th>

              {/* Col 6: Status Dropdown Filter */}
              <th className="py-2 px-2 border-r border-gray-200 dark:border-white/10 overflow-visible">
                <CustomSelect
                  size="sm"
                  menuAlign="right"
                  options={STATUS_FILTER_OPTIONS}
                  value={colFilterStatus}
                  onChange={setColFilterStatus}
                  placeholder="All Status"
                />
              </th>

              {/* Col 7: Reset Filter Button */}
              <th className="py-2 px-2 text-right">
                {activeFiltersCount > 0 ? (
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="w-full h-8 px-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-red-500/20 shadow-2xs"
                    title="Reset all filters"
                  >
                    <RotateCcw size={10} />
                    <span>Reset</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-gray-400 pr-2">Filter</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {members.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4 border border-gray-100 mx-auto">
                    <Users size={22} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">No members match your criteria</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">Try clearing one of your column filters.</p>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="px-4 py-2 rounded-xl bg-[#0055FF] text-white text-xs font-bold shadow-md hover:bg-blue-600 cursor-pointer transition-all"
                    >
                      Reset All Filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              members.map((m, index) => (
                <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group">
                  {/* Col 0: Row index */}
                  <td className="py-4 px-2.5 text-center border-r border-gray-100 dark:border-white/5 font-mono text-[11px] text-gray-400">
                    {index + 1}
                  </td>

                  {/* Col 1: Member Name & ID */}
                  <td className="px-4 py-4 border-r border-gray-100 dark:border-white/5">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{m.name}</span>
                      <span className="text-[10px] font-mono text-gray-400">{m.id}</span>
                    </div>
                  </td>

                  {/* Col 2: Role */}
                  <td className="px-4 py-4 border-r border-gray-100 dark:border-white/5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wide ${roleColors[m.role] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>
                      {m.role}
                    </span>
                  </td>

                  {/* Col 3: Unit / Lot */}
                  <td className="px-4 py-4 border-r border-gray-100 dark:border-white/5">
                    <div className="leading-tight">
                      <div className="font-semibold text-gray-900 dark:text-white text-xs">
                        {m.role && (m.role.includes('Manager') || m.role.includes('Admin'))
                          ? (m.unitId && !m.unitId.startsWith('Unit 1') ? m.unitId : 'HQ / Management')
                          : m.unitId}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">
                        {m.role && (m.role.includes('Manager') || m.role.includes('Admin'))
                          ? 'Staff / Admin'
                          : (m.lotNumber ? `Lot ${m.lotNumber}` : 'No Lot Assigned')}
                      </div>
                    </div>
                  </td>

                  {/* Col 4: Contact Details */}
                  <td className="px-4 py-4 border-r border-gray-100 dark:border-white/5">
                    <div className="leading-tight">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium">
                        <Mail size={11} className="text-gray-400 dark:text-gray-500 shrink-0" />
                        <span className="truncate max-w-[160px]">{m.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        <Phone size={11} className="text-gray-400 dark:text-gray-500 shrink-0" />
                        {m.phone}
                      </div>
                    </div>
                  </td>

                  {/* Col 5: Occupants */}
                  <td className="px-4 py-4 border-r border-gray-100 dark:border-white/5">
                    {m.role && (m.role.includes('Manager') || m.role.includes('Admin')) ? (
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">-</span>
                    ) : m.additionalOccupants && m.additionalOccupants.length > 0 ? (
                      <span className="text-[10px] font-bold text-[#0055FF] bg-[#0055FF]/10 px-2 py-0.5 rounded-full border border-[#0055FF]/20">
                        {m.additionalOccupants.length + 1} Occupants
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">1 Occupant</span>
                    )}
                  </td>

                  {/* Col 6: Status */}
                  <td className="px-4 py-4 border-r border-gray-100 dark:border-white/5">
                    <MemberStatusBadge status={m.status} />
                  </td>

                  {/* Col 7: Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => onEditMember(m)}
                        className="px-3 py-1.5 rounded-xl border border-[#0055FF]/30 dark:border-[#00D4B2]/30 bg-[#0055FF]/10 dark:bg-[#00D4B2]/10 text-[11px] font-bold text-[#0055FF] dark:text-[#00D4B2] hover:bg-[#0055FF] hover:text-white dark:hover:bg-[#00D4B2] dark:hover:text-[#0B1121] cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs hover:scale-105"
                        title="Edit Member (Email, Phone, Role, Unit)"
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>
                      {m.name !== activePersonaName && (
                        m.status === 'Active' ? (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(m.id, 'Restricted')}
                            className="px-3 py-1.5 rounded-xl border border-[#FF4757]/30 text-[11px] font-bold text-[#FF4757] hover:bg-[#FF4757]/10 cursor-pointer transition-all"
                          >
                            Restrict
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(m.id, 'Active')}
                            className="px-3 py-1.5 rounded-xl border border-[#00D4B2]/30 text-[11px] font-bold text-[#00D4B2] hover:bg-[#00D4B2]/10 cursor-pointer transition-all"
                          >
                            Activate
                          </button>
                        )
                      )}
                      {m.name !== activePersonaName && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${m.name} (${m.email}) from scheme ${activeSchemeId}?`)) {
                              onDeleteMember(m.id);
                            }
                          }}
                          className="p-1.5 rounded-xl text-[#FF4757] hover:bg-[#FF4757]/10 border border-transparent hover:border-[#FF4757]/20 transition-all cursor-pointer hover:scale-105"
                          title={`Delete Member ${m.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Wrapper for the global popover that has access to useMorphingPopover
function PopoverAddMemberWrapper({
  onAddMember,
  activePersonaName,
  activeSchemeId,
  members,
  prefillUnit,
  prefillLotNumber,
}: {
  onAddMember: any;
  activePersonaName: string;
  activeSchemeId: string;
  members?: Member[];
  prefillUnit?: string;
  prefillLotNumber?: number;
}) {
  const { setIsOpen } = useMorphingPopover();
  return (
    <AddMemberFormContent
      onAddMember={onAddMember}
      activePersonaName={activePersonaName}
      activeSchemeId={activeSchemeId}
      members={members}
      prefillUnit={prefillUnit}
      prefillLotNumber={prefillLotNumber}
      onClose={() => setIsOpen(false)}
    />
  );
}

// Inner Form Content
function AddMemberFormContent({ 
  onAddMember, 
  activePersonaName,
  activeSchemeId,
  members,
  prefillUnit,
  prefillLotNumber,
  onClose
}: { 
  onAddMember: any; 
  activePersonaName: string;
  activeSchemeId: string;
  members?: Member[];
  prefillUnit?: string;
  prefillLotNumber?: number;
  onClose?: () => void;
}) {
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<MemberRole>(prefillUnit ? 'Tenant' : 'Lot Owner');
  const [formUnit, setFormUnit] = useState(prefillUnit || 'Unit 1');
  const [formLot, setFormLot] = useState<number | string>(prefillLotNumber || 1);
  const [additionalOccupants, setAdditionalOccupants] = useState<{ id: string; name: string; email: string; role: 'Resident' | 'Tenant' | 'Family Member' | 'Co-Owner' }[]>([]);

  // Dynamically assemble unit options from members + standard 24 units + HQ / Management
  const unitOptions: SelectOption[] = useMemo(() => {
    const unitSet = new Set<string>();
    if (members && members.length > 0) {
      members.forEach(m => {
        if (m.unitId && m.unitId.trim()) unitSet.add(m.unitId.trim());
      });
    }
    // Standard units 1 to 24
    for (let i = 1; i <= 24; i++) {
      unitSet.add(`Unit ${i}`);
    }
    unitSet.add('HQ / Management');

    const sorted = Array.from(unitSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });

    return sorted.map(u => ({
      value: u,
      label: u === 'HQ / Management' ? 'HQ / Management (Scheme Wide)' : u,
      description: u === 'HQ / Management' ? 'All lots administration' : `Assigned to Lot ${u.replace(/\D/g, '') || '1'}`
    }));
  }, [members]);

  const handleUnitChange = (val: string) => {
    setFormUnit(val);
    if (val === 'HQ / Management') {
      setFormLot(1);
    } else {
      const match = val.match(/\d+/);
      if (match) {
        setFormLot(parseInt(match[0], 10));
      }
    }
  };

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) return;
    setIsSubmitting(true);

    const primaryToken = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const primaryJoinUrl = `${window.location.origin}/#/join/${activeSchemeId}?token=${primaryToken}&email=${encodeURIComponent(formEmail.trim())}&role=${encodeURIComponent(formRole)}&unit=${encodeURIComponent(formLot)}&name=${encodeURIComponent(formName.trim())}`;

    try {
      // 1. Dispatch invite email to primary member
      await dispatchMemberInviteEmail({
        toEmail: formEmail.trim(),
        toName: formName.trim(),
        role: formRole,
        schemeName: activeSchemeId,
        schemeId: activeSchemeId,
        lotNumber: formLot,
        inviterName: activePersonaName,
        inviteToken: primaryToken,
        joinUrl: primaryJoinUrl,
      });

      // 2. Dispatch invite emails to any additional occupants
      const validOccupants = additionalOccupants.filter(o => o.name.trim() && o.email.trim());
      for (const occ of validOccupants) {
        const occToken = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const occJoinUrl = `${window.location.origin}/#/join/${activeSchemeId}?token=${occToken}&email=${encodeURIComponent(occ.email.trim())}&role=${encodeURIComponent(occ.role)}&unit=${encodeURIComponent(formLot)}&name=${encodeURIComponent(occ.name.trim())}`;
        await dispatchMemberInviteEmail({
          toEmail: occ.email.trim(),
          toName: occ.name.trim(),
          role: occ.role,
          schemeName: activeSchemeId,
          schemeId: activeSchemeId,
          lotNumber: formLot,
          inviterName: activePersonaName,
          inviteToken: occToken,
          joinUrl: occJoinUrl,
        });
      }
    } catch (err) {
      console.error('Email dispatch error on onboarding member:', err);
    }

    onAddMember({
      name: formName,
      email: formEmail,
      phone: formPhone || '0400 000 000',
      role: formRole,
      unitId: formUnit,
      lotNumber: Number(formLot),
      additionalOccupants: additionalOccupants.filter(o => o.name.trim() && o.email.trim()),
      initialStatus: 'Invited',
      inviteToken: primaryToken,
    });
    
    setIsSubmitting(false);
    if (onClose) onClose();
  };

  return (
    <div className="space-y-6">
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <span className="text-xs font-extrabold text-[#0055FF] uppercase tracking-wider">Multi-Occupant Onboarding Zone</span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Member & Lot Occupants</h2>
        </div>
        <button onClick={() => onClose && onClose()} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        
        {/* Personal Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Primary Member Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Mike Davies"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-[#161a26] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Primary Email Address</label>
            <input
              type="email"
              required
              placeholder="mike@owner.com"
              value={formEmail}
              onChange={e => setFormEmail(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-[#161a26] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
            />
          </div>
        </div>

        {/* Phone & Custom Dropdown Role Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Phone Number</label>
            <input
              type="text"
              placeholder="0411 222 333"
              value={formPhone}
              onChange={e => setFormPhone(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-[#161a26] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <CustomSelect
              label="Unit / Apartment #"
              options={unitOptions}
              value={formUnit}
              onChange={handleUnitChange}
              placeholder="Select Unit..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Assigned Lot #</label>
            <input
              type="number"
              readOnly
              value={formLot}
              className="w-full h-10 px-3.5 rounded-xl bg-gray-100 dark:bg-[#12151f] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-500 dark:text-gray-400 cursor-not-allowed"
              title="Automatically synchronized with selected Unit"
            />
          </div>
        </div>

        {/* ADDITIONAL OCCUPANTS SECTION */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-[#0055FF] tracking-wider">Multi-Occupant Lot Mapping</span>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Additional Lot Residents & Occupants</h4>
              <p className="text-[11px] text-gray-500">Map multiple co-owners, family members, or tenants living in {formUnit || 'this lot'}.</p>
            </div>

            <button
              type="button"
              onClick={handleAddOccupantRow}
              className="bg-[#0B1121] hover:bg-black text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Plus size={14} className="text-[#00D4B2]" /> 
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
                    className="p-5 rounded-3xl border border-gray-200 dark:border-white/5 bg-gray-50/80 dark:bg-[#1a1d27]/80 shadow-sm space-y-3 relative"
                  >
                    <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-white/5 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0055FF]/20 text-[#0033CC] flex items-center justify-center font-bold text-xs">
                          #{idx + 1}
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">Occupant Details</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveOccupantRow(occ.id)}
                        className="text-[#FF4757] hover:text-red-700 bg-[#FF4757]/10 hover:bg-[#FF4757]/20 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border border-[#FF4757]/30 transition-colors cursor-pointer"
                      >
                        <X size={13} /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1 ml-1">Occupant Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lisa Ray"
                          value={occ.name}
                          onChange={e => handleOccupantChange(occ.id, 'name', e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-[#1a1d27] text-xs outline-none font-bold text-gray-900 dark:text-white shadow-sm focus:border-[#00D4B2]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1 ml-1">Occupant Email</label>
                        <input
                          type="email"
                          required
                          placeholder="lisa@unit10.com"
                          value={occ.email}
                          onChange={e => handleOccupantChange(occ.id, 'email', e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-[#1a1d27] text-xs outline-none font-bold text-gray-900 dark:text-white shadow-sm focus:border-[#00D4B2]"
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
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-3 rounded-2xl border border-gray-200 dark:border-white/8 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
          >
            Cancel
          </button>

          <GlowSubmitButton 
            label="Send Invites to All Occupants"
            loadingLabel="Sending Invites..."
            isLoading={isSubmitting}
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
        active ? 'text-[#00D4B2]' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/80 dark:hover:bg-white/10'
      }`}
    >
      {active && (
        <motion.div
          layoutId="active-role-pill-bg"
          className="absolute inset-0 bg-[#0B1121] dark:bg-white/10 rounded-full z-0 shadow-sm overflow-hidden border border-[#00D4B2]/20"
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
      return <span className="px-3 py-1 rounded-full bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/20 text-[10px] font-extrabold uppercase">INVITED</span>;
    case 'Restricted':
      return <span className="px-3 py-1 rounded-full bg-red-100 text-[#FF6B6B] text-[10px] font-extrabold uppercase">RESTRICTED</span>;
  }
}







// End UserManagementView

// Subcomponent: Scheme Permission Matrix
// Subcomponent: Individual Overrides Inspector
// Subcomponent: Member Directory Table