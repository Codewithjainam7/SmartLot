import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ResidentRequest, CaseStatus, AuditEvent } from '../store/smartLotStore';
import { 
  MorphingPopover, 
  MorphingPopoverTrigger, 
  MorphingPopoverContent 
} from './core/morphing-popover';
import { CreateRequestFormContent } from './CreateRequestModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Vote, 
  MessageSquare, 
  User,
  AlertCircle,
  Reply,
  AtSign,
  FileText,
  ThumbsUp,
  MoreVertical,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Check,
  ChevronDown,
  X,
  Send,
  Mail,
  MapPin,
  Sparkles,
  Building,
  Lock,
  Shield,
  RotateCcw,
  Inbox,
  Pencil,
  Trash2
} from 'lucide-react';

interface ResidentRequestsViewProps {
  requests: ResidentRequest[];
  onOpenCreateModal?: () => void;
  onSubmitRequest: (data: any) => any;
  onCloseRequest: (requestId: string, reason: string) => void;
  onAddComment: (requestId: string, text: string, replyTo?: { authorName: string; text: string }) => void;
  onEditComment?: (requestId: string, commentId: string, newText: string) => void;
  onDeleteComment?: (requestId: string, commentId: string) => void;
  onSimulateManagerReply?: (requestId: string, replyText: string, managerName?: string) => void;
  onAddInternalNote?: (requestId: string, text: string) => void;
  onUpdateStatus?: (requestId: string, status: CaseStatus) => void;
  onUpdatePriority?: (requestId: string, priority: any) => void;
  onAssignActivity?: (requestId: string, assigneeName: string, assigneeRole: string, assigneeEmail?: string) => void;
  onReopenActivity?: (requestId: string, reason: string) => void;
  activePersonaName: string;
  activePersonaRole: string;
  activePersonaEmail?: string;
  activePersonaPhone?: string;
  activePersonaContext?: string;
  activeSchemeName?: string;
  activeManagerEmail?: string;
}

