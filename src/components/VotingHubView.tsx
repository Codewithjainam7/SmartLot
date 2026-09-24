// @smartlot/component
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CustomSelect, SelectOption } from './core/CustomSelect';
import { 
  Motion, 
  MotionVote, 
  ResidentRequest, 
  SCMOffice,
  MotionAttachment,
  CreateMotionPayload
} from '../store/smartLotStore';
import { 
  Vote, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Clock, 
  MessageSquare, 
  Send, 
  AlertCircle, 
  ShieldAlert, 
  FileText, 
  Building2, 
  DollarSign, 
  UserCheck, 
  Users, 
  Filter, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  ExternalLink, 
  Check, 
  AlertTriangle, 
  Wrench, 
  Calendar,
  X,
  HelpCircle,
  TrendingUp,
  RotateCcw,
  Printer,
  Lock,
  Unlock,
  Shield,
  FileCheck,
  Eye,
  Info,
  Layers,
  ArrowRight,
  UploadCloud,
  CheckCircle,
  ArrowLeft,
  Scale,
  Plus,
  LayoutGrid,
  List
} from 'lucide-react';

interface VotingHubViewProps {
  motions: Motion[];
  requests: ResidentRequest[];
  onCreateMotion?: (payload: CreateMotionPayload) => Motion | void;
  onCastBallot: (motionId: string, vote: MotionVote, comment?: string) => void;
  onRequestRFI?: (motionId: string, question: string, extendedDays: number) => void;
  onSubmitRevisedProposal?: (motionId: string, note: string, attachments?: MotionAttachment[]) => void;
  onRestartVoting?: (motionId: string, reason: string) => void;
  onSendSCMReminder?: (motionId: string, memberName: string) => void;
  onSendBlastReminder?: (motionId: string) => void;
  onExtendDeadline?: (motionId: string, days: number, reason?: string) => void;
  onMarkUnresolved?: (motionId: string, reason: string) => void;
  onCloseVotingEarly: (motionId: string, reason: string) => void;
  onResolveMotion: (motionId: string, outcome: 'passed' | 'rejected') => void;
  onAddComment: (motionId: string, text: string) => void;
  onNavigateToRequest?: (requestId: string) => void;
  onInitiateWorkOrder?: (motionId: string) => void;
  activePersonaName: string;
  activePersonaRole: string;
  activeSchemeName?: string;
  activeSchemeId?: string;
}

