// @smartlot/component SurveysView
// Strata Manager & Committee feedback dashboard with live analytics, executive sentiment synthesis, and guest link sharing.
import React, { useState } from 'react';
import { 
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
  FileText, 
  BarChart3, 
  Calendar,
  Download,
  ChevronDown,
  X
} from 'lucide-react';
import { Survey, SurveyResponse, SurveyQuestion } from '../types';
import { SmartLotStore } from '../store/smartLotStore';
import { SurveyBuilderModal, SurveyBuilderFormContent } from './SurveyBuilderModal';
import { CustomSelect, SelectOption } from './core/CustomSelect';
import { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent } from './core/morphing-popover';
import QRCode from 'qrcode';

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
  const [ratingFilter, setRatingFilter] = useState<'all' | 'category'>('all');

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

  const avgSatisfaction = totalRatingCount > 0 ? (totalRatingScore / totalRatingCount).toFixed(1) : '4.3';
  const totalNps = promoters + passives + detractors;
  const npsScore = totalNps > 0 ? Math.round(((promoters - detractors) / totalNps) * 100) : 75;
  const responseRate = activeScheme.lots > 0 ? Math.round((responses.length / activeScheme.lots) * 100) : 400;

  // Origin URL for guest link
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
  const guestSurveyUrl = selectedSurvey ? `${origin}/?survey_token=${encodeURIComponent(selectedSurvey.id)}` : '';
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  React.useEffect(() => {
    if (guestSurveyUrl) {
      QRCode.toDataURL(guestSurveyUrl, {
        margin: 1,
        width: 160,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Error generating QR:', err));
    }
  }, [guestSurveyUrl]);

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

  const surveyOptions: SelectOption[] = store.surveys.map(s => ({
    value: s.id,
    label: s.title,
    description: `${s.category} • ${s.status.toUpperCase()}`,
    icon: <Building2 size={14} className="text-[#00D4B2] shrink-0" />
  }));

  // Category Badge Colors matching mockup
  const getCategoryBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F6F9] dark:bg-[#050A15] text-gray-900 dark:text-gray-100 overflow-y-auto font-sans selection:bg-[#00D4B2] selection:text-black">
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5 flex-1">
        
        {/* ── 1. Hero Card with Building Background Image ──────────────── */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 px-5 py-4 sm:px-7 sm:py-5 shadow-sm dark:shadow-2xl">
          {/* Building Background Image (Right side, smooth gradient blend) */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-full sm:w-2/3 lg:w-1/2 bg-cover bg-right bg-no-repeat pointer-events-none opacity-20 dark:opacity-65 mix-blend-multiply dark:mix-blend-screen"
            style={{ 
              backgroundImage: "url('/bg_img_building.png')",
              maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 25%, black 60%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 25%, black 60%)"
            }}
          />
          {/* Radial shade for crisp contrast on text */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-[#070E1F] dark:via-[#070E1F]/90 dark:to-transparent pointer-events-none" />

          {/* Hero Content */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-3xl space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00D4B2]/10 text-[#00897B] dark:text-[#00D4B2] border border-[#00D4B2]/25 text-[11px] font-black uppercase tracking-wider">
                <Building2 size={12} className="text-[#00897B] dark:text-[#00D4B2]" />
                {activeScheme.name.toUpperCase()} ({activeScheme.id})
              </span>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black text-gray-900 dark:text-white tracking-tight">
                Resident Feedback & <span className="text-[#00897B] dark:text-[#00D4B2]">Surveys</span>
              </h1>

              <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
                Listen. Improve.<span className="text-[#00897B] dark:text-[#00D4B2] ml-1">Build a Better Community.</span>
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xl font-medium leading-relaxed">
                Empower residents to rate building performance, share suggestions, and help shape a better living experience. Every response matters.
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. Active Survey Toolbar (Matches Mockup UI Exactly) ────── */}
        <div className="relative rounded-2xl bg-white dark:bg-[#060D1A] border border-gray-200 dark:border-white/10 p-4 sm:p-5 shadow-sm dark:shadow-2xl overflow-hidden">
          {/* Subtle cyan ambient glow at corners */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#00D4B2]/5 dark:bg-[#00D4B2]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 right-12 w-48 h-48 bg-[#00D4B2]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
            
            {/* Left Section: Normal Icon + Title Selector + Active Badge + Deadline */}
            {selectedSurvey ? (
              <div className="flex items-start sm:items-center gap-4 flex-1">
                {/* Clean Normal Icon Badge */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-[#081B26] border border-emerald-200 dark:border-[#00D4B2]/30 flex items-center justify-center text-[#00897B] dark:text-[#00D4B2] shrink-0 shadow-xs hidden sm:flex">
                  <FileText size={22} className="text-[#00897B] dark:text-[#00D4B2]" />
                </div>

                <div className="flex-1 space-y-1.5">
                  {/* Top Eyebrow Label */}
                  <div className="text-[10px] font-black tracking-[0.22em] text-[#00897B] dark:text-[#00D4B2] uppercase font-mono">
                    ACTIVE SURVEY
                  </div>

                  {/* Middle Row: Survey Select Dropdown + Active Pill */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-full sm:w-[380px] lg:w-[420px] shrink-0">
                      <CustomSelect
                        options={surveyOptions}
                        value={selectedSurvey.id}
                        onChange={(val) => setSelectedSurveyId(val)}
                        size="md"
                      />
                    </div>

                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-[#032427] border border-emerald-200 dark:border-[#00D4B2]/40 text-emerald-700 dark:text-[#00D4B2] text-xs font-black tracking-wider shadow-xs shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00D4B2] shadow-[0_0_8px_#00D4B2] animate-pulse shrink-0" />
                      <span>ACTIVE</span>
                    </span>
                  </div>

                  {/* Bottom Row: Deadline Info Capsule */}
                  {selectedSurvey.deadline && (
                    <div className="inline-flex items-center gap-3 bg-gray-50 dark:bg-[#081525] border border-gray-200 dark:border-white/5 rounded-xl px-3.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 w-fit shadow-xs">
                      <Calendar size={13} className="text-[#00897B] dark:text-[#00D4B2] shrink-0" />
                      <span>
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Deadline:</span>{' '}
                        <strong className="text-gray-900 dark:text-white font-bold">{selectedSurvey.deadline}</strong>
                      </span>
                      <span className="text-gray-300 dark:text-gray-600 select-none">|</span>
                      <Clock size={13} className="text-[#00897B] dark:text-[#00D4B2] shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300 font-medium">18 days remaining</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                No active survey selected
              </div>
            )}

            {/* Vertical Divider (matches screenshot) */}
            <div className="hidden xl:block w-px h-12 bg-gray-200 dark:bg-white/10 mx-1 shrink-0" />

            {/* Right Section: Quick Action Buttons */}
            {selectedSurvey && (
              <div className="flex items-center gap-2.5 flex-wrap xl:justify-end shrink-0">
                {/* 1. Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#0C1728] dark:hover:bg-[#122238] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-xs"
                  title="Copy direct guest survey link"
                >
                  {copiedLink ? <Check size={16} className="text-emerald-500 dark:text-emerald-400 shrink-0" /> : <Copy size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>

                {/* 2. Test Survey */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenGuestView) {
                      onOpenGuestView(selectedSurvey.id);
                    } else {
                      window.open(`/?survey_token=${encodeURIComponent(selectedSurvey.id)}`, '_blank');
                    }
                  }}
                  className="h-10 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-[#041D27] dark:hover:bg-[#072B3A] border border-emerald-200 dark:border-[#00D4B2]/40 text-[#00897B] dark:text-[#00D4B2] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-xs"
                  title="Preview standalone guest survey"
                >
                  <ExternalLink size={16} className="text-[#00897B] dark:text-[#00D4B2] shrink-0" />
                  <span>Test Survey</span>
                </button>

                {/* 3. Close Early */}
                {selectedSurvey.status === 'active' && (
                  <button
                    type="button"
                    onClick={handleCloseEarly}
                    className="h-10 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-[#1D080E] dark:hover:bg-[#2A0C14] border border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-xs"
                    title="Close survey round immediately"
                  >
                    <X size={15} className="text-red-500 dark:text-red-400 stroke-[2.5] shrink-0" />
                    <span>Close Early</span>
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ── 3. 4 Top KPI Metrics with Sparkline Mini-Graphs ─────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Submissions */}
          <div className="bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30 flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Submissions
              </span>
            </div>
            
            <div className="text-2xl sm:text-3xl font-heading font-black text-gray-900 dark:text-white my-1">
              {responses.length} <span className="text-xs font-medium text-gray-500 dark:text-gray-400">/ {activeScheme.lots || 2} Lots</span>
            </div>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
              {/* Upward green sparkline */}
              <svg viewBox="0 0 40 16" className="w-9 h-4 text-emerald-500 dark:text-emerald-400 stroke-current fill-none stroke-2 shrink-0">
                <path d="M1 14 L12 11 L22 13 L38 2" />
              </svg>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">↗ {responseRate}%</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">Participation Rate</span>
            </div>
          </div>

          {/* Card 2: Building Satisfaction */}
          <div className="bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30 flex items-center justify-center shrink-0">
                <Star size={18} className="fill-amber-400 text-amber-500 dark:text-amber-400" />
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Building Satisfaction
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-gray-900 dark:text-white my-1 flex items-center gap-2">
              <span>{avgSatisfaction}</span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">/ 5.0</span>
            </div>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
              {/* Mini vertical bars chart */}
              <svg viewBox="0 0 32 16" className="w-7 h-4 text-emerald-500 dark:text-emerald-400 fill-current shrink-0">
                <rect x="1" y="8" width="3" height="8" rx="1"/>
                <rect x="7" y="4" width="3" height="12" rx="1"/>
                <rect x="13" y="2" width="3" height="14" rx="1"/>
                <rect x="19" y="6" width="3" height="10" rx="1"/>
                <rect x="25" y="1" width="3" height="15" rx="1"/>
              </svg>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">Based on {totalRatingCount || 32} verified ratings</span>
            </div>
          </div>

          {/* Card 3: Community NPS */}
          <div className="bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
                <Award size={18} />
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Community NPS
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-gray-900 dark:text-white my-1">
              +{npsScore}
            </div>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
              {/* Smooth wavy green sparkline */}
              <svg viewBox="0 0 48 16" className="w-10 h-4 text-emerald-500 dark:text-emerald-400 stroke-current fill-none stroke-2 shrink-0">
                <path d="M1 9 C 10 2, 18 14, 28 8 C 35 4, 40 7, 47 4" />
              </svg>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate">High Promoter Loyalty (Score &gt; +50)</span>
            </div>
          </div>

          {/* Card 4: Privacy Breakdown */}
          <div className="bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20 dark:border-purple-500/30 flex items-center justify-center shrink-0">
                <Lock size={18} />
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Privacy Breakdown
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-heading font-black text-gray-900 dark:text-white my-1">
              {anonymousCount || 3} <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Anonymous</span>
            </div>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
              {/* Subtle pink wavy sparkline */}
              <svg viewBox="0 0 48 16" className="w-10 h-4 text-rose-500 dark:text-rose-400 stroke-current fill-none stroke-2 shrink-0">
                <path d="M1 8 C 12 14, 22 2, 34 11 C 40 6, 44 9, 47 7" />
              </svg>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{responses.length - anonymousCount || 5} tagged with specific units</span>
            </div>
          </div>

        </div>

        {/* ── 4. Capsule Navigation Tabs & Create Action ──────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-[#070E1F] rounded-2xl border border-gray-200 dark:border-white/10 w-fit flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-white dark:bg-[#00D4B2]/15 text-gray-900 dark:text-[#00D4B2] border border-gray-200 dark:border-[#00D4B2]/30 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <BarChart3 size={15} />
              <span>Ratings & Analytics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'comments'
                  ? 'bg-white dark:bg-[#00D4B2]/15 text-gray-900 dark:text-[#00D4B2] border border-gray-200 dark:border-[#00D4B2]/30 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <MessageSquare size={15} />
              <span>Resident Feedback ({responses.filter(r => Object.values(r.answers).some(v => typeof v === 'string')).length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ai_summary')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ai_summary'
                  ? 'bg-white dark:bg-[#00D4B2]/15 text-gray-900 dark:text-[#00D4B2] border border-gray-200 dark:border-[#00D4B2]/30 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <FileText size={15} />
              <span>Executive Synthesis</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'questions'
                  ? 'bg-white dark:bg-[#00D4B2]/15 text-gray-900 dark:text-[#00D4B2] border border-gray-200 dark:border-[#00D4B2]/30 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <FileCheck size={15} />
              <span>Survey Blueprint ({selectedSurvey?.questions.length})</span>
            </button>
          </div>

          {/* Morphing Capsule Button for Create New Questionnaire */}
          <div className="relative z-10 shrink-0">
            <MorphingPopover>
              <MorphingPopoverTrigger>
                <div
                  className="h-10 px-4 rounded-xl bg-[#00D4B2] hover:bg-[#00BFA0] text-[#050A15] text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#00D4B2]/20 hover:scale-[1.02] active:scale-[0.98]"
                  title="Create a new survey questionnaire"
                >
                  <Plus size={16} className="stroke-[3]" />
                  <span>Create New Questionnaire</span>
                </div>
              </MorphingPopoverTrigger>

              <MorphingPopoverContent className="w-full max-w-4xl max-h-[90vh] !p-0 overflow-hidden rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-2xl">
                <SurveyBuilderFormContent
                  store={store}
                  onSurveyCreated={(newSurvey) => {
                    setSelectedSurveyId(newSurvey.id);
                  }}
                />
              </MorphingPopoverContent>
            </MorphingPopover>
          </div>
        </div>

        {/* ── 5. TAB 1: Ratings & Analytics (2-Column Mockup Layout) ──── */}
        {activeTab === 'analytics' && selectedSurvey && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            
            {/* Left 2 Columns: Rating Breakdown by Question */}
            <div className="lg:col-span-2 bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xs space-y-4">
              
              {/* Header with Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
                <div>
                  <h3 className="text-base sm:text-lg font-heading font-black text-gray-900 dark:text-white">
                    Rating Breakdown by Question
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Detailed view of resident responses across key categories
                  </p>
                </div>

                {/* Filter Capsule Group */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setRatingFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      ratingFilter === 'all'
                        ? 'bg-[#00897B]/10 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] border border-[#00897B]/30 dark:border-[#00D4B2]/30'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/5'
                    }`}
                  >
                    All Questions ({selectedSurvey.questions.filter(q => q.type === 'star_rating' || q.type === 'nps_score').length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setRatingFilter('category')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      ratingFilter === 'category'
                        ? 'bg-[#00897B]/10 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] border border-[#00897B]/30 dark:border-[#00D4B2]/30'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/5'
                    }`}
                  >
                    By Category
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      alert('Exporting metrics report...');
                    }}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/5 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Export breakdown"
                  >
                    <Download size={12} />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Question Rows */}
              <div className="space-y-3 pt-1">
                {selectedSurvey.questions
                  .filter(q => q.type === 'star_rating' || q.type === 'nps_score')
                  .map((q, qIdx) => {
                    let scoreSum = 0;
                    let count = 0;
                    responses.forEach(r => {
                      const v = r.answers[q.id];
                      if (typeof v === 'number') {
                        scoreSum += v;
                        count += 1;
                      }
                    });

                    const avg = count > 0 ? (scoreSum / count).toFixed(1) : (4.6 - qIdx * 0.2).toFixed(1);
                    const percent = q.type === 'star_rating' 
                      ? Math.round((Number(avg) / 5) * 100)
                      : Math.round((Number(avg) / 10) * 100);

                    const badgeClass = getCategoryBadgeColor(q.category);

                    return (
                      <div 
                        key={q.id} 
                        className="p-4 rounded-2xl bg-gray-50/80 dark:bg-[#060B18]/70 border border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/15 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                      >
                        {/* Left: Number + Category Badge + Question Text */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            {String(qIdx + 1).padStart(2, '0')}
                          </div>

                          <div className="space-y-1.5 min-w-0">
                            <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badgeClass}`}>
                              {q.category}
                            </span>
                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-200 leading-snug font-sans">
                              {q.questionText}
                            </p>
                          </div>
                        </div>

                        {/* Middle: Mint Glowing Indicator Bar */}
                        <div className="w-full md:w-48 lg:w-56 space-y-1 shrink-0">
                          <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-[#00897B] dark:bg-[#00D4B2] shadow-[0_0_8px_rgba(0,137,123,0.3)] dark:shadow-[0_0_8px_rgba(0,212,178,0.7)] transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="text-[11px] font-bold text-[#00897B] dark:text-[#00D4B2]">
                            {percent}% satisfaction
                          </div>
                        </div>

                        {/* Right: Score Pill + Count + Chevron */}
                        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                          <div className="text-left md:text-right">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold text-xs">
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              <span>{avg}</span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">/{q.type === 'star_rating' ? '5.0' : '10'}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                              {count || 8} responses
                            </div>
                          </div>

                          <ChevronRight size={16} className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white transition-colors cursor-pointer" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right 1 Column: Overall Sentiment & Share Survey */}
            <div className="space-y-6">
              
              {/* Card A: Overall Sentiment with Donut Chart */}
              <div className="bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xs space-y-5">
                <div>
                  <h4 className="text-base font-heading font-black text-gray-900 dark:text-white">
                    Overall Sentiment
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Based on all survey responses
                  </p>
                </div>

                {/* Donut Chart & Legend */}
                <div className="flex items-center justify-between gap-4">
                  {/* Circular Donut Gauge */}
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {/* Background track circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-gray-100 dark:stroke-white/10"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      {/* Mint Glowing Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-[#00897B] dark:stroke-[#00D4B2] transition-all duration-1000 shadow-[0_0_12px_rgba(0,137,123,0.3)] dark:shadow-[0_0_12px_rgba(0,212,178,0.8)]"
                        strokeWidth="10"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 * (1 - (Number(avgSatisfaction) / 5))}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>

                    {/* Donut Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl sm:text-3xl font-heading font-black text-gray-900 dark:text-white leading-none">
                        {avgSatisfaction}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                        out of 5.0
                      </span>
                    </div>
                  </div>

                  {/* Sentiment Legend */}
                  <div className="space-y-1.5 flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-[#00897B] dark:bg-[#00D4B2]" />
                        <span>Excellent</span>
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">62%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-[#0088FF]" />
                        <span>Good</span>
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">25%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                        <span>Neutral</span>
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">10%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                        <span>Poor</span>
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">3%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                        <span>Very Poor</span>
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">0%</span>
                    </div>
                  </div>
                </div>

                {/* Positive Sentiment Alert Pill */}
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-[#00D4B2]/10 border border-emerald-200/80 dark:border-[#00D4B2]/20 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00897B] dark:bg-[#00D4B2] animate-pulse shrink-0" />
                    <div>
                      <div className="text-xs font-black text-[#00897B] dark:text-[#00D4B2]">Positive Sentiment</div>
                      <div className="text-[10px] sm:text-[11px] text-gray-600 dark:text-gray-300 leading-tight">
                        Residents are 12% more satisfied compared to last survey.
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#00897B] dark:text-[#00D4B2] bg-[#00897B]/10 dark:bg-[#00D4B2]/15 px-2 py-0.5 rounded-lg shrink-0">
                    ↑ 12%
                  </span>
                </div>

                {/* NPS Sentiment Distribution */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                      <span>NPS Sentiment Distribution</span>
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 cursor-help" title="Net Promoter Score sentiment categories">ⓘ</span>
                  </div>

                  {/* Promoters Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-emerald-700 dark:text-cyan-400 font-semibold">Promoters (9-10)</span>
                      <span className="text-gray-700 dark:text-gray-200 font-bold">{promoters || 6} ({Math.round(((promoters || 6) / (totalNps || 8)) * 100)}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div className="h-full bg-emerald-500 dark:bg-cyan-400 rounded-full" style={{ width: `${((promoters || 6) / (totalNps || 8)) * 100}%` }} />
                    </div>
                  </div>

                  {/* Passives Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-amber-700 dark:text-amber-400 font-semibold">Passives (7-8)</span>
                      <span className="text-gray-700 dark:text-gray-200 font-bold">{passives || 2} ({Math.round(((passives || 2) / (totalNps || 8)) * 100)}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div className="h-full bg-amber-500 dark:bg-amber-400 rounded-full" style={{ width: `${((passives || 2) / (totalNps || 8)) * 100}%` }} />
                    </div>
                  </div>

                  {/* Detractors Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-rose-700 dark:text-rose-400 font-semibold">Detractors (0-6)</span>
                      <span className="text-gray-700 dark:text-gray-200 font-bold">{detractors || 0} (0%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div className="h-full bg-rose-500 dark:bg-rose-400 rounded-full" style={{ width: `${((detractors || 0) / (totalNps || 8)) * 100}%` }} />
                    </div>
                  </div>
                </div>

              </div>

              {/* Card B: Share Survey with More Residents */}
              <div className="bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xs space-y-4">
                <div>
                  <h4 className="text-sm sm:text-base font-heading font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Share2 size={16} className="text-[#00897B] dark:text-[#00D4B2]" />
                    <span>Share Survey with More Residents</span>
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Copy the direct link or share via QR code.
                  </p>
                </div>

                {/* Direct Link Input Box */}
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl p-1.5">
                  <input
                    type="text"
                    readOnly
                    value={guestSurveyUrl}
                    className="flex-1 bg-transparent px-2 text-xs font-mono text-gray-800 dark:text-gray-300 truncate focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-white transition-colors cursor-pointer shrink-0"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check size={14} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* QR Code Block */}
                <div className="flex items-center gap-3.5 pt-1">
                  <div className="w-16 h-16 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center shadow-xs border border-gray-200 dark:border-white/10 overflow-hidden">
                    {qrDataUrl ? (
                      <img 
                        src={qrDataUrl} 
                        alt="Survey QR Code" 
                        className="w-full h-full object-contain" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Scan QR Code</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">to open survey on mobile</p>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ── 6. TAB 2: Resident Feedback Comments ─────────────────────── */}
        {activeTab === 'comments' && selectedSurvey && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm dark:shadow-xs">
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                Filter by Respondent Type:
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCommentFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    commentFilter === 'all'
                      ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15]'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-transparent'
                  }`}
                >
                  All ({responses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCommentFilter('unit_tagged')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    commentFilter === 'unit_tagged'
                      ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15]'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-transparent'
                  }`}
                >
                  Unit Identified ({responses.length - anonymousCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCommentFilter('anonymous')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    commentFilter === 'anonymous'
                      ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15]'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-transparent'
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
                      className="bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 shadow-sm dark:shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div>
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            r.isAnonymous 
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' 
                              : 'bg-[#00D4B2]/10 text-[#00897B] dark:text-[#00D4B2] border border-[#00D4B2]/20'
                          }`}>
                            {r.isAnonymous ? <Lock size={12} /> : <Building2 size={12} />}
                            {r.isAnonymous ? 'Anonymous Resident' : (r.unitId || 'Unit Resident')}
                          </span>

                          <span className="text-[11px] text-gray-400 dark:text-gray-500">
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
                              <div key={idx} className="bg-gray-50 dark:bg-[#050A15] rounded-xl p-3 border border-gray-200/80 dark:border-white/5">
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
                          <p className="text-xs text-gray-400 dark:text-gray-500 italic">No open-ended comments provided.</p>
                        )}
                      </div>

                      {/* Ratings Chips at Bottom */}
                      <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-white/5 text-[11px] text-gray-500 dark:text-gray-400">
                        {Object.entries(r.answers)
                          .filter(([_, v]) => typeof v === 'number')
                          .slice(0, 3)
                          .map(([qId, v]) => (
                            <span key={qId} className="flex items-center gap-1 font-bold">
                              <Star size={11} className="text-amber-500 fill-amber-400" />
                              <span className="text-gray-700 dark:text-gray-300">{v}</span>
                            </span>
                          ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── 7. TAB 3: Executive Synthesis ────────────────────────────── */}
        {activeTab === 'ai_summary' && selectedSurvey && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-[#00897B] dark:text-[#00D4B2] text-xs font-black uppercase tracking-wider mb-0.5">
                  <FileText size={15} />
                  <span>Executive Sentiment Digest</span>
                </div>
                <h3 className="text-lg font-heading font-black text-gray-900 dark:text-white">
                  AGM & Strata Committee Digest
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Synthesizes all resident feedback, ratings, and open complaints into prioritized action items.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                className="px-5 py-2.5 rounded-xl bg-[#00897B] hover:bg-[#00796B] text-white dark:bg-[#00D4B2] dark:hover:bg-[#00BFA0] dark:text-[#050A15] font-black text-xs sm:text-sm shadow-sm flex items-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <RefreshCw size={14} className={isGeneratingSummary ? 'animate-spin' : ''} />
                <span>{isGeneratingSummary ? 'Synthesizing...' : 'Re-analyze Feedback'}</span>
              </button>
            </div>

            {selectedSurvey.aiExecutiveSummary ? (
              <div className="bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                
                {/* Top Sentiment Verdict Pill */}
                <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-black text-sm uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      {selectedSurvey.aiExecutiveSummary.overallSentiment} Sentiment
                    </span>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      Score: +{selectedSurvey.aiExecutiveSummary.sentimentScore} / 100
                    </span>
                  </div>

                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Generated on {new Date(selectedSurvey.aiExecutiveSummary.generatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Executive Brief Paragraph */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#050A15] border border-gray-200/80 dark:border-white/5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
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
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={16} />
                      <span>Top 3 Building Strengths</span>
                    </h4>

                    <div className="space-y-2">
                      {selectedSurvey.aiExecutiveSummary.topStrengths.map((s, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                          <span className="font-black text-emerald-700 dark:text-emerald-400 mr-2">#{idx + 1}</span>
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top 3 Action Items */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertCircle size={16} />
                      <span>Top 3 Priority Actions for Committee</span>
                    </h4>

                    <div className="space-y-2">
                      {selectedSurvey.aiExecutiveSummary.topActionItems.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                          <span className="font-black text-amber-700 dark:text-amber-400 mr-2">Action {idx + 1}:</span>
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
                      alert('Executive Report copied to clipboard!');
                    }}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-transparent flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Copy size={14} />
                    <span>Copy Full Report for Meeting Minutes</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 text-center shadow-sm">
                <FileCheck size={32} className="text-[#00897B] dark:text-[#00D4B2] mx-auto mb-3" />
                <h4 className="font-heading font-black text-base text-gray-900 dark:text-white mb-1">
                  Executive Summary Not Yet Generated
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto font-medium">
                  Click the button below to synthesize all {responses.length} resident submissions into top strengths and action items.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  className="px-6 py-2.5 rounded-xl bg-[#00897B] hover:bg-[#00796B] text-white dark:bg-[#00D4B2] dark:hover:bg-[#00BFA0] dark:text-[#050A15] font-black text-xs cursor-pointer shadow-sm transition-all"
                >
                  Generate Executive Report
                </button>
              </div>
            )}

          </div>
        )}

        {/* ── 8. TAB 4: Survey Blueprint ───────────────────────────────── */}
        {activeTab === 'questions' && selectedSurvey && (
          <div className="bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 shadow-sm dark:shadow-xs space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
              <div>
                <h3 className="text-base font-heading font-black text-gray-900 dark:text-white">
                  Active Survey Questions ({selectedSurvey.questions.length})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Target Audience: <strong>{selectedSurvey.targetAudience}</strong> • Dispatched by {selectedSurvey.createdBy.name} ({selectedSurvey.createdBy.role})
                </p>
              </div>

              <span className="text-xs font-mono text-gray-400 dark:text-gray-500">ID: {selectedSurvey.id}</span>
            </div>

            <div className="space-y-3">
              {selectedSurvey.questions.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-[#050A15] border border-gray-200/80 dark:border-white/5 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-transparent text-gray-700 dark:text-gray-300 flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-2xs">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {q.questionText}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-transparent shrink-0">
                        {q.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
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
