import React from 'react';
import { Motion, MotionVote } from '../store/smartLotStore';
import { 
  Vote, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Clock
} from 'lucide-react';

interface VotingViewProps {
  motions: Motion[];
  onCastBallot: (motionId: string, vote: MotionVote) => void;
  activePersonaRole: string;
  activePersonaName: string;
}

export function VotingView({ motions, onCastBallot, activePersonaName }: VotingViewProps) {
  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-full bg-[#F4F6F9]">
      
      {/* Clean Header Banner */}
      <div className="bg-gradient-to-r from-[#0B1121] to-[#1E2026] text-white rounded-3xl p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0055FF]/20 text-[#0055FF] text-xs font-bold uppercase tracking-wider mb-3">
            Day 1 Committee Access Gate
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Strata Committee Voting Engine</h1>
          <p className="text-sm text-gray-300 leading-relaxed">
            Review formal motions, compare contractor quotes ex GST, track live scheme quorum, and cast digital ballots.
          </p>
        </div>
      </div>

      {/* Motions Grid */}
      <div className="space-y-6">
        {motions.map(motion => {
          const yesVotes = motion.ballots.filter(b => b.vote === 'YES').length;
          const noVotes = motion.ballots.filter(b => b.vote === 'NO').length;
          const abstainVotes = motion.ballots.filter(b => b.vote === 'ABSTAIN').length;
          const totalVotes = motion.ballots.length;
          const quorumProgress = Math.min(100, Math.round((totalVotes / motion.quorumTarget) * 100));
          const hasVoted = motion.ballots.some(b => b.voterName === activePersonaName);

          return (
            <div key={motion.id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 relative overflow-hidden">
              
              {/* Header status bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-[#0055FF] uppercase tracking-wider">{motion.id} • Linked Case {motion.caseId}</span>
                    {motion.status === 'passed' && (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#10B981] text-xs font-extrabold uppercase">
                        MOTION PASSED
                      </span>
                    )}
                    {motion.status === 'active' && (
                      <span className="px-3 py-1 rounded-full bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/20 text-xs font-extrabold uppercase">
                        VOTING ACTIVE
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{motion.title}</h2>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200">
                  <Clock size={16} className="text-[#FF6B6B]" />
                  <span>{motion.deadline}</span>
                </div>
              </div>

              {/* Problem Summary */}
              <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="font-bold text-gray-900">Problem Summary: </span>
                {motion.summary}
              </p>

              {/* Contractor Quote Comparison Cards ($1,400 vs $1,650 ex GST) */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Attached Contractor Quotes (Comparison)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {motion.quotes.map(quote => (
                    <div 
                      key={quote.vendorId}
                      className={`p-5 rounded-2xl border transition-all ${
                        quote.recommended 
                          ? 'bg-[#00D4B2]/10/40 border-[#00D4B2]/30 ring-1 ring-emerald-300' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-900">{quote.vendorName}</span>
                        {quote.recommended && (
                          <span className="bg-[#10B981] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-gray-900">${quote.amount.toLocaleString()}</span>
                        <span className="text-xs font-semibold text-gray-500">ex GST</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Quorum Meter */}
              <div className="bg-[#F4F6F9] p-6 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-gray-900 flex items-center gap-2">
                    <Vote size={18} className="text-[#0055FF]" /> Live Quorum Meter
                  </span>
                  <span className="text-gray-600">{totalVotes} / {motion.quorumTarget} Committee Votes ({quorumProgress}%)</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#0055FF] to-[#10B981] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${quorumProgress}%` }}
                  />
                </div>

                <div className="flex items-center gap-6 text-xs font-semibold text-gray-500 pt-1">
                  <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#10B981]" /> {yesVotes} YES</span>
                  <span className="flex items-center gap-1.5"><XCircle size={14} className="text-[#FF6B6B]" /> {noVotes} NO</span>
                  <span className="flex items-center gap-1.5"><MinusCircle size={14} className="text-gray-400" /> {abstainVotes} ABSTAIN</span>
                </div>
              </div>

              {/* Digital Ballot Controls */}
              {motion.status === 'active' && (
                <div className="pt-4 border-t border-gray-100">
                  {hasVoted ? (
                    <div className="bg-[#0055FF]/10 border border-blue-100 p-4 rounded-2xl text-center text-sm font-bold text-blue-900 flex items-center justify-center gap-2">
                      <CheckCircle2 size={18} className="text-[#0033CC]" /> Your Digital Ballot has been securely logged for this motion.
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Cast Your Digital Ballot</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => onCastBallot(motion.id, 'YES')}
                          className="bg-[#10B981] hover:bg-emerald-600 text-white rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02]"
                        >
                          <CheckCircle2 size={18} /> Vote YES
                        </button>

                        <button
                          onClick={() => onCastBallot(motion.id, 'NO')}
                          className="bg-[#FF6B6B] hover:bg-red-600 text-white rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02]"
                        >
                          <XCircle size={18} /> Vote NO
                        </button>

                        <button
                          onClick={() => onCastBallot(motion.id, 'ABSTAIN')}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          <MinusCircle size={18} /> ABSTAIN
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Auto-Resolution Banner */}
              {motion.status === 'passed' && (
                <div className="bg-[#00D4B2]/10 border border-[#00D4B2]/30 p-5 rounded-2xl flex items-center justify-between text-emerald-900">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">Quorum Reached & Motion Passed Automatically</div>
                      <div className="text-xs text-emerald-700">Digital Work Order <span className="font-bold">{motion.createdWorkOrderId}</span> was auto-generated and dispatched to contractor.</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
