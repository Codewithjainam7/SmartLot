import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ResidentRequest, CaseStatus } from '../store/smartLotStore';
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
  X, 
  Send,
  User,
  AlertCircle
} from 'lucide-react';

interface ResidentRequestsViewProps {
  requests: ResidentRequest[];
  onOpenCreateModal?: () => void;
  onSubmitRequest: (data: any) => void;
  onCloseRequest: (requestId: string, reason: string) => void;
  onAddComment: (requestId: string, text: string) => void;
  activePersonaName: string;
  activePersonaRole: string;
}

export function ResidentRequestsView({
  requests,
  onSubmitRequest,
  onCloseRequest,
  onAddComment,
  activePersonaName,
}: ResidentRequestsViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewScope, setViewScope] = useState<'my' | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<ResidentRequest | null>(null);
  const [closeModalRequest, setCloseModalRequest] = useState<ResidentRequest | null>(null);
  const [closeReason, setCloseReason] = useState('');
  const [commentInput, setCommentInput] = useState('');

  const filteredRequests = requests.filter(r => {
    if (viewScope === 'my' && r.requestorName !== activePersonaName) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const activeDetail = selectedRequest ? requests.find(r => r.id === selectedRequest.id) || selectedRequest : null;

  const handleConfirmClose = () => {
    if (!closeModalRequest || !closeReason.trim()) return;
    onCloseRequest(closeModalRequest.id, closeReason);
    setCloseModalRequest(null);
    setCloseReason('');
    if (selectedRequest?.id === closeModalRequest.id) setSelectedRequest(null);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetail || !commentInput.trim()) return;
    onAddComment(activeDetail.id, commentInput);
    setCommentInput('');
  };

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-full bg-[#F4F6F9]">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0055FF]/10 text-[#0033CC] text-xs font-bold uppercase tracking-wider mb-2">
            Resident Hub • Requests Engine
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Resident Service & Repair Requests</h1>
          <p className="text-sm text-gray-500">Log issues, track status in real-time, and view community requests.</p>
        </div>

        {/* Morphing Capsule Button */}
        <MorphingPopover>
          <MorphingPopoverTrigger>
            <div className="bg-[#0B1121] hover:bg-black text-white px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-105 cursor-pointer">
              <Plus size={18} className="text-[#00D4B2]" /> 
              <span>Create New Request</span>
            </div>
          </MorphingPopoverTrigger>

          <MorphingPopoverContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CreateRequestFormContent 
              onSubmit={onSubmitRequest}
              requestorName={activePersonaName}
            />
          </MorphingPopoverContent>
        </MorphingPopover>
      </div>

      {/* Filter & View Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100">
        
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label="All" active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} count={requests.length} />
          <StatusPill label="New" active={filterStatus === 'new'} onClick={() => setFilterStatus('new')} />
          <StatusPill label="Pending Triage" active={filterStatus === 'pending_triage'} onClick={() => setFilterStatus('pending_triage')} />
          <StatusPill label="Approved" active={filterStatus === 'approved'} onClick={() => setFilterStatus('approved')} />
          <StatusPill label="Rejected" active={filterStatus === 'rejected'} onClick={() => setFilterStatus('rejected')} />
          <StatusPill label="Closed" active={filterStatus === 'closed'} onClick={() => setFilterStatus('closed')} />
        </div>

        {/* View Scope Toggle */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewScope('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewScope === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            All Requests
          </button>
          <button
            onClick={() => setViewScope('my')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewScope === 'my' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            My Requests Only
          </button>
        </div>

      </div>

      {/* Requests Grid with Fading & Shrinking Depth Exit Animation */}
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
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[300px]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{req.id} • {req.unit}</span>
                  <StatusBadge status={req.status} />
                </div>

                <div className="text-xs font-extrabold text-[#0055FF] uppercase tracking-wider mb-1 capitalize">
                  {req.requestType.replace(/_/g, ' ')}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{req.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">{req.description}</p>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-3 mt-auto">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>By {req.requestorName}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {req.createdAt}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1 font-semibold">
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
              className="relative bg-white w-full max-w-xl h-full shadow-2xl z-10 p-8 overflow-y-auto space-y-6"
            >
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{activeDetail.id} • {activeDetail.unit}</span>
                  <h2 className="text-xl font-bold text-gray-900">{activeDetail.title}</h2>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={activeDetail.status} />
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full capitalize">
                  {activeDetail.requestType.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
                <div className="font-bold text-gray-900">Full Description:</div>
                <p className="text-gray-600 leading-relaxed">{activeDetail.description}</p>
              </div>

              {activeDetail.attachmentUrl && (
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase mb-2 block">Attached Image</span>
                  <img src={activeDetail.attachmentUrl} alt="Attachment" className="w-full h-48 object-cover rounded-2xl border border-gray-200" />
                </div>
              )}

              {activeDetail.status === 'closed' && activeDetail.closeReason && (
                <div className="bg-[#FF4757]/10 border border-[#FF4757]/30 p-4 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-red-900 flex items-center gap-1.5"><AlertCircle size={14} /> Closed with Rationale:</div>
                  <p className="text-red-700">{activeDetail.closeReason}</p>
                </div>
              )}

              {/* Comments Thread */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Comments Thread ({activeDetail.comments.length})</h4>
                
                <div className="space-y-3">
                  {activeDetail.comments.map(c => (
                    <div key={c.id} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-gray-900">
                        <span>{c.authorName} ({c.authorRole})</span>
                        <span className="text-[10px] text-gray-400 font-normal">{c.createdAt}</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add a comment or response..."
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:bg-white"
                  />
                  <button type="submit" className="bg-[#0B1121] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
                    <Send size={12} /> Post
                  </button>
                </form>
              </div>

              {activeDetail.status !== 'closed' && activeDetail.requestorName === activePersonaName && (
                <div className="pt-6 border-t border-gray-100">
                  <button
                    onClick={() => setCloseModalRequest(activeDetail)}
                    className="w-full bg-[#FF4757]/10 hover:bg-[#FF4757]/20 text-[#FF4757] border border-[#FF4757]/30 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    Close Request & Add Reason
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
              className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <h3 className="text-xl font-bold text-gray-900">Close Request & Notify Manager</h3>
              <p className="text-xs text-gray-500">State your rationale for closing <span className="font-bold">{closeModalRequest.id}</span> (Required):</p>

              <textarea
                required
                rows={3}
                placeholder="e.g. Issue resolved independently / duplicate request logged..."
                value={closeReason}
                onChange={e => setCloseReason(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-xs outline-none font-semibold text-gray-800"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setCloseModalRequest(null)} className="px-4 py-2 text-xs font-bold text-gray-600 cursor-pointer">Cancel</button>
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

    </div>
  );
}

function StatusPill({ label, active, onClick, count }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
        active ? 'bg-[#0B1121] text-[#00D4B2]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label} {count !== undefined && `(${count})`}
    </button>
  );
}

function StatusBadge({ status }: { status: CaseStatus }) {
  switch (status) {
    case 'new':
      return <span className="px-3 py-1 rounded-full bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/20 text-[10px] font-bold uppercase">NEW</span>;
    case 'pending_triage':
      return <span className="px-3 py-1 rounded-full bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/20 text-[10px] font-bold uppercase">PENDING TRIAGE</span>;
    case 'in_voting':
      return <span className="px-3 py-1 rounded-full bg-purple-100 text-[#0055FF] text-[10px] font-bold uppercase">IN VOTING</span>;
    case 'approved':
      return <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#10B981] text-[10px] font-bold uppercase">APPROVED</span>;
    case 'rejected':
      return <span className="px-3 py-1 rounded-full bg-red-100 text-[#FF6B6B] text-[10px] font-bold uppercase">REJECTED</span>;
    case 'closed':
      return <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold uppercase">CLOSED</span>;
  }
}
