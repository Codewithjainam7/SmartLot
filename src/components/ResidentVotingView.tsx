// @smartlot/component
import React, { useState } from 'react';
import { ResidentRequest } from '../store/smartLotStore';
import { 
  Vote, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Send, 
  AlertCircle, 
  ShieldAlert,
  Clock
} from 'lucide-react';

interface ResidentVotingViewProps {
  requestsInVoting: ResidentRequest[];
  onCastVote: (requestId: string, vote: 'YES' | 'NO') => void;
  onAddComment: (requestId: string, text: string) => void;
  activePersonaName: string;
  activePersonaRole: string;
}

export function ResidentVotingView({
  requestsInVoting,
  onCastVote,
  onAddComment,
  activePersonaName,
  activePersonaRole,
}: ResidentVotingViewProps) {
  const [selectedRequest, setSelectedRequest] = useState<ResidentRequest | null>(requestsInVoting[0] || null);
  const [commentText, setCommentText] = useState('');

  const isTenant = activePersonaRole.toLowerCase().includes('tenant');
  const activeDetail = selectedRequest ? requestsInVoting.find(r => r.id === selectedRequest.id) || selectedRequest : requestsInVoting[0];

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetail || !commentText.trim()) return;
    onAddComment(activeDetail.id, commentText);
    setCommentText('');
  };

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-full bg-[#F4F6F9] dark:bg-[#0a0a0f]">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B1121] to-[#1E2026] text-white rounded-3xl p-8 shadow-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0055FF]/20 text-[#0055FF] text-xs font-bold uppercase tracking-wider mb-2">
          Resident Hub â€¢ Community Voting
        </div>
        <h1 className="text-2xl font-bold">Requests Currently in Community Voting</h1>
        <p className="text-sm text-gray-300 mt-1">Review active community requests, add comments, and track voting status.</p>

        {isTenant && (
          <div className="mt-4 bg-amber-500/20 border border-amber-500/30 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-amber-200 font-medium">
            <ShieldAlert size={16} className="text-amber-400 shrink-0" />
            <span>Note: You are logged in as a <span className="font-bold text-white">Tenant</span>. Per scheme bylaws, tenants do not have voting eligibility, but can view & comment on requests.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: List of Requests Currently in Voting */}
        <div className="lg:col-span-5 space-y-4 bg-white dark:bg-[#0d1117] rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Active Voting Motions ({requestsInVoting.length})</h3>

          <div className="space-y-3">
            {requestsInVoting.map(req => (
              <button
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className={`w-full text-left p-5 rounded-2xl border transition-all cursor-pointer ${
                  activeDetail?.id === req.id 
                    ? 'bg-[#0B1121] text-white border-black shadow-md' 
                    : 'bg-gray-50 dark:bg-[#1a1d27] border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold uppercase ${activeDetail?.id === req.id ? 'text-[#0055FF]' : 'text-gray-400 dark:text-gray-500'}`}>{req.id} â€¢ {req.unit}</span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${activeDetail?.id === req.id ? 'bg-[#00D4B2] text-[#0B1121]' : 'bg-purple-100 dark:bg-purple-950/20 text-[#0055FF] dark:text-[#6699ff]'}`}>
                    IN VOTING
                  </span>
                </div>
                <h4 className="font-bold text-base mb-1">{req.title}</h4>
                <p className={`text-xs line-clamp-2 ${activeDetail?.id === req.id ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500'}`}>{req.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Selected Request Details, Comments & Ballot */}
        {activeDetail && (
          <div className="lg:col-span-7 bg-white dark:bg-[#0d1117] rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 dark:border-white/5 pb-4">
              <div>
                <span className="text-xs font-bold text-[#0055FF] uppercase tracking-wider">{activeDetail.id} â€¢ {activeDetail.unit}</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{activeDetail.title}</h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/20 text-[#0055FF] dark:text-[#6699ff] text-xs font-bold uppercase">
                IN VOTING
              </span>
            </div>

            {/* Request Summary & Photo */}
            <div className="space-y-3 bg-gray-50 dark:bg-[#1a1d27] p-4 rounded-2xl border border-gray-100 dark:border-white/5 text-xs">
              <div className="font-bold text-gray-900 dark:text-white">Request Description:</div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{activeDetail.description}</p>
            </div>

            {activeDetail.attachmentUrl && (
              <img src={activeDetail.attachmentUrl} alt="Inspection Attachment" className="w-full h-48 object-cover rounded-2xl border border-gray-200 dark:border-white/8 shadow-sm" />
            )}

            {/* Cast Ballot Section (Lot Owners & Residents only) */}
            <div className="bg-[#F4F6F9] dark:bg-[#0a0a0f] p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-gray-900 dark:text-white flex items-center gap-2">
                  <Vote size={18} className="text-[#0055FF]" /> Voting Tally
                </span>
                <span className="text-gray-600 dark:text-gray-300">{activeDetail.votesYes + activeDetail.votesNo} Ballots Cast</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                <div className="bg-[#00D4B2]/10 dark:bg-[#00D4B2]/5 border border-[#00D4B2]/30 dark:border-[#00D4B2]/20 p-3 rounded-xl flex items-center justify-between text-emerald-900 dark:text-emerald-300">
                  <span>YES Votes:</span>
                  <span className="text-base font-black">{activeDetail.votesYes}</span>
                </div>
                <div className="bg-[#FF4757]/10 dark:bg-[#FF4757]/5 border border-[#FF4757]/30 dark:border-[#FF4757]/20 p-3 rounded-xl flex items-center justify-between text-red-900 dark:text-red-300">
                  <span>NO Votes:</span>
                  <span className="text-base font-black">{activeDetail.votesNo}</span>
                </div>
              </div>

              {!isTenant && !activeDetail.userVoted && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => onCastVote(activeDetail.id, 'YES')}
                    className="bg-[#10B981] hover:bg-emerald-600 text-white rounded-2xl py-3 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={16} /> Vote YES
                  </button>
                  <button
                    onClick={() => onCastVote(activeDetail.id, 'NO')}
                    className="bg-[#FF6B6B] hover:bg-red-600 text-white rounded-2xl py-3 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <XCircle size={16} /> Vote NO
                  </button>
                </div>
              )}

              {activeDetail.userVoted && (
                <div className="bg-[#0055FF]/10 border border-blue-200 dark:border-blue-900/30 p-3 rounded-xl text-center text-xs font-bold text-blue-900 dark:text-[#00D4B2] flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={16} className="text-[#00D4B2]" /> Your vote has been logged for this request.
                </div>
              )}
            </div>

            {/* Comments Section (Add Comments flow from Miro diagram) */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5 dark:border-white/5">
              <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={16} className="text-[#0055FF]" /> Discussion & Comments ({activeDetail.comments.length})
              </h4>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {activeDetail.comments.map(c => (
                  <div key={c.id} className="bg-gray-50 dark:bg-[#1a1d27] p-3.5 rounded-2xl border border-gray-100 dark:border-white/5 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white">
                      <span>{c.authorName} ({c.authorRole})</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">{c.createdAt}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleSendComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add a comment to this request..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-[#1a1d27] text-xs outline-none focus:bg-white dark:focus:bg-[#252836]"
                />
                <button type="submit" className="bg-[#0B1121] dark:bg-[#00D4B2]/10 dark:border dark:border-[#00D4B2]/20 hover:bg-black dark:hover:bg-[#00D4B2]/20 text-white dark:text-[#00D4B2] px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                  <Send size={14} /> Post
                </button>
              </form>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

