import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, Trash2, Home, Mail, Phone, ExternalLink, ArrowLeft, Shield, Lock, 
  Search, Filter, Plus, CheckCircle2, Clock, AlertTriangle, ChevronRight, X, 
  Building2, Users, FileText, Check, AlertCircle, RefreshCw, Send, Eye,
  Sparkles, Layers, Activity, Sun, Moon, ArrowUpRight, BarChart3, Edit3, Save, UserCheck, Key, UserPlus, Zap
} from 'lucide-react';
import { Member, ResidentRequest, UnitData, getDefaultPermissionsForRole, CaseStatus, MemberRole, RequestStream } from '../store/smartLotStore';
import { Scheme } from '../types';
import { CustomCheckbox } from './core/CustomCheckbox';

interface AdminViewProps {
  members: Member[];
  schemes: Scheme[];
  requests?: ResidentRequest[];
  units?: UnitData[];
  theme?: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
  onBackToLanding: () => void;
  onDeleteMember: (id: string) => void;
  onDeleteScheme: (id: string) => void;
  onAddScheme?: (id: string, name: string, lots: number) => Promise<any>;
  onAddMember?: (memberData: {
    name: string;
    email: string;
    phone: string;
    role: MemberRole;
    unitId: string;
    lotNumber: number;
    schemeId?: string;
  }) => Promise<any>;
  onAddResidentRequest?: (reqData: {
    schemeId: string;
    unit: string;
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Emergency';
    requestorName?: string;
    requestorEmail?: string;
    requestorRole?: 'Lot Owner' | 'Resident' | 'Tenant' | 'Strata Manager';
    requestType?: RequestStream;
  }) => Promise<any> | string;
  onUpdateScheme?: (id: string, updates: { name?: string; lots?: number }) => Promise<any>;
  onUpdateMember?: (id: string, updates: Partial<Member>) => Promise<any>;
  onUpdateResidentRequest?: (id: string, updates: Partial<ResidentRequest>) => Promise<any>;
  onTriageRequest?: (id: string, triageData: any) => void;
  onCloseRequest?: (id: string, reason?: string) => void;
  onAddComment?: (id: string, text: string) => void;
  globalRolePermissions?: Record<string, { label: string; active: boolean; locked?: boolean; comingSoon?: boolean }[]>;
  onToggleGlobalPermission?: (role: string, permissionLabel: string) => void;
  onToggleIndividualPermission?: (memberId: string, permissionLabel: string) => void;
  onRefreshData?: () => Promise<void>;
}

