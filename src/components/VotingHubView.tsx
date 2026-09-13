// @smartlot/component
import React, { useState, useRef } from 'react';
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
  ExternalLink, 
  Check, 
  AlertTriangle, 
  Wrench, 
  Calendar,
  X,
  HelpCircle,
  TrendingUp,
  RotateCcw,
  Bell,
  Printer,
  Sparkles,
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
  Plus
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
  // Filter motions for active scheme if schemeId is set
  const schemeMotions = motions.filter(m => !m.schemeId || !activeSchemeId || m.schemeId === activeSchemeId || activeSchemeId === 'SP52042');

  // View state: 'list' (Executive Motions Hub) or 'detail' (Full-Page Motion Governance Workspace)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'passed' | 'unresolved'>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
  const [showRfiModal, setShowRfiModal] = useState(false);
  const [rfiQuestion, setRfiQuestion] = useState('');
  const [rfiDays, setRfiDays] = useState(7);
  
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
  
  // SCM is elected Strata Committee Member (Cameron, Joana, Jake, George, Lisa, John)
  const isSCM = roleLower.includes('committee') || ['cameron', 'joana', 'jake', 'george', 'lisa', 'john'].some(scm => nameLower.includes(scm));
  const isLotOwnerOrResident = !isStrataManager && !isBuildingManager && !isSystemAdmin && !isSCM;

  // Rights:
  // - SCM & System Admin can cast vote
  // - Strata Manager & Building Manager CANNOT vote under Australian Strata Law
  const canCastVote = isSCM || isSystemAdmin;
  const canManageMotion = isStrataManager || isSystemAdmin;
  const canRequestRFI = isSCM || isStrataManager || isSystemAdmin;
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

  // Committee roster (defaults to 6 Cavallo members if not explicitly set)
  const committeeRoster = activeMotion?.committeeRoster || [
    { id: 'scm-1', name: 'Cameron', office: 'Chairperson' as SCMOffice, email: 'cameron.chair@cavalloscm.org', unit: 'Unit 28' },
    { id: 'scm-2', name: 'Joana', office: 'Treasurer' as SCMOffice, email: 'joana.treasurer@cavalloscm.org', unit: 'Unit 15' },
    { id: 'scm-3', name: 'Jake', office: 'Secretary' as SCMOffice, email: 'jake.secretary@cavalloscm.org', unit: 'Unit 9' },
    { id: 'scm-4', name: 'George', office: 'Committee Member' as SCMOffice, email: 'george.scm@cavalloscm.org', unit: 'Unit 12' },
    { id: 'scm-5', name: 'Lisa', office: 'Committee Member' as SCMOffice, email: 'lisa.scm@cavalloscm.org', unit: 'Unit 18' },
    { id: 'scm-6', name: 'John', office: 'Committee Member' as SCMOffice, email: 'john.member@cavalloscm.org', unit: 'Unit 21' },
  ];

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

  // Statistics
  const statsActive = schemeMotions.filter(m => m.status === 'active').length;
  const statsPassed = schemeMotions.filter(m => m.status === 'passed').length;
  const statsUnresolved = schemeMotions.filter(m => m.status === 'unresolved' || m.status === 'rejected').length;
  const statsAwaitingUser = schemeMotions.filter(
    m => m.status === 'active' && canCastVote && !m.ballots?.some(b => b.voterName.toLowerCase() === activePersonaName.toLowerCase())
  ).length;

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

  const handleConfirmRFI = () => {
    if (!rfiQuestion.trim() || !activeMotion) return;
    if (onRequestRFI) {
      onRequestRFI(activeMotion.id, rfiQuestion.trim(), Number(rfiDays) || 7);
    }
    setShowRfiModal(false);
    setRfiQuestion('');
    showToast(`⚠️ RFI submitted. Voting deadline extended by ${rfiDays} days.`);
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

  const handleSendBlast = () => {
    if (!activeMotion) return;
    if (onSendBlastReminder) {
      onSendBlastReminder(activeMotion.id);
    }
    showToast(`📢 Blast notification sent to all ${pendingVotesCount} unresponsive committee members.`);
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
    <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto bg-[#F8FAFC] dark:bg-[#07090E] text-gray-900 dark:text-gray-100 font-sans transition-colors pb-16">
      
      {/* ── Toast Notification ────────────────────────────────── */}
      {actionNotification && (
        <div className="fixed top-6 right-8 z-50 bg-gray-950 text-white dark:bg-white dark:text-black px-5 py-3 rounded-2xl shadow-2xl border border-white/20 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top duration-200">
          <Sparkles size={15} className="text-[#00D4B2]" />
          <span>{actionNotification}</span>
        </div>
      )}

      {/* ── Sleek Executive Header (Action-Oriented, No Book Fluff) ── */}
      <div className="border-b border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1017] px-6 lg:px-8 py-3.5 shrink-0 sticky top-0 z-30 shadow-2xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <Vote size={20} className="text-[#0055FF] dark:text-[#00D4B2]" />
              <span>Committee Voting</span>
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
              {activeMotion?.strataPlan || 'SP 52042'}
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Quorum: 4 of 6 Votes
            </span>
            <div className="h-4 w-px bg-gray-200 dark:bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{activePersonaName}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                isSCM 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                  : isStrataManager 
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-gray-500/15 text-gray-500 dark:text-gray-400 border border-gray-500/30'
              }`}>
                {isSCM ? 'Eligible SCM Voter' : isStrataManager ? 'Strata Manager (Non-voting)' : isLotOwnerOrResident ? 'Resident (Discussion)' : 'Observer'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {viewMode === 'list' && canManageMotion && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>+ Start New Vote</span>
              </button>
            )}
            {activeMotion && (
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer size={13} className="text-[#0055FF] dark:text-[#00D4B2]" />
                <span>Certified Report</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── VIEW MODE 1: EXECUTIVE MOTIONS HUB (GALLERY / DIRECTORY) ── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* ── Executive KPI Summary Grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-[#0D121C] border border-gray-200/80 dark:border-white/10 rounded-3xl p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-lg shrink-0">
                <Clock size={22} />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">{statsActive}</div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400">Active in Voting</div>
              </div>
            </div>

            <div className={`bg-white dark:bg-[#0D121C] border rounded-3xl p-5 shadow-xs flex items-center gap-4 ${
              canCastVote && statsAwaitingUser > 0 
                ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/5' 
                : 'border-gray-200/80 dark:border-white/10'
            }`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg shrink-0">
                <Vote size={22} />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span>{canCastVote ? statsAwaitingUser : '—'}</span>
                  {canCastVote && statsAwaitingUser > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400">Awaiting Your Vote</div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0D121C] border border-gray-200/80 dark:border-white/10 rounded-3xl p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">{statsPassed}</div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400">Passed & Binding</div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0D121C] border border-gray-200/80 dark:border-white/10 rounded-3xl p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-lg shrink-0">
                <FileText size={22} />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">{statsUnresolved}</div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400">Under RFI / Revision</div>
              </div>
            </div>
          </div>

          {/* ── Search & Filter Controls ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0D121C] p-4 rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search motion title, ID, or lot..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-xs'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                All Motions ({schemeMotions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('active')}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'active'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
                }`}
              >
                Active ({statsActive})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('passed')}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'passed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                Passed & Binding ({statsPassed})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('unresolved')}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'unresolved'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                }`}
              >
                Under RFI ({statsUnresolved})
              </button>

              {canManageMotion && (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-3.5 py-1.5 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer ml-auto"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>+ Start Vote</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Responsive Full-Width Motions Grid ── */}
          {filteredMotions.length === 0 ? (
            <div className="bg-white dark:bg-[#0D121C] border border-gray-200/80 dark:border-white/10 rounded-3xl p-16 text-center space-y-4">
              <Vote size={48} className="mx-auto text-gray-300 dark:text-gray-600" />
              <div className="text-base font-bold text-gray-800 dark:text-gray-200">No motions match your filters</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Try searching for a different term or reset your status filters to view all strata motions.
              </p>
              <button
                type="button"
                onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-500"
              >
                Reset Filters
              </button>
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
                    className="bg-white dark:bg-[#0D121C] border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 shadow-xs hover:shadow-xl hover:border-[#0055FF]/40 dark:hover:border-[#00D4B2]/40 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
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
                        ) : motion.status === 'unresolved' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase">
                            Under RFI
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
                      <div className="bg-gray-50 dark:bg-black/30 p-3.5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <Vote size={13} className="text-[#0055FF] dark:text-[#00D4B2]" />
                            <span>Quorum Progress:</span>
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
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 dark:bg-white/3 border border-gray-100 dark:border-white/5 text-xs">
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
                          <span>Cast Ballot →</span>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
          
          {/* Top Breadcrumb & Motion Switcher Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 dark:border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-gray-200 dark:border-white/10 shadow-2xs cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>All Motions ({schemeMotions.length})</span>
              </button>

              <div className="h-4 w-px bg-gray-300 dark:bg-white/20 hidden sm:block" />

              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                <span>{activeMotion.strataPlan || 'SP 52042'}</span>
                <span>/</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{activeMotion.id}</span>
              </div>
            </div>

            {/* Quick Motion Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 hidden sm:inline">Jump to:</span>
              <select
                value={activeMotion.id}
                onChange={(e) => setSelectedMotionId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#141A24] border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
              >
                {schemeMotions.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.id}: {m.title.substring(0, 45)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── 12-Column Executive Layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ── LEFT 8 COLUMNS: Main Governance Canvas ── */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Executive Motion Header Block */}
              <div className="bg-white dark:bg-[#0D121C] rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4">
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
                  ) : activeMotion.status === 'unresolved' ? (
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-black uppercase">
                      Under RFI Clarification
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
                <div className="bg-gradient-to-r from-emerald-950/60 via-emerald-900/40 to-teal-950/60 border-2 border-emerald-500/40 rounded-3xl p-6 text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-emerald-950/20">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <Lock size={22} className="stroke-[2.5]" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white">
                          🎉 MOTION OFFICIALLY PASSED & BINDING RESOLUTION
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-black uppercase">
                          Threshold Achieved
                        </span>
                      </div>
                      <p className="text-xs text-emerald-200/80 leading-relaxed">
                        Statutory threshold of {quorumTarget} YES votes reached under NSW Strata Schemes Management Act 2015. Ballots are locked against further modification.
                      </p>
                    </div>
                  </div>

                  {activeMotion.createdWorkOrderId ? (
                    <div className="shrink-0 bg-black/40 border border-emerald-500/30 rounded-2xl px-4 py-2.5 text-right">
                      <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Work Order Dispatched</div>
                      <div className="text-sm font-mono font-black text-white">{activeMotion.createdWorkOrderId}</div>
                    </div>
                  ) : canManageMotion && (
                    <button
                      type="button"
                      onClick={() => onResolveMotion(activeMotion.id, 'passed')}
                      className="shrink-0 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                    >
                      <Wrench size={14} />
                      <span>Issue Work Order</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-[#0D121C] border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Live Quorum & Voting Progress
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
                    <div className="h-3.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden flex">
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
                      className="absolute top-6 text-[10px] font-mono font-bold text-gray-600 dark:text-gray-300 -translate-x-1/2 whitespace-nowrap"
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
              )}

              {/* ── Committee Member Voting Action: Vote - Approve or Reject ── */}
              {canCastVote && !isLocked && (
                <div className="bg-white dark:bg-[#0D121C] border border-gray-200/80 dark:border-white/10 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Vote size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-gray-900 dark:text-white">
                        Vote — Approve or Reject
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {userBallot ? (
                          <span>
                            You voted <strong className={userBallot.vote === 'YES' ? 'text-emerald-500' : 'text-red-500'}>{userBallot.vote === 'YES' ? 'Approve' : 'Reject'}</strong>. You can change your vote anytime before voting closes.
                          </span>
                        ) : (
                          <span>Cast your committee vote on this motion.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleVoteSubmit('YES')}
                      className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                        userBallot?.vote === 'YES'
                          ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/50 shadow-emerald-500/20 shadow-md'
                          : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white border border-emerald-500/20'
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVoteSubmit('NO')}
                      className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                        userBallot?.vote === 'NO'
                          ? 'bg-red-500 text-white ring-2 ring-red-400/50 shadow-red-500/20 shadow-md'
                          : 'bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white border border-red-500/20'
                      }`}
                    >
                      <X size={14} strokeWidth={3} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── Official Committee Discussion & Comments ── */}
              <div className="bg-white dark:bg-[#0D121C] border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare size={18} className="text-[#0055FF] dark:text-[#00D4B2]" />
                    <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Comments & Discussion
                    </h2>
                  </div>

                  {/* RFI Trigger Button */}
                  {canRequestRFI && !isLocked && (
                    <button
                      type="button"
                      onClick={() => setShowRfiModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-amber-500/20 transition-all"
                    >
                      <HelpCircle size={13} />
                      <span>Ask for More Info</span>
                    </button>
                  )}
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
              
              {/* Strata Manager Admin Actions Panel */}
              <div className="bg-white dark:bg-[#0D121C] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Governance Actions
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                    NSW SSMA 2015
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Formal Legal Vote Report Button */}
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-[#0055FF]/10 dark:bg-[#0055FF]/20 hover:bg-[#0055FF] text-[#0055FF] dark:text-[#60A5FA] hover:text-white border border-[#0055FF]/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <Printer size={14} />
                    <span>Generate Certified Vote Report</span>
                  </button>

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
                        className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                      >
                        <Scale size={14} />
                        <span>Close Vote</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowExtendModal(true)}
                        className="w-full py-2.5 px-4 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-blue-500/10 text-gray-700 dark:text-gray-300 hover:text-blue-500 border border-gray-200 dark:border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Calendar size={14} />
                        <span>Extend Voting Deadline</span>
                      </button>

                      {pendingVotesCount > 0 && (
                        <button
                          type="button"
                          onClick={handleSendBlast}
                          className="w-full py-2.5 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-black border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Bell size={14} />
                          <span>Blast Remind Unresponsive ({pendingVotesCount})</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowRestartModal(true)}
                        className="w-full py-2.5 px-4 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-amber-500/10 text-gray-700 dark:text-gray-300 hover:text-amber-500 border border-gray-200 dark:border-white/10 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={14} />
                        <span>Restart Committee Vote</span>
                      </button>

                      {isPassed && !activeMotion.createdWorkOrderId && (
                        <button
                          type="button"
                          onClick={() => onResolveMotion(activeMotion.id, 'passed')}
                          className="w-full py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Wrench size={14} />
                          <span>Issue Official Work Order</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ── Strata Committee Members (SCM) Live Voting Roster Card ── */}
              <div className="bg-white dark:bg-[#0D121C] rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[#0055FF] dark:text-[#00D4B2]" />
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Committee Roster
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-gray-400">
                    6 Members
                  </span>
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

                        {/* 1-Click Remind Button for Managers */}
                        {!hasVoted && canManageMotion && (
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
              <div className="bg-white dark:bg-[#0D121C] rounded-3xl border border-gray-200/80 dark:border-white/10 p-5 shadow-xs space-y-2 text-xs text-gray-500 dark:text-gray-400">
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
      {showReportModal && activeMotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0C1018] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-white/15 p-6 lg:p-8 shadow-2xl text-gray-900 dark:text-white space-y-6">
            
            {/* Report Header */}
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-white/10 pb-4">
              <div>
                <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
                  Official Strata Record • NSW SSMA 2015 s 106
                </div>
                <h2 className="text-xl font-black">Certificate of Committee Motion Vote</h2>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-white/4 p-4 rounded-2xl text-xs">
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Motion ID</div>
                <div className="font-mono font-bold">{activeMotion.id}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Quorum Target</div>
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
              <table className="w-full text-xs border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
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

            {/* Statutory Certification Block */}
            <div className="border-t border-gray-200 dark:border-white/10 pt-4 grid grid-cols-2 gap-6 text-xs">
              <div className="border-t border-dashed border-gray-400 pt-2 text-gray-500">
                <div>Steve (StrataChoice)</div>
                <div className="text-[10px]">Strata Managing Agent Certification</div>
              </div>
              <div className="border-t border-dashed border-gray-400 pt-2 text-gray-500">
                <div>Cameron (Chairperson)</div>
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

      {/* ── RFI / Clarification Modal ──────────────────────────── */}
      {showRfiModal && activeMotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0C1018] rounded-3xl max-w-lg w-full border border-gray-200 dark:border-white/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <HelpCircle size={18} className="text-amber-500" />
                  <span>Request for Information (RFI)</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Request clarification or revisions from the requester and optionally extend the voting deadline.
                </p>
              </div>
              <button onClick={() => setShowRfiModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Clarification Question / Design Request</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please supply updated signage design mockups in green finish to match foyer aesthetics..."
                  value={rfiQuestion}
                  onChange={e => setRfiQuestion(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#0055FF]"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Extend Voting Deadline</label>
                <div className="flex items-center gap-2">
                  {[7, 14, 21].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setRfiDays(d)}
                      className={`px-3 py-1.5 rounded-xl border font-bold cursor-pointer transition-all ${
                        rfiDays === d ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-transparent text-gray-400 border-gray-200 dark:border-white/10'
                      }`}
                    >
                      +{d} Days
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRfiModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRFI}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black cursor-pointer shadow-sm"
              >
                Submit RFI & Extend Deadline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Restart Voting Modal ───────────────────────────────── */}
      {showRestartModal && activeMotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0C1018] rounded-3xl max-w-lg w-full border border-gray-200 dark:border-white/15 p-6 shadow-2xl space-y-4">
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
                  placeholder="e.g. Requester Jack submitted revised green mockup design following John's RFI. Fresh vote required..."
                  value={restartReason}
                  onChange={e => setRestartReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
          <div className="bg-white dark:bg-[#0C1018] rounded-3xl max-w-lg w-full border border-gray-200 dark:border-white/15 p-6 shadow-2xl space-y-4">
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
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 focus:outline-none"
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
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black cursor-pointer shadow-sm"
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
          <div className="bg-white dark:bg-[#0C1018] rounded-3xl max-w-lg w-full border border-gray-200 dark:border-white/15 p-6 shadow-2xl space-y-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0C1018] rounded-3xl max-w-xl w-full border border-gray-200 dark:border-white/15 p-6 lg:p-7 shadow-2xl space-y-5 text-gray-900 dark:text-white animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div>
                <div className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest mb-0.5">
                  Strata Manager Decision • SP 52042
                </div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Scale size={18} className="text-red-500" />
                  <span>Close Vote</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Motion: <strong>{activeMotion.id}</strong> — {activeMotion.title}
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
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 dark:bg-[#070A10] rounded-2xl border border-gray-200 dark:border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCloseModalTab('before')}
                className={`py-2 rounded-xl transition-all cursor-pointer font-bold ${
                  closeModalTab === 'before'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Before completion
              </button>
              <button
                type="button"
                onClick={() => setCloseModalTab('after')}
                className={`py-2 rounded-xl transition-all cursor-pointer font-bold ${
                  closeModalTab === 'after'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                After Completion = Output achieved
              </button>
            </div>

            {/* PATHWAY 1: BEFORE COMPLETION (Needs extra info -> Add a reason -> Send notification to requestor -> Request goes back to pending) */}
            {closeModalTab === 'before' && (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs space-y-1">
                  <div className="font-black text-amber-600 dark:text-amber-400">
                    Incase of additional details needed to cast vote
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Close voting early when the committee or strata manager requires missing specifications, additional contractor quotes, or revised details. The case status will automatically revert back to <strong>Pending Triage</strong> and an email notification will be sent to the requestor.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                    Add a reason *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Committee requested 2 additional contractor quotes and structural engineer report before voting..."
                    value={closeReasonInput}
                    onChange={e => setCloseReasonInput(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="p-3 bg-gray-50 dark:bg-black/30 rounded-xl border border-gray-200 dark:border-white/5 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between">
                  <span>Automated Workflow:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Send notification to requestor ➔ Request goes back to pending
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
                    className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer shadow-md transition-all"
                  >
                    Send Notification & Revert to Pending
                  </button>
                </div>
              </div>
            )}

            {/* PATHWAY 2: AFTER COMPLETION = OUTPUT ACHIEVED */}
            {closeModalTab === 'after' && (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs space-y-1">
                  <div className="font-black text-emerald-600 dark:text-emerald-400">
                    Request status changes as per votes
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-mono text-[11px] pt-1 flex items-center gap-2">
                    <span>Live Quorum: <strong>{yesVotes} YES</strong> • <strong>{noVotes} NO</strong> • <strong>{abstainVotes} ABSTAIN</strong></span>
                    <span>(Target: {quorumTarget} Votes)</span>
                  </div>
                </div>

                {/* Option A: Motion Passed [If Approved] */}
                <div className="space-y-2">
                  <div className="text-[11px] font-black uppercase text-gray-400 tracking-wider">
                    Motion Passed [If Approved] • Send notification to all participants
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-blue-500/5 dark:bg-[#070A10] p-3.5 rounded-xl border border-blue-500/30 space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          If strata / building-level
                        </span>
                        <p className="text-gray-600 dark:text-gray-300 text-[11px] mt-1 leading-relaxed">
                          Motion passed ➔ Dispatches notification to all participants ➔ <strong>Initiate Work order Flow</strong>.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConfirmResolveMotion('passed', '🚀 Motion Approved! Work order flow initiated.')}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                      >
                        Initiate Work order Flow
                      </button>
                    </div>

                    <div className="bg-purple-500/5 dark:bg-[#070A10] p-3.5 rounded-xl border border-purple-500/30 space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-300">
                          If resident-level
                        </span>
                        <p className="text-gray-600 dark:text-gray-300 text-[11px] mt-1 leading-relaxed">
                          Motion passed ➔ Dispatches approval letter to resident ➔ <strong>[Request] Voting Closed</strong>.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConfirmResolveMotion('passed', '✅ Resident request approved and voting closed.')}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                      >
                        [Request] Voting Closed
                      </button>
                    </div>
                  </div>
                </div>

                {/* Option B: If Rejected */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-red-600 dark:text-red-400">If Rejected:</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Send notification to requestor ➔ [Request] Voting Closed</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleConfirmResolveMotion('rejected', '❌ Motion Rejected. Notification sent to requestor.')}
                      className="px-3.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white border border-red-500/20 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Mark as Rejected & Close
                    </button>
                  </div>
                </div>

                {/* Option C: In case of tie or no votes, send for Manager review */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-2 text-xs">
                  <div>
                    <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Scale size={13} />
                      <span>In case of tie or no votes, send for Manager review:</span>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      Committee votes are tied or inconclusive. Strata Manager exercises administrative casting determination.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmResolveMotion('passed', '⚖️ Strata Manager casting vote: PASSED. Work order flow initiated.')}
                      className="flex-1 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-emerald-500/20 text-gray-700 dark:text-gray-300 hover:text-emerald-400 border border-transparent hover:border-emerald-500/30 rounded-lg font-bold text-xs cursor-pointer transition-colors"
                    >
                      Casting Vote: Pass Motion
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmResolveMotion('rejected', '⚖️ Strata Manager casting vote: REJECTED. Request closed.')}
                      className="flex-1 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-red-500/20 text-gray-700 dark:text-gray-300 hover:text-red-400 border border-transparent hover:border-red-500/30 rounded-lg font-bold text-xs cursor-pointer transition-colors"
                    >
                      Casting Vote: Reject Motion
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0C1018] rounded-3xl max-w-lg w-full border border-gray-200 dark:border-white/15 p-6 lg:p-7 shadow-2xl space-y-5 text-gray-900 dark:text-white">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div>
                <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5">
                  Strata Committee Motion • {activeMotion?.strataPlan || 'SP 52042'}
                </div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Vote size={18} className="text-blue-600 dark:text-[#00D4B2]" />
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
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    Category
                  </label>
                  <select
                    value={createCategory}
                    onChange={e => setCreateCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Repairs & Maintenance">Repairs & Maintenance</option>
                    <option value="Major Works">Major Works</option>
                    <option value="By-law Approval">By-law Approval</option>
                    <option value="Financial">Financial Approval</option>
                    <option value="General">General Resolution</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    Voting Period
                  </label>
                  <select
                    value={createDeadlineDays}
                    onChange={e => setCreateDeadlineDays(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={7}>7 Days (Standard)</option>
                    <option value={14}>14 Days (Extended)</option>
                    <option value={21}>21 Days (Statutory)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  Summary & Motion Details *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain what the committee is voting on, why it is needed, and the proposed scope of work..."
                  value={createSummary}
                  onChange={e => setCreateSummary(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Optional: Link to Resident Request */}
              {requests && requests.length > 0 && (
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                    Link to Resident Request (Optional)
                  </label>
                  <select
                    value={createLinkedRequestId}
                    onChange={e => setCreateLinkedRequestId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- None (Standalone Committee Motion) --</option>
                    {requests.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.referenceId || r.id} — {r.title} ({r.requestType || 'General'})
                      </option>
                    ))}
                  </select>
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
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
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
