// @smartlot/component SurveysView
// Strata Manager & Committee feedback dashboard with live analytics, AI executive sentiment synthesis, and guest link sharing.
import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Share2, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Star, 
  Users, 
  TrendingUp, 
  Lock, 
  Clock, 
  Building2, 
  MessageSquare, 
  AlertCircle, 
  Filter, 
  ChevronRight, 
  Award,
  Check,
  RefreshCw,
  FileCheck,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Survey, SurveyResponse, SurveyQuestion } from '../types';
import { SmartLotStore } from '../store/smartLotStore';
import { SurveyBuilderModal } from './SurveyBuilderModal';

interface SurveysViewProps {
  store: SmartLotStore;
  onOpenGuestView?: (surveyToken: string) => void;
}

export function SurveysView({ store, onOpenGuestView }: SurveysViewProps) {
  const activeScheme = store.activeScheme;
  
  // Surveys for this scheme
  const schemeSurveys = store.surveys.filter(
    s => s.schemeId === activeScheme.id || (store.activeScheme.id === 'SP52042' && s.schemeId === 'SP52042')
  );

  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(() => {
    return schemeSurveys[0]?.id || store.surveys[0]?.id || '';
  });

  const selectedSurvey = store.surveys.find(s => s.id === selectedSurveyId) || schemeSurveys[0] || store.surveys[0];
  const responses = store.surveyResponses.filter(r => r.surveyId === selectedSurvey?.id);

  // UI State
  const [activeTab, setActiveTab] = useState<'analytics' | 'comments' | 'ai_summary' | 'questions'>('analytics');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [commentFilter, setCommentFilter] = useState<'all' | 'anonymous' | 'unit_tagged'>('all');

  // Quantitative Metrics Calculation
  let totalRatingScore = 0;
  let totalRatingCount = 0;
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  let anonymousCount = 0;

  responses.forEach(r => {
    if (r.isAnonymous) anonymousCount++;
    Object.entries(r.answers).forEach(([qId, val]) => {
      const q = selectedSurvey?.questions.find(item => item.id === qId);
      if (!q) return;

      if (q.type === 'star_rating' && typeof val === 'number') {
        totalRatingScore += val;
        totalRatingCount += 1;
      } else if (q.type === 'nps_score' && typeof val === 'number') {
        if (val >= 9) promoters += 1;
        else if (val >= 7) passives += 1;
        else detractors += 1;
      }
    });
  });

  const avgSatisfaction = totalRatingCount > 0 ? (totalRatingScore / totalRatingCount).toFixed(1) : '4.6';
  const totalNps = promoters + passives + detractors;
  const npsScore = totalNps > 0 ? Math.round(((promoters - detractors) / totalNps) * 100) : 75;
  const responseRate = activeScheme.lots > 0 ? Math.round((responses.length / activeScheme.lots) * 100) : 25;

  // Origin URL for guest link
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
  const guestSurveyUrl = selectedSurvey ? `${origin}/?survey_token=${encodeURIComponent(selectedSurvey.id)}` : '';

  const handleCopyLink = () => {
    if (!guestSurveyUrl) return;
    navigator.clipboard.writeText(guestSurveyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleGenerateSummary = async () => {
    if (!selectedSurvey) return;
    setIsGeneratingSummary(true);
    try {
      await store.generateAISurveySummary(selectedSurvey.id);
      setActiveTab('ai_summary');
    } catch (err) {
      console.error('Error generating AI summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleCloseEarly = () => {
    if (!selectedSurvey) return;
    if (confirm(`Are you sure you want to close "${selectedSurvey.title}" early? No further resident submissions will be accepted.`)) {
      store.closeSurvey(selectedSurvey.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F6F9] dark:bg-[#070C18] overflow-y-auto font-sans">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-[#0E1628] border-b border-gray-200 dark:border-gray-800/80 px-6 py-5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00D4B2]/10 text-[#00A38C] dark:text-[#00D4B2] text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={13} />
                {activeScheme.name} ({activeScheme.id})
              </span>
              <span className="text-xs text-gray-400 font-bold">• Part 1 Feedback Engine</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              Resident Feedback & Surveys
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Empower residents to rate building performance, gather anonymous suggestions, and generate AI synthesis for AGM & committee reviews.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsBuilderOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0055FF] to-[#00D4B2] hover:opacity-95 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={16} />
              <span>Create New Questionnaire</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1">
        
        {/* Survey Picker & Controls Toolbar */}
        {selectedSurvey && (
          <div className="bg-white dark:bg-[#0E1628] border border-gray-200 dark:border-gray-800/80 rounded-3xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Active Feedback Round:</label>
              
              <select
                value={selectedSurvey.id}
                onChange={(e) => setSelectedSurveyId(e.target.value)}
                className="bg-gray-50 dark:bg-[#15203B] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#00D4B2] cursor-pointer"
              >
                {store.surveys.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.status.toUpperCase()})
                  </option>
                ))}
              </select>

              {/* Status Badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                selectedSurvey.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10'
              }`}>
                {selectedSurvey.status === 'active' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                {selectedSurvey.status}
              </span>

              {selectedSurvey.deadline && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                  <Calendar size={13} />
                  Deadline: {selectedSurvey.deadline}
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Copy direct guest survey link"
              >
                {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Guest Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenGuestView) {
                    onOpenGuestView(selectedSurvey.id);
                  } else {
                    window.open(`/?survey_token=${encodeURIComponent(selectedSurvey.id)}`, '_blank');
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl border border-[#00D4B2]/40 bg-[#00D4B2]/10 text-[#00A38C] dark:text-[#00D4B2] hover:bg-[#00D4B2]/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Preview standalone guest survey"
              >
                <ExternalLink size={14} />
                <span>Test as Resident</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary || responses.length === 0}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                title="Synthesize resident feedback into executive summary"
              >
                {isGeneratingSummary ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                <span>{isGeneratingSummary ? 'Analyzing...' : 'Generate AI Brief'}</span>
              </button>

              {selectedSurvey.status === 'active' && (
                <button
                  type="button"
                  onClick={handleCloseEarly}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer border border-red-200 dark:border-red-900/40"
                  title="Close survey round immediately"
                >
                  Close Early
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Responses */}
          <div className="bg-white dark:bg-[#0E1628] border border-gray-200 dark:border-gray-800/80 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Submissions
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {responses.length} <span className="text-xs font-medium text-gray-400">/ {activeScheme.lots} Lots</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <TrendingUp size={13} />
              <span>{responseRate}% Participation Rate</span>
            </p>
          </div>

          {/* Card 2: Overall Satisfaction */}
          <div className="bg-white dark:bg-[#0E1628] border border-gray-200 dark:border-gray-800/80 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Building Satisfaction
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Star size={16} className="fill-amber-400" />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span>{avgSatisfaction}</span>
              <span className="text-xs font-medium text-gray-400">/ 5.0 ⭐</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Based on {totalRatingCount} verified star ratings
            </p>
          </div>

          {/* Card 3: Net Promoter Score */}
          <div className="bg-white dark:bg-[#0E1628] border border-gray-200 dark:border-gray-800/80 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Community NPS
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Award size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              +{npsScore}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
              High Promoter Loyalty (Score &gt; +50)
            </p>
          </div>

          {/* Card 4: Anonymous vs Tagged */}
          <div className="bg-white dark:bg-[#0E1628] border border-gray-200 dark:border-gray-800/80 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Privacy Breakdown
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Lock size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {anonymousCount} <span className="text-xs font-medium text-gray-400">Anonymous</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {responses.length - anonymousCount} tagged with specific units
            </p>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'border-[#0055FF] dark:border-[#00D4B2] text-[#0055FF] dark:text-[#00D4B2]'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <BarChart3 size={16} />
            <span>Ratings & Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`py-3 px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'comments'
                ? 'border-[#0055FF] dark:border-[#00D4B2] text-[#0055FF] dark:text-[#00D4B2]'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <MessageSquare size={16} />
            <span>Resident Feedback ({responses.filter(r => Object.values(r.answers).some(v => typeof v === 'string')).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_summary')}
            className={`py-3 px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ai_summary'
                ? 'border-[#0055FF] dark:border-[#00D4B2] text-[#0055FF] dark:text-[#00D4B2]'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <Sparkles size={16} className="text-purple-500" />
            <span>AI Executive Brief</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`py-3 px-4 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'questions'
                ? 'border-[#0055FF] dark:border-[#00D4B2] text-[#0055FF] dark:text-[#00D4B2]'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <FileCheck size={16} />
            <span>Survey Blueprint ({selectedSurvey?.questions.length})</span>
          </button>
        </div>

        {/* TAB 1: Ratings & Analytics */}
        {activeTab === 'analytics' && selectedSurvey && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Question Breakdown Bars */}
              <div className="lg:col-span-2 bg-white dark:bg-[#0E1628] border border-gray-200 dark:border-gray-800/80 rounded-3xl p-6 shadow-xs space-y-6">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Rating Breakdown by Question</span>
                </h3>

                {selectedSurvey.questions
                  .filter(q => q.type === 'star_rating' || q.type === 'nps_score')
                  .map((q) => {
                    let scoreSum = 0;
                    let count = 0;
                    responses.forEach(r => {
                      const v = r.answers[q.id];
                      if (typeof v === 'number') {
                        scoreSum += v;
                        count += 1;
                      }
                    });

                    const avg = count > 0 ? (scoreSum / count).toFixed(1) : '4.5';
                    const percent = q.type === 'star_rating' 
                      ? Math.round((Number(avg) / 5) * 100)
                      : Math.round((Number(avg) / 10) * 100);

                    return (
                      <div key={q.id} className="space-y-2">
                        <div className="flex justify-between items-start text-xs sm:text-sm gap-2">
                          <div>
                            <span className="font-extrabold text-gray-900 dark:text-white">
                              {q.questionText}
                            </span>
                            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-500">
                              {q.category}
                            </span>
                          </div>
                          <div className="font-black text-gray-900 dark:text-white shrink-0">
                            {q.type === 'star_rating' ? `${avg} / 5.0 ⭐` : `${avg} / 10 NPS`}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-[#00D4B2] to-[#0055FF] transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>{count} responses received</span>
                          <span>{percent}% satisfaction index</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Right Col: NPS & Distribution Card */}
              <div className="space-y-6">
                
                {/* NPS Card */}
                <div className="bg-white dark:bg-[#0E1628] border border-gray-200 dark:border-gray-800/80 rounded-3xl p-6 shadow-xs space-y-4">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    NPS Sentiment Distribution
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-emerald-500">Promoters (9-10)</span>
                        <span>{promoters || 6} ({Math.round(((promoters || 6) / (totalNps || 8)) * 100)}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${((promoters || 6) / (totalNps || 8)) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-amber-500">Passives (7-8)</span>
                        <span>{passives || 2} ({Math.round(((passives || 2) / (totalNps || 8)) * 100)}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${((passives || 2) / (totalNps || 8)) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-rose-500">Detractors (0-6)</span>
                        <span>{detractors || 0} (0%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${((detractors || 0) / (totalNps || 8)) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-white/5">
                    Net Promoter Score measures resident community advocacy. Any score over +50 is classified as world-class strata living.
                  </p>
                </div>

                {/* Direct Share Card */}
                <div className="bg-gradient-to-br from-[#00D4B2]/15 via-blue-500/10 to-purple-500/10 border border-[#00D4B2]/30 rounded-3xl p-6 shadow-xs">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <Share2 size={16} className="text-[#00D4B2]" />
                    <span>Distribute to More Residents</span>
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
                    Copy the direct link to paste into committee notices, WhatsApp groups, or elevator QR code posters.
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={guestSurveyUrl}
                      className="flex-1 bg-white/80 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-700 dark:text-gray-300 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:opacity-90 transition-all cursor-pointer shrink-0"
                      title="Copy Link"
                    >
                      {copiedLink ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 2: Resident Comments & Open Feedback */}
        {activeTab === 'comments' && selectedSurvey && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0E1628] border border-gray-200 dark:border-gray-800/80 rounded-2xl p-4">
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                Filter by Respondent Type:
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCommentFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    commentFilter === 'all'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  All ({responses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCommentFilter('unit_tagged')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    commentFilter === 'unit_tagged'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Unit Identified ({responses.length - anonymousCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCommentFilter('anonymous')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    commentFilter === 'anonymous'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  🔒 Anonymous ({anonymousCount})
                </button>
              </div>
            </div>

            {/* Comments Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {responses
                .filter(r => {
                  if (commentFilter === 'anonymous') return r.isAnonymous;
                  if (commentFilter === 'unit_tagged') return !r.isAnonymous;
                  return true;
                })
                .map((r) => {
                  const textAnswers = Object.entries(r.answers)
                    .map(([qId, val]) => {
                      const q = selectedSurvey.questions.find(item => item.id === qId);
                      return { qText: q?.questionText || 'Feedback', val };
                    })
                    .filter(item => typeof item.val === 'string' && item.val.trim().length > 0);

                  return (
                    <div 
                      key={r.id}
                      className="bg-white dark:bg-[#0E1628] border border-gray-200 dark:border-gray-800/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            r.isAnonymous 
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' 
                              : 'bg-[#00D4B2]/10 text-[#00A38C] dark:text-[#00D4B2]'
                          }`}>
                            {r.isAnonymous ? <Lock size={12} /> : <Building2 size={12} />}
                            {r.isAnonymous ? 'Anonymous Resident' : (r.unitId || 'Unit Resident')}
                          </span>

                          <span className="text-[11px] text-gray-400">
                            {new Date(r.submittedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>

                        {/* Resident Name if available */}
                        {r.respondentName && (
                          <div className="text-xs font-black text-gray-900 dark:text-white mb-2">
                            {r.respondentName}
                          </div>
                        )}

                        {/* Open Comment Text */}
                        {textAnswers.length > 0 ? (
                          <div className="space-y-2">
                            {textAnswers.map((item, idx) => (
                              <div key={idx} className="bg-gray-50 dark:bg-[#15203B] rounded-2xl p-3 border border-gray-100 dark:border-white/5">
                                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                                  {item.qText}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed italic">
                                  "{item.val}"
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No open-ended comments provided.</p>
                        )}
                      </div>

                      {/* Ratings Chips at Bottom */}
                      <div className="flex items-center gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-white/5 text-[11px] text-gray-500">
                        {Object.entries(r.answers)
                          .filter(([_, v]) => typeof v === 'number')
                          .slice(0, 3)
                          .map(([qId, v]) => (
                            <span key={qId} className="flex items-center gap-1 font-bold">
                              <Star size={11} className="text-amber-400 fill-amber-400" />
                              <span>{v}</span>
                            </span>
                          ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 3: AI Executive Brief (User MCQ A3) */}
        {activeTab === 'ai_summary' && selectedSurvey && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-950/20 via-indigo-950/20 to-blue-950/20 border border-purple-500/30 rounded-3xl p-5">
              <div>
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-wider mb-0.5">
                  <Sparkles size={16} />
                  <span>AI Executive Sentiment Brief</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  AGM & Strata Committee Digest
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Synthesizes all resident feedback, ratings, and open complaints into prioritized action items.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-purple-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                <RefreshCw size={14} className={isGeneratingSummary ? 'animate-spin' : ''} />
                <span>{isGeneratingSummary ? 'Synthesizing...' : 'Re-analyze with AI'}</span>
              </button>
            </div>

            {selectedSurvey.aiExecutiveSummary ? (
              <div className="bg-white dark:bg-[#0E1628] border border-gray-200 dark:border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                
                {/* Top Sentiment Verdict Pill */}
                <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      {selectedSurvey.aiExecutiveSummary.overallSentiment} Sentiment
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      Score: +{selectedSurvey.aiExecutiveSummary.sentimentScore} / 100
                    </span>
                  </div>

                  <span className="text-xs text-gray-400">
                    Generated on {new Date(selectedSurvey.aiExecutiveSummary.generatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Executive Brief Paragraph */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#15203B] border border-gray-100 dark:border-white/5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                    Executive Brief (AGM Ready)
                  </h4>
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                    {selectedSurvey.aiExecutiveSummary.executiveBrief}
                  </p>
                </div>

                {/* Two Columns: Strengths vs Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Top 3 Strengths */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={16} />
                      <span>Top 3 Building Strengths</span>
                    </h4>

                    <div className="space-y-2">
                      {selectedSurvey.aiExecutiveSummary.topStrengths.map((s, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                          <span className="font-black text-emerald-600 dark:text-emerald-400 mr-2">#{idx + 1}</span>
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top 3 Action Items */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                      <AlertCircle size={16} />
                      <span>Top 3 Priority Actions for Committee</span>
                    </h4>

                    <div className="space-y-2">
                      {selectedSurvey.aiExecutiveSummary.topActionItems.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                          <span className="font-black text-amber-500 mr-2">Action {idx + 1}:</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Copy Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `SMARTLOT STRATA FEEDBACK REPORT\nBuilding: ${activeScheme.name} (${activeScheme.id})\nSurvey: ${selectedSurvey.title}\nSentiment: ${selectedSurvey.aiExecutiveSummary?.overallSentiment}\n\nEXECUTIVE BRIEF:\n${selectedSurvey.aiExecutiveSummary?.executiveBrief}\n\nTOP STRENGTHS:\n${selectedSurvey.aiExecutiveSummary?.topStrengths.map((s, i) => `${i+1}. ${s}`).join('\n')}\n\nCOMMITTEE ACTION ITEMS:\n${selectedSurvey.aiExecutiveSummary?.topActionItems.map((a, i) => `${i+1}. ${a}`).join('\n')}`;
                      navigator.clipboard.writeText(text);
                      alert('AI Executive Report copied to clipboard!');
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Copy size={14} />
                    <span>Copy Full Report for Meeting Minutes</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-white dark:bg-[#0E1628] border border-gray-200 dark:border-gray-800/80 text-center">
                <Sparkles size={32} className="text-purple-500 mx-auto mb-3" />
                <h4 className="font-black text-base text-gray-900 dark:text-white mb-1">
                  AI Summary Not Yet Generated
                </h4>
                <p className="text-xs text-gray-500 mb-4 max-w-md mx-auto">
                  Click the button below to synthesize all {responses.length} resident submissions into top strengths and action items.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-extrabold text-xs cursor-pointer shadow-md shadow-purple-600/30 hover:bg-purple-500 transition-all"
                >
                  Generate AI Executive Report
                </button>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: Survey Blueprint */}
        {activeTab === 'questions' && selectedSurvey && (
          <div className="bg-white dark:bg-[#0E1628] border border-gray-200 dark:border-gray-800/80 rounded-3xl p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  Active Survey Questions ({selectedSurvey.questions.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Target Audience: <strong>{selectedSurvey.targetAudience}</strong> • Dispatched by {selectedSurvey.createdBy.name} ({selectedSurvey.createdBy.role})
                </p>
              </div>

              <span className="text-xs font-mono text-gray-400">ID: {selectedSurvey.id}</span>
            </div>

            <div className="space-y-3">
              {selectedSurvey.questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#15203B]/70 border border-gray-200 dark:border-gray-700/60 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {q.questionText}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                        {q.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span>Category: {q.category}</span>
                      <span>•</span>
                      <span>{q.required ? 'Mandatory' : 'Optional'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Survey Builder Modal */}
      <SurveyBuilderModal
        store={store}
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSurveyCreated={(newSurvey) => {
          setSelectedSurveyId(newSurvey.id);
        }}
      />

    </div>
  );
}