export function ResidentRequestsView({
  requests,
  onSubmitRequest,
  onCloseRequest,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onSimulateManagerReply,
  onAddInternalNote,
  onUpdateStatus,
  onUpdatePriority,
  onAssignActivity,
  onReopenActivity,
  activePersonaName,
  activePersonaRole,
  activePersonaEmail,
  activePersonaPhone,
  activePersonaContext,
  activeSchemeName,
  activeManagerEmail,
}: ResidentRequestsViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewScope, setViewScope] = useState<'my' | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<ResidentRequest | null>(null);
  const [closeModalRequest, setCloseModalRequest] = useState<ResidentRequest | null>(null);
  const [closeReason, setCloseReason] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [replyingToComment, setReplyingToComment] = useState<{ authorName: string; text: string } | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({ 'C-1': 2, 'C-2': 1 });
  const [likedByUser, setLikedByUser] = useState<Record<string, boolean>>({});
  const [helpfulComments, setHelpfulComments] = useState<Record<string, boolean>>({ 'C-1': true });
  const [activeMenuCommentId, setActiveMenuCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const toggleLikeComment = (commentId: string) => {
    const isLiked = likedByUser[commentId];
    setLikedByUser(prev => ({ ...prev, [commentId]: !isLiked }));
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + (isLiked ? -1 : 1)
    }));
  };

  const toggleHelpfulComment = (commentId: string) => {
    setHelpfulComments(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const filteredRequests = requests.filter(r => {
    if (viewScope === 'my' && r.requestorName !== activePersonaName) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  // Extract unique authors from comments to suggest in @mention dropdown
  const activeDetail = selectedRequest ? requests.find(r => r.id === selectedRequest.id) || selectedRequest : null;
  const possibleTagTargets = Array.from(new Set([
    ...(activeDetail ? activeDetail.comments.map(c => c.authorName) : []),
    activeDetail?.requestorName || '',
    activeDetail?.strataManagerEmail ? 'Strata Manager' : '',
  ].filter(name => name && name !== activePersonaName)));

  const handleCommentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCommentInput(val);
    if (val.endsWith('@') || (val.includes('@') && !val.split('@').pop()?.includes(' '))) {
      setShowMentionMenu(true);
    } else {
      setShowMentionMenu(false);
    }
  };

  const handleSelectMention = (name: string) => {
    const lastAtIndex = commentInput.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const newText = commentInput.substring(0, lastAtIndex) + `@${name} `;
      setCommentInput(newText);
    } else {
      setCommentInput(prev => `${prev} @${name} `);
    }
    setShowMentionMenu(false);
  };

  const [internalNoteInput, setInternalNoteInput] = useState('');
  const isManagerOrAdmin = activePersonaRole.toLowerCase().includes('manager') || activePersonaRole.toLowerCase().includes('admin');
  const isManagerOrCommittee = isManagerOrAdmin || activePersonaRole.toLowerCase().includes('committee');
  const [reopenModalRequest, setReopenModalRequest] = useState<ResidentRequest | null>(null);
  const [reopenReason, setReopenReason] = useState('');

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeDetail) return;
    onAddComment(activeDetail.id, commentInput.trim(), replyingToComment || undefined);
    setCommentInput('');
    setReplyingToComment(null);
    setShowMentionMenu(false);
  };

  const handleSaveEditComment = (commentId: string) => {
    if (!editingCommentText.trim() || !activeDetail) return;
    if (onEditComment) {
      onEditComment(activeDetail.id, commentId, editingCommentText.trim());
    }
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    if (!activeDetail) return;
    if (window.confirm('Are you sure you want to delete this comment?')) {
      if (onDeleteComment) {
        onDeleteComment(activeDetail.id, commentId);
      }
    }
    setActiveMenuCommentId(null);
  };

  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNoteInput.trim() || !activeDetail || !onAddInternalNote) return;
    onAddInternalNote(activeDetail.id, internalNoteInput.trim());
    setInternalNoteInput('');
  };

  const handleConfirmClose = () => {
    if (!closeModalRequest || !closeReason.trim()) return;
    onCloseRequest(closeModalRequest.id, closeReason);
    setCloseModalRequest(null);
    setCloseReason('');
    if (selectedRequest?.id === closeModalRequest.id) setSelectedRequest(null);
  };

  const handleConfirmReopen = () => {
    if (!reopenModalRequest || !reopenReason.trim() || !onReopenActivity) return;
    onReopenActivity(reopenModalRequest.id, reopenReason);
    setReopenModalRequest(null);
    setReopenReason('');
  };

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-full bg-[#F4F6F9] dark:bg-[#0a0a0f]">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0d1117] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-[#00D4B2]/10 relative overflow-hidden">
        {/* Subtle glow in dark mode */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D4B2]/0 via-transparent to-[#0055FF]/0 dark:from-[#00D4B2]/5 dark:via-transparent dark:to-[#0055FF]/5 pointer-events-none rounded-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0055FF]/10 dark:bg-[#0055FF]/15 text-[#0055FF] dark:text-[#6699ff] border border-[#0055FF]/20 text-xs font-bold uppercase tracking-wider mb-2">
            Resident Hub • Requests Engine
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resident Service & Repair Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Log issues, track status in real-time, and view community requests.</p>
        </div>

        {/* Morphing Capsule Button */}
        <div className="relative z-10">
          <MorphingPopover>
            <MorphingPopoverTrigger>
              <div className="bg-[#0B1121] dark:bg-[#00D4B2]/10 dark:border dark:border-[#00D4B2]/20 hover:bg-black dark:hover:bg-[#00D4B2]/20 text-white dark:text-[#00D4B2] px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-105 cursor-pointer">
                <Plus size={18} className="text-[#00D4B2]" /> 
                <span>Create New Request</span>
              </div>
            </MorphingPopoverTrigger>

            <MorphingPopoverContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CreateRequestFormContent 
                onSubmit={onSubmitRequest}
                requestorName={activePersonaName}
                requestorEmail={activePersonaEmail}
                requestorPhone={activePersonaPhone}
                defaultBuildingName={activeSchemeName}
                defaultUnit={activePersonaContext}
                defaultManagerEmail={activeManagerEmail}
              />
            </MorphingPopoverContent>
          </MorphingPopover>
        </div>
      </div>

      {/* Filter & View Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0d1117] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
        
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label="All" active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} count={requests.length} />
          <StatusPill label="New" active={filterStatus === 'new'} onClick={() => setFilterStatus('new')} />
          <StatusPill label="Acknowledged" active={filterStatus === 'acknowledged'} onClick={() => setFilterStatus('acknowledged')} />
          <StatusPill label="In Progress" active={filterStatus === 'in_progress'} onClick={() => setFilterStatus('in_progress')} />
          <StatusPill label="Waiting" active={filterStatus === 'waiting'} onClick={() => setFilterStatus('waiting')} />
          <StatusPill label="Resolved" active={filterStatus === 'resolved'} onClick={() => setFilterStatus('resolved')} />
          <StatusPill label="Pending Triage" active={filterStatus === 'pending_triage'} onClick={() => setFilterStatus('pending_triage')} />
          <StatusPill label="Closed" active={filterStatus === 'closed'} onClick={() => setFilterStatus('closed')} />
        </div>

        {/* View Scope Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-[#1a1d27] p-1 rounded-xl border border-transparent dark:border-white/5">
          <button
            onClick={() => setViewScope('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewScope === 'all' 
                ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#00D4B2] border dark:border-[#00D4B2]/20 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            All Requests
          </button>
          <button
            onClick={() => setViewScope('my')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewScope === 'my' 
                ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#00D4B2] border dark:border-[#00D4B2]/20 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            My Requests Only
          </button>
        </div>

      </div>

      {/* Requests Grid with Fading & Shrinking Depth Exit Animation */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-12 border border-gray-100 dark:border-white/5 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 mx-auto flex items-center justify-center">
            <Inbox size={24} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No activities found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {filterStatus === 'all' 
              ? "No activities have been recorded yet. Click '+ New Request' to submit an issue."
              : `No activities found with status '${filterStatus}'. Try selecting 'All' or clearing filters.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredRequests.map(req => (
            <motion.div
              key={req.id}
              layout
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 10, filter: 'blur(3px)' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setSelectedRequest(req)}
              className="bg-white dark:bg-[#121316] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[300px]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#00D4B2]/10 text-[#00D4B2] border border-[#00D4B2]/25 tracking-wider">
                      {req.referenceId || req.id}
                    </span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {req.buildingName ? `${req.buildingName} • ${req.unit}` : req.unit}
                    </span>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <div className="text-xs font-extrabold text-[#0055FF] dark:text-[#66A3FF] uppercase tracking-wider capitalize">
                    {req.requestType.replace(/_/g, ' ')}
                  </div>
                  {req.priority && (
                    <span className={`text-[10px] font-black px-2 py-0.2 rounded-full border ${
                      req.priority === 'Urgent' || req.priority === 'Emergency'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : req.priority === 'High'
                        ? 'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                      {req.priority}
                    </span>
                  )}
                </div>

                {req.location && (
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 mb-2 font-medium">
                    <MapPin size={11} className="text-[#00D4B2] shrink-0" />
                    <span>{req.location}</span>
                  </div>
                )}

                {req.assignedToName && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00D4B2] bg-[#00D4B2]/10 border border-[#00D4B2]/20 px-2.5 py-0.5 rounded-full mb-2">
                    <User size={10} />
                    <span>Assigned: {req.assignedToName}</span>
                  </div>
                )}

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-snug">{req.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4">{req.description}</p>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-white/5 dark:border-gray-800 space-y-3 mt-auto">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>By {req.requestorName}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {req.createdAt}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 flex items-center gap-1 font-semibold">
                    <MessageSquare size={14} className="text-[#0055FF]" /> {req.comments.length} Comments
                  </span>

                  {req.status !== 'closed' && req.requestorName === activePersonaName && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCloseModalRequest(req);
                      }}
                      className="text-xs font-bold text-[#FF4757] hover:text-red-700 bg-[#FF4757]/10 px-3 py-1.5 rounded-xl border border-[#FF4757]/30 cursor-pointer"
                    >
                      Close Request
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      )}

      {/* Details Drawer */}
      <AnimatePresence>
        {activeDetail && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
              onClick={() => setSelectedRequest(null)} 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%', opacity: 0.5, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="relative bg-[#090D16] dark:bg-[#070B14] w-full max-w-xl h-full shadow-2xl z-10 p-5 sm:p-7 overflow-y-auto overflow-x-hidden space-y-6 text-white border-l border-white/10"
            >
              
              {/* Header: Unit Tag, Title, Close Button & Status Pill Bar */}
              <div className="space-y-3 pb-2 border-b border-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-black text-[#00D4B2] bg-[#00D4B2]/10 border border-[#00D4B2]/20 px-2.5 py-0.5 rounded-full tracking-wider">
                        {activeDetail.referenceId || activeDetail.id}
                      </span>
                      <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                        {activeDetail.buildingName ? `${activeDetail.buildingName} • ${activeDetail.unit}` : activeDetail.unit || 'LOT REQUEST'}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white leading-tight">{activeDetail.title}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedRequest(null)} 
                    className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Status, Priority & Location Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {isManagerOrAdmin && onUpdateStatus ? (
                    <select
                      value={activeDetail.status}
                      onChange={(e) => onUpdateStatus(activeDetail.id, e.target.value as CaseStatus)}
                      className="h-7 px-2.5 rounded-full bg-[#0055FF]/20 text-[#60A5FA] border border-[#0055FF]/40 text-[11px] font-extrabold outline-none cursor-pointer hover:bg-[#0055FF]/30 transition-colors"
                      title="Manager quick status override"
                    >
                      <option value="new" className="bg-[#0B1121] text-white">Status: New</option>
                      <option value="acknowledged" className="bg-[#0B1121] text-white">Status: Acknowledged</option>
                      <option value="in_progress" className="bg-[#0B1121] text-white">Status: In Progress</option>
                      <option value="waiting" className="bg-[#0B1121] text-white">Status: Waiting</option>
                      <option value="resolved" className="bg-[#0B1121] text-white">Status: Resolved</option>
                      <option value="closed" className="bg-[#0B1121] text-white">Status: Closed</option>
                    </select>
                  ) : (
                    <StatusBadge status={activeDetail.status} />
                  )}

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    <span className="capitalize">{activeDetail.requestType.replace(/_/g, ' ')}</span>
                  </div>

                  {isManagerOrAdmin && onUpdatePriority ? (
                    <select
                      value={activeDetail.priority || 'Normal'}
                      onChange={(e) => onUpdatePriority(activeDetail.id, e.target.value)}
                      className="h-7 px-2.5 rounded-full bg-white/10 text-gray-200 border border-white/15 text-[11px] font-bold outline-none cursor-pointer hover:bg-white/15 transition-colors"
                      title="Manager priority override"
                    >
                      <option value="Low" className="bg-[#0B1121] text-white">Priority: Low</option>
                      <option value="Normal" className="bg-[#0B1121] text-white">Priority: Normal</option>
                      <option value="Medium" className="bg-[#0B1121] text-white">Priority: Medium</option>
                      <option value="High" className="bg-[#0B1121] text-white">Priority: High</option>
                      <option value="Urgent" className="bg-[#0B1121] text-white">Priority: Urgent</option>
                      <option value="Emergency" className="bg-[#0B1121] text-white">Priority: Emergency</option>
                    </select>
                  ) : activeDetail.priority ? (
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      activeDetail.priority === 'Urgent' || activeDetail.priority === 'Emergency'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : activeDetail.priority === 'High'
                        ? 'bg-[#FFB020]/10 text-[#FFB020] border-[#FFB020]/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                      Priority: {activeDetail.priority}
                    </span>
                  ) : null}

                  {activeDetail.location && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10 text-[11px]">
                      <MapPin size={11} className="text-[#00D4B2]" />
                      <span>{activeDetail.location}</span>
                    </div>
                  )}

                  {/* Assignee Selector for Managers */}
                  {isManagerOrAdmin && onAssignActivity ? (
                    <select
                      value={activeDetail.assignedToName ? `${activeDetail.assignedToName}|${activeDetail.assignedToRole || 'Contractor'}` : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          onAssignActivity(activeDetail.id, '', '');
                        } else {
                          const [name, role] = val.split('|');
                          onAssignActivity(activeDetail.id, name, role || 'Contractor');
                        }
                      }}
                      className="h-7 px-2.5 rounded-full bg-[#00D4B2]/15 text-[#00D4B2] border border-[#00D4B2]/30 text-[11px] font-bold outline-none cursor-pointer hover:bg-[#00D4B2]/25 transition-colors"
                      title="Assign activity to contractor or manager"
                    >
                      <option value="" className="bg-[#0B1121] text-white">Select Assignee...</option>
                      <option value="Apex Gate & Security Services|Specialist Contractor" className="bg-[#0B1121] text-white">Assign: Apex Gate & Security</option>
                      <option value="Rapid Response Electrical|Certified Electrician" className="bg-[#0B1121] text-white">Assign: Rapid Response Electrical</option>
                      <option value="Bright Water Plumbing Solutions|Licensed Plumber" className="bg-[#0B1121] text-white">Assign: Bright Water Plumbing</option>
                      <option value="Emma Wilson|Strata Manager" className="bg-[#0B1121] text-white">Assign: Emma Wilson (Manager)</option>
                      <option value="Roman Joe|Strata Manager" className="bg-[#0B1121] text-white">Assign: Roman Joe (Manager)</option>
                      <option value="Alex Vance|Building Manager" className="bg-[#0B1121] text-white">Assign: Alex Vance (Building Mgr)</option>
                    </select>
                  ) : activeDetail.assignedToName ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D4B2]/10 text-[#00D4B2] border border-[#00D4B2]/25 text-[11px] font-bold">
                      <User size={11} />
                      <span>Assigned: {activeDetail.assignedToName}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Conduit Outbound Email Card */}
              <div className="bg-[#101726]/90 rounded-2xl p-4 border border-[#00D4B2]/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-[#00D4B2] uppercase tracking-wider">
                    <Mail size={15} />
                    <span>Email Dispatch Record</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#00D4B2]/10 text-[#00D4B2] border border-[#00D4B2]/25 flex items-center gap-1">
                    <Check size={11} className="stroke-[3]" />
                    <span>Dispatched via SmartLot</span>
                  </span>
                </div>
                <div className="text-[11px] font-mono text-gray-300 space-y-1.5 bg-black/40 rounded-xl p-3 border border-white/5">
                  <div className="flex items-start gap-1">
                    <span className="text-gray-400 font-bold min-w-[70px]">Subject:</span> 
                    <span className="text-white font-semibold">[SmartLot {activeDetail.referenceId || activeDetail.id}] {activeDetail.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 font-bold min-w-[70px]">To:</span> 
                    <span className="text-gray-200">{activeDetail.strataManagerEmail || 'emma.wilson@agency.com'} <span className="text-gray-500">(Strata Manager)</span></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 font-bold min-w-[70px]">CC:</span> 
                    <span className="text-gray-200">{activeDetail.requestorEmail} <span className="text-gray-500">({activeDetail.requestorName})</span></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 font-bold min-w-[70px]">Reply-To:</span> 
                    <span className="text-[#00D4B2] font-bold">requests+{(activeDetail.referenceId ? activeDetail.referenceId.replace('#', '') : activeDetail.id).toLowerCase()}@smartlot.com</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
                  <span className="text-gray-400">Status: Notification dispatched</span>
                  <span className="text-gray-500">Preference: {activeDetail.contactPreference || 'Email'}</span>
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-[#101726]/80 rounded-2xl p-5 border border-white/5 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-black text-[#00D4B2] uppercase tracking-wider">
                  <FileText size={15} />
                  <span>Description</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-normal">
                  {activeDetail.description}
                </p>
              </div>

              {/* Multi-Photo Attachments */}
              {(activeDetail.attachmentUrls && activeDetail.attachmentUrls.length > 0) ? (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Attached Photos ({activeDetail.attachmentUrls.length})</span>
                  <div className="grid grid-cols-2 gap-2">
                    {activeDetail.attachmentUrls.map((img, i) => (
                      <img key={i} src={img} alt={`Attachment ${i+1}`} className="w-full h-36 object-cover rounded-2xl border border-white/10 shadow-sm" />
                    ))}
                  </div>
                </div>
              ) : activeDetail.attachmentUrl ? (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Attached Photo</span>
                  <img src={activeDetail.attachmentUrl} alt="Attachment" className="w-full h-44 object-cover rounded-2xl border border-white/10" />
                </div>
              ) : null}

              {activeDetail.status === 'closed' && activeDetail.closeReason && (
                <div className="bg-[#FF4757]/10 border border-[#FF4757]/30 p-4 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-red-400 flex items-center gap-1.5"><AlertCircle size={14} /> Closed with Rationale:</div>
                  <p className="text-red-300">{activeDetail.closeReason}</p>
                </div>
              )}

              {/* Internal Strata Manager Notes (Visible to Strata Managers, Admins, and Committee Members) */}
              {isManagerOrCommittee && (
                <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[#13110d] to-[#0a0f1d] p-4.5 space-y-3 shadow-lg relative overflow-hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                        <Lock size={15} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-white">Internal Staff & Committee Notes</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Shield size={10} /> Private
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Visible to Strata Managers, Building Admins, and Committee Members. Completely hidden from regular residents and lot owners.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Existing Notes List */}
                  <div className="space-y-2 pt-1">
                    {(!activeDetail.internalNotes || activeDetail.internalNotes.length === 0) ? (
                      <div className="bg-black/30 rounded-2xl p-3 border border-white/5 text-[11px] text-gray-500 italic">
                        No internal notes recorded. Use this space for contractor quotes, committee memos, or private follow-ups.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {activeDetail.internalNotes.map((note) => (
                          <div key={note.id} className="bg-black/40 rounded-2xl p-3 border border-amber-500/20 space-y-1 text-xs">
                            <div className="flex items-center justify-between text-[10px] text-gray-400">
                              <span className="font-bold text-amber-300">
                                {note.authorName} <span className="text-gray-500">({note.authorRole})</span>
                              </span>
                              <span>{note.createdAt}</span>
                            </div>
                            <p className="text-gray-200 leading-relaxed font-normal whitespace-pre-wrap">{note.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Compose Note */}
                    <form onSubmit={handleAddInternalNote} className="space-y-2 pt-1">
                      <textarea
                        rows={2}
                        value={internalNoteInput}
                        onChange={(e) => setInternalNoteInput(e.target.value)}
                        placeholder="Type private manager note (not visible to residents)..."
                        className="w-full bg-[#070B14] border border-amber-500/30 rounded-2xl p-3 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400 resize-none font-medium leading-relaxed"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!internalNoteInput.trim()}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Lock size={12} />
                          <span>Save Private Note</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="space-y-5 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-white">
                    <MessageSquare size={16} className="text-[#00D4B2]" /> 
                    <span>Activity Timeline ({activeDetail.comments.length + (activeDetail.auditLog?.length || 0)})</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 font-bold">
                    <span>Oldest first</span>
                    <ChevronDown size={13} />
                  </div>
                </div>
                
                {/* Unified Timeline: Audit Events + Comments merged and sorted */}
                <div className="space-y-3 relative">
                  {activeDetail.comments.length === 0 && !(activeDetail.auditLog?.length) ? (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl text-xs text-gray-400">
                      No activity yet.
                    </div>
                  ) : (
                    (() => {
                      // Build unified timeline items
                      type TimelineItem =
                        | { kind: 'comment'; data: typeof activeDetail.comments[number]; idx: number }
                        | { kind: 'audit'; data: AuditEvent };

                      const items: TimelineItem[] = [
                        ...(activeDetail.auditLog || []).map(a => ({ kind: 'audit' as const, data: a })),
                        ...activeDetail.comments.map((c, idx) => ({ kind: 'comment' as const, data: c, idx })),
                      ];

                      return items.map((item, tIdx) => {
                        if (item.kind === 'audit') {
                          const ev = item.data;

                          // Icon + color per event type
                          const auditMeta: Record<string, { icon: React.ReactNode; bg: string; border: string; label: string }> = {
                            created:        { icon: <Plus size={11} />, bg: 'bg-[#0055FF]/15', border: 'border-[#0055FF]/30', label: 'Activity Created' },
                            status_change:  { icon: <ChevronDown size={11} />, bg: 'bg-white/5', border: 'border-white/10', label: 'Status Updated' },
                            triage_approved:{ icon: <CheckCircle2 size={11} />, bg: 'bg-[#10B981]/15', border: 'border-[#10B981]/30', label: 'Approved' },
                            triage_rejected:{ icon: <XCircle size={11} />, bg: 'bg-[#FF4757]/15', border: 'border-[#FF4757]/30', label: 'Rejected' },
                            comment_added:  { icon: <MessageSquare size={11} />, bg: 'bg-purple-900/20', border: 'border-purple-500/20', label: 'Comment Added' },
                            closed:         { icon: <XCircle size={11} />, bg: 'bg-gray-800/60', border: 'border-gray-600/40', label: 'Activity Closed' },
                            email_sent:     { icon: <AtSign size={11} />, bg: 'bg-[#00D4B2]/10', border: 'border-[#00D4B2]/25', label: 'Email Sent' },
                            email_received: { icon: <Reply size={11} />, bg: 'bg-[#00D4B2]/10', border: 'border-[#00D4B2]/25', label: 'Email Reply Captured' },
                            priority_change:{ icon: <AlertCircle size={11} />, bg: 'bg-[#FFB020]/10', border: 'border-[#FFB020]/20', label: 'Priority Changed' },
                          };
                          const meta = auditMeta[ev.type] || auditMeta.status_change;

                          return (
                            <div key={ev.id} className="flex items-start gap-3">
                              {/* Timeline line connector */}
                              <div className="relative flex flex-col items-center shrink-0">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${meta.bg} border ${meta.border} text-white`}>
                                  {meta.icon}
                                </div>
                                {tIdx < items.length - 1 && (
                                  <div className="w-[1.5px] flex-1 min-h-[12px] mt-1 bg-white/8" />
                                )}
                              </div>

                              {/* Event chip body */}
                              <div className={`flex-1 min-w-0 mb-3 rounded-2xl px-3.5 py-2.5 border ${meta.bg} ${meta.border} text-[11px]`}>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    <span className="font-bold text-white">{meta.label}</span>
                                    {ev.fromStatus && ev.toStatus && (
                                      <span className="flex items-center gap-1 text-gray-400 min-w-0">
                                        <span className="px-1.5 py-0.5 rounded bg-white/8 capitalize">{ev.fromStatus.replace(/_/g, ' ')}</span>
                                        <span className="text-gray-500">→</span>
                                        <span className="px-1.5 py-0.5 rounded bg-white/8 capitalize">{ev.toStatus.replace(/_/g, ' ')}</span>
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-gray-500 shrink-0">{ev.timestamp}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 text-gray-400">
                                  <span className="font-semibold text-gray-300">{ev.actor}</span>
                                  <span className="text-gray-600">·</span>
                                  <span>{ev.actorRole}</span>
                                </div>
                                {ev.note && (
                                  <p className="mt-1 text-gray-400 leading-relaxed">{ev.note}</p>
                                )}
                              </div>
                            </div>
                          );
                        }

                        // Comment bubble
                        const c = item.data;
                        const commentIdx = item.idx;
                        const authorInitials = c.authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                        const isManager = c.authorRole.toLowerCase().includes('manager') || c.authorRole.toLowerCase().includes('admin');
                        const isAuthor = c.authorName === activePersonaName;
                        const canEditOrDelete = isAuthor || isManagerOrAdmin;
                        const isEditingThis = editingCommentId === c.id;
                        const roleBadgeBg = isManager ? 'bg-[#0055FF]/20 text-[#66A3FF] border border-[#0055FF]/40' : 'bg-purple-900/30 text-purple-300 border border-purple-500/30';
                        const avatarBg = commentIdx % 2 === 0 ? 'bg-[#2A4365] text-[#90CDF4]' : 'bg-[#44337A] text-[#D6BCFA]';
                        const likesCount = commentLikes[c.id] || 0;
                        const isLiked = likedByUser[c.id];
                        const isHelpful = helpfulComments[c.id];

                        return (
                          <div key={c.id} className="flex items-start gap-3 w-full min-w-0">
                            {/* Avatar */}
                            <div className="relative flex flex-col items-center shrink-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${avatarBg} border border-white/10 shadow-sm`}>
                                {authorInitials}
                              </div>
                              {tIdx < items.length - 1 && (
                                <div className="w-[1.5px] flex-1 min-h-[12px] mt-1 bg-white/8" />
                              )}
                            </div>

                            {/* Message Body */}
                            <div className="flex-1 min-w-0 mb-3 space-y-1.5">
                              <div className="flex items-center justify-between gap-2 text-xs w-full">
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                  <span className="font-bold text-white text-xs truncate">{c.authorName}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${roleBadgeBg}`}>
                                    {c.authorRole}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-[11px] shrink-0">
                                  {c.isEdited && (
                                    <span className="text-[10px] text-gray-500 font-medium italic">
                                      (edited)
                                    </span>
                                  )}
                                  <span>{c.createdAt}</span>

                                  {canEditOrDelete && (
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={() => setActiveMenuCommentId(activeMenuCommentId === c.id ? null : c.id)}
                                        className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                                        title="More options"
                                      >
                                        <MoreVertical size={13} />
                                      </button>

                                      {activeMenuCommentId === c.id && (
                                        <>
                                          <div className="fixed inset-0 z-20" onClick={() => setActiveMenuCommentId(null)} />
                                          <div className="absolute right-0 top-full mt-1 z-30 bg-[#0E1524] border border-white/10 rounded-2xl shadow-2xl py-1 min-w-[110px] backdrop-blur-md animate-in fade-in duration-150">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingCommentId(c.id);
                                                setEditingCommentText(c.text);
                                                setActiveMenuCommentId(null);
                                              }}
                                              className="w-full text-left px-3.5 py-1.5 text-xs text-gray-200 hover:text-white hover:bg-white/10 flex items-center gap-2 cursor-pointer transition-colors"
                                            >
                                              <Pencil size={12} className="text-[#00D4B2]" />
                                              <span>Edit</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteComment(c.id)}
                                              className="w-full text-left px-3.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                                            >
                                              <Trash2 size={12} className="text-red-400" />
                                              <span>Delete</span>
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="bg-[#111726] hover:bg-[#131b2e] rounded-3xl p-4 border border-white/5 space-y-3 transition-colors shadow-xs w-full overflow-hidden">
                                {c.replyTo && (
                                  <div className="bg-white/[0.04] border-l-2 border-[#00D4B2] px-3 py-1.5 rounded-r-xl rounded-l-xs text-[11px] text-gray-300 flex items-center gap-2 min-w-0 w-full overflow-hidden">
                                    <Reply size={12} className="text-[#00D4B2] shrink-0" />
                                    <span className="font-semibold text-white/90 shrink-0">@{c.replyTo.authorName}:</span>
                                    <span className="truncate text-gray-400 font-normal min-w-0 flex-1">{c.replyTo.text}</span>
                                  </div>
                                )}

                                {isEditingThis ? (
                                  <div className="space-y-2 pt-1">
                                    <textarea
                                      rows={2}
                                      value={editingCommentText}
                                      onChange={(e) => setEditingCommentText(e.target.value)}
                                      className="w-full bg-[#070B14] border border-[#00D4B2]/40 focus:border-[#00D4B2] rounded-2xl p-2.5 text-xs text-white placeholder-gray-500 outline-none resize-none font-medium leading-relaxed"
                                      autoFocus
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCommentId(null);
                                          setEditingCommentText('');
                                        }}
                                        className="px-3 py-1 rounded-full text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditComment(c.id)}
                                        disabled={!editingCommentText.trim() || editingCommentText.trim() === c.text}
                                        className="bg-[#00D4B2] hover:bg-[#00BFA0] text-[#070B14] px-3.5 py-1 rounded-full text-xs font-black disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-200 leading-relaxed font-normal whitespace-pre-wrap">
                                    {c.text.split(/(@[A-Za-z0-9_ ]+)/g).map((part: string, i: number) => {
                                      if (part.startsWith('@')) {
                                        return (
                                          <span key={i} className="font-bold text-[#00D4B2] bg-[#00D4B2]/10 px-2 py-0.5 rounded-full mr-1">
                                            {part}
                                          </span>
                                        );
                                      }
                                      return part;
                                    })}
                                  </p>
                                )}

                                <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-xs text-gray-400">
                                  <div className="flex items-center gap-4">
                                    <button
                                      type="button"
                                      onClick={() => toggleLikeComment(c.id)}
                                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                        isLiked ? 'text-[#00D4B2] bg-[#00D4B2]/10' : 'hover:text-white hover:bg-white/5 text-gray-400'
                                      }`}
                                    >
                                      <ThumbsUp size={13} className={isLiked ? 'fill-[#00D4B2]' : ''} />
                                      <span>{likesCount}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingToComment({ authorName: c.authorName, text: c.text });
                                        setTimeout(() => {
                                          commentTextareaRef.current?.focus();
                                        }, 50);
                                      }}
                                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                    >
                                      <Reply size={13} />
                                      <span>Reply</span>
                                    </button>
                                  </div>

                                  {isHelpful && (
                                    <button
                                      type="button"
                                      onClick={() => toggleHelpfulComment(c.id)}
                                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00D4B2] bg-[#00D4B2]/10 border border-[#00D4B2]/20 px-3 py-1 rounded-full cursor-pointer hover:bg-[#00D4B2]/20 transition-all"
                                    >
                                      <Check size={12} className="stroke-[3]" />
                                      <span>Marked Helpful</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>

                {/* Bottom Input Area matching reference screenshot */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    {/* Active User Avatar */}
                    <div className="w-9 h-9 rounded-full bg-[#0D3B36] text-[#00D4B2] border border-[#00D4B2]/30 flex items-center justify-center text-[11px] font-black shrink-0 mt-1 shadow-sm">
                      {activePersonaName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>

                    {/* Input Field Container with smooth round border */}
                    <div className="flex-1 min-w-0 bg-[#111726] rounded-3xl border border-white/10 focus-within:border-[#00D4B2]/60 transition-all relative shadow-md">
                      
                      {/* Docked Reply Preview Header */}
                      {replyingToComment && (
                        <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-[#00D4B2]/[0.08] border-b border-[#00D4B2]/20 text-xs rounded-t-3xl min-w-0 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-1 h-5.5 rounded-full bg-[#00D4B2] shrink-0" />
                            <Reply size={13} className="text-[#00D4B2] shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-[#00D4B2] text-[10px] uppercase font-extrabold tracking-wider block truncate">
                                Replying to {replyingToComment.authorName}
                              </span>
                              <span className="text-gray-300 text-xs font-normal truncate block">
                                "{replyingToComment.text}"
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReplyingToComment(null)}
                            className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
                            title="Cancel reply"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      <div className="p-3.5 space-y-2.5">
                        {/* Mention Popover Suggestions */}
                        {showMentionMenu && possibleTagTargets.length > 0 && (
                          <div className="absolute bottom-full mb-2 left-0 right-0 z-30 bg-[#0E1524] border border-white/10 rounded-2xl shadow-2xl p-2 max-h-48 overflow-y-auto space-y-1 backdrop-blur-md">
                            <div className="text-[10px] font-black uppercase text-[#00D4B2] px-3.5 py-1 tracking-wider">Mention Member</div>
                            {possibleTagTargets.map(name => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => handleSelectMention(name)}
                                className="w-full text-left px-3.5 py-2 rounded-2xl text-xs font-bold text-gray-200 hover:bg-[#00D4B2]/15 hover:text-[#00D4B2] transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-[#00D4B2]/10 text-[#00D4B2] flex items-center justify-center text-[10px] font-black">
                                    @
                                  </div>
                                  <span>{name}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-normal">Tag</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <textarea
                          ref={commentTextareaRef}
                          rows={2}
                          placeholder="Write a comment... (Type @ to tag a person)"
                          value={commentInput}
                          onChange={(e: any) => {
                            const val = e.target.value;
                            setCommentInput(val);
                            if (val.endsWith('@') || (val.includes('@') && !val.split('@').pop()?.includes(' '))) {
                              setShowMentionMenu(true);
                            } else {
                              setShowMentionMenu(false);
                            }
                          }}
                          className="w-full bg-transparent px-1 text-xs text-white placeholder-gray-500 outline-none resize-none font-medium leading-relaxed"
                        />

                        {/* Bottom action icons & Post Comment Button */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                          <div className="flex items-center gap-2 text-gray-400">
                            <button type="button" className="p-1.5 rounded-full hover:bg-white/5 hover:text-white cursor-pointer transition-colors">
                              <Paperclip size={15} />
                            </button>
                            <button type="button" className="p-1.5 rounded-full hover:bg-white/5 hover:text-white cursor-pointer transition-colors">
                              <ImageIcon size={15} />
                            </button>
                            <button type="button" className="p-1.5 rounded-full hover:bg-white/5 hover:text-white cursor-pointer transition-colors">
                              <Smile size={15} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleSendComment}
                            disabled={!commentInput.trim()}
                            className="bg-[#00D4B2] hover:bg-[#00BFA0] text-[#070B14] px-4.5 py-2 rounded-full text-xs font-black flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-md active:scale-95"
                          >
                            <Send size={13} className="fill-[#070B14]" />
                            <span>Post Comment</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {activeDetail.status !== 'closed' && (activeDetail.requestorName === activePersonaName || isManagerOrAdmin) && (
                <div className="pt-4 border-t border-white/5">
                  <button
                    type="button"
                    aria-label="Close activity and state rationale"
                    title="Close this activity with mandatory justification reason"
                    onClick={() => setCloseModalRequest(activeDetail)}
                    className="w-full bg-[#FF4757]/10 hover:bg-[#FF4757]/20 text-[#FF4757] border border-[#FF4757]/30 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Close Request & Add Reason
                  </button>
                </div>
              )}

              {activeDetail.status === 'closed' && (
                <div className="pt-4 border-t border-white/5">
                  <button
                    type="button"
                    aria-label="Reopen activity and notify team"
                    title="Reopen this activity with mandatory justification reason"
                    onClick={() => setReopenModalRequest(activeDetail)}
                    className="w-full bg-[#00D4B2]/10 hover:bg-[#00D4B2]/20 text-[#00D4B2] border border-[#00D4B2]/30 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Reopen Activity & Add Reason</span>
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Close Request Modal */}
      <AnimatePresence>
        {closeModalRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setCloseModalRequest(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12, filter: 'blur(3px)' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white dark:bg-[#0d1117] w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 border dark:border-white/5 space-y-4"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">Close Request & Notify Manager</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">State your rationale for closing <span className="font-bold">{closeModalRequest.referenceId || closeModalRequest.id}</span> (Required):</p>

              <textarea
                required
                rows={3}
                placeholder="e.g. Issue resolved independently / duplicate request logged..."
                value={closeReason}
                onChange={e => setCloseReason(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-[#1a1d27] text-xs outline-none font-semibold text-gray-800 dark:text-gray-200 focus:bg-white dark:focus:bg-[#252836]"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setCloseModalRequest(null)} className="px-4 py-2 text-xs font-bold text-gray-650 dark:text-gray-400 cursor-pointer">Cancel</button>
                <button
                  onClick={handleConfirmClose}
                  disabled={!closeReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  Close & Notify Manager
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reopen Request Modal */}
      <AnimatePresence>
        {reopenModalRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setReopenModalRequest(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12, filter: 'blur(3px)' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white dark:bg-[#0d1117] w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 border dark:border-white/5 space-y-4"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Reopen Activity & Notify Team</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">State your rationale for reopening <span className="font-bold">{reopenModalRequest.referenceId || reopenModalRequest.id}</span>:</p>

              <textarea
                required
                rows={3}
                placeholder="e.g. Issue recurred / contractor work incomplete / further inspection needed..."
                value={reopenReason}
                onChange={e => setReopenReason(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-[#1a1d27] text-xs outline-none font-semibold text-gray-800 dark:text-gray-200 focus:bg-white dark:focus:bg-[#252836]"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setReopenModalRequest(null)} className="px-4 py-2 text-xs font-bold text-gray-650 dark:text-gray-400 cursor-pointer">Cancel</button>
                <button
                  onClick={handleConfirmReopen}
                  disabled={!reopenReason.trim()}
                  className="bg-[#0055FF] hover:bg-[#0040CC] text-white px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shadow-md"
                >
                  Reopen Activity
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function StatusPill({ label, active, onClick, count }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
        active 
          ? 'bg-[#0B1121] dark:bg-[#00D4B2]/10 text-[#00D4B2] border-[#00D4B2]/30 shadow-md' 
          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 border-transparent dark:border-white/5'
      }`}
    >
      {label} {count !== undefined && `(${count})`}
    </button>
  );
}

function StatusBadge({ status }: { status: CaseStatus }) {
  switch (status) {
    case 'new':
      return <span className="px-3 py-1 rounded-full bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/25 text-[10px] font-black uppercase tracking-wider">NEW</span>;
    case 'acknowledged':
      return <span className="px-3 py-1 rounded-full bg-[#00D4B2]/10 text-[#00D4B2] border border-[#00D4B2]/25 text-[10px] font-black uppercase tracking-wider">ACKNOWLEDGED</span>;
    case 'in_progress':
      return <span className="px-3 py-1 rounded-full bg-[#0055FF]/15 text-[#66A3FF] border border-[#0055FF]/30 text-[10px] font-black uppercase tracking-wider">IN PROGRESS</span>;
    case 'waiting':
      return <span className="px-3 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/25 text-[10px] font-black uppercase tracking-wider">WAITING</span>;
    case 'resolved':
      return <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-[#10B981] border border-emerald-500/25 text-[10px] font-black uppercase tracking-wider">RESOLVED</span>;
    case 'pending_triage':
      return <span className="px-3 py-1 rounded-full bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/25 text-[10px] font-black uppercase tracking-wider">PENDING TRIAGE</span>;
    case 'in_voting':
      return <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/25 text-[10px] font-black uppercase tracking-wider">IN VOTING</span>;
    case 'approved':
      return <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-[#10B981] border border-emerald-500/25 text-[10px] font-black uppercase tracking-wider">APPROVED</span>;
    case 'rejected':
      return <span className="px-3 py-1 rounded-full bg-red-500/10 text-[#FF6B6B] border border-red-500/25 text-[10px] font-black uppercase tracking-wider">REJECTED</span>;
    case 'closed':
      return <span className="px-3 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[10px] font-black uppercase tracking-wider">CLOSED</span>;
    default:
      return <span className="px-3 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[10px] font-black uppercase tracking-wider">{(status as string).toUpperCase()}</span>;
  }
}




// End ResidentRequestsView

// Subcomponent: Requests Filter Bar
// Subcomponent: Request Details Drawer
// Requests: Request Status Timeline and Badges
// Animation: Request Timeline Step Indicator
// Animation: Filter Drawer Slide Animation