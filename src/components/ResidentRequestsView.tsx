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
  Trash2,
  Download,
  ExternalLink,
  Zap,
  AlertTriangle,
  Building2,
  Home,
  HelpCircle
} from 'lucide-react';

interface ResidentRequestsViewProps {
  requests: ResidentRequest[];
  onOpenCreateModal?: () => void;
  onSubmitRequest: (data: any) => any;
  onCloseRequest: (requestId: string, reason: string) => void;
  onAddComment: (
    requestId: string,
    text: string,
    replyTo?: { authorName: string; text: string },
    attachments?: { name: string; url: string; type?: string; size?: string }[]
  ) => void;
  onEditComment?: (requestId: string, commentId: string, newText: string) => void;
  onDeleteComment?: (requestId: string, commentId: string) => void;
  onSimulateManagerReply?: (requestId: string, replyText: string, managerName?: string) => void;
  onAddInternalNote?: (requestId: string, text: string) => void;
  onUpdateStatus?: (requestId: string, status: CaseStatus, reason?: string) => void;
  onUpdatePriority?: (requestId: string, priority: any) => void;
  onAssignActivity?: (requestId: string, assigneeName: string, assigneeRole: string, assigneeEmail?: string) => void;
  onReopenActivity?: (requestId: string, reason: string) => void;
  onTriageCase?: (caseId: string, action: 'approve' | 'reject', rejectionReason?: string) => void;
  initialFilter?: string;
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
  onTriageCase,
  initialFilter,
  activePersonaName,
  activePersonaRole,
  activePersonaEmail,
  activePersonaPhone,
  activePersonaContext,
  activeSchemeName,
  activeManagerEmail,
}: ResidentRequestsViewProps) {
  const isManagerOrAdmin = activePersonaRole.toLowerCase().includes('manager') || activePersonaRole.toLowerCase().includes('admin');
  const isManagerOrCommittee = isManagerOrAdmin || activePersonaRole.toLowerCase().includes('committee');

  const pendingTriageRequests = requests.filter(r => r.status === 'pending_triage' || r.status === 'new');

  const [filterStatus, setFilterStatus] = useState<string>(
    initialFilter || (isManagerOrCommittee && pendingTriageRequests.length > 0 ? 'needs_triage' : 'all')
  );
  const [filterStream, setFilterStream] = useState<string>('all');
  const [rejectModalRequest, setRejectModalRequest] = useState<ResidentRequest | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

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

  const handleQuickApprove = (requestId: string) => {
    if (onTriageCase) {
      onTriageCase(requestId, 'approve');
    } else if (onUpdateStatus) {
      onUpdateStatus(requestId, 'approved');
    }
  };

  const handleConfirmReject = () => {
    if (!rejectModalRequest || !rejectionReasonText.trim()) return;
    if (onTriageCase) {
      onTriageCase(rejectModalRequest.id, 'reject', rejectionReasonText.trim());
    } else if (onUpdateStatus) {
      onUpdateStatus(rejectModalRequest.id, 'rejected', rejectionReasonText.trim());
    }
    setRejectModalRequest(null);
    setRejectionReasonText('');
    if (selectedRequest?.id === rejectModalRequest.id) {
      setSelectedRequest(null);
    }
  };

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
    if (filterStatus === 'needs_triage') {
      if (!(r.status === 'pending_triage' || r.status === 'new')) return false;
    } else if (filterStatus !== 'all' && r.status !== filterStatus) {
      return false;
    }
    if (filterStream !== 'all') {
      const streamInfo = getRequestStreamInfo(r);
      if (streamInfo.id !== filterStream) {
        return false;
      }
    }
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
  const [reopenModalRequest, setReopenModalRequest] = useState<ResidentRequest | null>(null);
  const [reopenReason, setReopenReason] = useState('');

  // Comment attachments and emoji state
  const [commentAttachments, setCommentAttachments] = useState<{
    id: string;
    name: string;
    size: string;
    type: string;
    url: string;
  }[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  const docInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>, isImageOnly: boolean) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const sizeFormatted = file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

        setCommentAttachments(prev => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            size: sizeFormatted,
            type: file.type || (isImageOnly ? 'image/jpeg' : 'application/pdf'),
            url: result,
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setCommentAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSelectEmoji = (emoji: string) => {
    const textarea = commentTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart || commentInput.length;
      const end = textarea.selectionEnd || commentInput.length;
      const nextVal = commentInput.substring(0, start) + emoji + commentInput.substring(end);
      setCommentInput(nextVal);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setCommentInput(prev => prev + emoji);
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!commentInput.trim() && commentAttachments.length === 0) || !activeDetail) return;
    onAddComment(
      activeDetail.id,
      commentInput.trim(),
      replyingToComment || undefined,
      commentAttachments.map(a => ({ name: a.name, url: a.url, type: a.type, size: a.size }))
    );
    setCommentInput('');
    setCommentAttachments([]);
    setReplyingToComment(null);
    setShowMentionMenu(false);
    setShowEmojiPicker(false);
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
      <div className="space-y-3 bg-white dark:bg-[#0d1117] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
        
        {/* Status Filter Pills Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Needs Triage Pill for Managers & Committee */}
            {isManagerOrCommittee && (
              <button
                type="button"
                onClick={() => setFilterStatus('needs_triage')}
                className={`relative px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer border flex items-center gap-1.5 ${
                  filterStatus === 'needs_triage'
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <Zap size={13} className={filterStatus === 'needs_triage' ? 'fill-black' : 'fill-amber-400'} />
                <span>Needs Triage</span>
                {pendingTriageRequests.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    filterStatus === 'needs_triage' ? 'bg-black text-amber-400' : 'bg-amber-500 text-black'
                  }`}>
                    {pendingTriageRequests.length}
                  </span>
                )}
              </button>
            )}

            <StatusPill label="All" active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} count={requests.length} />
            <StatusPill label="New" active={filterStatus === 'new'} onClick={() => setFilterStatus('new')} />
            <StatusPill label="Acknowledged" active={filterStatus === 'acknowledged'} onClick={() => setFilterStatus('acknowledged')} />
            <StatusPill label="In Progress" active={filterStatus === 'in_progress'} onClick={() => setFilterStatus('in_progress')} />
            <StatusPill label="Waiting" active={filterStatus === 'waiting'} onClick={() => setFilterStatus('waiting')} />
            <StatusPill label="Resolved" active={filterStatus === 'resolved'} onClick={() => setFilterStatus('resolved')} />
            <StatusPill label="Closed" active={filterStatus === 'closed'} onClick={() => setFilterStatus('closed')} />
          </div>

          {/* View Scope Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-[#1a1d27] p-1 rounded-xl border border-transparent dark:border-white/5 shrink-0 self-start md:self-auto">
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

        {/* Secondary Stream Filter Pills Row */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-white/5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-2 shrink-0 flex items-center gap-1">
            <Filter size={12} /> Strata Stream:
          </span>
          {[
            { id: 'all', label: 'All Streams' },
            { id: 'general_inquiry', label: 'General Inquiry', icon: HelpCircle },
            { id: 'emergency_repair', label: 'Emergency Repair', icon: AlertTriangle },
            { id: 'private_lot_repair', label: 'Private Lot Repair', icon: Home },
            { id: 'common_area_repair', label: 'Common Area Repair', icon: Building2 },
          ].map(s => {
            const Icon = s.icon;
            const active = filterStream === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilterStream(s.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer border ${
                  active
                    ? 'bg-[#00D4B2]/15 text-[#00D4B2] border-[#00D4B2]/30'
                    : 'bg-transparent text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {Icon && <Icon size={12} />}
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Requests Grid with Fading & Shrinking Depth Exit Animation */}
      {filteredRequests.length === 0 ? (
        filterStatus === 'needs_triage' ? (
          <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-12 border border-amber-500/20 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <span>🎉 Inbox Zero — All Requests Triaged!</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                There are no pending or un-triaged resident requests awaiting manager review in this scheme.
              </p>
            </div>
            <button
              onClick={() => setFilterStatus('all')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold text-gray-900 dark:text-white transition-colors cursor-pointer"
            >
              <span>View All Scheme Requests</span>
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-12 border border-gray-100 dark:border-white/5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 mx-auto flex items-center justify-center">
              <Inbox size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No activities found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {filterStatus === 'all' 
                ? "No activities have been recorded yet. Click '+ Create New Request' to submit an issue."
                : `No activities found matching your active filters. Try selecting 'All' or clearing filters.`}
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredRequests.map(req => {
              const streamInfo = getRequestStreamInfo(req);
              const StreamIconComp = streamInfo.icon;
              return (
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

                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {/* Strata Stream Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${streamInfo.badgeColor}`}>
                        <StreamIconComp size={10} />
                        <span>{streamInfo.label}</span>
                      </span>

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

                    {/* Manager Quick-Triage Action Bar on Card */}
                    {isManagerOrCommittee && (req.status === 'pending_triage' || req.status === 'new') && (
                      <div className="pt-2 border-t border-amber-500/20 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRejectModalRequest(req);
                          }}
                          className="flex-1 py-1.5 px-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="Reject with statutory reason"
                        >
                          <XCircle size={13} />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickApprove(req.id);
                          }}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          title="Approve and direct dispatch"
                        >
                          <CheckCircle2 size={13} />
                          <span>Approve</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-semibold">
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
              );
            })}
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

              {/* Manager & Committee Triage Action Suite */}
              {isManagerOrCommittee && (activeDetail.status === 'pending_triage' || activeDetail.status === 'new') && (
                <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-5 space-y-3 shadow-lg shadow-amber-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
                      <Zap size={16} className="fill-amber-400 text-amber-400" />
                      <span>Action Required: Strata Triage Assessment</span>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Pending Manager Review
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    Under NSW Strata Schemes Management Act 2015 s 106, common property repairs are the statutory responsibility of the Owners Corporation. Verify whether this request falls under Common Property or Private Lot Owner fixtures.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleQuickApprove(activeDetail.id)}
                      className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={16} />
                      <span>Approve & Dispatch Work</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRejectModalRequest(activeDetail)}
                      className="py-2.5 px-4 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <XCircle size={16} />
                      <span>Reject with Statutory Rationale</span>
                    </button>
                  </div>
                </div>
              )}

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

                {onSimulateManagerReply && activeDetail.status !== 'closed' && (
                  <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[10px] text-gray-400">Strata Manager responding via email?</span>
                    <button
                      type="button"
                      onClick={() => onSimulateManagerReply(
                        activeDetail.id,
                        "Thanks. I've contacted the security gate contractor. They will attend tomorrow to inspect.",
                        activeDetail.strataManagerEmail ? (activeDetail.strataManagerEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())) : 'Emma Wilson'
                      )}
                      className="px-3 py-1.5 rounded-xl bg-[#00D4B2]/15 hover:bg-[#00D4B2]/25 text-[#00D4B2] border border-[#00D4B2]/30 text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 self-end sm:self-auto"
                      title="Simulate manager replying via email to test automatic capture"
                    >
                      <Mail size={12} />
                      <span>Simulate Inbound Email Reply</span>
                    </button>
                  </div>
                )}
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

              {/* Multi-Photo & Document Attachments */}
              {(activeDetail.attachmentUrls && activeDetail.attachmentUrls.length > 0) ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Attached Files ({activeDetail.attachmentUrls.length})
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {activeDetail.attachmentUrls.map((url, i) => {
                      const isImage = url.startsWith('data:image') || url.includes('unsplash.com') || url.match(/\.(jpg|jpeg|png|webp|gif|avif)/i);
                      if (isImage) {
                        return (
                          <div
                            key={i}
                            onClick={() => setPreviewModalImage(url)}
                            className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-sm cursor-pointer"
                          >
                            <img src={url} alt={`Attachment ${i+1}`} className="w-full h-36 object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <ExternalLink size={16} />
                            </div>
                          </div>
                        );
                      }
                      return (
                        <a
                          key={i}
                          href={url}
                          download={`document_${i+1}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="col-span-2 flex items-center gap-3 p-3 bg-white/[0.04] hover:bg-white/[0.08] rounded-2xl border border-white/10 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-[#00D4B2]/10 text-[#00D4B2] flex items-center justify-center shrink-0">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">Attached Document {i+1}</p>
                            <p className="text-[10px] text-gray-400">Click to view / download file</p>
                          </div>
                          <Download size={15} className="text-gray-400 group-hover:text-[#00D4B2] shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              ) : activeDetail.attachmentUrl ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Attached File</span>
                  {activeDetail.attachmentUrl.startsWith('data:image') || activeDetail.attachmentUrl.includes('unsplash.com') || activeDetail.attachmentUrl.match(/\.(jpg|jpeg|png|webp|gif|avif)/i) ? (
                    <div
                      onClick={() => setPreviewModalImage(activeDetail.attachmentUrl!)}
                      className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-sm cursor-pointer"
                    >
                      <img src={activeDetail.attachmentUrl} alt="Attachment" className="w-full h-44 object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <ExternalLink size={16} />
                      </div>
                    </div>
                  ) : (
                    <a
                      href={activeDetail.attachmentUrl}
                      download="document"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white/[0.04] hover:bg-white/[0.08] rounded-2xl border border-white/10 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#00D4B2]/10 text-[#00D4B2] flex items-center justify-center shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">Attached Document</p>
                        <p className="text-[10px] text-gray-400">Click to view / download file</p>
                      </div>
                      <Download size={15} className="text-gray-400 group-hover:text-[#00D4B2] shrink-0" />
                    </a>
                  )}
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
                                  <div className="space-y-2.5">
                                    {c.text && (
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

                                    {/* Attached Media & Documents */}
                                    {c.attachments && c.attachments.length > 0 && (
                                      <div className="space-y-2 pt-1">
                                        {/* Images preview grid */}
                                        {c.attachments.filter(a => a.type?.startsWith('image/') || a.url.startsWith('data:image')).length > 0 && (
                                          <div className="flex flex-wrap gap-2">
                                            {c.attachments
                                              .filter(a => a.type?.startsWith('image/') || a.url.startsWith('data:image'))
                                              .map((att, idx) => (
                                                <div
                                                  key={idx}
                                                  onClick={() => setPreviewModalImage(att.url)}
                                                  className="relative group rounded-xl overflow-hidden border border-white/10 hover:border-[#00D4B2]/50 transition-all cursor-pointer shadow-xs"
                                                  title={`${att.name} (${att.size || ''}) - Click to preview`}
                                                >
                                                  <img
                                                    src={att.url}
                                                    alt={att.name}
                                                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover group-hover:scale-105 transition-transform"
                                                  />
                                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                    <ExternalLink size={14} />
                                                  </div>
                                                </div>
                                              ))}
                                          </div>
                                        )}

                                        {/* Documents list */}
                                        {c.attachments.filter(a => !(a.type?.startsWith('image/') || a.url.startsWith('data:image'))).length > 0 && (
                                          <div className="flex flex-col gap-1.5">
                                            {c.attachments
                                              .filter(a => !(a.type?.startsWith('image/') || a.url.startsWith('data:image')))
                                              .map((att, idx) => (
                                                <a
                                                  key={idx}
                                                  href={att.url}
                                                  download={att.name}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/30 hover:bg-black/50 border border-white/10 hover:border-[#00D4B2]/40 transition-all text-xs text-gray-200 group w-fit max-w-full"
                                                >
                                                  <div className="w-7 h-7 rounded-lg bg-[#00D4B2]/10 text-[#00D4B2] flex items-center justify-center shrink-0">
                                                    <FileText size={14} />
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-white truncate max-w-[180px] sm:max-w-xs">{att.name}</p>
                                                    <p className="text-[10px] text-gray-400">{att.size || 'Document'} • Click to download</p>
                                                  </div>
                                                  <Download size={13} className="text-gray-400 group-hover:text-[#00D4B2] shrink-0 ml-1" />
                                                </a>
                                              ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
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

                      {/* Selected Attachments Preview Chips */}
                      {commentAttachments.length > 0 && (
                        <div className="px-3.5 py-2.5 bg-white/[0.03] border-b border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                            <span className="flex items-center gap-1.5 text-[#00D4B2]">
                              <Paperclip size={11} /> Attached Files ({commentAttachments.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => setCommentAttachments([])}
                              className="text-gray-400 hover:text-red-400 text-[10px] font-medium transition-colors cursor-pointer"
                            >
                              Remove all
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                            {commentAttachments.map(att => {
                              const isImage = att.type.startsWith('image/') || att.url.startsWith('data:image');
                              return (
                                <div
                                  key={att.id}
                                  className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl bg-[#070B14] border border-white/10 text-xs text-white shadow-xs max-w-full"
                                >
                                  {isImage ? (
                                    <img
                                      src={att.url}
                                      alt={att.name}
                                      className="w-7 h-7 rounded-lg object-cover border border-white/10 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 rounded-lg bg-[#00D4B2]/10 text-[#00D4B2] flex items-center justify-center shrink-0">
                                      <FileText size={13} />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-bold text-gray-200 truncate max-w-[130px] leading-tight">
                                      {att.name}
                                    </p>
                                    <p className="text-[9px] text-gray-400 leading-none">
                                      {att.size}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAttachment(att.id)}
                                    className="p-1 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors cursor-pointer ml-1 shrink-0"
                                    title="Remove file"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
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

                        {/* Hidden Real File Inputs */}
                        <input
                          ref={docInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.zip"
                          className="hidden"
                          onChange={(e) => handleAttachmentSelect(e, false)}
                        />
                        <input
                          ref={imgInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleAttachmentSelect(e, true)}
                        />

                        {/* Bottom action icons & Post Comment Button */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-white/5 relative">
                          {/* Interactive Emoji Picker Popover */}
                          {showEmojiPicker && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setShowEmojiPicker(false)}
                              />
                              <div className="absolute bottom-full mb-3 left-0 z-40 bg-[#0E1524] border border-[#00D4B2]/30 rounded-2xl shadow-2xl p-3 w-72 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-2.5">
                                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-[#00D4B2] tracking-wider">
                                    <Smile size={13} />
                                    <span>Quick Emojis</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(false)}
                                    className="text-gray-400 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>

                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                  <div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 px-1 mb-1 block">Reactions</span>
                                    <div className="grid grid-cols-6 gap-1">
                                      {['👍', '👎', '❤️', '👏', '🎉', '🙌', '🤝', '🔥', '😊', '🙏', '💡', '💯'].map(emoji => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => handleSelectEmoji(emoji)}
                                          className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg hover:scale-110 transition-all cursor-pointer"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 px-1 mb-1 block">Building & Strata</span>
                                    <div className="grid grid-cols-6 gap-1">
                                      {['🏢', '🚪', '🔑', '🪟', '🚿', '⚡', '🔧', '🔨', '🚨', '⚠️', '🛠️', '📦'].map(emoji => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => handleSelectEmoji(emoji)}
                                          className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg hover:scale-110 transition-all cursor-pointer"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 px-1 mb-1 block">Tasks & Verification</span>
                                    <div className="grid grid-cols-6 gap-1">
                                      {['✅', '❌', '📋', '📝', '💬', '⏱️', '🔍', '📌', '👀', '🙋‍♂️', '⏳', '📢'].map(emoji => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => handleSelectEmoji(emoji)}
                                          className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg hover:scale-110 transition-all cursor-pointer"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          <div className="flex items-center gap-1 text-gray-400">
                            <button
                              type="button"
                              onClick={() => docInputRef.current?.click()}
                              title="Attach Document (.pdf, .doc, .xlsx, etc.)"
                              className="p-1.5 rounded-full hover:bg-white/10 hover:text-[#00D4B2] cursor-pointer transition-colors"
                            >
                              <Paperclip size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => imgInputRef.current?.click()}
                              title="Attach Photo / Image"
                              className="p-1.5 rounded-full hover:bg-white/10 hover:text-[#00D4B2] cursor-pointer transition-colors"
                            >
                              <ImageIcon size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowEmojiPicker(prev => !prev)}
                              title="Insert Emoji"
                              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                showEmojiPicker ? 'text-[#00D4B2] bg-white/10' : 'hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <Smile size={15} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleSendComment}
                            disabled={!commentInput.trim() && commentAttachments.length === 0}
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

      {/* Image Lightbox Modal */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewModalImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-[#0E1524] p-3 rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs text-gray-300">
              <span className="font-bold flex items-center gap-1.5 text-white">
                <ImageIcon size={14} className="text-[#00D4B2]" /> Attachment Preview
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewModalImage}
                  download="attached_photo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full bg-white/10 hover:bg-[#00D4B2]/20 hover:text-[#00D4B2] text-white transition-colors cursor-pointer"
                  title="Open Original / Download"
                >
                  <Download size={14} />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalImage(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={previewModalImage}
                alt="Enlarged Attachment"
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Rejection Reason Modal */}
      <AnimatePresence>
        {rejectModalRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setRejectModalRequest(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12, filter: 'blur(3px)' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white dark:bg-[#0d1117] w-full max-w-lg rounded-3xl p-6 shadow-2xl z-10 border border-gray-100 dark:border-white/10 space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-rose-500">
                  <AlertCircle size={20} />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reject Request with Statutory Rationale</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectModalRequest(null)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Under Australian Strata Governance, rejecting a resident's repair or service request requires a written statutory reason that will be logged in the immutable audit log and notified to <strong className="text-gray-800 dark:text-gray-200">{rejectModalRequest.requestorName}</strong> ({rejectModalRequest.unit}).
              </p>

              {/* Quick Strata Templates */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Quick Strata Templates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Private Lot Fixture: Under SSMA 2015 s 106, internal fixtures remain the Lot Owner's responsibility.",
                    "By-law Application Required: Major renovations or structural alterations require prior General Meeting approval.",
                    "Duplicate Request: An active work order is already underway for this issue.",
                    "Insufficient Details: Please provide high-resolution photos and contractor access availability."
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRejectionReasonText(tpl)}
                      className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors border border-transparent dark:border-white/5 cursor-pointer"
                    >
                      {tpl.split(':')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                required
                rows={4}
                placeholder="Type the statutory rejection explanation to be recorded and sent to the resident..."
                value={rejectionReasonText}
                onChange={e => setRejectionReasonText(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1a1d27] text-xs outline-none font-medium text-gray-900 dark:text-gray-100 focus:border-red-500/50"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalRequest(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={!rejectionReasonText.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <XCircle size={14} />
                  <span>Confirm Rejection</span>
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

export function getRequestStreamInfo(req: ResidentRequest) {
  const typeOrStream = `${req.stream || ''} ${req.requestType || ''} ${req.title || ''}`.toLowerCase();
  if (typeOrStream.includes('emergency') || req.priority === 'Emergency' || req.priority === 'Urgent') {
    return {
      id: 'emergency_repair',
      label: 'Emergency Repair',
      icon: AlertTriangle,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      badgeColor: 'text-rose-400 bg-rose-500/15 border-rose-500/30'
    };
  }
  if (typeOrStream.includes('private') || typeOrStream.includes('unit') || typeOrStream.includes('lot') || typeOrStream.includes('tap') || typeOrStream.includes('dryer') || typeOrStream.includes('blind')) {
    return {
      id: 'private_lot_repair',
      label: 'Private Lot Repair',
      icon: Home,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      badgeColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30'
    };
  }
  if (typeOrStream.includes('common') || typeOrStream.includes('maintenance') || typeOrStream.includes('upgrade') || typeOrStream.includes('gate') || typeOrStream.includes('lift') || typeOrStream.includes('pool') || typeOrStream.includes('foyer')) {
    return {
      id: 'common_area_repair',
      label: 'Common Area Repair',
      icon: Building2,
      color: 'text-[#00D4B2] bg-[#00D4B2]/10 border-[#00D4B2]/30',
      badgeColor: 'text-[#00D4B2] bg-[#00D4B2]/15 border-[#00D4B2]/30'
    };
  }
  return {
    id: 'general_inquiry',
    label: 'General Inquiry',
    icon: HelpCircle,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    badgeColor: 'text-blue-400 bg-blue-500/15 border-blue-500/30'
  };
}
// End ResidentRequestsView

// Subcomponent: Requests Filter Bar
// Subcomponent: Request Details Drawer
// Requests: Request Status Timeline and Badges
// Animation: Request Timeline Step Indicator
// Animation: Filter Drawer Slide Animation