export function AdminView({ 
  members, 
  schemes, 
  requests = [], 
  units = [],
  theme = 'dark',
  setTheme,
  onBackToLanding, 
  onDeleteMember, 
  onDeleteScheme, 
  onAddScheme,
  onAddMember,
  onAddResidentRequest,
  onUpdateScheme,
  onUpdateMember,
  onUpdateResidentRequest,
  onTriageRequest,
  onCloseRequest,
  onAddComment,
  globalRolePermissions = {}, 
  onToggleGlobalPermission,
  onToggleIndividualPermission,
  onRefreshData
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'schemes' | 'users' | 'permissions'>('overview');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');

  // Modals - Scheme Creation & Editing
  const [isAddSchemeOpen, setIsAddSchemeOpen] = useState(false);
  const [newSchemeId, setNewSchemeId] = useState('');
  const [newSchemeName, setNewSchemeName] = useState('');
  const [newSchemeLots, setNewSchemeLots] = useState(10);
  const [isSubmittingScheme, setIsSubmittingScheme] = useState(false);

  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  const [editSchemeName, setEditSchemeName] = useState('');
  const [editSchemeLots, setEditSchemeLots] = useState(10);

  // Modals - Member Creation, Editing & Permissions
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberSchemeId, setNewMemberSchemeId] = useState(schemes[0]?.id || '');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<MemberRole>('Strata Manager');
  const [newMemberUnit, setNewMemberUnit] = useState('HQ / Management');
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberEmail, setEditMemberEmail] = useState('');
  const [editMemberPhone, setEditMemberPhone] = useState('');
  const [editMemberRole, setEditMemberRole] = useState<MemberRole>('Resident');
  const [editMemberUnit, setEditMemberUnit] = useState('');
  const [editMemberStatus, setEditMemberStatus] = useState<'Active' | 'Invited' | 'Restricted'>('Active');
  const [memberPermissionsAudit, setMemberPermissionsAudit] = useState<Member | null>(null);

  // Modals - Request Creation, Inspection & Editing
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [newReqSchemeId, setNewReqSchemeId] = useState(schemes[0]?.id || '');
  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqDescription, setNewReqDescription] = useState('');
  const [newReqUnit, setNewReqUnit] = useState('Unit 1');
  const [newReqPriority, setNewReqPriority] = useState<'Low' | 'Medium' | 'High' | 'Emergency'>('Medium');
  const [newReqType, setNewReqType] = useState<RequestStream>('maintenance_upgrade');
  const [newReqRequesterName, setNewReqRequesterName] = useState('Super Admin');
  const [newReqRequesterRole, setNewReqRequesterRole] = useState<'Strata Manager' | 'Lot Owner' | 'Resident' | 'Tenant'>('Strata Manager');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState<ResidentRequest | null>(null);
  const [isEditingRequest, setIsEditingRequest] = useState(false);
  const [editReqTitle, setEditReqTitle] = useState('');
  const [editReqDescription, setEditReqDescription] = useState('');
  const [editReqPriority, setEditReqPriority] = useState<'Low' | 'Medium' | 'High' | 'Emergency'>('Medium');
  const [editReqStatus, setEditReqStatus] = useState<CaseStatus>('new');
  const [newCommentText, setNewCommentText] = useState('');

  // Scheme Master Audit Modal
  const [selectedSchemeForAudit, setSelectedSchemeForAudit] = useState<Scheme | null>(null);

  // Stats Calculations
  const stats = useMemo(() => {
    const totalSchemes = schemes.length;
    const totalLots = schemes.reduce((acc, s) => acc + (s.lots || 0), 0);
    const totalUsers = members.length;
    const totalRequests = requests.length;
    const emergencyRequests = requests.filter(r => r.priority === 'Emergency' && r.status !== 'resolved' && r.status !== 'closed');
    const openRequests = requests.filter(r => r.status !== 'resolved' && r.status !== 'closed');
    const activeManagers = members.filter(m => m.role === 'Strata Manager').length;

    return {
      totalSchemes,
      totalLots,
      totalUsers,
      totalRequests,
      emergencyRequestsCount: emergencyRequests.length,
      openRequestsCount: openRequests.length,
      activeManagers
    };
  }, [schemes, members, requests]);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = 
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requestorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.schemeId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesScheme = selectedSchemeFilter === 'ALL' || req.schemeId === selectedSchemeFilter;
      const matchesStatus = selectedStatusFilter === 'ALL' || req.status === selectedStatusFilter;
      const matchesPriority = selectedPriorityFilter === 'ALL' || req.priority === selectedPriorityFilter;

      return matchesSearch && matchesScheme && matchesStatus && matchesPriority;
    });
  }, [requests, searchQuery, selectedSchemeFilter, selectedStatusFilter, selectedPriorityFilter]);

  // Filtered Users
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.schemeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.unitId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesScheme = selectedSchemeFilter === 'ALL' || m.schemeId === selectedSchemeFilter;
      return matchesSearch && matchesScheme;
    });
  }, [members, searchQuery, selectedSchemeFilter]);

  // Filtered Schemes
  const filteredSchemes = useMemo(() => {
    return schemes.filter(s => 
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [schemes, searchQuery]);

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchemeId || !newSchemeName) return;
    setIsSubmittingScheme(true);
    try {
      if (onAddScheme) {
        await onAddScheme(newSchemeId.trim().toUpperCase(), newSchemeName.trim(), Number(newSchemeLots));
      }
      setIsAddSchemeOpen(false);
      setNewSchemeId('');
      setNewSchemeName('');
      setNewSchemeLots(10);
    } catch (err) {
      console.error("Error creating scheme:", err);
    } finally {
      setIsSubmittingScheme(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail || !newMemberSchemeId) return;
    setIsSubmittingMember(true);
    try {
      if (onAddMember) {
        const lotNum = parseInt(newMemberUnit.replace(/\D/g, '')) || 0;
        await onAddMember({
          name: newMemberName.trim(),
          email: newMemberEmail.trim(),
          phone: newMemberPhone.trim() || '0400 000 000',
          role: newMemberRole,
          unitId: newMemberUnit.trim(),
          lotNumber: lotNum,
          schemeId: newMemberSchemeId
        });
      }
      setIsAddMemberOpen(false);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPhone('');
      setNewMemberUnit('Unit 1');
    } catch (err) {
      console.error("Error creating member:", err);
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqTitle || !newReqDescription || !newReqSchemeId) return;
    setIsSubmittingRequest(true);
    try {
      if (onAddResidentRequest) {
        await onAddResidentRequest({
          schemeId: newReqSchemeId,
          unit: newReqUnit,
          title: newReqTitle.trim(),
          description: newReqDescription.trim(),
          priority: newReqPriority,
          requestType: newReqType,
          requestorName: newReqRequesterName.trim() || 'Super Admin',
          requestorRole: newReqRequesterRole
        });
      }
      setIsCreateRequestOpen(false);
      setNewReqTitle('');
      setNewReqDescription('');
      setNewReqUnit('Unit 1');
    } catch (err) {
      console.error("Error creating request:", err);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleSaveSchemeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScheme || !onUpdateScheme) return;
    await onUpdateScheme(editingScheme.id, {
      name: editSchemeName.trim(),
      lots: Number(editSchemeLots)
    });
    setEditingScheme(null);
  };

  const handleSaveMemberEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !onUpdateMember) return;
    await onUpdateMember(editingMember.id, {
      name: editMemberName.trim(),
      email: editMemberEmail.trim(),
      phone: editMemberPhone.trim(),
      role: editMemberRole,
      unitId: editMemberUnit.trim(),
      status: editMemberStatus
    });
    setEditingMember(null);
  };

  const handleSaveRequestEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !onUpdateResidentRequest) return;
    await onUpdateResidentRequest(selectedRequest.id, {
      title: editReqTitle.trim(),
      description: editReqDescription.trim(),
      priority: editReqPriority,
      status: editReqStatus
    });
    setSelectedRequest(prev => prev ? {
      ...prev,
      title: editReqTitle.trim(),
      description: editReqDescription.trim(),
      priority: editReqPriority,
      status: editReqStatus
    } : null);
    setIsEditingRequest(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !newCommentText.trim() || !onAddComment) return;
    onAddComment(selectedRequest.id, `[SUPER ADMIN]: ${newCommentText.trim()}`);
    setNewCommentText('');
  };

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

  const activePerms = (globalRolePermissions && Object.keys(globalRolePermissions).length > 0)
    ? globalRolePermissions
    : (() => {
        const m: Record<string, any> = {};
        ROLES_ORDER.forEach(r => {
          m[r] = getDefaultPermissionsForRole(r);
        });
        return m;
      })();

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#07090e] text-gray-900 dark:text-white font-sans transition-colors duration-300 flex flex-col overflow-x-hidden">
      
      {/* Top Super Admin Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <button 
              onClick={onBackToLanding}
              className="p-2.5 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-all border border-gray-200 dark:border-white/5 cursor-pointer shadow-sm"
              title="Return to Main Application"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#FF4757]/10 border border-[#FF4757]/20 text-[#FF4757] shadow-sm">
                <ShieldAlert size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight uppercase">Super Admin Console</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#00D4B2]/10 text-[#00A38C] border border-[#00D4B2]/20">
                    Master Mode
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Full CRUD master controls for Schemes, Users, Role Assignments, and Tickets.
                </p>
              </div>
            </div>
          </div>

          {/* Top Actions & Theme Switcher */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            {onRefreshData && (
              <button
                type="button"
                onClick={async () => {
                  setIsSyncing(true);
                  try {
                    await onRefreshData();
                  } finally {
                    setTimeout(() => setIsSyncing(false), 500);
                  }
                }}
                disabled={isSyncing}
                className="p-2.5 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title="Sync Database"
              >
                <RefreshCw size={16} className={`${isSyncing ? 'animate-spin text-[#00D4B2]' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync DB'}</span>
              </button>
            )}

            {setTheme && (
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-all cursor-pointer"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
              </button>
            )}

            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Assign / Add User</span>
            </button>

            <button
              onClick={() => setIsAddSchemeOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#00D4B2] hover:bg-[#00bda0] text-[#0B1121] font-bold text-xs shadow-md shadow-[#00D4B2]/20 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Register Scheme</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-6 space-y-6 flex-1">
        
        {/* Navigation Tabs with Smooth Animated Pill Design */}
        <div className="bg-gray-200/60 dark:bg-[#0d1117]/80 p-1.5 rounded-[22px] border border-gray-300/50 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none shadow-sm backdrop-blur-md">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[18px] font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === 'overview'
                ? 'bg-[#0B1121] dark:bg-white text-[#00D4B2] dark:text-[#0B1121] shadow-md shadow-[#0B1121]/20 dark:shadow-white/10 scale-[1.02]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
            }`}
          >
            <Activity size={15} className={activeTab === 'overview' ? 'text-[#00D4B2] dark:text-[#0B1121]' : ''} />
            <span>Overview & KPIs</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[18px] font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95 relative ${
              activeTab === 'requests'
                ? 'bg-[#0B1121] dark:bg-white text-[#00D4B2] dark:text-[#0B1121] shadow-md shadow-[#0B1121]/20 dark:shadow-white/10 scale-[1.02]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
            }`}
          >
            <FileText size={15} className={activeTab === 'requests' ? 'text-[#00D4B2] dark:text-[#0B1121]' : ''} />
            <span>Cross-Scheme Requests</span>
            {stats.openRequestsCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                activeTab === 'requests' ? 'bg-[#00D4B2] text-[#0B1121]' : 'bg-[#00D4B2]/20 text-[#00A38C] dark:text-[#00D4B2]'
              }`}>
                {stats.openRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('schemes')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[18px] font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === 'schemes'
                ? 'bg-[#0B1121] dark:bg-white text-[#00D4B2] dark:text-[#0B1121] shadow-md shadow-[#0B1121]/20 dark:shadow-white/10 scale-[1.02]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
            }`}
          >
            <Building2 size={15} className={activeTab === 'schemes' ? 'text-[#00D4B2] dark:text-[#0B1121]' : ''} />
            <span>Strata Schemes ({schemes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[18px] font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === 'users'
                ? 'bg-[#0B1121] dark:bg-white text-[#00D4B2] dark:text-[#0B1121] shadow-md shadow-[#0B1121]/20 dark:shadow-white/10 scale-[1.02]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
            }`}
          >
            <Users size={15} className={activeTab === 'users' ? 'text-[#00D4B2] dark:text-[#0B1121]' : ''} />
            <span>Global Users & Roles ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[18px] font-bold text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-95 ${
              activeTab === 'permissions'
                ? 'bg-[#0B1121] dark:bg-white text-[#00D4B2] dark:text-[#0B1121] shadow-md shadow-[#0B1121]/20 dark:shadow-white/10 scale-[1.02]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
            }`}
          >
            <Shield size={15} className={activeTab === 'permissions' ? 'text-[#00D4B2] dark:text-[#0B1121]' : ''} />
            <span>Global Permissions Matrix</span>
          </button>
        </div>

        {/* Search & Global Filter Bar */}
        {activeTab !== 'permissions' && activeTab !== 'overview' && (
          <div className="bg-white dark:bg-[#0d1117] p-4 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search across tickets, schemes, members, units..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/30 focus:border-[#00D4B2] transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 px-2">
                <Filter size={14} /> Filter:
              </div>

              {/* Scheme Filter */}
              <select
                value={selectedSchemeFilter}
                onChange={e => setSelectedSchemeFilter(e.target.value)}
                className="bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Schemes</option>
                {schemes.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                ))}
              </select>

              {/* Status Filter for Requests */}
              {activeTab === 'requests' && (
                <>
                  <select
                    value={selectedStatusFilter}
                    onChange={e => setSelectedStatusFilter(e.target.value)}
                    className="bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="new">New</option>
                    <option value="pending_triage">Pending Triage</option>
                    <option value="in_voting">In Voting</option>
                    <option value="approved">Approved</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <select
                    value={selectedPriorityFilter}
                    onChange={e => setSelectedPriorityFilter(e.target.value)}
                    className="bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="Emergency">Emergency Only</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </>
              )}

              {(searchQuery || selectedSchemeFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || selectedPriorityFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSchemeFilter('ALL');
                    setSelectedStatusFilter('ALL');
                    setSelectedPriorityFilter('ALL');
                  }}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs font-bold transition-all cursor-pointer"
                  title="Reset Filters"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW & KPIS */}
        {activeTab === 'overview' && (
          <div key="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
            
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-white dark:bg-[#0d1117] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm space-y-3 relative overflow-hidden group hover:border-[#00D4B2]/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Active Schemes</span>
                  <div className="p-2.5 rounded-2xl bg-[#00D4B2]/10 text-[#00A38C]">
                    <Building2 size={18} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalSchemes}</span>
                  <span className="text-xs font-bold text-gray-400">({stats.totalLots} Total Lots)</span>
                </div>
                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Fully synchronized in Supabase
                </div>
              </div>

              <div className="bg-white dark:bg-[#0d1117] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm space-y-3 relative overflow-hidden group hover:border-[#0055FF]/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Platform Users</span>
                  <div className="p-2.5 rounded-2xl bg-[#0055FF]/10 text-[#0055FF]">
                    <Users size={18} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#0055FF]">{stats.totalUsers}</span>
                  <span className="text-xs font-bold text-gray-400">Registered</span>
                </div>
                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  {stats.activeManagers} Strata Managers managing sites
                </div>
              </div>

              <div className="bg-white dark:bg-[#0d1117] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Pending Requests</span>
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                    <FileText size={18} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-500">{stats.openRequestsCount}</span>
                  <span className="text-xs font-bold text-gray-400">/ {stats.totalRequests} Total</span>
                </div>
                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Across all strata building portfolios
                </div>
              </div>

              <div className="bg-white dark:bg-[#0d1117] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm space-y-3 relative overflow-hidden group hover:border-[#FF4757]/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Emergency Tickets</span>
                  <div className="p-2.5 rounded-2xl bg-[#FF4757]/10 text-[#FF4757]">
                    <AlertTriangle size={18} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#FF4757]">{stats.emergencyRequestsCount}</span>
                  <span className="text-xs font-bold text-gray-400">Active</span>
                </div>
                <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Direct master editing & dispatch
                </div>
              </div>

            </div>

            {/* Quick Actions & Recent Platform Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Recent Requests Feed across schemes */}
              <div className="lg:col-span-2 bg-white dark:bg-[#0d1117] rounded-3xl p-6 border border-gray-200 dark:border-white/5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">
                      Live Platform Requests Activity
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Latest tickets logged across all strata schemes.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className="text-xs font-bold text-[#0055FF] dark:text-[#00D4B2] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View All <ChevronRight size={14} />
                  </button>
                </div>

                {requests.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-gray-400 text-xs">
                    No requests currently logged in the system.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {requests.slice(0, 5).map(req => (
                      <div 
                        key={req.id}
                        onClick={() => {
                          setSelectedRequest(req);
                          setActiveTab('requests');
                        }}
                        className="py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center ${
                            req.priority === 'Emergency' ? 'bg-[#FF4757]/10 text-[#FF4757]' :
                            req.priority === 'High' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-blue-500/10 text-[#0055FF]'
                          }`}>
                            {req.priority === 'Emergency' ? (
                              <AlertTriangle size={14} className="text-[#FF4757]" />
                            ) : req.priority === 'High' ? (
                              <Zap size={14} className="text-amber-500" />
                            ) : (
                              <FileText size={14} className="text-[#0055FF]" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#0055FF] dark:group-hover:text-[#00D4B2] transition-colors">
                              {req.title}
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                              <span className="font-bold text-gray-700 dark:text-gray-300">{req.schemeId}</span>
                              <span>•</span>
                              <span>{req.unit}</span>
                              <span>•</span>
                              <span>By {req.requestorName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            req.status === 'resolved' ? 'bg-[#00D4B2]/10 text-[#00A38C]' :
                            req.status === 'approved' ? 'bg-blue-500/10 text-[#0055FF]' :
                            req.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                            'bg-amber-500/10 text-amber-600'
                          }`}>
                            {req.status.replace(/_/g, ' ')}
                          </span>
                          <ChevronRight size={14} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Col: Schemes Audit & Shortcuts */}
              <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-6 border border-gray-200 dark:border-white/5 shadow-sm space-y-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">
                  Scheme Quick Audit
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Inspect building lots, assigned staff, and open tickets securely.
                </p>

                <div className="space-y-2">
                  {schemes.map(s => (
                    <div 
                      key={s.id}
                      className="p-3 rounded-2xl bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/5 flex items-center justify-between hover:border-[#00D4B2]/50 transition-all"
                    >
                      <div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">{s.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{s.id} • {s.lots} Lots</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingScheme(s);
                            setEditSchemeName(s.name);
                            setEditSchemeLots(s.lots);
                          }}
                          className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all cursor-pointer"
                          title="Edit Scheme"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => setSelectedSchemeForAudit(s)}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 hover:bg-[#00D4B2] hover:text-[#0B1121] text-gray-700 dark:text-gray-200 text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                          title="Audit Scheme Details"
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-2">
                  <button
                    onClick={() => setActiveTab('permissions')}
                    className="w-full py-2.5 rounded-xl bg-[#0055FF]/10 hover:bg-[#0055FF]/20 text-[#0055FF] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Shield size={14} />
                    <span>Configure Global Permissions Matrix</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: CROSS-SCHEME REQUESTS (MASTER TRIAGE & OPERATIONS) */}
        {activeTab === 'requests' && (
          <div key="requests" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  All Requests & Maintenance Tickets ({filteredRequests.length})
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Global operational oversight. Master Admins can create, review, edit fields, triage, approve, reject, or assign tickets across all schemes.
                </p>
              </div>
              <button
                onClick={() => {
                  setNewReqSchemeId(schemes[0]?.id || '');
                  setIsCreateRequestOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#00D4B2] hover:bg-[#00bda0] text-[#0B1121] font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Plus size={16} /> Create Master Request
              </button>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-12 text-center border border-gray-200 dark:border-white/5 space-y-3">
                <FileText size={36} className="mx-auto text-gray-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">No requests match your current filters</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">Try clearing search keywords or changing the scheme filter.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-[#1a1d27]/80 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-white/5">
                        <th className="py-4 px-5">Ticket Info</th>
                        <th className="py-4 px-5">Scheme & Location</th>
                        <th className="py-4 px-5">Requester</th>
                        <th className="py-4 px-5">Priority</th>
                        <th className="py-4 px-5">Status</th>
                        <th className="py-4 px-5 text-right">Master Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                      {filteredRequests.map(req => (
                        <tr 
                          key={req.id} 
                          className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Ticket Info */}
                          <td className="py-4 px-5">
                            <div className="font-bold text-gray-900 dark:text-white text-sm">
                              {req.title}
                            </div>
                            <div className="text-[10px] text-gray-400 line-clamp-1 max-w-xs mt-0.5">
                              {req.description}
                            </div>
                            <div className="text-[9px] font-mono text-gray-400 mt-1">
                              ID: {req.id} • {new Date(req.createdAt).toLocaleDateString()}
                            </div>
                          </td>

                          {/* Scheme & Location */}
                          <td className="py-4 px-5">
                            <div className="font-black text-gray-800 dark:text-gray-200">
                              {req.schemeId}
                            </div>
                            <div className="text-[11px] text-gray-500 font-bold mt-0.5">
                              {req.unit}
                            </div>
                          </td>

                          {/* Requester */}
                          <td className="py-4 px-5">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {req.requestorName}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {req.requestorRole} • {req.requestorEmail}
                            </div>
                          </td>

                          {/* Priority */}
                          <td className="py-4 px-5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1.5 ${
                              req.priority === 'Emergency' ? 'bg-[#FF4757]/15 text-[#FF4757] border border-[#FF4757]/30 animate-pulse' :
                              req.priority === 'High' ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30' :
                              'bg-blue-500/10 text-[#0055FF] border border-blue-500/20'
                            }`}>
                              {req.priority === 'Emergency' ? (
                                <AlertTriangle size={11} className="text-[#FF4757]" />
                              ) : req.priority === 'High' ? (
                                <Zap size={11} className="text-amber-600" />
                              ) : (
                                <FileText size={11} className="text-[#0055FF]" />
                              )}
                              <span>{req.priority}</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              req.status === 'resolved' ? 'bg-[#00D4B2]/10 text-[#00A38C] border border-[#00D4B2]/20' :
                              req.status === 'approved' ? 'bg-blue-500/10 text-[#0055FF] border border-blue-500/20' :
                              req.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                              'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            }`}>
                              {req.status.replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setIsEditingRequest(false);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-[#00D4B2] hover:text-[#0B1121] text-gray-700 dark:text-gray-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Eye size={13} />
                                <span>Inspect & Edit</span>
                              </button>

                              {onTriageRequest && req.status !== 'resolved' && (
                                <button
                                  onClick={() => onTriageRequest(req.id, { status: 'resolved' })}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#00D4B2]/10 hover:bg-[#00D4B2] text-[#00A38C] hover:text-[#0B1121] text-xs font-bold transition-all cursor-pointer"
                                  title="Mark Resolved"
                                >
                                  <Check size={13} />
                                </button>
                              )}

                              {onCloseRequest && req.status !== 'closed' && (
                                <button
                                  onClick={() => onCloseRequest(req.id, 'Super Admin closed request.')}
                                  className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                                  title="Close Request"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STRATA SCHEMES & LOTS */}
        {activeTab === 'schemes' && (
          <div key="schemes" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  Registered Strata Schemes ({filteredSchemes.length})
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Global building portfolios. Master admins can register, directly edit scheme metadata, audit lots, or remove schemes.
                </p>
              </div>
              <button
                onClick={() => setIsAddSchemeOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#00D4B2] hover:bg-[#00bda0] text-[#0B1121] font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Plus size={16} /> Register Scheme
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSchemes.map(s => {
                const schemeMembers = members.filter(m => m.schemeId === s.id);
                const schemeRequests = requests.filter(r => r.schemeId === s.id && r.status !== 'resolved');

                return (
                  <div 
                    key={s.id}
                    className="bg-white dark:bg-[#0d1117] rounded-3xl p-6 border border-gray-200 dark:border-white/5 shadow-sm space-y-4 flex flex-col justify-between hover:border-[#00D4B2]/40 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="p-3 rounded-2xl bg-[#0055FF]/10 text-[#0055FF]">
                          <Building2 size={22} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingScheme(s);
                              setEditSchemeName(s.name);
                              setEditSchemeLots(s.lots);
                            }}
                            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                            title="Edit Scheme Details"
                          >
                            <Edit3 size={14} />
                          </button>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#00D4B2]/10 text-[#00A38C] border border-[#00D4B2]/20">
                            {s.lots} Lots
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-gray-900 dark:text-white">{s.name}</h3>
                        <p className="text-xs font-mono text-gray-400">Scheme ID: {s.id}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1d27]">
                          <div className="text-[10px] text-gray-400 font-bold uppercase">Residents / Users</div>
                          <div className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{schemeMembers.length}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1d27]">
                          <div className="text-[10px] text-gray-400 font-bold uppercase">Open Tickets</div>
                          <div className="text-sm font-black text-amber-500 mt-0.5">{schemeRequests.length}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedSchemeForAudit(s)}
                        className="flex-1 py-2 rounded-xl bg-[#0B1121] dark:bg-white text-[#00D4B2] dark:text-[#0B1121] text-xs font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Eye size={14} />
                        <span>Inspect Scheme</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to de-register and delete ${s.name} (${s.id})? This action cannot be undone.`)) {
                            onDeleteScheme(s.id);
                          }
                        }}
                        className="p-2 rounded-xl text-[#FF4757] hover:bg-[#FF4757]/10 border border-transparent hover:border-[#FF4757]/30 transition-all cursor-pointer"
                        title="Delete Scheme"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: GLOBAL USERS & PERMISSIONS */}
        {activeTab === 'users' && (
          <div key="users" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  Global Platform Users & Role Assignments ({filteredMembers.length})
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Directory of all active accounts. Master admins can assign new users to schemes, modify existing roles, and configure individual permission overrides.
                </p>
              </div>
              <button
                onClick={() => {
                  setNewMemberSchemeId(schemes[0]?.id || '');
                  setIsAddMemberOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <UserPlus size={16} /> Assign / Add User
              </button>
            </div>

            <div className="bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[#1a1d27]/80 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-white/5">
                      <th className="py-4 px-5">User Details</th>
                      <th className="py-4 px-5">Assigned Scheme</th>
                      <th className="py-4 px-5">Role & Unit</th>
                      <th className="py-4 px-5">Contact Details</th>
                      <th className="py-4 px-5">Status</th>
                      <th className="py-4 px-5 text-right">Master Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                    {filteredMembers.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-bold text-gray-900 dark:text-white text-sm">{m.name}</div>
                          <div className="text-[10px] font-mono text-gray-400">ID: {m.id}</div>
                        </td>
                        <td className="py-4 px-5 font-bold text-gray-800 dark:text-gray-200">
                          {m.schemeId}
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#1a1d27] text-gray-800 dark:text-gray-200">
                            {m.role}
                          </span>
                          <div className="text-[10px] text-gray-400 mt-1 font-semibold">{m.unitId} (Lot {m.lotNumber})</div>
                        </td>
                        <td className="py-4 px-5 space-y-0.5 text-gray-600 dark:text-gray-300 text-[11px]">
                          <div className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400" /> {m.email}</div>
                          {m.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400" /> {m.phone}</div>}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            m.status === 'Active' ? 'bg-[#00D4B2]/10 text-[#00A38C] border border-[#00D4B2]/20' : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingMember(m);
                                setEditMemberName(m.name);
                                setEditMemberEmail(m.email);
                                setEditMemberPhone(m.phone || '');
                                setEditMemberRole(m.role);
                                setEditMemberUnit(m.unitId);
                                setEditMemberStatus(m.status);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-[#00D4B2] hover:text-[#0B1121] text-gray-700 dark:text-gray-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Edit User Profile"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => setMemberPermissionsAudit(m)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#0055FF]/10 hover:bg-[#0055FF] text-[#0055FF] hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="View & Edit Individual Overrides"
                            >
                              <Key size={13} />
                              <span>Overrides</span>
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Remove user ${m.name} from scheme ${m.schemeId}?`)) {
                                  onDeleteMember(m.id);
                                }
                              }}
                              className="p-1.5 rounded-xl text-[#FF4757] hover:bg-[#FF4757]/10 transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GLOBAL DEFAULT PERMISSIONS MATRIX */}
        {activeTab === 'permissions' && (
          <div key="permissions" className="bg-white dark:bg-[#0d1117] rounded-3xl p-6 border border-gray-200 dark:border-white/5 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  Global Role Default Permissions Matrix
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                  Configure the master permission presets applied to newly created strata schemes across Australia. 
                  Strata managers inherit these defaults but can override them on a per-building basis.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#00A38C] bg-[#00D4B2]/10 px-3 py-1.5 rounded-full border border-[#00D4B2]/20 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Live Supabase Synced
                </span>
              </div>
            </div>
            
            <div className="rounded-3xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#0d1117] shadow-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#1a1d27] border-b border-gray-200 dark:border-white/5">
                    <th className="p-4 px-5 font-black uppercase tracking-wider text-gray-900 dark:text-white w-64">
                      Module / Role Access
                    </th>
                    {ROLES_ORDER.map(role => (
                      <th key={role} className="p-4 font-bold text-gray-900 dark:text-white text-center whitespace-nowrap text-[11px]">
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {CATEGORY_MAP.map(cat => (
                    <React.Fragment key={cat.name}>
                      <tr className="bg-gray-100/80 dark:bg-[#0B1121] border-t-2 border-b border-gray-200 dark:border-white/10">
                        <td colSpan={ROLES_ORDER.length + 1} className="p-3 px-5 font-black text-[#0055FF] dark:text-[#00D4B2] text-[11px] uppercase tracking-wider">
                          {cat.name}
                        </td>
                      </tr>
                      {cat.perms.map(permName => (
                        <tr key={permName} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="p-3 px-5 text-gray-700 dark:text-gray-300 font-semibold border-r border-gray-100 dark:border-white/5">
                            {permName}
                          </td>
                          {ROLES_ORDER.map(role => {
                            const rolePerms = activePerms[role] || [];
                            const permObj = rolePerms.find(p => p.label === permName);
                            if (!permObj) return <td key={role} className="p-3 text-center text-gray-300 dark:text-gray-600 border-r border-gray-100 dark:border-white/5 last:border-0">-</td>;
                            return (
                              <td key={role} className="p-3 text-center border-r border-gray-100 dark:border-white/5 last:border-0">
                                <div className="flex justify-center">
                                  {permObj.locked ? (
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">
                                      Locked
                                    </span>
                                  ) : (
                                    <CustomCheckbox
                                      checked={permObj.active}
                                      onChange={() => onToggleGlobalPermission?.(role, permName)}
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
            </div>
          </div>
        )}

      </main>

      {/* MODAL 1: REGISTER NEW STRATA SCHEME */}
      {isAddSchemeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsAddSchemeOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-[#00D4B2]/10 text-[#00A38C] w-fit">
                <Building2 size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Register Strata Scheme</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Create a new building portfolio. Units roster and base permissions will be auto-generated.
              </p>
            </div>

            <form onSubmit={handleCreateScheme} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Scheme ID (e.g. SP99482)</label>
                <input
                  type="text"
                  required
                  placeholder="SP10293"
                  value={newSchemeId}
                  onChange={e => setNewSchemeId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:border-[#00D4B2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Scheme Name</label>
                <input
                  type="text"
                  required
                  placeholder="The Grand Horizon Apartments"
                  value={newSchemeName}
                  onChange={e => setNewSchemeName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:border-[#00D4B2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Total Lots Count</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={500}
                  value={newSchemeLots}
                  onChange={e => setNewSchemeLots(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:border-[#00D4B2]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingScheme}
                className="w-full py-3.5 rounded-2xl bg-[#00D4B2] hover:bg-[#00bda0] text-[#0B1121] font-black text-xs uppercase tracking-wider transition-all shadow-md mt-4 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingScheme ? 'Registering Scheme...' : 'Create & Sync Scheme'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN / ADD USER TO SCHEME */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsAddMemberOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0055FF]/10 text-[#0055FF] text-xs font-bold">
                <UserPlus size={14} /> Assign / Add User
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Assign User to Scheme</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Register a user and grant them designated role access on a specific strata scheme.
              </p>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Target Scheme</label>
                <select
                  value={newMemberSchemeId}
                  onChange={e => setNewMemberSchemeId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  {schemes.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Smith"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-bold focus:outline-none focus:border-[#00D4B2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-bold focus:outline-none focus:border-[#00D4B2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Role</label>
                  <select
                    value={newMemberRole}
                    onChange={e => {
                      const r = e.target.value as MemberRole;
                      setNewMemberRole(r);
                      if (r === 'Strata Manager' || r === 'Building Manager') {
                        setNewMemberUnit('HQ / Management');
                      } else {
                        setNewMemberUnit('Unit 1');
                      }
                    }}
                    className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Strata Manager">Strata Manager</option>
                    <option value="Building Manager">Building Manager</option>
                    <option value="Committee Member">Committee Member</option>
                    <option value="Lot Owner">Lot Owner</option>
                    <option value="Resident">Resident</option>
                    <option value="Tenant">Tenant</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Unit ID</label>
                  <input
                    type="text"
                    required
                    value={newMemberUnit}
                    onChange={e => setNewMemberUnit(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-bold focus:outline-none focus:border-[#00D4B2]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingMember}
                className="w-full py-3.5 rounded-2xl bg-[#0055FF] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md mt-4 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingMember ? 'Assigning User...' : 'Assign User to Scheme'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE MASTER REQUEST / TICKET */}
      {isCreateRequestOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsCreateRequestOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D4B2]/10 text-[#00A38C] text-xs font-bold">
                <FileText size={14} /> Master Ticket Creator
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Create Cross-Scheme Ticket</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Log a maintenance request or emergency ticket directly under any strata building.
              </p>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Target Scheme</label>
                <select
                  value={newReqSchemeId}
                  onChange={e => setNewReqSchemeId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  {schemes.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Ticket Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lift 2 Hydraulic Pressure Fault"
                  value={newReqTitle}
                  onChange={e => setNewReqTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-bold focus:outline-none focus:border-[#00D4B2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed description of the issue..."
                  value={newReqDescription}
                  onChange={e => setNewReqDescription(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-medium focus:outline-none focus:border-[#00D4B2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Priority</label>
                  <select
                    value={newReqPriority}
                    onChange={e => setNewReqPriority(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Emergency">Emergency Priority</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Unit / Location</label>
                  <input
                    type="text"
                    required
                    placeholder="Common Area / Unit 10"
                    value={newReqUnit}
                    onChange={e => setNewReqUnit(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-bold focus:outline-none focus:border-[#00D4B2]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingRequest}
                className="w-full py-3.5 rounded-2xl bg-[#00D4B2] hover:bg-[#00bda0] text-[#0B1121] font-black text-xs uppercase tracking-wider transition-all shadow-md mt-4 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingRequest ? 'Logging Ticket...' : 'Create Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT SCHEME DETAILS */}
      {editingScheme && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingScheme(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0055FF]/10 text-[#0055FF] text-xs font-bold">
                <Edit3 size={14} /> Edit Scheme
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Modify {editingScheme.id}</h3>
            </div>

            <form onSubmit={handleSaveSchemeEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Scheme Name</label>
                <input
                  type="text"
                  required
                  value={editSchemeName}
                  onChange={e => setEditSchemeName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:border-[#00D4B2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Total Registered Lots</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={500}
                  value={editSchemeLots}
                  onChange={e => setEditSchemeLots(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-3 text-xs font-bold focus:outline-none focus:border-[#00D4B2]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#00D4B2] hover:bg-[#00bda0] text-[#0B1121] font-black text-xs uppercase tracking-wider transition-all shadow-md mt-4 cursor-pointer"
              >
                Save Scheme Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT USER PROFILE DIRECTLY */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingMember(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0055FF]/10 text-[#0055FF] text-xs font-bold">
                <UserCheck size={14} /> Master User Edit
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{editingMember.name}</h3>
              <p className="text-xs font-mono text-gray-400">Scheme: {editingMember.schemeId}</p>
            </div>

            <form onSubmit={handleSaveMemberEdit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={editMemberName}
                  onChange={e => setEditMemberName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-bold focus:outline-none focus:border-[#00D4B2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={editMemberEmail}
                  onChange={e => setEditMemberEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-bold focus:outline-none focus:border-[#00D4B2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Role</label>
                  <select
                    value={editMemberRole}
                    onChange={e => setEditMemberRole(e.target.value as MemberRole)}
                    className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Strata Manager">Strata Manager</option>
                    <option value="Building Manager">Building Manager</option>
                    <option value="Committee Member">Committee Member</option>
                    <option value="Lot Owner">Lot Owner</option>
                    <option value="Resident">Resident</option>
                    <option value="Tenant">Tenant</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Unit ID</label>
                  <input
                    type="text"
                    required
                    value={editMemberUnit}
                    onChange={e => setEditMemberUnit(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-bold focus:outline-none focus:border-[#00D4B2]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Account Status</label>
                <select
                  value={editMemberStatus}
                  onChange={e => setEditMemberStatus(e.target.value as any)}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Invited">Invited</option>
                  <option value="Restricted">Restricted</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#00D4B2] hover:bg-[#00bda0] text-[#0B1121] font-black text-xs uppercase tracking-wider transition-all shadow-md mt-3 cursor-pointer"
              >
                Update Member
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: INDIVIDUAL USER PERMISSION OVERRIDES */}
      {memberPermissionsAudit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200 my-8">
            <button
              onClick={() => setMemberPermissionsAudit(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0055FF]/10 text-[#0055FF] text-xs font-bold">
                <Key size={14} /> Individual Permissions Override
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{memberPermissionsAudit.name}</h3>
              <p className="text-xs text-gray-400">
                Scheme: <strong>{memberPermissionsAudit.schemeId}</strong> • Base Role: <strong>{memberPermissionsAudit.role}</strong>
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
              {CATEGORY_MAP.map(cat => (
                <div key={cat.name} className="space-y-2">
                  <div className="text-[11px] font-black text-[#0055FF] dark:text-[#00D4B2] uppercase tracking-wider">
                    {cat.name}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.perms.map(permName => {
                      const override = memberPermissionsAudit.individualPermissions?.find(p => p.label === permName);
                      const basePerms = activePerms[memberPermissionsAudit.role] || [];
                      const basePermObj = basePerms.find(p => p.label === permName);
                      const isActive = override ? override.active : (basePermObj ? basePermObj.active : false);

                      return (
                        <div 
                          key={permName}
                          onClick={() => {
                            if (onToggleIndividualPermission) {
                              onToggleIndividualPermission(memberPermissionsAudit.id, permName);
                              setMemberPermissionsAudit(prev => {
                                if (!prev) return null;
                                const existing = prev.individualPermissions || [];
                                const idx = existing.findIndex(p => p.label === permName);
                                let updated;
                                if (idx >= 0) {
                                  updated = existing.map((p, i) => i === idx ? { ...p, active: !p.active } : p);
                                } else {
                                  updated = [...existing, { label: permName, active: !isActive }];
                                }
                                return { ...prev, individualPermissions: updated };
                              });
                            }
                          }}
                          className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/5 flex items-center justify-between cursor-pointer hover:border-[#00D4B2]/40 transition-all"
                        >
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{permName}</span>
                          <CustomCheckbox checked={isActive} onChange={() => {}} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex justify-end">
              <button
                onClick={() => setMemberPermissionsAudit(null)}
                className="px-5 py-2 rounded-2xl bg-[#00D4B2] hover:bg-[#00bda0] text-[#0B1121] font-bold text-xs cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: DETAILED REQUEST INSPECTION & MASTER EDITING */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200 my-8">
            <button
              onClick={() => {
                setSelectedRequest(null);
                setIsEditingRequest(false);
              }}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    selectedRequest.priority === 'Emergency' ? 'bg-[#FF4757]/15 text-[#FF4757] border border-[#FF4757]/30' :
                    'bg-blue-500/10 text-[#0055FF]'
                  }`}>
                    {selectedRequest.priority} Priority
                  </span>
                  <span className="text-xs font-bold text-gray-400">• Scheme {selectedRequest.schemeId}</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">{selectedRequest.title}</h3>
                <p className="text-xs text-gray-400">
                  Submitted by <strong>{selectedRequest.requestorName}</strong> ({selectedRequest.requestorRole}, {selectedRequest.unit}) on {new Date(selectedRequest.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsEditingRequest(!isEditingRequest);
                  setEditReqTitle(selectedRequest.title);
                  setEditReqDescription(selectedRequest.description);
                  setEditReqPriority(selectedRequest.priority);
                  setEditReqStatus(selectedRequest.status);
                }}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-[#00D4B2] hover:text-[#0B1121] text-gray-700 dark:text-gray-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 size={13} />
                <span>{isEditingRequest ? 'Cancel Edit' : 'Edit Request'}</span>
              </button>
            </div>

            {/* Master Edit Form if Editing */}
            {isEditingRequest ? (
              <form onSubmit={handleSaveRequestEdit} className="space-y-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Ticket Title</label>
                  <input
                    type="text"
                    required
                    value={editReqTitle}
                    onChange={e => setEditReqTitle(e.target.value)}
                    className="w-full bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-[#00D4B2]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={editReqDescription}
                    onChange={e => setEditReqDescription(e.target.value)}
                    className="w-full bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-[#00D4B2]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Priority</label>
                    <select
                      value={editReqPriority}
                      onChange={e => setEditReqPriority(e.target.value as any)}
                      className="w-full bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Emergency">Emergency Priority</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Status</label>
                    <select
                      value={editReqStatus}
                      onChange={e => setEditReqStatus(e.target.value as any)}
                      className="w-full bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="new">New</option>
                      <option value="pending_triage">Pending Triage</option>
                      <option value="in_voting">In Voting</option>
                      <option value="approved">Approved</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#00D4B2] hover:bg-[#00bda0] text-[#0B1121] font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
                >
                  Save Ticket Updates
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/5 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Request Description</div>
                <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {selectedRequest.description}
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Discussion & Audit Trail ({selectedRequest.comments?.length || 0})</div>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                {(!selectedRequest.comments || selectedRequest.comments.length === 0) ? (
                  <div className="text-xs text-gray-400 italic">No comments added yet.</div>
                ) : (
                  selectedRequest.comments.map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-bold text-gray-700 dark:text-gray-300">{c.authorName} ({c.authorRole})</span>
                        <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              {onAddComment && (
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add an administrative instruction or note..."
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#00D4B2]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-2xl bg-[#0055FF] text-white font-bold text-xs hover:bg-blue-600 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Send size={14} /> Send
                  </button>
                </form>
              )}
            </div>

            {/* Quick Status Control Buttons */}
            {onTriageRequest && (
              <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-gray-400">Super Admin Direct Action:</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onTriageRequest(selectedRequest.id, { status: 'approved' });
                      setSelectedRequest(prev => prev ? { ...prev, status: 'approved' } : null);
                    }}
                    className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500 text-[#0055FF] hover:text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      onTriageRequest(selectedRequest.id, { status: 'resolved' });
                      setSelectedRequest(prev => prev ? { ...prev, status: 'resolved' } : null);
                    }}
                    className="px-3 py-2 rounded-xl bg-[#00D4B2]/10 hover:bg-[#00D4B2] text-[#00A38C] hover:text-[#0B1121] font-bold text-xs transition-all cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => {
                      onTriageRequest(selectedRequest.id, { status: 'rejected' });
                      setSelectedRequest(prev => prev ? { ...prev, status: 'rejected' } : null);
                    }}
                    className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 8: SCHEME MASTER AUDIT MODAL (STRICTLY WITHIN ADMIN SECURITY BOUNDS) */}
      {selectedSchemeForAudit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-3xl w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200 my-8">
            <button
              onClick={() => setSelectedSchemeForAudit(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D4B2]/10 text-[#00A38C] text-xs font-bold">
                  <Building2 size={14} /> Scheme Audit
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{selectedSchemeForAudit.name}</h3>
                <p className="text-xs font-mono text-gray-400">Scheme ID: {selectedSchemeForAudit.id} • {selectedSchemeForAudit.lots} Lots</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setNewMemberSchemeId(selectedSchemeForAudit.id);
                    setIsAddMemberOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus size={14} />
                  <span>Assign User</span>
                </button>
                <button
                  onClick={() => {
                    setEditingScheme(selectedSchemeForAudit);
                    setEditSchemeName(selectedSchemeForAudit.name);
                    setEditSchemeLots(selectedSchemeForAudit.lots);
                    setSelectedSchemeForAudit(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-[#00D4B2] hover:text-[#0B1121] text-gray-700 dark:text-gray-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 size={14} />
                  <span>Edit Scheme</span>
                </button>
              </div>
            </div>

            {/* Scheme Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1a1d27] border border-gray-100 dark:border-white/5">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Assigned Users</div>
                <div className="text-xl font-black text-gray-900 dark:text-white mt-1">
                  {members.filter(m => m.schemeId === selectedSchemeForAudit.id).length}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1a1d27] border border-gray-100 dark:border-white/5">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Total Tickets</div>
                <div className="text-xl font-black text-[#0055FF] mt-1">
                  {requests.filter(r => r.schemeId === selectedSchemeForAudit.id).length}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1a1d27] border border-gray-100 dark:border-white/5">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Open Requests</div>
                <div className="text-xl font-black text-amber-500 mt-1">
                  {requests.filter(r => r.schemeId === selectedSchemeForAudit.id && r.status !== 'resolved').length}
                </div>
              </div>
            </div>

            {/* Members in this Scheme */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Registered Residents & Staff</h4>
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5 bg-gray-50/50 dark:bg-[#1a1d27]/40 rounded-2xl p-3 border border-gray-100 dark:border-white/5">
                {members.filter(m => m.schemeId === selectedSchemeForAudit.id).length === 0 ? (
                  <div className="text-xs text-gray-400 py-3 text-center">No members assigned to this building yet.</div>
                ) : (
                  members.filter(m => m.schemeId === selectedSchemeForAudit.id).map(m => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">{m.name}</span>
                        <span className="text-gray-400 ml-2">({m.email})</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                        {m.role} • {m.unitId}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Master Actions */}
            <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
              <button
                onClick={() => {
                  if (confirm(`De-register and delete ${selectedSchemeForAudit.name}?`)) {
                    onDeleteScheme(selectedSchemeForAudit.id);
                    setSelectedSchemeForAudit(null);
                  }
                }}
                className="px-4 py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Delete Scheme
              </button>

              <button
                onClick={() => setSelectedSchemeForAudit(null)}
                className="px-5 py-2.5 rounded-2xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// End AdminView
// View: Real-time KPI Metric Counters
// View: Emergency Ticket High-Priority Flags
// View: Scheme Audit and Inspection Suite
// View: User Role Assignment Modal Logic
// View: Master Ticket Creation Workflow
// Animation: Tab Pill Glowing Indicator
// Animation: Slide-in and Fade-in Keyframes
// Animation: Card Hover Transform and Scale
// Animation: Modal Backdrop Blur Layering
// Animation: Live KPI Pulse Indicators