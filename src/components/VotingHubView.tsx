// @smartlot/component
import React, { useState } from 'react';
import { 
  Motion, 
  MotionVote, 
  ResidentRequest, 
  SCMOffice,
  MotionAttachment 
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
  ArrowLeft,
  Scale
} from 'lucide-react';

interface VotingHubViewProps {
  motions: Motion[];
  requests: ResidentRequest[];
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

  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'passed' | 'unresolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  // Workflow View Mode: 'list' (Requests currently in voting) vs 'detail' (Selected Motion & Track)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  // Close Voting Decision Engine Modal (Miro Flowchart)
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeModalTab, setCloseModalTab] = useState<'before' | 'after'>('before');
  const [closeReasonInput, setCloseReasonInput] = useState('');

  // ── Permission Matrix (per spreadsheet) ──────────────────────────────────
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

  // Close Voting: Path 1 (Before Completion - Revert to Pending)
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

  // Close Voting: Path 2 (After Completion - Output Achieved Resolution)
  const handleConfirmResolveMotion = (outcome: 'passed' | 'rejected', customToast?: string) => {
    if (!activeMotion) return;
    onResolveMotion(activeMotion.id, outcome);
    setShowCloseModal(false);
    showToast(customToast || (outcome === 'passed' ? '🚀 Motion PASSED & work order flow initiated.' : '❌ Motion REJECTED & request closed.'));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F6F9] dark:bg-[#07090E] text-gray-900 dark:text-gray-100 font-sans transition-colors relative">
      
      {/* ── Toast Notification ────────────────────────────────── */}
      {actionNotification && (
        <div className="absolute top-4 right-8 z-50 bg-gray-950 text-white dark:bg-white dark:text-black px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <Sparkles size={14} className="text-[#00D4B2]" />
          <span>{actionNotification}</span>
        </div>
      )}

      {/* ── Top Header Banner ─────────────────────────────────── */}
      <div className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0C1017] px-6 lg:px-8 py-5 shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0055FF]/10 dark:bg-[#0055FF]/20 text-[#0055FF] dark:text-[#60A5FA] border border-[#0055FF]/20 text-xs font-bold uppercase tracking-wider mb-1.5">
              <Vote size={13} className="text-[#0055FF] dark:text-[#60A5FA]" />
              <span>NSW Strata Schemes Management Act 2015 s 106 • Committee Voting</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <span>Strata Committee Voting Engine</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-mono">
                {activeMotion?.strataPlan || 'SP 52042'}
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Administer binding committee resolutions, manage RFIs, enforce 4-vote passing thresholds, and issue certified vote tallies.
            </p>
          </div>

          {/* View Mode Switcher & Quick Stat Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Miro Flow Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#141A24] p-1 rounded-2xl border border-gray-200 dark:border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-[#0055FF] text-gray-900 dark:text-white shadow-xs font-black'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Layers size={13} />
                <span>1. Requests in Voting ({statsActive})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detail')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'detail'
                    ? 'bg-white dark:bg-[#0055FF] text-gray-900 dark:text-white shadow-xs font-black'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Vote size={13} />
                <span>2. Ticket & Vote Track</span>
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-[#141A24] border border-gray-200 dark:border-white/10 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-[#0055FF]/10 dark:bg-[#0055FF]/20 text-[#0055FF] dark:text-[#60A5FA] flex items-center justify-center font-black text-xs">
                {statsActive}
              </div>
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Active</div>
                <div className="text-xs font-black text-gray-900 dark:text-white">In Progress</div>
              </div>
            </div>

            {canCastVote && (
              <div className="bg-gray-50 dark:bg-[#141A24] border border-gray-200 dark:border-white/10 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs">
                  {statsAwaitingUser}
                </div>
                <div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Awaiting You</div>
                  <div className="text-xs font-black text-amber-600 dark:text-amber-400">Needs SCM Vote</div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-[#141A24] border border-gray-200 dark:border-white/10 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
                {statsPassed}
              </div>
              <div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Passed</div>
                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">Locked & Passed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Role Gate Advisory Banner (Spreadsheet Permission Matrix) ── */}
      <div className="bg-gray-100/90 dark:bg-[#0F141F] border-b border-gray-200 dark:border-white/10 px-6 lg:px-8 py-2.5 shrink-0 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-500 dark:text-gray-400">Your Current Perspective:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00D4B2]/15 text-[#00D4B2] border border-[#00D4B2]/30 font-black">
              <Shield size={11} />
              <span>{activePersonaName} ({activePersonaRole})</span>
            </span>

            {/* Permission Matrix Clarification Pill */}
            {isStrataManager && (
              <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                <Info size={12} className="text-blue-400 shrink-0" />
                <span><strong>Strata Manager:</strong> You administer, extend, restart, and blast remind. <em>Non-voting role under NSW Law.</em></span>
              </span>
            )}
            {isBuildingManager && (
              <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                <Info size={12} className="text-amber-400 shrink-0" />
                <span><strong>Building Manager:</strong> You participate in discussion and technical input. <em>Non-voting role.</em></span>
              </span>
            )}
            {isSCM && (
              <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                <span><strong>Strata Committee Member:</strong> You hold official voting rights. 4 votes required to pass.</span>
              </span>
            )}
            {isLotOwnerOrResident && (
              <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                <Eye size={12} className="text-purple-400 shrink-0" />
                <span><strong>Lot Owner (Resident):</strong> Transparency View. You can view progress and submit revised attachments.</span>
              </span>
            )}
          </div>

          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span>Site: <strong>Cavallo, 1 Pitt St, Sydney NSW 2000</strong></span>
            <span>• Quorum: <strong>4 of 6 Votes</strong></span>
          </div>
        </div>
      </div>

      {/* ── Main Workspace: Dual Mode (Step 1: List vs Step 2: Detail) ──────── */}
      {viewMode === 'list' ? (
        /* ── VIEW 1: FULL-WIDTH REQUESTS CURRENTLY IN VOTING (Miro Flowchart Step 1) ── */
        <div className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
          
          {/* Header Bar with Count, Description, Search and Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0D121C] border border-gray-200 dark:border-white/10 rounded-3xl p-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Requests Currently in Voting</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {filteredMotions.length}
                  </span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Active Committee Ballots
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                NSW SSMA 2015 s 106 • Select a request below to inspect live voter tallies, post comments, or execute the Close Voting Decision Engine.
              </p>
            </div>

            {/* Search Input & Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search motions or SP..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-1 focus:ring-[#0055FF]"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-black/40 rounded-xl text-xs font-bold">
                {(['all', 'active', 'passed', 'unresolved'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                      activeFilter === f 
                        ? 'bg-white dark:bg-[#1A2232] text-gray-900 dark:text-white shadow-2xs font-black' 
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Request Cards Grid */}
          {filteredMotions.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#0D121C] border border-gray-200 dark:border-white/10 rounded-3xl p-8 text-gray-400">
              <Vote size={36} className="mx-auto mb-2 text-gray-400 dark:text-gray-600" />
              <div className="text-sm font-bold text-gray-700 dark:text-gray-300">No requests found</div>
              <div className="text-xs text-gray-400 mt-1">Try adjusting your search query or filter settings.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMotions.map(motion => {
                const req = requests.find(r => r.id === motion.caseId || r.referenceId === motion.caseId);
                const mYes = motion.ballots?.filter(b => b.vote === 'YES').length || 0;
                const mNo = motion.ballots?.filter(b => b.vote === 'NO').length || 0;
                const mTarget = motion.quorumTarget || 4;
                const mPassed = motion.status === 'passed' || mYes >= mTarget;
                const mIsBuilding = (motion.heading || '').toLowerCase().includes('building') || (motion.heading || '').toLowerCase().includes('strata') || (req?.requestType || '').toLowerCase().includes('maintenance');
                const isTie = !mPassed && mYes > 0 && mYes === mNo;

                return (
                  <div
                    key={motion.id}
                    onClick={() => {
                      setSelectedMotionId(motion.id);
                      setViewMode('detail');
                    }}
                    className="bg-white dark:bg-[#0D121C] hover:border-[#0055FF]/40 dark:hover:border-[#00D4B2]/40 border border-gray-200 dark:border-white/10 rounded-3xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-mono font-black px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                            {req?.referenceId || motion.id}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                            mIsBuilding 
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
                              : 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20'
                          }`}>
                            {mIsBuilding ? 'Building-Level Motion' : 'Resident-Level Motion'}
                          </span>
                        </div>

                        {mPassed ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Passed & Locked
                          </span>
                        ) : isTie ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
                            Tie Vote ({mYes} vs {mNo})
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Active • Closes in 48h
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-black text-sm text-gray-900 dark:text-white group-hover:text-[#0055FF] dark:group-hover:text-[#00D4B2] transition-colors line-clamp-2">
                          {motion.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {motion.summary}
                        </p>
                      </div>

                      {/* Live Segmented Progress Bar */}
                      <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400 text-[11px] font-bold">Quorum Target: {mTarget} of {totalCommitteeSize} Votes</span>
                          <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                            {mYes} YES • {mNo} NO
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2 overflow-hidden flex">
                          <div style={{ width: `${Math.min(100, (mYes / totalCommitteeSize) * 100)}%` }} className="bg-emerald-500" />
                          <div style={{ width: `${Math.min(100, (mNo / totalCommitteeSize) * 100)}%` }} className="bg-red-500" />
                          <div style={{ width: `${Math.max(0, 100 - ((mYes + mNo) / totalCommitteeSize) * 100)}%` }} className="bg-gray-300 dark:bg-gray-700" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                      <span className="text-gray-400 text-[11px] truncate">
                        By: <strong className="text-gray-700 dark:text-gray-300">{req?.requestorName || 'Strata Committee'}</strong>
                      </span>
                      <span className="text-xs font-black text-[#0055FF] dark:text-[#00D4B2] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Review & Track Voting</span>
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : (
        /* ── VIEW 2: DETAIL & LIVE VOTING TRACKING WORKSPACE (Miro Flowchart Step 2 & 3) ── */
        <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto p-4 lg:p-6 gap-6">
        
        {/* ── Left Column: Motions Queue ──────────────────────── */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col bg-white dark:bg-[#0D121C] rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
          
          {/* List Search & Filter Bar */}
          <div className="p-3.5 border-b border-gray-100 dark:border-white/5 space-y-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search SP, heading, or motion ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-1 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 dark:bg-black/40 rounded-xl text-[11px] font-bold text-center">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${activeFilter === 'all' ? 'bg-white dark:bg-[#1A2232] text-gray-900 dark:text-white shadow-2xs font-extrabold' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                All ({schemeMotions.length})
              </button>
              <button 
                onClick={() => setActiveFilter('active')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${activeFilter === 'active' ? 'bg-white dark:bg-[#1A2232] text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setActiveFilter('passed')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${activeFilter === 'passed' ? 'bg-white dark:bg-[#1A2232] text-emerald-600 dark:text-emerald-400 shadow-2xs font-extrabold' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Passed
              </button>
              <button 
                onClick={() => setActiveFilter('unresolved')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${activeFilter === 'unresolved' ? 'bg-white dark:bg-[#1A2232] text-amber-600 dark:text-amber-400 shadow-2xs font-extrabold' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Unresolved
              </button>
            </div>
          </div>

          {/* Scrollable Motions List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredMotions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                <Vote size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                No motions match your search criteria.
              </div>
            ) : (
              filteredMotions.map(motion => {
                const isSelected = activeMotion?.id === motion.id;
                const mYes = motion.ballots?.filter(b => b.vote === 'YES').length || 0;
                const mTarget = motion.quorumTarget || 4;
                const mPassed = motion.status === 'passed' || mYes >= mTarget;
                const mUserVoted = motion.ballots?.some(b => b.voterName.toLowerCase() === activePersonaName.toLowerCase());

                return (
                  <div
                    key={motion.id}
                    onClick={() => setSelectedMotionId(motion.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected 
                        ? 'bg-[#0055FF]/5 dark:bg-[#0055FF]/10 border-[#0055FF]/40 shadow-xs' 
                        : 'bg-gray-50/50 dark:bg-white/2 border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/15'
                    }`}
                  >
                    {/* Active Selection Stripe */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0055FF] dark:bg-[#00D4B2]" />
                    )}

                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500">
                        {motion.strataPlan ? `${motion.strataPlan} • ` : ''}{motion.id}
                      </span>

                      {/* Status Chip */}
                      {mPassed ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold flex items-center gap-1">
                          <CheckCircle2 size={10} /> Passed & Locked
                        </span>
                      ) : motion.status === 'unresolved' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-extrabold">
                          Unresolved
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-extrabold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> In Progress
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                      {motion.title}
                    </h3>

                    {/* Quorum Progress Tracker */}
                    <div className="mt-2.5 pt-2 border-t border-gray-200/60 dark:border-white/5 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-gray-900 dark:text-white">{mYes}</span>
                        <span className="text-gray-400">/ {mTarget} required to pass</span>
                      </div>

                      {canCastVote && !mUserVoted && !mPassed && (
                        <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                          • Needs Your Vote
                        </span>
                      )}
                      {mUserVoted && (
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                          ✓ You Voted
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right Column: Motion Execution & SCM Governance Panel ── */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#0D121C] rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
          
          {activeMotion ? (
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
              
              {/* Back to Requests navigation bar (Miro Step 2) */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="inline-flex items-center gap-2 text-xs font-black text-[#0055FF] dark:text-[#60A5FA] hover:underline cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>← Back to Requests Currently in Voting</span>
                </button>

                <div className="text-xs text-gray-400">
                  Motion <strong>{activeMotion.id}</strong> • Quorum Target: <strong>{quorumTarget} of {totalCommitteeSize} Votes</strong>
                </div>
              </div>

              {/* ── Motion Header Block (Standard Title Format) ── */}
              <div className="border-b border-gray-100 dark:border-white/8 pb-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                      {activeMotion.id}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Category: {activeMotion.heading || 'Lot Owner Request'}
                    </span>
                    {activeMotion.strataPlan && (
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                        {activeMotion.strataPlan} • {activeMotion.propertyAddress}
                      </span>
                    )}
                  </div>

                  {/* Strata Manager Admin Actions Menu */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {canManageMotion && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCloseModalTab(isPassed ? 'after' : 'before');
                            setShowCloseModal(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                          title="Open Close Voting Decision Engine (Miro Workflow)"
                        >
                          <Scale size={13} />
                          <span>Close Voting</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowRestartModal(true)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-amber-500/10 text-gray-700 dark:text-gray-300 hover:text-amber-500 border border-transparent hover:border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                          title="Restart voting process with reset notification"
                        >
                          <RotateCcw size={12} />
                          <span>Restart Vote</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowExtendModal(true)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-blue-500/10 text-gray-700 dark:text-gray-300 hover:text-blue-400 border border-transparent hover:border-blue-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                          title="Extend voting deadline"
                        >
                          <Calendar size={12} />
                          <span>Extend Deadline</span>
                        </button>
                      </>
                    )}

                    {/* Generate Formal Vote Report Button */}
                    <button
                      type="button"
                      onClick={() => setShowReportModal(true)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0055FF]/10 dark:bg-[#0055FF]/20 hover:bg-[#0055FF] text-[#0055FF] dark:text-[#60A5FA] hover:text-white border border-[#0055FF]/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Printer size={13} />
                      <span>Formal Vote Report</span>
                    </button>
                  </div>
                </div>

                {/* Standard Title Format: [Strata Plan] - [Address] - [Heading] */}
                <h2 className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white leading-snug">
                  {activeMotion.title}
                </h2>

                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {activeMotion.summary}
                </p>

                {/* ── Linked Request Details Card (Proper Full Specs Card) ── */}
                {linkedRequest && (
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
                )}
              </div>

              {/* ── Status Banner (Passed & Locked Celebration OR In Progress) ── */}
              {isPassed ? (
                <div className="bg-gradient-to-r from-emerald-950/60 via-emerald-900/40 to-teal-950/60 border-2 border-emerald-500/40 rounded-2xl p-4 text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <Lock size={18} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white">
                          🎉 MOTION OFFICIALLY PASSED & LOCKED
                        </h4>
                        <span className="px-2 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-black uppercase">
                          Threshold Reached
                        </span>
                      </div>
                      <p className="text-xs text-emerald-200/80 mt-0.5">
                        Statutory threshold of {quorumTarget} YES votes achieved. This motion is binding under the NSW Strata Schemes Management Act 2015. Ballots are locked against further modification.
                      </p>
                    </div>
                  </div>

                  {activeMotion.createdWorkOrderId ? (
                    <div className="shrink-0 bg-black/40 border border-emerald-500/30 rounded-xl px-3 py-2 text-right">
                      <div className="text-[10px] text-emerald-400 font-bold uppercase">Work Order Initiated</div>
                      <div className="text-xs font-mono font-black text-white">{activeMotion.createdWorkOrderId}</div>
                    </div>
                  ) : canManageMotion && (
                    <button
                      type="button"
                      onClick={() => onResolveMotion(activeMotion.id, 'passed')}
                      className="shrink-0 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Wrench size={13} />
                      <span>Issue Work Order</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-2xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                    <div>
                      <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Live Quorum & Voting Progress
                      </div>
                      <div className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 mt-0.5">
                        <span>{yesVotes} Yes votes cast</span>
                        <span className="text-gray-400 font-normal">•</span>
                        <span className="text-[#0055FF] dark:text-[#00D4B2]">{quorumTarget - yesVotes} more needed to pass</span>
                      </div>
                    </div>

                    {/* Strata Manager Blast Reminder Button */}
                    {canManageMotion && pendingVotesCount > 0 && (
                      <button
                        type="button"
                        onClick={handleSendBlast}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-black border border-amber-500/30 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        title="Send automated reminder blast to all unresponsive committee members"
                      >
                        <Bell size={12} />
                        <span>Blast Remind Unresponsive ({pendingVotesCount})</span>
                      </button>
                    )}
                  </div>

                  {/* Progress Bar with 4-Vote Threshold Marker */}
                  <div className="relative pt-2 pb-1">
                    <div className="h-3 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden flex">
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

                    {/* Threshold Target Line indicator at 4 of 6 (66.6%) */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-gray-900 dark:bg-white z-10"
                      style={{ left: `${(quorumTarget / totalCommitteeSize) * 100}%` }}
                    />
                    <div 
                      className="absolute top-5 text-[9px] font-mono font-bold text-gray-500 dark:text-gray-400 -translate-x-1/2 whitespace-nowrap"
                      style={{ left: `${(quorumTarget / totalCommitteeSize) * 100}%` }}
                    >
                      ▲ Pass Threshold ({quorumTarget} Votes)
                    </div>
                  </div>

                  {/* Voting Legend */}
                  <div className="flex flex-wrap items-center gap-4 mt-5 text-[11px] text-gray-500 dark:text-gray-400">
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
                      <strong>{pendingVotesCount}</strong> Pending Response
                    </span>
                    <span className="ml-auto text-gray-400 font-mono text-[10px]">
                      Deadline: {activeMotion.deadline}
                    </span>
                  </div>
                </div>
              )}

              {/* ── Strata Committee Members (SCM) Live Voting Roster ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[#0055FF] dark:text-[#00D4B2]" />
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Strata Committee Voting Roster ({committeeRoster.length} Members)
                    </h3>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    Quorum Rule: 4 votes (Yes or No) binding decision
                  </span>
                </div>

                <div className="bg-white dark:bg-[#070A10] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-white/4 border-b border-gray-200 dark:border-white/10 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Committee Member</th>
                        <th className="py-2.5 px-3">Office</th>
                        <th className="py-2.5 px-3">Status / Vote</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Voter Rationale / Notes</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {committeeRoster.map(scm => {
                        const ballot = activeMotion.ballots.find(b => b.voterName.toLowerCase() === scm.name.toLowerCase());
                        const hasVoted = !!ballot;
                        const isUserRow = scm.name.toLowerCase() === activePersonaName.toLowerCase();

                        return (
                          <tr 
                            key={scm.id} 
                            className={`transition-colors ${isUserRow ? 'bg-[#0055FF]/5 dark:bg-[#00D4B2]/5' : 'hover:bg-gray-50/50 dark:hover:bg-white/2'}`}
                          >
                            <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">
                              <div className="flex items-center gap-1.5">
                                <span>{scm.name}</span>
                                {isUserRow && (
                                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#00D4B2]/20 text-[#00D4B2]">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 font-normal">{scm.unit || 'Lot Rep'}</div>
                            </td>

                            <td className="py-2.5 px-3">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                scm.office === 'Chairperson' 
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20' 
                                  : scm.office === 'Treasurer'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20'
                                  : scm.office === 'Secretary'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20'
                                  : 'bg-gray-100 dark:bg-white/5 text-gray-500'
                              }`}>
                                {scm.office}
                              </span>
                            </td>

                            <td className="py-2.5 px-3">
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
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500 dark:text-gray-400">
                              {ballot ? ballot.votedAt : '—'}
                            </td>

                            <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300 text-xs max-w-[200px] truncate">
                              {ballot?.comment ? `"${ballot.comment}"` : <span className="text-gray-400 italic">No notes</span>}
                            </td>

                            <td className="py-2.5 px-3 text-right">
                              {!hasVoted && canManageMotion && (
                                <button
                                  type="button"
                                  onClick={() => handleSendReminder(scm.name)}
                                  className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-amber-500/20 text-gray-600 dark:text-gray-300 hover:text-amber-400 text-[11px] font-bold transition-all cursor-pointer border border-transparent hover:border-amber-500/30"
                                  title={`Send in-context private reminder to ${scm.name}`}
                                >
                                  Remind
                                </button>
                              )}
                              {hasVoted && (
                                <span className="text-emerald-500 font-bold text-[10px]">Logged</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Ballot Casting Box (Interactive for Committee Members) ── */}
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#0E131E] dark:to-[#090C14] border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Vote size={18} className="text-[#0055FF] dark:text-[#00D4B2]" />
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Cast Official Strata Committee Ballot
                    </h3>
                  </div>

                  {userBallot && (
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>Current Ballot: <strong>{userBallot.vote}</strong></span>
                      {!isLocked && <span className="text-gray-400 font-normal">(Can be modified before 4th vote)</span>}
                    </span>
                  )}
                </div>

                {isLocked ? (
                  <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-xl text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Lock size={14} className="text-emerald-500 shrink-0" />
                    <span>Voting is officially finalized and locked. Decision has reached the statutory threshold and cannot be redacted or amended.</span>
                  </div>
                ) : !canCastVote ? (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-xs text-blue-400 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Info size={14} className="shrink-0" />
                      <span>Under NSW Strata Law, only elected <strong>Strata Committee Members (SCM)</strong> cast binding votes on this motion. You are currently logged in as <strong>{activePersonaName} ({activePersonaRole})</strong>.</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      As an elected committee member, choose your ballot below. You may redact or amend your vote anytime <strong>prior to the motion reaching 4 passing votes</strong>.
                    </p>

                    {/* Vote Rationale Input */}
                    <div>
                      <input
                        type="text"
                        placeholder="Optional: Enter committee reason or conditions for your vote..."
                        value={scmBallotComment}
                        onChange={e => setScmBallotComment(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-1 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
                      />
                    </div>

                    {/* Large Crisp Voting Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => handleVoteSubmit('YES')}
                        className={`py-3 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs border ${
                          userBallot?.vote === 'YES'
                            ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <Check size={18} className="stroke-[3]" />
                        <span>VOTE YES</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVoteSubmit('NO')}
                        className={`py-3 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs border ${
                          userBallot?.vote === 'NO'
                            ? 'bg-red-500 text-white border-red-400 shadow-md shadow-red-500/20'
                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border-red-500/30'
                        }`}
                      >
                        <X size={18} className="stroke-[3]" />
                        <span>VOTE NO</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVoteSubmit('ABSTAIN')}
                        className={`py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs border ${
                          userBallot?.vote === 'ABSTAIN'
                            ? 'bg-gray-400 text-black border-gray-300'
                            : 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-600 dark:text-gray-300 border-gray-500/30'
                        }`}
                      >
                        <MinusCircle size={18} />
                        <span>ABSTAIN</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Attachments Showcase: Original vs Revised Resubmission (Crucial Acceptance Criteria) ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#0055FF] dark:text-[#00D4B2]" />
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Proposal Documents & Media Comparison
                    </h3>
                  </div>

                  {canResubmitProposal && (
                    <button
                      type="button"
                      onClick={() => setShowResubmitModal(true)}
                      className="text-xs font-bold text-[#0055FF] dark:text-[#00D4B2] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <UploadCloud size={13} />
                      <span>Upload Revised Attachment</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Section A: Original Submission Attachments */}
                  <div className="bg-gray-50 dark:bg-[#080B12] border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        Original Submission Attachments
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">10 Sep 2026</span>
                    </div>

                    <div className="space-y-2">
                      {(activeMotion.attachments || []).map((att, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-white/4 border border-gray-200/80 dark:border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText size={14} className="text-gray-400 shrink-0" />
                            <div className="truncate">
                              <div className="font-bold text-gray-800 dark:text-gray-200 truncate">{att.name}</div>
                              <div className="text-[10px] text-gray-400">{att.size || 'Original Mockup'} • {att.uploadedBy || 'Requester'}</div>
                            </div>
                          </div>
                          <a 
                            href={att.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section B: Revised Resubmission Attachments (Post-RFI) */}
                  <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border-2 border-emerald-500/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Revised Resubmission (Post-RFI v2)
                      </span>
                      <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black">
                        NEW REVISED
                      </span>
                    </div>

                    {activeMotion.revisedAttachments && activeMotion.revisedAttachments.length > 0 ? (
                      <div className="space-y-2">
                        {activeMotion.revisedAttachments.map((att, idx) => (
                          <div 
                            key={idx}
                            className="p-2.5 rounded-xl bg-white dark:bg-[#0c141d] border border-emerald-500/20 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 truncate">
                                <Sparkles size={14} className="text-emerald-400 shrink-0" />
                                <div className="truncate font-bold text-gray-900 dark:text-white">
                                  {att.name}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-400">{att.uploadedAt}</span>
                            </div>
                            {att.note && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-300 italic pl-5">
                                "{att.note}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400 text-xs">
                        No revised attachments submitted yet.
                        {canRequestRFI && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => setShowRfiModal(true)}
                              className="text-xs font-bold text-blue-400 hover:underline cursor-pointer"
                            >
                              Raise RFI to request revised design
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Tender Quotes (Vendor Selection) ── */}
              {activeMotion.quotes && activeMotion.quotes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-[#0055FF] dark:text-[#00D4B2]" />
                      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Tender Quotes & Contractor Comparison
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeMotion.quotes.map(q => (
                      <div 
                        key={q.vendorId}
                        className={`p-4 rounded-2xl border transition-all ${
                          q.recommended 
                            ? 'bg-gradient-to-br from-[#0055FF]/5 to-transparent dark:from-[#0055FF]/10 border-[#0055FF]/30 shadow-xs' 
                            : 'bg-gray-50/50 dark:bg-white/2 border-gray-200 dark:border-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">{q.vendorName}</h4>
                            <span className="text-[10px] text-gray-400">Licensed Strata Contractor</span>
                          </div>
                          {q.recommended && (
                            <span className="px-2 py-0.5 rounded-full bg-[#0055FF]/20 text-[#0055FF] dark:text-[#60A5FA] text-[10px] font-black uppercase">
                              Recommended Tender
                            </span>
                          )}
                        </div>

                        <div className="text-2xl font-black text-gray-900 dark:text-white font-mono mt-2">
                          ${q.amount.toLocaleString()}
                          <span className="text-xs font-normal text-gray-400 ml-1">
                            {q.gstIncluded ? 'incl. GST' : 'ex. GST'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── In-Context Discussion & Private Manager Conduit ── */}
              <div className="border-t border-gray-100 dark:border-white/8 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-[#0055FF] dark:text-[#00D4B2]" />
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      In-Context Motion Discussion & Manager Conduit
                    </h3>
                  </div>

                  {/* RFI Trigger Button */}
                  {canRequestRFI && !isLocked && (
                    <button
                      type="button"
                      onClick={() => setShowRfiModal(true)}
                      className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle size={12} />
                      <span>Request Clarification (RFI)</span>
                    </button>
                  )}
                </div>

                {/* Comment Feed */}
                <div className="space-y-3">
                  {(activeMotion.comments || []).map((c, i) => (
                    <div 
                      key={c.id || i}
                      className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-white/3 border border-gray-100 dark:border-white/5 space-y-1.5"
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
                <form onSubmit={handleSendComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contribute technical insight or ask a question..."
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs focus:outline-none focus:ring-1 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Send size={13} />
                    <span>Send</span>
                  </button>
                </form>
              </div>

              {/* ── Strata Manager Decision Engine Action Card (Miro Step 3) ── */}
              {canManageMotion && (
                <div className="bg-gradient-to-br from-red-500/10 via-amber-500/5 to-purple-500/10 border border-red-500/25 rounded-2xl p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-500 dark:text-red-400 font-black text-xs uppercase tracking-wider">
                      <Scale size={15} />
                      <span>Strata Manager Decision Engine</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                      Miro Resolution Hub
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    As Strata Manager, resolve this resolution once quorum is achieved (Issue Work Order or Close Lot Approval), or close early if additional specifications and details are needed from the requestor.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setCloseModalTab(isPassed ? 'after' : 'before');
                      setShowCloseModal(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Scale size={14} />
                    <span>Open Close Voting Decision Engine</span>
                  </button>
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <Vote size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">No Motion Selected</h3>
              <p className="text-xs text-gray-400 max-w-sm mt-1">
                Select an active or passed committee motion from the left queue to view the full voting roster, tender comparisons, and live ballots.
              </p>
            </div>
          )}

        </div>
      </div>
      )}

      {/* ── Formal Legal Vote Report Modal (Printable) ────────── */}
      {showReportModal && activeMotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
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
                <div className="text-[10px]">Mock sample attachment will be registered automatically</div>
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

      {/* ── MODAL: Close Voting Decision Engine (Miro Flowchart Implementation) ── */}
      {showCloseModal && activeMotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0C1018] rounded-3xl max-w-xl w-full border border-gray-200 dark:border-white/15 p-6 lg:p-7 shadow-2xl space-y-5 text-gray-900 dark:text-white animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div>
                <div className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest mb-0.5">
                  Miro Workflow Engine • Strata Manager Close Resolution
                </div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Scale size={18} className="text-red-500" />
                  <span>Close Voting Resolution Engine</span>
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
                Path 1: Before Completion
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
                Path 2: Output Achieved
              </button>
            </div>

            {/* PATHWAY 1: BEFORE COMPLETION (Needs extra info -> Mandatory Reason -> Notify -> Request goes back to pending) */}
            {closeModalTab === 'before' && (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs space-y-1">
                  <div className="font-black text-amber-600 dark:text-amber-400">
                    Flowchart Rule: Additional Details Needed to Cast Vote
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Close voting early when the committee or strata manager requires missing specifications, additional engineering reports, or revised mockups. The case status will automatically revert back to <strong>Pending Triage</strong> and an email notification will be dispatched to the requestor.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                    Mandatory Reason for Early Closure *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Committee requested 2 additional acoustic contractor quotes and structural engineer report before voting..."
                    value={closeReasonInput}
                    onChange={e => setCloseReasonInput(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="p-3 bg-gray-50 dark:bg-black/30 rounded-xl border border-gray-200 dark:border-white/5 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between">
                  <span>Automated Action:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Revert to Pending Triage & Email Requestor
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
                    Revert Request to Pending & Notify
                  </button>
                </div>
              </div>
            )}

            {/* PATHWAY 2: AFTER COMPLETION = OUTPUT ACHIEVED */}
            {closeModalTab === 'after' && (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs space-y-1">
                  <div className="font-black text-emerald-600 dark:text-emerald-400">
                    Flowchart Rule: Output Achieved • Request Status Changes as per Votes
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 font-mono text-[11px] pt-1 flex items-center gap-2">
                    <span>Live Quorum: <strong>{yesVotes} YES</strong> • <strong>{noVotes} NO</strong> • <strong>{abstainVotes} ABSTAIN</strong></span>
                    <span>(Target: {quorumTarget} Votes)</span>
                  </div>
                </div>

                {/* Option A: Motion Passed / Quorum Met */}
                <div className="space-y-2">
                  <div className="text-[11px] font-black uppercase text-gray-400 tracking-wider">
                    If Approved (Threshold Met)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-blue-500/5 dark:bg-[#070A10] p-3.5 rounded-xl border border-blue-500/30 space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Strata / Building-Level Scope
                        </span>
                        <p className="text-gray-600 dark:text-gray-300 text-[11px] mt-1 leading-relaxed">
                          Motion Passed ➔ Dispatches notification to all participants ➔ <strong>Initiates Work Order Flow</strong>.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConfirmResolveMotion('passed', '🚀 Motion Approved! Work Order flow initiated for contractor.')}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                      >
                        Initiate Work Order Flow
                      </button>
                    </div>

                    <div className="bg-purple-500/5 dark:bg-[#070A10] p-3.5 rounded-xl border border-purple-500/30 space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-300">
                          Resident-Level Scope
                        </span>
                        <p className="text-gray-600 dark:text-gray-300 text-[11px] mt-1 leading-relaxed">
                          Motion Passed ➔ Dispatches approval letter to resident ➔ <strong>Request Voting Closed & Approved</strong>.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConfirmResolveMotion('passed', '✅ Resident request approved and voting closed.')}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                      >
                        Close Ticket as Approved
                      </button>
                    </div>
                  </div>
                </div>

                {/* Option B: If Motion Rejected */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-red-600 dark:text-red-400">If Motion Rejected:</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Send notification to requestor ➔ Request Voting Closed & Rejected.</div>
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

                {/* Option C: If Tie Vote -> Strata Manager Review */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-2 text-xs">
                  <div>
                    <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Scale size={13} />
                      <span>If Tie / Inconclusive (Manager Review):</span>
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
                      onClick={() => handleConfirmResolveMotion('rejected', '⚖️ Strata Manager casting vote: REJECTED. Ticket closed.')}
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

    </div>
  );
}