export function VotingHubView({
  motions,
  requests,
  onCreateMotion,
  onCastBallot,
  onRequestRFI,
  onSubmitRevisedProposal,
  onRestartVoting,
  onSendSCMReminder,
  onSendBlastReminder,
  onExtendDeadline,
  onMarkUnresolved,
  onCloseVotingEarly,
  onResolveMotion,
  onAddComment,
  onNavigateToRequest,
  onInitiateWorkOrder,
  activePersonaName,
  activePersonaRole,
  activeSchemeName = 'Current Scheme',
  activeSchemeId
}: VotingHubViewProps) {
  // Scope: 'all' shows all 4 portfolio motions; 'scheme' filters to activeSchemeId
  const [schemeScope, setSchemeScope] = useState<'all' | 'scheme'>('all');
  const schemeMotions = schemeScope === 'all' 
    ? motions 
    : motions.filter(m => !m.schemeId || !activeSchemeId || m.schemeId === activeSchemeId);

  // View state: 'list' (Executive Motions Hub) or 'detail' (Full-Page Motion Governance Workspace)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [motionDisplayMode, setMotionDisplayMode] = useState<'table' | 'cards'>('table');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'passed' | 'unresolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMotionFilterDropdownOpen, setIsMotionFilterDropdownOpen] = useState(false);
  const motionFilterDropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (motionFilterDropdownRef.current && !motionFilterDropdownRef.current.contains(e.target as Node)) {
        setIsMotionFilterDropdownOpen(false);
      }
    };
    if (isMotionFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMotionFilterDropdownOpen]);

  // Create New Vote Modal (Strata Manager)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createSummary, setCreateSummary] = useState('');
  const [createCategory, setCreateCategory] = useState('Repairs & Maintenance');
  const [createLinkedRequestId, setCreateLinkedRequestId] = useState('');
  const [createDeadlineDays, setCreateDeadlineDays] = useState(7);
  const [createVendorName, setCreateVendorName] = useState('');
  const [createEstimatedCost, setCreateEstimatedCost] = useState('');
  const [selectedMotionId, setSelectedMotionId] = useState<string>(
    schemeMotions.find(m => m.id === 'MOT-CAV-501')?.id || schemeMotions[0]?.id || ''
  );
  const [commentInput, setCommentInput] = useState('');
  const [scmBallotComment, setScmBallotComment] = useState('');
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  // Modals state
  const [showReportModal, setShowReportModal] = useState(false);
  
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [restartReason, setRestartReason] = useState('');

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendDaysInput, setExtendDaysInput] = useState(7);
  const [extendReasonInput, setExtendReasonInput] = useState('');

  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitNote, setResubmitNote] = useState('');

  // Close Voting Modal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeModalTab, setCloseModalTab] = useState<'before' | 'after'>('before');
  const [closeReasonInput, setCloseReasonInput] = useState('');

  // ── Permission Matrix (per Australian Strata Law / NSW SSMA 2015 s 106) ──
  const roleLower = activePersonaRole.toLowerCase();
  const nameLower = activePersonaName.toLowerCase();
  
  const isStrataManager = roleLower.includes('strata manager') || (roleLower.includes('manager') && !roleLower.includes('building'));
  const isBuildingManager = roleLower.includes('building manager');
  const isSystemAdmin = roleLower.includes('admin') || roleLower.includes('system');
  
  // SCM is elected Strata Committee Member (Michael Chen, Sarah Jones)
  const isSCM = roleLower.includes('committee') || ['michael', 'sarah'].some(scm => nameLower.includes(scm));
  const isLotOwnerOrResident = !isStrataManager && !isBuildingManager && !isSystemAdmin && !isSCM;

  // Tenants (renters / non-owner occupants) have zero statutory authority to generate official legal/statutory committee certificates or Certified Vote Reports
  const isTenant = roleLower.includes('tenant') || (roleLower.includes('resident') && !roleLower.includes('owner') && !roleLower.includes('committee'));
  const canGenerateReport = !isTenant && (isStrataManager || isBuildingManager || isSystemAdmin || isSCM || roleLower.includes('owner'));

  // Rights:
  // - SCM & System Admin can cast binding statutory committee votes
  // - Tenants & Residents can cast Community Feedback ballots to show voting UI/button preferences
  // - Strata Manager & Building Manager administer motions
  const canCastVote = isSCM || isSystemAdmin || isTenant || isLotOwnerOrResident;
  const canManageMotion = isStrataManager || isSystemAdmin;
  const canResubmitProposal = isLotOwnerOrResident || isStrataManager || isSystemAdmin;

  const showToast = (msg: string) => {
    setActionNotification(msg);
    setTimeout(() => setActionNotification(null), 4000);
  };

  const filteredMotions = schemeMotions.filter(m => {
    if (activeFilter !== 'all') {
      if (activeFilter === 'unresolved' && (m.status === 'unresolved' || m.status === 'rejected')) return true;
      if (m.status !== activeFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) || 
        m.summary.toLowerCase().includes(q) || 
        m.id.toLowerCase().includes(q) ||
        (m.strataPlan && m.strataPlan.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Active motion
  const activeMotion: Motion | undefined = schemeMotions.find(m => m.id === selectedMotionId) || filteredMotions[0] || schemeMotions[0];

  // Linked request
  const linkedRequest = activeMotion ? requests.find(r => r.id === activeMotion.caseId || r.referenceId === activeMotion.caseId) : null;

  // Committee roster (dynamically resolves from activeMotion, voters in ballots, or default committee)
  const committeeRoster = useMemo(() => {
    if (activeMotion?.committeeRoster && activeMotion.committeeRoster.length > 0) {
      return activeMotion.committeeRoster;
    }
    // If ballots exist with voter names, ensure those voters appear in the roster
    const votersInBallots = (activeMotion?.ballots || []).map((b, i) => ({
      id: `ballot-voter-${i}`,
      name: b.voterName,
      office: (b.voterOffice || b.voterRole || 'Committee Member') as SCMOffice,
      email: `${b.voterName.toLowerCase().replace(/\s+/g, '.')}@stratacommittee.org.au`,
      unit: 'Lot Rep'
    }));

    if (votersInBallots.length > 0) {
      const existingNames = new Set(votersInBallots.map(v => v.name.toLowerCase()));
      const defaultCavallo = [
        { id: 'scm-1', name: 'Michael Chen', office: 'Chairperson' as SCMOffice, email: 'michael.chen@coronation.com', unit: 'Unit 2' },
        { id: 'scm-2', name: 'Sarah Jones', office: 'Treasurer' as SCMOffice, email: 'sarah.jones@duplex.com', unit: 'Unit 1' },
        { id: 'scm-3', name: 'David Miller', office: 'Secretary' as SCMOffice, email: 'david.m@duplex.com', unit: 'Unit 3' },
        { id: 'scm-4', name: 'Elena Vance', office: 'Committee Member' as SCMOffice, email: 'elena.vance@strata.com', unit: 'Unit 5' },
        { id: 'scm-5', name: 'David Ward', office: 'Committee Member' as SCMOffice, email: 'david.ward@strata.com', unit: 'Unit 7' },
        { id: 'scm-6', name: 'Lisa Ray', office: 'Committee Member' as SCMOffice, email: 'lisa.ray@strata.com', unit: 'Unit 8' },
      ];
      const combined = [...votersInBallots];
      if (activeMotion?.schemeId === 'SP52042' || !activeMotion?.schemeId) {
        defaultCavallo.forEach(scm => {
          if (!existingNames.has(scm.name.toLowerCase()) && combined.length < (activeMotion?.committeeSize || 6)) {
            combined.push(scm);
          }
        });
      }
      return combined;
    }

    return [
      { id: 'scm-1', name: 'Michael Chen', office: 'Chairperson' as SCMOffice, email: 'michael.chen@coronation.com', unit: 'Unit 2' },
      { id: 'scm-2', name: 'Sarah Jones', office: 'Treasurer' as SCMOffice, email: 'sarah.jones@duplex.com', unit: 'Unit 1' },
      { id: 'scm-3', name: 'David Miller', office: 'Secretary' as SCMOffice, email: 'david.m@duplex.com', unit: 'Unit 3' },
      { id: 'scm-4', name: 'Elena Vance', office: 'Committee Member' as SCMOffice, email: 'elena.vance@strata.com', unit: 'Unit 5' },
      { id: 'scm-5', name: 'David Ward', office: 'Committee Member' as SCMOffice, email: 'david.ward@strata.com', unit: 'Unit 7' },
      { id: 'scm-6', name: 'Lisa Ray', office: 'Committee Member' as SCMOffice, email: 'lisa.ray@strata.com', unit: 'Unit 8' },
    ];
  }, [activeMotion]);

  const totalCommitteeSize = activeMotion?.committeeSize || committeeRoster.length || 6;
  const quorumTarget = activeMotion?.quorumTarget || 4; // 4 votes required to pass

  // Ballots calculation
  const ballots = activeMotion?.ballots || [];
  const yesVotes = ballots.filter(b => b.vote === 'YES').length;
  const noVotes = ballots.filter(b => b.vote === 'NO').length;
  const abstainVotes = ballots.filter(b => b.vote === 'ABSTAIN').length;
  const totalVotesCast = ballots.length;
  const pendingVotesCount = Math.max(0, totalCommitteeSize - totalVotesCast);

  const isPassed = activeMotion?.status === 'passed' || yesVotes >= quorumTarget;
  const isLocked = isPassed || activeMotion?.status === 'unresolved' || activeMotion?.status === 'rejected';

  // User's existing ballot
  const userBallot = ballots.find(b => b.voterName.toLowerCase() === activePersonaName.toLowerCase());

  const statsActive = schemeMotions.filter(m => m.status === 'active').length;
  const statsPassed = schemeMotions.filter(m => m.status === 'passed').length;
  const statsUnresolved = schemeMotions.filter(m => m.status === 'unresolved' || m.status === 'rejected').length;
  const statsAwaitingUser = schemeMotions.filter(
    m => m.status === 'active' && canCastVote && !m.ballots?.some(b => b.voterName.toLowerCase() === activePersonaName.toLowerCase())
  ).length;
  const statsAwaitingQuorum = schemeMotions.filter(
    m => m.status === 'active' && (m.ballots?.filter(b => b.vote === 'YES').length || 0) < (m.quorumTarget || 4)
  ).length;

  const motionFilterOptions = useMemo(() => [
    { label: 'All Motions', value: 'all' as const, count: schemeMotions.length, dot: 'bg-gray-400' },
    { label: 'Active', value: 'active' as const, count: statsActive, dot: 'bg-blue-400' },
    { label: 'Passed & Binding', value: 'passed' as const, count: statsPassed, dot: 'bg-emerald-400' },
    { label: 'Closed / Rejected', value: 'unresolved' as const, count: statsUnresolved, dot: 'bg-red-400' },
  ], [schemeMotions.length, statsActive, statsPassed, statsUnresolved]);

  const activeMotionFilterOption = useMemo(() => {
    return motionFilterOptions.find(opt => opt.value === activeFilter) || motionFilterOptions[0];
  }, [activeFilter, motionFilterOptions]);

  const handleVoteSubmit = (vote: MotionVote) => {
    if (!activeMotion) return;
    if (isLocked) {
      showToast('⚠️ This motion is already locked. No further votes or changes are permitted.');
      return;
    }
    if (!canCastVote) {
      showToast('⚠️ Under NSW Strata Schemes Management Act 2015, managers and residents cannot vote in committee motions.');
      return;
    }

    onCastBallot(activeMotion.id, vote, scmBallotComment.trim() || undefined);
    setScmBallotComment('');
    showToast(`✅ Ballot recorded: ${vote} vote submitted by ${activePersonaName}.`);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeMotion) return;
    onAddComment(activeMotion.id, commentInput.trim());
    setCommentInput('');
    showToast('💬 Comment posted to motion thread.');
  };

  const handleConfirmRestart = () => {
    if (!restartReason.trim() || !activeMotion) return;
    if (onRestartVoting) {
      onRestartVoting(activeMotion.id, restartReason.trim());
    }
    setShowRestartModal(false);
    setRestartReason('');
    showToast('🔄 Voting restarted. Ballots reset and all committee members notified.');
  };

  const handleConfirmExtend = () => {
    if (!activeMotion) return;
    if (onExtendDeadline) {
      onExtendDeadline(activeMotion.id, Number(extendDaysInput) || 7, extendReasonInput.trim());
    }
    setShowExtendModal(false);
    setExtendReasonInput('');
    showToast(`📅 Deadline extended by ${extendDaysInput} days.`);
  };

  const handleConfirmCreateMotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim() || !createSummary.trim()) {
      showToast('⚠️ Please enter a title and description for the vote.');
      return;
    }

    const deadlineDate = new Date(Date.now() + createDeadlineDays * 24 * 60 * 60 * 1000);
    const deadlineStr = `${deadlineDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} at 5:00 PM`;

    const quotes = createVendorName.trim() && createEstimatedCost ? [{
      vendorId: `VEND-${Date.now()}`,
      vendorName: createVendorName.trim(),
      amount: parseFloat(createEstimatedCost.replace(/[^0-9.]/g, '')) || 0,
      gstIncluded: true,
      recommended: true
    }] : [];

    const payload: CreateMotionPayload = {
      caseId: createLinkedRequestId || undefined,
      title: createTitle.trim(),
      summary: createSummary.trim(),
      quorumTarget: 4,
      deadline: deadlineStr,
      schemeId: activeSchemeId || 'SP52042',
      quotes
    };

    if (onCreateMotion) {
      onCreateMotion(payload);
    }

    setShowCreateModal(false);
    setCreateTitle('');
    setCreateSummary('');
    setCreateLinkedRequestId('');
    setCreateVendorName('');
    setCreateEstimatedCost('');
    showToast('🚀 New vote started! Committee members can now cast their votes.');
  };

  const handleConfirmCloseEarly = () => {
    if (!activeMotion) return;
    if (!closeReasonInput.trim()) {
      showToast('⚠️ Please provide a mandatory reason for closing voting early.');
      return;
    }
    onCloseVotingEarly(activeMotion.id, closeReasonInput.trim());
    setShowCloseModal(false);
    setCloseReasonInput('');
    showToast('✅ Voting closed early. Case reverted to Pending Triage & notification sent to requestor.');
    setViewMode('list');
  };

  const handleConfirmResolveMotion = (outcome: 'passed' | 'rejected', customToast?: string) => {
    if (!activeMotion) return;
    onResolveMotion(activeMotion.id, outcome);
    setShowCloseModal(false);
    showToast(customToast || (outcome === 'passed' ? '🚀 Motion PASSED & work order flow initiated.' : '❌ Motion REJECTED & request closed.'));
  };

  const handleConfirmResubmit = () => {
    if (!resubmitNote.trim() || !activeMotion) return;
    const sampleAttachment: MotionAttachment = {
      name: `Revised_Submission_${new Date().toISOString().split('T')[0]}.pdf`,
      url: '#',
      size: '2.4 MB',
      type: 'revised',
      uploadedAt: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      uploadedBy: `${activePersonaName} (${activePersonaRole})`,
      note: resubmitNote.trim()
    };
    if (onSubmitRevisedProposal) {
      onSubmitRevisedProposal(activeMotion.id, resubmitNote.trim(), [sampleAttachment]);
    }
    setShowResubmitModal(false);
    setResubmitNote('');
    showToast('📎 Revised design attachment submitted for committee review.');
  };

  const handleSendReminder = (scmName: string) => {
    if (!activeMotion) return;
    if (onSendSCMReminder) {
      onSendSCMReminder(activeMotion.id, scmName);
    }
    showToast(`🔔 Reminder dispatched to ${scmName}.`);
  };

  const openMotionDetail = (motionId: string) => {
    setSelectedMotionId(motionId);
    setViewMode('detail');
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setViewMode('list');
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div ref={scrollContainerRef} className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 overflow-y-auto h-full bg-[#F4F6F9] dark:bg-[#0a0a0f] font-sans text-gray-900 dark:text-gray-100">
      
      {/* ── Toast Notification ────────────────────────────────── */}
      {actionNotification && (
        <div className="fixed top-6 right-4 sm:right-8 z-50 bg-gray-950 text-white dark:bg-white dark:text-black px-4 sm:px-5 py-3 rounded-2xl shadow-2xl border border-white/20 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 size={15} className="text-[#00D4B2]" />
          <span>{actionNotification}</span>
        </div>
      )}

      {/* ── Page Header Banner (Matches ResidentRequestsView & VendorView) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
        {/* Subtle glow in dark mode */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D4B2]/0 via-transparent to-[#0055FF]/0 dark:from-[#00D4B2]/5 dark:via-transparent dark:to-[#0055FF]/5 pointer-events-none rounded-2xl sm:rounded-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0055FF]/10 dark:bg-[#00D4B2]/10 text-[#0055FF] dark:text-[#00D4B2] border border-[#0055FF]/20 dark:border-[#00D4B2]/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            Statutory Committee Governance
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Vote size={22} className="text-[#0055FF] dark:text-[#00D4B2] shrink-0" />
            <span>Committee Motions & Voting</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-xl bg-blue-500/10 text-[#0055FF] dark:text-[#00D4B2] border border-blue-500/20">
              {activeSchemeId || activeMotion?.strataPlan || 'SP 52042'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Official strata resolutions, statutory quorum tracking ({quorumTarget} of {totalCommitteeSize} to pass), and secret ballots.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-white/10">
            <span className="font-semibold text-gray-800 dark:text-gray-200">{activePersonaName}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              isSCM 
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                : isStrataManager 
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : isTenant
                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                : 'bg-gray-500/15 text-gray-500 dark:text-gray-400 border border-gray-500/30'
            }`}>
              {isSCM ? 'Eligible SCM Voter' : isStrataManager ? 'Strata Manager' : isTenant ? 'Tenant' : isLotOwnerOrResident ? 'Lot Owner' : 'Observer'}
            </span>
          </div>

          {viewMode === 'list' && canManageMotion && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer min-h-[40px]"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Start New Vote</span>
            </button>
          )}
          {activeMotion && canGenerateReport && (
            <button
              type="button"
              id="view-report-modal-btn"
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-white/10 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer min-h-[40px]"
            >
              <Printer size={14} className="text-[#0055FF] dark:text-[#00D4B2]" />
              <span>Certified Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Tenant Informational Notice Banner */}
      {isTenant && (
        <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between gap-3 text-blue-700 dark:text-blue-300 text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0 text-[#0055FF] dark:text-[#00D4B2]" />
            <span>
              <strong>Tenant Ballot & Feedback:</strong> You can review active motions, view the voting interface, and cast an indicative ballot to record your household's preference alongside the Strata Committee.
            </span>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-[#0055FF] dark:text-[#00D4B2] font-bold text-[11px]">
            Tenant Mode Active
          </span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── VIEW MODE 1: EXECUTIVE MOTIONS HUB (GALLERY / DIRECTORY) ── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          
          {/* ── KPI Operational Metrics ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* 1. Active in Voting */}
            <div 
              onClick={() => setActiveFilter('active')}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group ${
                activeFilter === 'active'
                  ? 'bg-white dark:bg-[#0d1117] border-[#0055FF] dark:border-[#00D4B2] shadow-sm ring-1 ring-[#0055FF]/20 dark:ring-[#00D4B2]/30'
                  : 'bg-white dark:bg-[#0d1117] border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active in Voting</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Clock size={15} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {statsActive}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Open for ballots</span>
              </div>
            </div>

            {/* 2. Awaiting Your Vote */}
            <div 
              onClick={() => setActiveFilter('pending_me')}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group ${
                activeFilter === 'pending_me'
                  ? 'bg-amber-500/10 dark:bg-amber-500/10 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                  : 'bg-white dark:bg-[#0d1117] border-gray-100 dark:border-white/5 hover:border-amber-500/40 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  {canCastVote ? 'Awaiting Your Vote' : 'Votes Needed'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Vote size={15} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {canCastVote ? statsAwaitingUser : statsAwaitingQuorum}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{canCastVote ? 'Action required' : 'Quorum pending'}</span>
              </div>
            </div>

            {/* 3. Passed & Binding */}
            <div 
              onClick={() => setActiveFilter('passed')}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group ${
                activeFilter === 'passed'
                  ? 'bg-white dark:bg-[#0d1117] border-[#0055FF] dark:border-[#00D4B2] shadow-sm ring-1 ring-[#0055FF]/20 dark:ring-[#00D4B2]/30'
                  : 'bg-white dark:bg-[#0d1117] border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Passed & Binding</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <CheckCircle2 size={15} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {statsPassed}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Threshold reached</span>
              </div>
            </div>

            {/* 4. Closed / Rejected */}
            <div 
              onClick={() => setActiveFilter('unresolved')}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group ${
                activeFilter === 'unresolved'
                  ? 'bg-white dark:bg-[#0d1117] border-[#0055FF] dark:border-[#00D4B2] shadow-sm ring-1 ring-[#0055FF]/20 dark:ring-[#00D4B2]/30'
                  : 'bg-white dark:bg-[#0d1117] border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Closed / Rejected</span>
                <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <FileText size={15} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {statsUnresolved}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                <span>Concluded motions</span>
              </div>
            </div>

          </div>

          {/* ── Search & Filter Controls Bar (Site Design) ── */}
          <div className="bg-white dark:bg-[#0d1117] p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Scope Switcher: All Properties vs Current Building */}
              <div className="flex items-center bg-gray-100 dark:bg-[#1a1d27] p-1 rounded-xl border border-transparent dark:border-white/5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSchemeScope('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none shrink-0 ${
                    schemeScope === 'all'
                      ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#00D4B2] border dark:border-[#00D4B2]/20 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  <span>All Properties</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    schemeScope === 'all' ? 'bg-blue-500/10 text-blue-600 dark:bg-[#00D4B2]/20 dark:text-[#00D4B2]' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                  }`}>
                    {motions.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSchemeScope('scheme')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none shrink-0 ${
                    schemeScope === 'scheme'
                      ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#00D4B2] border dark:border-[#00D4B2]/20 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  <span>Current Building</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    schemeScope === 'scheme' ? 'bg-blue-500/10 text-blue-600 dark:bg-[#00D4B2]/20 dark:text-[#00D4B2]' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                  }`}>
                    {motions.filter(m => !m.schemeId || !activeSchemeId || m.schemeId === activeSchemeId).length}
                  </span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search motion title, ID, or lot..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#121622] border border-gray-200/80 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#0055FF] dark:focus:border-[#00D4B2] transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Controls: Filter Pills & View Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
              {/* Status Filter Dropdown / Quick Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x">
                {motionFilterOptions.map(option => {
                  const isSelected = activeFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setActiveFilter(option.value)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? option.value === 'pending_me'
                            ? 'bg-amber-500 text-black font-extrabold shadow-xs'
                            : 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-xs'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${option.dot}`} />
                      <span>{option.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                        isSelected ? 'bg-white/20 text-current' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                      }`}>
                        {option.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-gray-100 dark:bg-[#1a1d27] p-1 rounded-xl border border-transparent dark:border-white/5 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMotionDisplayMode('table')}
                  className={`flex px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer items-center gap-1.5 select-none ${
                    motionDisplayMode === 'table'
                      ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#00D4B2] border dark:border-[#00D4B2]/20 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                  title="Enterprise Table View"
                >
                  <List size={13} />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMotionDisplayMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                    motionDisplayMode === 'cards'
                      ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#00D4B2] border dark:border-[#00D4B2]/20 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid size={13} />
                  <span>Cards</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Responsive Motions Table or Cards Grid ── */}
          {filteredMotions.length === 0 ? (
            <div className="bg-white dark:bg-[#0d1117] border border-gray-100 dark:border-white/5 rounded-2xl sm:rounded-3xl p-16 text-center space-y-4 shadow-sm">
              <Vote size={48} className="mx-auto text-gray-300 dark:text-gray-600" />
              <div className="text-base font-bold text-gray-800 dark:text-gray-200">No motions match your filters</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Try searching for a different term or reset your status filters to view all strata motions.
              </p>
              <button
                type="button"
                onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                className="px-4 py-2 bg-[#0055FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          ) : motionDisplayMode === 'table' ? (
            <div className="bg-white dark:bg-[#0d1117] border border-gray-100 dark:border-white/5 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[850px] text-left text-xs border-collapse font-sans table-auto">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-[#121622] text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100 dark:border-white/5 select-none">
                      <th className="py-3.5 px-4 w-[16%]">Motion ID & Category</th>
                      <th className="py-3.5 px-4 w-[28%]">Title & Purpose</th>
                      <th className="py-3.5 px-4 w-[14%]">Status</th>
                      <th className="py-3.5 px-4 w-[18%]">Quorum & Ballots</th>
                      <th className="py-3.5 px-4 w-[12%]">Deadline</th>
                      <th className="py-3.5 px-4 w-[12%] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                    {filteredMotions.map(motion => {
                      const mYes = motion.ballots?.filter(b => b.vote === 'YES').length || 0;
                      const mNo = motion.ballots?.filter(b => b.vote === 'NO').length || 0;
                      const mTarget = motion.quorumTarget || 4;
                      const mPassed = motion.status === 'passed' || mYes >= mTarget;
                      const mUserVoted = motion.ballots?.some(b => b.voterName.toLowerCase() === activePersonaName.toLowerCase());
                      const isActionRequired = canCastVote && !mUserVoted && (motion.status === 'active' || !motion.status);

                      return (
                        <tr 
                          key={motion.id}
                          onClick={() => openMotionDetail(motion.id)}
                          className={`hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group ${
                            isActionRequired ? 'bg-amber-500/5 dark:bg-amber-500/5' : ''
                          }`}
                        >
                          <td className="py-4 px-4 align-top">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-black text-xs text-[#0055FF] dark:text-[#00D4B2]">
                                {motion.id}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                {motion.heading?.split(':')[0] || 'Lot Request'}
                              </span>
                            </div>
                            {motion.schemeId && (
                              <div className="text-[10px] font-mono text-gray-400 mt-1">
                                Scheme: {motion.schemeId}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 align-top">
                            <div className="font-bold text-gray-900 dark:text-white text-xs group-hover:text-[#0055FF] dark:group-hover:text-[#00D4B2] transition-colors">
                              {motion.title || motion.heading}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                              {motion.summary}
                            </div>
                          </td>
                          <td className="py-4 px-4 align-top">
                            {mPassed ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                                <CheckCircle2 size={11} /> Passed & Locked
                              </span>
                            ) : motion.status === 'rejected' || motion.status === 'unresolved' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 text-[10px] font-black uppercase">
                                <XCircle size={11} /> {motion.status === 'rejected' ? 'Rejected' : 'Unresolved'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase">
                                <Clock size={11} /> In Voting
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 align-top">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-bold text-gray-700 dark:text-gray-300">
                                {mYes} YES • {mNo} NO
                              </span>
                              <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400">
                                Target: {mTarget}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  mPassed ? 'bg-emerald-500' : 'bg-blue-600 dark:bg-[#00D4B2]'
                                }`} 
                                style={{ width: `${Math.min(100, Math.round((mYes / mTarget) * 100))}%` }} 
                              />
                            </div>
                          </td>
                          <td className="py-4 px-4 align-top">
                            <div className="text-xs text-gray-800 dark:text-gray-200 font-semibold">
                              {motion.deadline}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {motion.voterGroup === 'committee_only' ? 'Committee Only' : 'All Owners'}
                            </div>
                          </td>
                          <td className="py-4 px-4 align-top text-right">
                            {isActionRequired ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openMotionDetail(motion.id);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs inline-flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                              >
                                <Vote size={12} />
                                <span>Cast Vote</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openMotionDetail(motion.id);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <span>{mUserVoted ? 'Voted • Details' : 'Details →'}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMotions.map(motion => {
                const mYes = motion.ballots?.filter(b => b.vote === 'YES').length || 0;
                const mNo = motion.ballots?.filter(b => b.vote === 'NO').length || 0;
                const mTarget = motion.quorumTarget || 4;
                const mTotal = motion.committeeSize || 6;
                const mPassed = motion.status === 'passed' || mYes >= mTarget;
                const mUserVoted = motion.ballots?.some(b => b.voterName.toLowerCase() === activePersonaName.toLowerCase());
                const recommendedQuote = motion.quotes?.find(q => q.recommended) || motion.quotes?.[0];

                return (
                  <div
                    key={motion.id}
                    onClick={() => openMotionDetail(motion.id)}
                    className="bg-white dark:bg-[#0d1117] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-white/10 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="space-y-4">
                      {/* Card Header: Meta Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                            {motion.id}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {motion.heading?.split(':')[0] || 'Lot Request'}
                          </span>
                        </div>

                        {/* Status Chip */}
                        {mPassed ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase flex items-center gap-1">
                            <CheckCircle2 size={11} /> Passed & Locked
                          </span>
                        ) : motion.status === 'rejected' || motion.status === 'unresolved' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-[10px] font-black uppercase flex items-center gap-1">
                            <XCircle size={11} /> Rejected
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Active
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1.5">
                        <h3 className="text-base font-black text-gray-900 dark:text-white group-hover:text-[#0055FF] dark:group-hover:text-[#00D4B2] transition-colors leading-snug line-clamp-2">
                          {motion.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                          {motion.summary}
                        </p>
                      </div>

                      {/* Quorum Progress Tracker with 4-Vote Threshold */}
                      <div className="bg-gray-50 dark:bg-white/[0.02] p-3.5 rounded-xl border border-gray-100 dark:border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <Vote size={13} className="text-[#0055FF] dark:text-[#00D4B2]" />
                            <span>Voting Progress:</span>
                          </span>
                          <span className="font-mono font-black text-gray-900 dark:text-white">
                            {mYes} / {mTarget} Votes to Pass
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="relative pt-1">
                          <div className="h-2 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${Math.min(100, (mYes / mTotal) * 100)}%` }}
                              className="bg-emerald-500 transition-all"
                            />
                            <div
                              style={{ width: `${Math.min(100, (mNo / mTotal) * 100)}%` }}
                              className="bg-red-500 transition-all"
                            />
                          </div>
                          {/* 4 of 6 pass threshold marker */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-gray-900 dark:bg-white"
                            style={{ left: `${(mTarget / mTotal) * 100}%` }}
                            title={`Pass threshold: ${mTarget} votes`}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
                          <span>{mYes} YES • {mNo} NO • {Math.max(0, mTotal - (mYes + mNo))} Pending</span>
                          <span className="font-bold text-gray-500 dark:text-gray-400">Target: {mTarget} of {mTotal}</span>
                        </div>
                      </div>

                      {/* Recommended Contractor Tender */}
                      {recommendedQuote && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 text-xs">
                          <div className="truncate pr-2">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Tender Quote</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 truncate block">
                              {recommendedQuote.vendorName}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-gray-900 dark:text-white text-sm">
                              ${recommendedQuote.amount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-400 block font-normal">incl. GST</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Deadline & Action CTA */}
                    <div className="pt-4 mt-5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>Deadline: {motion.deadline}</span>
                      </div>

                      {/* Contextual CTA */}
                      {canCastVote && !mUserVoted && !mPassed ? (
                        <span className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs inline-flex items-center gap-1.5 shadow-sm transition-all">
                          <Vote size={13} />
                          <span>Cast Vote →</span>
                        </span>
                      ) : mUserVoted ? (
                        <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          <span>Voted • Details →</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#0055FF] dark:text-[#00D4B2] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>Open Details →</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── VIEW MODE 2: DEDICATED FULL-PAGE MOTION GOVERNANCE WORKSPACE ── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {viewMode === 'detail' && activeMotion && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Breadcrumb & Motion Switcher Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 dark:bg-[#0d1117]/60 backdrop-blur-md p-3.5 px-5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-gray-200 dark:border-white/10 shadow-2xs cursor-pointer active:scale-95"
              >
                <ArrowLeft size={14} />
                <span>All Motions ({schemeMotions.length})</span>
              </button>

              <div className="h-4 w-px bg-gray-300 dark:bg-white/20 hidden sm:block" />

              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                <span>{activeSchemeId || activeMotion.strataPlan || 'SP 52042'}</span>
                <span>/</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{activeMotion.id}</span>
              </div>
            </div>

            {/* Quick Motion Selector Dropdown (CustomSelect matching site theme) */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 hidden sm:inline whitespace-nowrap">
                Jump to:
              </span>
              <div className="w-full sm:w-80">
                <CustomSelect
                  size="sm"
                  menuAlign="right"
                  placeholder="Select motion..."
                  options={schemeMotions.map(m => ({
                    value: m.id,
                    label: `${m.id}: ${m.title}`,
                    description: `Status: ${m.status.toUpperCase()} • Quorum: ${m.ballots?.length || 0}/${m.committeeSize || 6} Votes`
                  }))}
                  value={activeMotion.id}
                  onChange={(val) => setSelectedMotionId(val)}
                />
              </div>
            </div>
          </div>

          {/* ── 12-Column Executive Layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* ── LEFT 8 COLUMNS: Main Governance Canvas ── */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Executive Motion Header Block */}
              <div className="bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                      {activeMotion.id}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Category: {activeMotion.heading || 'Lot Owner Request'}
                    </span>
                    {activeMotion.strataPlan && (
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                        {activeMotion.strataPlan} • {activeMotion.propertyAddress}
                      </span>
                    )}
                  </div>

                  {/* Status Pill */}
                  {isPassed ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase flex items-center gap-1.5">
                      <Lock size={12} /> Passed & Locked
                    </span>
                  ) : activeMotion.status === 'rejected' || activeMotion.status === 'unresolved' ? (
                    <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-black uppercase flex items-center gap-1.5">
                      <XCircle size={12} /> Rejected & Closed
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-black uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Active in Voting
                    </span>
                  )}
                </div>

                {/* Standard Title Format */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white leading-snug">
                  {activeMotion.title}
                </h1>

                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {activeMotion.summary}
                </p>

                {/* ── Linked Request Details Card (Proper Full Specs Card) ── */}
                {linkedRequest && (
                  <div className="pt-2">
                    <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-white/3 dark:to-white/1 border border-blue-500/20 dark:border-white/10 rounded-2xl p-5 space-y-3.5 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/60 dark:border-white/5 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {linkedRequest.referenceId || linkedRequest.id}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                            {linkedRequest.requestType || 'Lot Request'}
                          </span>
                          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                            linkedRequest.priority === 'Urgent' || linkedRequest.priority === 'High' || linkedRequest.priority === 'Emergency'
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                          }`}>
                            {linkedRequest.priority} Priority
                          </span>
                        </div>

                        <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                          <Calendar size={12} />
                          <span>Submitted {linkedRequest.createdAt}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-white">
                          {linkedRequest.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                          {linkedRequest.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/50 dark:border-white/5 text-xs">
                        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                          <span>Requestor: <strong className="text-gray-800 dark:text-gray-200">{linkedRequest.requestorName}</strong> ({linkedRequest.requestorRole || 'Resident'})</span>
                          <span>• Lot/Unit: <strong className="text-gray-800 dark:text-gray-200">{linkedRequest.unit}</strong></span>
                        </div>

                        {onNavigateToRequest && (
                          <button
                            type="button"
                            onClick={() => onNavigateToRequest(linkedRequest.id)}
                            className="text-xs font-bold text-[#0055FF] dark:text-[#00D4B2] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open Full Request Ticket</span>
                            <ExternalLink size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Statutory Status & Quorum Visual ── */}
              {isPassed ? (
                <div className="bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <Lock size={20} className="stroke-[2.5]" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          Motion Resolution Passed & Legally Binding
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
                          Statutory Quorum Met
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        Statutory threshold of {quorumTarget} affirmative votes achieved under NSW Strata Schemes Management Act 2015. Ballots are locked and recorded into the scheme minutes.
                      </p>
                    </div>
                  </div>

                  {activeMotion.createdWorkOrderId ? (
                    <div className="shrink-0 bg-white/60 dark:bg-black/40 border border-emerald-500/30 rounded-2xl px-4 py-2.5 text-right">
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Work Order Dispatched</div>
                      <div className="text-sm font-mono font-black text-gray-900 dark:text-white">{activeMotion.createdWorkOrderId}</div>
                    </div>
                  ) : canManageMotion && (
                    <button
                      type="button"
                      onClick={() => onResolveMotion(activeMotion.id, 'passed')}
                      className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                    >
                      <Wrench size={14} />
                      <span>Issue Work Order</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Notice if activeMotion is rejected */}
                  {(activeMotion.status === 'rejected' || activeMotion.status === 'unresolved') && (
                    <div className="p-4 sm:p-5 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-900 dark:text-red-200 text-xs flex items-start gap-3.5 shadow-2xs">
                      <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                        <XCircle size={18} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black uppercase tracking-wider text-[11px] text-red-700 dark:text-red-300">
                            Motion Concluded — Rejected
                          </span>
                          <span className="px-2 py-0.2 rounded-full bg-red-500/20 text-red-600 dark:text-red-300 text-[10px] font-bold">
                            Ballots Locked
                          </span>
                        </div>
                        <p className="text-xs text-red-800 dark:text-red-200/90 leading-relaxed">
                          {activeMotion.closeReason || 'This motion was formally rejected by the committee and closed.'}
                        </p>
                        {activeMotion.closedAt && (
                          <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold pt-0.5">
                            Determined on {activeMotion.closedAt}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-[#0d1117] border border-gray-100 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Live Voting Progress
                        </div>
                        <div className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 mt-0.5">
                          <span>{yesVotes} Yes votes cast</span>
                          <span className="text-gray-400 font-normal">•</span>
                          <span className="text-[#0055FF] dark:text-[#00D4B2]">
                            {Math.max(0, quorumTarget - yesVotes)} more needed to pass
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Clock size={13} className="text-[#0055FF] dark:text-[#00D4B2]" />
                        <span>Voting Deadline: {activeMotion.deadline}</span>
                      </div>
                    </div>

                    {/* Progress Bar with 4-Vote Threshold Line */}
                    <div className="relative pt-2 pb-1">
                      <div className="h-3 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex">
                        <div 
                          style={{ width: `${Math.min(100, (yesVotes / totalCommitteeSize) * 100)}%` }}
                          className="bg-emerald-500 transition-all duration-500"
                        />
                        <div 
                          style={{ width: `${Math.min(100, (noVotes / totalCommitteeSize) * 100)}%` }}
                          className="bg-red-500 transition-all duration-500"
                        />
                        <div 
                          style={{ width: `${Math.min(100, (abstainVotes / totalCommitteeSize) * 100)}%` }}
                          className="bg-gray-400 transition-all duration-500"
                        />
                      </div>

                      {/* Threshold Line at 4 of 6 */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-gray-900 dark:bg-white z-10"
                        style={{ left: `${(quorumTarget / totalCommitteeSize) * 100}%` }}
                      />
                      <div 
                        className="absolute top-5 text-[10px] font-mono font-bold text-gray-600 dark:text-gray-300 -translate-x-1/2 whitespace-nowrap"
                        style={{ left: `${(quorumTarget / totalCommitteeSize) * 100}%` }}
                      >
                        ▲ Pass Threshold ({quorumTarget} Votes)
                      </div>
                    </div>

                    {/* Legend Counters */}
                    <div className="flex flex-wrap items-center gap-5 pt-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <strong>{yesVotes}</strong> Yes
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <strong>{noVotes}</strong> No
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                        <strong>{abstainVotes}</strong> Abstain
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-500 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                        <strong>{pendingVotesCount}</strong> Awaiting Response
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Committee Member Voting Action: Cast Official Ballot ── */}
              {canCastVote && !isLocked && (
                <div className="bg-white dark:bg-[#0d1117] border border-gray-100 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Vote size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {isTenant ? 'Record Indicative Ballot' : 'Cast Statutory Committee Ballot'}
                        </span>
                        {isTenant && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-[#0055FF] dark:text-[#00D4B2] border border-blue-500/20">
                            Tenant Ballot
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {userBallot ? (
                          <span>
                            You voted <strong className={userBallot.vote === 'YES' ? 'text-emerald-500' : userBallot.vote === 'NO' ? 'text-red-500' : 'text-gray-400'}>{userBallot.vote === 'YES' ? 'YES (Approve)' : userBallot.vote === 'NO' ? 'NO (Reject)' : 'ABSTAIN'}</strong>. You can change your ballot anytime before voting closes.
                          </span>
                        ) : isTenant ? (
                          <span>Cast your indicative ballot to record your household preference alongside the Strata Committee.</span>
                        ) : (
                          <span>Cast your formal vote on this motion. Minimum {quorumTarget} affirmative votes required for passage.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleVoteSubmit('YES')}
                      className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95 ${
                        userBallot?.vote === 'YES'
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/40 shadow-sm'
                          : 'bg-emerald-500/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white border border-emerald-500/20'
                      }`}
                    >
                      <Check size={14} strokeWidth={2.5} />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVoteSubmit('NO')}
                      className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95 ${
                        userBallot?.vote === 'NO'
                          ? 'bg-red-600 text-white ring-2 ring-red-400/40 shadow-sm'
                          : 'bg-red-500/10 hover:bg-red-600 text-red-700 dark:text-red-400 hover:text-white border border-red-500/20'
                      }`}
                    >
                      <X size={14} strokeWidth={2.5} />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVoteSubmit('ABSTAIN')}
                      className={`flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95 ${
                        userBallot?.vote === 'ABSTAIN'
                          ? 'bg-gray-700 text-white ring-2 ring-gray-400/40 shadow-sm'
                          : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <MinusCircle size={14} />
                      <span>Abstain</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── Official Committee Discussion & Comments ── */}
              <div className="bg-white dark:bg-[#0d1117] border border-gray-100 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare size={18} className="text-[#0055FF] dark:text-[#00D4B2]" />
                    <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Comments & Discussion
                    </h2>
                  </div>
                </div>

                {/* Comment Feed */}
                <div className="space-y-3">
                  {(activeMotion.comments || []).map((c, i) => (
                    <div 
                      key={c.id || i}
                      className="p-4 rounded-2xl bg-gray-50/70 dark:bg-white/3 border border-gray-100 dark:border-white/5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white">{c.authorName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                            {c.authorRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">{c.createdAt}</span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleSendComment} className="flex gap-2.5 pt-2">
                  <input
                    type="text"
                    placeholder="Add a comment or response..."
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-1 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Send size={13} />
                    <span>Send</span>
                  </button>
                </form>
              </div>

            </div>

            {/* ── RIGHT 4 COLUMNS: Action & Compliance Sidebar ── */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Governance Actions Panel - Strictly Strata Managers & System Admins */}
              {canManageMotion && (
                <div className="bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 p-4 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      Governance Actions
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-[#0055FF] dark:text-[#00D4B2] border border-blue-500/20">
                      NSW SSMA 2015
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Formal Legal Vote Report Button */}
                    {canGenerateReport && (
                      <button
                        type="button"
                        id="gov-gen-report-btn"
                        onClick={() => setShowReportModal(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs active:scale-95"
                      >
                        <Printer size={14} className="text-[#0055FF] dark:text-[#00D4B2]" />
                        <span>Generate Certified Vote Report</span>
                      </button>
                    )}

                    {/* Strata Manager Operational Controls (Strictly Role Gated) */}
                    {canManageMotion && (
                      <>
                        {/* Close Voting Trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            setCloseModalTab(isPassed ? 'after' : 'before');
                            setShowCloseModal(true);
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white border border-red-500/20 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs active:scale-95"
                        >
                          <Scale size={14} />
                          <span>Close Vote</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowExtendModal(true)}
                          className="w-full py-2.5 px-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-blue-500/10 text-gray-700 dark:text-gray-300 hover:text-[#0055FF] dark:hover:text-[#00D4B2] border border-gray-200/80 dark:border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Calendar size={14} />
                          <span>Extend Voting Deadline</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowRestartModal(true)}
                          className="w-full py-2.5 px-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-amber-500/10 text-gray-700 dark:text-gray-300 hover:text-amber-500 border border-gray-200/80 dark:border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                        >
                          <RotateCcw size={14} />
                          <span>Restart Committee Vote</span>
                        </button>

                        {isPassed && !activeMotion.createdWorkOrderId && (
                          <button
                            type="button"
                            onClick={() => onResolveMotion(activeMotion.id, 'passed')}
                            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
                          >
                            <Wrench size={14} />
                            <span>Issue Official Work Order</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── Strata Committee Members (SCM) Live Voting Roster Card ── */}
              <div className="bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[#0055FF] dark:text-[#00D4B2]" />
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                        Committee Roster
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        Live committee voting roll call
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-gray-400">
                      {committeeRoster.length} Members
                    </span>
                    <div className={`text-[10px] font-bold ${isPassed ? 'text-emerald-500 dark:text-emerald-400' : 'text-[#0055FF] dark:text-[#00D4B2]'}`}>
                      {isPassed 
                        ? `✓ Target Reached (${yesVotes}/${quorumTarget})` 
                        : `${yesVotes}/${quorumTarget} Votes Reached`}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {committeeRoster.map(scm => {
                    const ballot = activeMotion.ballots.find(b => b.voterName.toLowerCase() === scm.name.toLowerCase());
                    const hasVoted = !!ballot;
                    const isUserRow = scm.name.toLowerCase() === activePersonaName.toLowerCase();

                    return (
                      <div 
                        key={scm.id} 
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isUserRow 
                            ? 'bg-[#0055FF]/5 dark:bg-[#00D4B2]/5 border-[#0055FF]/30 dark:border-[#00D4B2]/30' 
                            : 'bg-gray-50/70 dark:bg-white/3 border-gray-100 dark:border-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-gray-900 dark:text-white">{scm.name}</span>
                              {isUserRow && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#00D4B2]/20 text-[#00D4B2]">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400">{scm.office} • {scm.unit || 'Lot Rep'}</div>
                          </div>

                          {/* Ballot Status Chip */}
                          {hasVoted ? (
                            ballot.vote === 'YES' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-black">
                                <Check size={11} /> YES
                              </span>
                            ) : ballot.vote === 'NO' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-[11px] font-black">
                                <X size={11} /> NO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/30 text-[11px] font-bold">
                                <MinusCircle size={11} /> ABSTAIN
                              </span>
                            )
                          ) : isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-500/10 text-gray-500 dark:text-gray-400 border border-gray-500/20 text-[11px] font-medium">
                              <span>Uncast</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <span>Pending</span>
                            </span>
                          )}
                        </div>

                        {/* Rationale Note */}
                        {ballot?.comment && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 italic mt-2 pt-2 border-t border-gray-200/60 dark:border-white/5">
                            "{ballot.comment}"
                          </p>
                        )}

                        {/* 1-Click Remind Button for Managers (Active votes only) */}
                        {!hasVoted && canManageMotion && !isLocked && (
                          <div className="mt-2.5 pt-2 border-t border-gray-200/60 dark:border-white/5 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleSendReminder(scm.name)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold transition-all cursor-pointer border border-amber-500/20"
                            >
                              Send Reminder
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Statutory Compliance Card */}
              <div className="bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 p-5 shadow-xs space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-bold text-xs">
                  <Shield size={14} className="text-[#0055FF] dark:text-[#00D4B2]" />
                  <span>NSW SSMA 2015 Compliance</span>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                  Resolutions require a minimum of 4 affirmative votes from elected committee members before the statutory deadline to become legally binding.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ── Formal Legal Vote Report Modal (Printable) ────────── */}
      {showReportModal && activeMotion && canGenerateReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-white/10 p-4 sm:p-6 lg:p-8 shadow-2xl text-gray-900 dark:text-white space-y-6">
            
            {/* Report Header */}
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-white/10 pb-4">
              <div>
                <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
                  Official Strata Record • NSW SSMA 2015 s 106
                </div>
                <h2 className="text-lg sm:text-xl font-black">Certificate of Committee Motion Vote</h2>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Strata Plan: <strong>{activeMotion.strataPlan || 'SP 52042'}</strong> • Property: <strong>{activeMotion.propertyAddress || 'Cavallo, 1 Pitt Street, Sydney NSW 2000'}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Motion Reference Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-white/4 p-3.5 sm:p-4 rounded-2xl text-xs">
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Motion ID</div>
                <div className="font-mono font-bold">{activeMotion.id}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Votes Needed to Pass</div>
                <div className="font-bold">{quorumTarget} of {totalCommitteeSize} Votes</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Outcome</div>
                <div className={`font-black uppercase ${isPassed ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {isPassed ? 'PASSED / BINDING' : 'IN PROGRESS'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Date Certified</div>
                <div className="font-mono">{new Date().toLocaleDateString('en-AU')}</div>
              </div>
            </div>

            {/* Resolution Title & Summary */}
            <div className="space-y-1 text-xs">
              <div className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">
                Motion Title
              </div>
              <div className="text-sm font-black">{activeMotion.title}</div>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{activeMotion.summary}</p>
            </div>

            {/* Committee Member Vote Breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase text-gray-400 tracking-wider">
                Full Committee Voter Breakdown
              </div>
              <div className="overflow-x-auto w-full -mx-1 sm:mx-0">
                <table className="w-full min-w-[550px] text-xs border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                  <thead className="bg-gray-100 dark:bg-white/5 font-bold text-gray-500">
                    <tr>
                      <th className="p-2.5 text-left">Member Name</th>
                      <th className="p-2.5 text-left">Office</th>
                      <th className="p-2.5 text-left">Ballot Cast</th>
                      <th className="p-2.5 text-left">Date/Time</th>
                      <th className="p-2.5 text-left">Voter Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {committeeRoster.map(scm => {
                      const ballot = activeMotion.ballots.find(b => b.voterName.toLowerCase() === scm.name.toLowerCase());
                      return (
                        <tr key={scm.id}>
                          <td className="p-2.5 font-bold">{scm.name}</td>
                          <td className="p-2.5 text-gray-400">{scm.office}</td>
                          <td className="p-2.5 font-mono font-bold">
                            {ballot ? ballot.vote : <span className="text-amber-500">UNRESPONSIVE</span>}
                          </td>
                          <td className="p-2.5 text-gray-400 font-mono">{ballot ? ballot.votedAt : '—'}</td>
                          <td className="p-2.5 text-gray-600 dark:text-gray-300 italic">{ballot?.comment || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statutory Certification Block */}
            <div className="border-t border-gray-200 dark:border-white/10 pt-4 grid grid-cols-2 gap-6 text-xs">
              <div className="border-t border-dashed border-gray-400 pt-2 text-gray-500">
                <div>Emma Wilson (Strata Managing Agent)</div>
                <div className="text-[10px]">Strata Managing Agent Certification</div>
              </div>
              <div className="border-t border-dashed border-gray-400 pt-2 text-gray-500">
                <div>Michael Chen (Chairperson)</div>
                <div className="text-[10px]">Strata Committee Endorsement</div>
              </div>
            </div>

            {/* Print / Close Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[#0055FF] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-blue-600 shadow-sm"
              >
                <Printer size={13} />
                <span>Print Certificate</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-white/20"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}


      {/* ── Restart Voting Modal ───────────────────────────────── */}
      {showRestartModal && activeMotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0d1117] rounded-3xl max-w-lg w-full border border-gray-100 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <RotateCcw size={18} className="text-amber-500" />
                  <span>Restart Committee Voting</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Reset existing ballots and notify all committee members to recast their votes following substantive proposal revisions.
                </p>
              </div>
              <button onClick={() => setShowRestartModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Reason for Restarting Vote</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Requester Sarah submitted revised mockup design following committee RFI. Fresh vote required..."
                  value={restartReason}
                  onChange={e => setRestartReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRestartModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestart}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black cursor-pointer shadow-sm"
              >
                Confirm Vote Reset & Notify SCMs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extend Deadline Modal ──────────────────────────────── */}
      {showExtendModal && activeMotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0d1117] rounded-3xl max-w-lg w-full border border-gray-100 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar size={18} className="text-blue-500" />
                  <span>Extend Motion Deadline</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Current Deadline: <strong>{activeMotion.deadline}</strong>
                </p>
              </div>
              <button onClick={() => setShowExtendModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Additional Days</label>
                <div className="flex items-center gap-2">
                  {[3, 7, 14, 30].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendDaysInput(d)}
                      className={`px-3 py-1.5 rounded-xl border font-bold cursor-pointer transition-all ${
                        extendDaysInput === d ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-gray-400 border-gray-200 dark:border-white/10'
                      }`}
                    >
                      +{d} Days
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Reason for Extension (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Committee quorum pending during school holidays..."
                  value={extendReasonInput}
                  onChange={e => setExtendReasonInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExtendModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmExtend}
                className="px-4 py-2 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Save Extended Deadline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit Revised Proposal Modal ──────────────────────── */}
      {showResubmitModal && activeMotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0d1117] rounded-3xl max-w-lg w-full border border-gray-100 dark:border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UploadCloud size={18} className="text-emerald-500" />
                  <span>Submit Revised Design / Proposal</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Upload new revised media (e.g. green accent design) to satisfy SCM requests.
                </p>
              </div>
              <button onClick={() => setShowResubmitModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Description of Changes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Updated signage specifications to dark bronze frame with forest green acrylic lettering as requested by John..."
                  value={resubmitNote}
                  onChange={e => setResubmitNote(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-4 text-center text-gray-400">
                <UploadCloud size={24} className="mx-auto mb-1 text-emerald-500" />
                <div className="font-bold text-gray-700 dark:text-gray-300">Revised_Signage_Mockup_v2.pdf</div>
                <div className="text-[10px]">Sample attachment will be registered automatically</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResubmitModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResubmit}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black cursor-pointer shadow-sm"
              >
                Upload & Mark RFI Addressed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Close Vote ── */}
      {showCloseModal && activeMotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-white/10 p-5 sm:p-7 shadow-2xl space-y-5 text-gray-900 dark:text-white animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div>
                <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-[#00D4B2] uppercase tracking-widest mb-0.5">
                  Statutory Determination • {activeMotion?.strataPlan || activeSchemeId || 'SP 52042'}
                </div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Scale size={18} className="text-[#0055FF] dark:text-[#00D4B2]" />
                  <span>Conclude Voting & Finalize Resolution</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Motion: <strong className="text-gray-800 dark:text-gray-200">{activeMotion.id}</strong> — {activeMotion.title}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* 2 Pathways Selector Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 dark:bg-[#1a1d27] rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setCloseModalTab('before')}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer font-bold text-center ${
                  closeModalTab === 'before'
                    ? 'bg-white dark:bg-[#0d1117] text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Request Details & Revert
              </button>
              <button
                type="button"
                onClick={() => setCloseModalTab('after')}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer font-bold text-center ${
                  closeModalTab === 'after'
                    ? 'bg-white dark:bg-[#0d1117] text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Determine Outcome & Execute
              </button>
            </div>

            {/* PATHWAY 1: REQUEST DETAILS & REVERT (Needs extra info -> Add a reason -> Send notification to requestor -> Request goes back to pending) */}
            {closeModalTab === 'before' && (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs space-y-1">
                  <div className="font-bold text-amber-700 dark:text-amber-400">
                    Suspend Vote & Request Additional Details
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[11px]">
                    Pause voting when the committee or strata manager requires missing specifications, additional contractor quotes, or structural certifications. The case status will automatically revert to <strong>Pending Triage</strong> and a notification email will be dispatched to the applicant.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                    Reason for Information Request *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Committee requested 2 additional contractor quotes and structural engineer report before formal voting..."
                    value={closeReasonInput}
                    onChange={e => setCloseReasonInput(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="p-3 bg-gray-50 dark:bg-[#1a1d27] rounded-xl border border-gray-200 dark:border-white/5 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between">
                  <span>Automated Workflow:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Notify requestor • Revert case to Pending Triage
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCloseModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCloseEarly}
                    disabled={!closeReasonInput.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    Submit Request & Revert to Pending
                  </button>
                </div>
              </div>
            )}

            {/* PATHWAY 2: DETERMINE OUTCOME & EXECUTE */}
            {closeModalTab === 'after' && (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs space-y-1">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">
                    Finalize Motion Determination
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-mono text-[11px] flex items-center gap-2">
                    <span>Live Quorum: <strong>{yesVotes} YES</strong> • <strong>{noVotes} NO</strong> • <strong>{abstainVotes} ABSTAIN</strong></span>
                    <span>(Target: {quorumTarget} Affirmative Votes)</span>
                  </div>
                </div>

                {/* Option A: Motion Passed */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                    Option 1: Resolution Approved & Passed
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-blue-500/5 dark:bg-[#1a1d27] p-3.5 rounded-xl border border-blue-500/20 space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0055FF] dark:text-[#00D4B2]">
                          Common Property / Building Works
                        </span>
                        <p className="text-gray-600 dark:text-gray-300 text-[11px] mt-1 leading-relaxed">
                          Resolution approved. Dispatches formal notification to committee and issues official contractor work order.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConfirmResolveMotion('passed', '🚀 Motion Approved! Work order flow initiated.')}
                        className="w-full py-2 bg-[#0055FF] hover:bg-blue-600 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs text-xs"
                      >
                        Approve & Issue Work Order
                      </button>
                    </div>

                    <div className="bg-purple-500/5 dark:bg-[#1a1d27] p-3.5 rounded-xl border border-purple-500/20 space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                          Individual Lot Owner Request
                        </span>
                        <p className="text-gray-600 dark:text-gray-300 text-[11px] mt-1 leading-relaxed">
                          Resolution approved. Dispatches formal approval notice to resident and records resolution in scheme roll.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConfirmResolveMotion('passed', '✅ Resident request approved and voting closed.')}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs text-xs"
                      >
                        Approve & Notify Resident
                      </button>
                    </div>
                  </div>
                </div>

                {/* Option B: If Rejected */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-red-600 dark:text-red-400">Option 2: Resolution Rejected</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Votes did not achieve required statutory threshold. Dispatches rejection notice to requestor.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleConfirmResolveMotion('rejected', '❌ Motion Rejected. Notification sent to requestor.')}
                      className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white border border-red-500/20 font-bold text-xs transition-colors cursor-pointer shrink-0"
                    >
                      Record Rejection & Close
                    </button>
                  </div>
                </div>

                {/* Option C: Strata Manager Administrative Determination */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-2 text-xs">
                  <div>
                    <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Scale size={13} />
                      <span>Option 3: Strata Manager Administrative Determination</span>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      Committee votes are deadlocked or quorum unreached. Strata Manager exercises administrative casting authority.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmResolveMotion('passed', '⚖️ Strata Manager casting vote: PASSED. Work order flow initiated.')}
                      className="flex-1 py-2 bg-gray-100 dark:bg-white/5 hover:bg-emerald-500/20 text-gray-700 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 border border-gray-200 dark:border-white/10 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                    >
                      Casting Vote: Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmResolveMotion('rejected', '⚖️ Strata Manager casting vote: REJECTED. Request closed.')}
                      className="flex-1 py-2 bg-gray-100 dark:bg-white/5 hover:bg-red-500/20 text-gray-700 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 border border-gray-200 dark:border-white/10 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                    >
                      Casting Vote: Reject
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ── MODAL: Start New Committee Vote ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-white/10 p-5 sm:p-7 shadow-2xl space-y-5 text-gray-900 dark:text-white">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div>
                <div className="text-[10px] font-mono font-bold text-[#0055FF] dark:text-[#00D4B2] uppercase tracking-widest mb-0.5">
                  Strata Committee Motion • {activeMotion?.strataPlan || activeSchemeId || 'SP 52042'}
                </div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Vote size={18} className="text-[#0055FF] dark:text-[#00D4B2]" />
                  <span>Start New Committee Vote</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Create an official motion for strata committee members to review and vote on.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmCreateMotion} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  Motion Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Approve Commercial Solar Inverter Replacement"
                  value={createTitle}
                  onChange={e => setCreateTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0055FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1.5 block text-xs">
                    Category
                  </label>
                  <CustomSelect
                    size="sm"
                    options={[
                      { value: 'Repairs & Maintenance', label: 'Repairs & Maintenance' },
                      { value: 'Major Works', label: 'Major Works' },
                      { value: 'By-law Approval', label: 'By-law Approval' },
                      { value: 'Financial', label: 'Financial Approval' },
                      { value: 'General', label: 'General Resolution' },
                    ]}
                    value={createCategory}
                    onChange={val => setCreateCategory(val)}
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1.5 block text-xs">
                    Voting Period
                  </label>
                  <CustomSelect
                    size="sm"
                    options={[
                      { value: '7', label: '7 Days (Standard)' },
                      { value: '14', label: '14 Days (Extended)' },
                      { value: '21', label: '21 Days (Statutory)' },
                    ]}
                    value={String(createDeadlineDays)}
                    onChange={val => setCreateDeadlineDays(Number(val) || 7)}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block text-xs">
                  Summary & Motion Details *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain what the committee is voting on, why it is needed, and the proposed scope of work..."
                  value={createSummary}
                  onChange={e => setCreateSummary(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0055FF]"
                />
              </div>

              {/* Optional: Link to Resident Request */}
              {requests && requests.length > 0 && (
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1.5 block text-xs">
                    Link to Resident Request (Optional)
                  </label>
                  <CustomSelect
                    size="sm"
                    options={[
                      { value: '', label: '-- None (Standalone Committee Motion) --' },
                      ...requests.map(r => ({
                        value: r.id,
                        label: `${r.referenceId || r.id} — ${r.title}`,
                        description: `Type: ${r.requestType || 'General'} • Unit: ${r.unit || 'Common Area'}`
                      }))
                    ]}
                    value={createLinkedRequestId}
                    onChange={val => setCreateLinkedRequestId(val)}
                  />
                </div>
              )}

              {/* Optional: Contractor & Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    Contractor / Vendor (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Solar Solutions"
                    value={createVendorName}
                    onChange={e => setCreateVendorName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#0055FF]"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    Estimated Cost (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $4,200 AUD"
                    value={createEstimatedCost}
                    onChange={e => setCreateEstimatedCost(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#0055FF]"
                  />
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Vote size={14} />
                  <span>Start Vote</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
