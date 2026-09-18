// @smartlot/component QuestionDetailModal
// Deep-dive analysis and full individual responses roster for a specific survey question.
import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Star, 
  Users, 
  Building2, 
  Lock, 
  CheckCircle2, 
  ListFilter, 
  MessageSquare, 
  BarChart3, 
  Award, 
  Search, 
  Copy, 
  Check, 
  Filter,
  ArrowUpDown,
  Sparkles,
  Info
} from 'lucide-react';
import { SurveyQuestion, SurveyResponse } from '../types';

interface QuestionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: SurveyQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  responses: SurveyResponse[];
  allQuestions?: SurveyQuestion[];
}

export function QuestionDetailModal({
  isOpen,
  onClose,
  question,
  questionIndex,
  totalQuestions,
  responses,
  allQuestions = []
}: QuestionDetailModalProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'unit_identified' | 'anonymous'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Question Category Badge Colors
  const getCategoryBadgeColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'management performance':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25';
      case 'building & cleanliness':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25';
      case 'building facilities':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25';
      case 'parking & by-laws':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25';
      case 'community nps':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25';
      default:
        return 'bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] border border-[#00D4B2]/25';
    }
  };

  // Extract all valid answers for this question
  const answeredResponses = useMemo(() => {
    if (!question) return [];
    return responses.filter(r => {
      const val = r.answers[question.id];
      return val !== undefined && val !== null && val !== '';
    });
  }, [question, responses]);

  // Statistics calculation for this question
  const stats = useMemo(() => {
    if (!question) return { count: 0, avg: '0.0', satisfactionPct: 0, distribution: {} };

    const totalAnswered = answeredResponses.length;
    let sum = 0;
    const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const npsScores = { promoters: 0, passives: 0, detractors: 0 };
    const npsFreq: Record<number, number> = {};
    for (let i = 0; i <= 10; i++) npsFreq[i] = 0;

    const choiceOptions = (Array.isArray(question.options) && question.options.length > 0) 
      ? question.options 
      : ['Yes', 'No', 'Neutral'];
    const choiceCounts: Record<string, number> = {};
    choiceOptions.forEach(opt => { choiceCounts[opt] = 0; });
    let totalChoicesVoted = 0;

    answeredResponses.forEach(r => {
      const val = r.answers[question.id];
      if (typeof val === 'number') {
        sum += val;
        if (question.type === 'star_rating') {
          const rounded = Math.min(5, Math.max(1, Math.round(val)));
          starCounts[rounded] = (starCounts[rounded] || 0) + 1;
        } else if (question.type === 'nps_score') {
          const score = Math.min(10, Math.max(0, Math.round(val)));
          npsFreq[score] = (npsFreq[score] || 0) + 1;
          if (score >= 9) npsScores.promoters += 1;
          else if (score >= 7) npsScores.passives += 1;
          else npsScores.detractors += 1;
        }
      } else if (typeof val === 'string' && (question.type === 'single_choice' || question.type === 'multi_choice')) {
        choiceCounts[val] = (choiceCounts[val] || 0) + 1;
        totalChoicesVoted += 1;
      } else if (Array.isArray(val) && (question.type === 'single_choice' || question.type === 'multi_choice')) {
        val.forEach(v => {
          choiceCounts[v] = (choiceCounts[v] || 0) + 1;
          totalChoicesVoted += 1;
        });
      }
    });

    const avg = totalAnswered > 0 ? (sum / totalAnswered).toFixed(1) : '0.0';
    const satisfactionPct = question.type === 'star_rating'
      ? Math.round((Number(avg) / 5) * 100)
      : question.type === 'nps_score'
        ? Math.round((Number(avg) / 10) * 100)
        : 0;

    return {
      totalAnswered,
      sum,
      avg,
      satisfactionPct,
      starCounts,
      npsScores,
      npsFreq,
      choiceCounts,
      choiceOptions,
      totalChoicesVoted
    };
  }, [question, answeredResponses]);

  // Filtered responses based on search and privacy filter
  const filteredResponses = useMemo(() => {
    return answeredResponses.filter(r => {
      // Privacy Mode Filter
      if (filterMode === 'anonymous' && !r.isAnonymous) return false;
      if (filterMode === 'unit_identified' && r.isAnonymous) return false;

      // Text / Unit search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const unitMatch = r.unitId?.toLowerCase().includes(query);
        const nameMatch = r.respondentName?.toLowerCase().includes(query);
        const answerVal = String(r.answers[question?.id || ''] || '').toLowerCase();
        const answerMatch = answerVal.includes(query);
        return unitMatch || nameMatch || answerMatch;
      }

      return true;
    });
  }, [answeredResponses, filterMode, searchQuery, question]);

  const handleCopyResponse = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 font-sans">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 pb-4 border-b border-gray-100 dark:border-white/10 shrink-0 bg-white/80 dark:bg-[#070E1F]/90 backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            
            <div className="space-y-2 flex-1 min-w-0">
              {/* Category & Type Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black font-mono tracking-wider px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                  QUESTION {String(questionIndex + 1).padStart(2, '0')} OF {String(totalQuestions).padStart(2, '0')}
                </span>

                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getCategoryBadgeColor(question.category)}`}>
                  {question.category}
                </span>

                {question.type === 'star_rating' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    <Star size={11} className="fill-amber-400" /> 5-Star Rating Scale
                  </span>
                )}

                {question.type === 'nps_score' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
                    <Award size={11} /> Net Promoter Score (0 - 10)
                  </span>
                )}

                {question.type === 'single_choice' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                    <CheckCircle2 size={11} /> Single Choice Selection
                  </span>
                )}

                {question.type === 'multi_choice' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                    <ListFilter size={11} /> Multi-Choice Checkboxes
                  </span>
                )}

                {(question.type === 'text_feedback' || (question.type as string) === 'text') && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-[#00897B] dark:text-[#00D4B2] border border-[#00D4B2]/20">
                    <MessageSquare size={11} /> Open-Ended Feedback
                  </span>
                )}
              </div>

              {/* Large, High-Contrast Question Text (Effortlessly readable for all ages) */}
              <h2 className="text-base sm:text-xl md:text-2xl font-sans font-black text-gray-900 dark:text-white leading-snug tracking-tight">
                {question.questionText}
              </h2>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 overscroll-contain">
          
          {/* 1. Metric Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            
            {/* Metric 1: Total Responses */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-50 dark:bg-[#060B18] border border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                <Users size={14} className="text-blue-500" />
                <span>Responses Logged</span>
              </div>
              <div className="text-xl sm:text-2xl font-sans font-black text-gray-900 dark:text-white">
                {stats.totalAnswered}
                <span className="text-xs font-medium text-gray-400 ml-1.5">
                  / {responses.length} submissions
                </span>
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {responses.length > 0 ? `${Math.round((stats.totalAnswered / responses.length) * 100)}% question completion` : 'Awaiting data'}
              </div>
            </div>

            {/* Metric 2: Primary Score / Top Choice */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-50 dark:bg-[#060B18] border border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                {question.type === 'star_rating' ? (
                  <>
                    <Star size={14} className="fill-amber-400 text-amber-500" />
                    <span>Average Star Score</span>
                  </>
                ) : question.type === 'nps_score' ? (
                  <>
                    <Award size={14} className="text-cyan-500" />
                    <span>Average Score (0-10)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>Total Choice Votes</span>
                  </>
                )}
              </div>

              <div className="text-xl sm:text-2xl font-sans font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                {question.type === 'star_rating' ? (
                  <>
                    <span className="text-amber-500 dark:text-amber-400">★ {stats.totalAnswered > 0 ? stats.avg : '--'}</span>
                    <span className="text-xs font-medium text-gray-400">/ 5.0</span>
                  </>
                ) : question.type === 'nps_score' ? (
                  <>
                    <span className="text-cyan-600 dark:text-cyan-400">{stats.totalAnswered > 0 ? stats.avg : '--'}</span>
                    <span className="text-xs font-medium text-gray-400">/ 10</span>
                  </>
                ) : (
                  <span>{stats.totalChoicesVoted} Votes</span>
                )}
              </div>

              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {question.type === 'star_rating' || question.type === 'nps_score' 
                  ? `${stats.satisfactionPct}% resident satisfaction rate`
                  : 'Based on verified choices'}
              </div>
            </div>

            {/* Metric 3: Sentiment Verdict */}
            <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-2xl bg-gray-50 dark:bg-[#060B18] border border-gray-200 dark:border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                <Sparkles size={14} className="text-[#00897B] dark:text-[#00D4B2]" />
                <span>Overall Status</span>
              </div>

              <div className="text-base sm:text-lg font-sans font-black text-gray-900 dark:text-white truncate">
                {stats.totalAnswered === 0 ? (
                  'Awaiting Responses'
                ) : question.type === 'star_rating' ? (
                  Number(stats.avg) >= 4.0 ? 'Highly Commended' : Number(stats.avg) >= 3.0 ? 'Acceptable' : 'Requires Focus'
                ) : question.type === 'nps_score' ? (
                  stats.npsScores.promoters >= stats.npsScores.detractors ? 'Positive Advocate' : 'Detractor Heavy'
                ) : (
                  'Active Feedback'
                )}
              </div>

              <div className="text-[11px] font-semibold text-[#00897B] dark:text-[#00D4B2] mt-0.5 truncate">
                {stats.totalAnswered > 0 ? 'Verified Strata Round' : 'No records yet'}
              </div>
            </div>

          </div>

          {/* 2. Visual Distribution Breakdown */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/70 dark:bg-[#060B18]/60 border border-gray-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-sans font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 size={16} className="text-[#00897B] dark:text-[#00D4B2]" />
                <span>Response Distribution</span>
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {stats.totalAnswered} Total Responses
              </span>
            </div>

            {/* A. 5-Star Breakdown */}
            {question.type === 'star_rating' && (
              <div className="space-y-2 pt-1">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = stats.starCounts[stars] || 0;
                  const pct = stats.totalAnswered > 0 ? Math.round((count / stats.totalAnswered) * 100) : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="w-16 font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 shrink-0">
                        <span>{stars}</span>
                        <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                      </span>

                      <div className="flex-1 h-3 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-amber-400 dark:bg-amber-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <span className="w-20 text-right font-bold text-gray-900 dark:text-white shrink-0 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* B. NPS Distribution */}
            {question.type === 'nps_score' && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-cyan-500/10 border border-emerald-200 dark:border-cyan-500/20">
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-cyan-300">Promoters (9-10)</div>
                    <div className="text-lg font-black text-emerald-800 dark:text-cyan-200">
                      {stats.npsScores.promoters} <span className="text-xs font-normal">({stats.totalAnswered > 0 ? Math.round((stats.npsScores.promoters / stats.totalAnswered) * 100) : 0}%)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Passives (7-8)</div>
                    <div className="text-lg font-black text-amber-800 dark:text-amber-200">
                      {stats.npsScores.passives} <span className="text-xs font-normal">({stats.totalAnswered > 0 ? Math.round((stats.npsScores.passives / stats.totalAnswered) * 100) : 0}%)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                    <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">Detractors (0-6)</div>
                    <div className="text-lg font-black text-rose-800 dark:text-rose-200">
                      {stats.npsScores.detractors} <span className="text-xs font-normal">({stats.totalAnswered > 0 ? Math.round((stats.npsScores.detractors / stats.totalAnswered) * 100) : 0}%)</span>
                    </div>
                  </div>
                </div>

                {/* Score Frequency 0 - 10 */}
                <div className="flex items-end justify-between gap-1 pt-2 h-20 border-t border-gray-200/60 dark:border-white/5">
                  {Array.from({ length: 11 }, (_, i) => i).map((num) => {
                    const count = stats.npsFreq[num] || 0;
                    const heightPct = stats.totalAnswered > 0 ? Math.max(12, Math.round((count / stats.totalAnswered) * 100)) : 12;
                    const isPromoter = num >= 9;
                    const isPassive = num >= 7 && num <= 8;
                    return (
                      <div key={num} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <div 
                          className={`w-full rounded-t transition-all ${
                            count > 0 
                              ? (isPromoter ? 'bg-cyan-400' : isPassive ? 'bg-amber-400' : 'bg-rose-400')
                              : 'bg-gray-200 dark:bg-white/10'
                          }`}
                          style={{ height: count > 0 ? `${heightPct}%` : '8%' }}
                          title={`Score ${num}: ${count} votes`}
                        />
                        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{num}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* C. Choice Breakdown */}
            {(question.type === 'single_choice' || question.type === 'multi_choice') && (
              <div className="space-y-2.5 pt-1">
                {stats.choiceOptions.map((opt) => {
                  const count = stats.choiceCounts[opt] || 0;
                  const pct = stats.totalChoicesVoted > 0 ? Math.round((count / stats.totalChoicesVoted) * 100) : 0;
                  return (
                    <div key={opt} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                          <CheckCircle2 size={12} className={count > 0 ? 'text-[#00897B] dark:text-[#00D4B2]' : 'text-gray-400'} />
                          <span>{opt}</span>
                        </span>
                        <span className="font-mono font-bold text-gray-900 dark:text-white">
                          {count} votes ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-[#00897B] dark:bg-[#00D4B2] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* D. Open Text Summary */}
            {(question.type === 'text_feedback' || (question.type as string) === 'text') && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Info size={16} className="shrink-0" />
                <span>
                  This is an open-ended feedback question. Review the individual verbatim responses submitted by residents below.
                </span>
              </div>
            )}

          </div>

          {/* 3. Individual Submissions Roster */}
          <div className="space-y-3">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-sans font-black text-gray-900 dark:text-white">
                  Individual Resident Submissions ({filteredResponses.length})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Detailed responses recorded for this question during this survey round
                </p>
              </div>

              {/* Filters & Search Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search unit or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-7 pr-2.5 rounded-xl bg-gray-50 dark:bg-[#060B18] border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#00D4B2]"
                  />
                </div>

                {/* Filter Pill: All */}
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`h-8 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15]'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  All ({answeredResponses.length})
                </button>

                {/* Filter Pill: Unit Identified */}
                <button
                  type="button"
                  onClick={() => setFilterMode('unit_identified')}
                  className={`h-8 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterMode === 'unit_identified'
                      ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15]'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Identified ({answeredResponses.filter(r => !r.isAnonymous).length})
                </button>

                {/* Filter Pill: Anonymous */}
                <button
                  type="button"
                  onClick={() => setFilterMode('anonymous')}
                  className={`h-8 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterMode === 'anonymous'
                      ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15]'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Anonymous ({answeredResponses.filter(r => r.isAnonymous).length})
                </button>
              </div>
            </div>

            {/* List of Responses */}
            {filteredResponses.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-gray-50 dark:bg-[#060B18] border border-gray-200 dark:border-white/5">
                <Users size={28} className="text-gray-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  No responses matching this filter.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredResponses.map((r) => {
                  const val = r.answers[question.id];
                  const formattedDate = new Date(r.submittedAt).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  // Look for any accompanying open-ended comments in this submission for context
                  const otherRemarks = Object.entries(r.answers)
                    .filter(([qId, textVal]) => qId !== question.id && typeof textVal === 'string' && textVal.trim().length > 0)
                    .map(([qId, textVal]) => {
                      const otherQ = allQuestions.find(item => item.id === qId);
                      return { prompt: otherQ?.questionText || 'Feedback', comment: textVal as string };
                    });

                  return (
                    <div 
                      key={r.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#060B18] border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all shadow-xs space-y-3"
                    >
                      {/* Top Header: Submitter & Date */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            r.isAnonymous
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                              : 'bg-[#00D4B2]/10 text-[#00897B] dark:text-[#00D4B2] border border-[#00D4B2]/20'
                          }`}>
                            {r.isAnonymous ? <Lock size={12} /> : <Building2 size={12} />}
                            {r.isAnonymous ? 'Anonymous Resident' : (r.unitId || 'Unit Identified')}
                          </span>

                          {r.respondentName && !r.isAnonymous && (
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 hidden sm:inline">
                              • {r.respondentName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">
                            {formattedDate}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopyResponse(r.id, `${r.unitId || 'Anonymous'}: ${String(val)}`)}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                            title="Copy response details"
                          >
                            {copiedId === r.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>

                      {/* Submitted Answer Display (Format-Specific) */}
                      <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5">
                        
                        {/* 1. Star Rating Display */}
                        {question.type === 'star_rating' && typeof val === 'number' && (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((starIdx) => (
                                <Star
                                  key={starIdx}
                                  size={16}
                                  className={
                                    starIdx <= val
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-gray-200 dark:fill-gray-700 text-gray-300 dark:text-gray-600'
                                  }
                                />
                              ))}
                              <span className="text-sm font-sans font-black text-gray-900 dark:text-white ml-2">
                                {val}.0 / 5.0
                              </span>
                            </div>

                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                              {val === 5 ? 'Excellent' : val === 4 ? 'Good' : val === 3 ? 'Neutral' : val === 2 ? 'Poor' : 'Very Poor'}
                            </span>
                          </div>
                        )}

                        {/* 2. NPS Rating Display */}
                        {question.type === 'nps_score' && typeof val === 'number' && (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Score:</span>
                              <span className="text-base font-sans font-black text-gray-900 dark:text-white bg-white dark:bg-white/10 px-2.5 py-0.5 rounded-lg border border-gray-200 dark:border-white/10">
                                {val} / 10
                              </span>
                            </div>

                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              val >= 9 
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                                : val >= 7
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25'
                                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25'
                            }`}>
                              {val >= 9 ? 'Promoter' : val >= 7 ? 'Passive' : 'Detractor'}
                            </span>
                          </div>
                        )}

                        {/* 3. Single / Multi Choice Display */}
                        {(question.type === 'single_choice' || question.type === 'multi_choice') && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Selected:</span>
                            {Array.isArray(val) ? (
                              val.map((item, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-[#00D4B2]/10 text-[#00897B] dark:text-[#00D4B2] border border-[#00D4B2]/25">
                                  <Check size={12} className="stroke-[3]" />
                                  <span>{String(item)}</span>
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-[#00D4B2]/10 text-[#00897B] dark:text-[#00D4B2] border border-[#00D4B2]/25">
                                <Check size={12} className="stroke-[3]" />
                                <span>{String(val)}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* 4. Text Display */}
                        {(question.type === 'text_feedback' || (question.type as string) === 'text') && (
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed italic">
                            "{String(val)}"
                          </p>
                        )}

                      </div>

                      {/* If resident left an open-ended remark in the same survey round, display for context */}
                      {otherRemarks.length > 0 && question.type !== 'text_feedback' && (question.type as string) !== 'text' && (
                        <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <MessageSquare size={11} className="text-[#00897B] dark:text-[#00D4B2]" />
                            <span>Accompanying Feedback from {r.unitId || 'Resident'}:</span>
                          </span>
                          {otherRemarks.map((rem, remIdx) => (
                            <div key={remIdx} className="text-xs text-gray-600 dark:text-gray-300 italic pl-2 border-l-2 border-[#00897B]/40 dark:border-[#00D4B2]/40 py-0.5">
                              "{rem.comment}"
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* Footer Action Bar */}
        <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-white/10 shrink-0 bg-gray-50/90 dark:bg-[#070E1F]/90 flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Showing <span className="font-bold text-gray-800 dark:text-gray-200">{filteredResponses.length}</span> of {answeredResponses.length} recorded answers
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Done
          </button>
        </div>

      </div>

    </div>
  );
}
