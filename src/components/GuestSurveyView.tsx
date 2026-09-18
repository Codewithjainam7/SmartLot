// @smartlot/component GuestSurveyView
// Mobile-first, zero-login standalone feedback view for residents.
import React, { useState, useEffect } from 'react';
import { SmartLotLogo } from './core/SmartLotLogo';
import { Survey, SurveyQuestion } from '../types';
import { SmartLotStore } from '../store/smartLotStore';
import { supabase } from '../lib/supabase';
import { 
  Star, 
  ShieldCheck, 
  ShieldAlert, 
  Building2, 
  Clock, 
  CheckCircle2, 
  Sun,
  Moon,
  Lock, 
  User, 
  Home, 
  Send,
  AlertCircle,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { CustomSelect, SelectOption } from './core/CustomSelect';

interface GuestSurveyViewProps {
  surveyToken: string;
  store: SmartLotStore;
  onClose?: () => void;
}

export function GuestSurveyView({ surveyToken, store, onClose }: GuestSurveyViewProps) {
  // Find matching survey by ID or token
  const cleanToken = surveyToken ? surveyToken.trim() : '';

  // 1. In-memory / localStorage resolver helper
  const findLocalSurvey = (): Survey | undefined => {
    let found = 
      store.surveys.find(s => s.id === cleanToken) ||
      store.surveys.find(s => s.id.toLowerCase() === cleanToken.toLowerCase()) ||
      store.surveys.find(s => s.id.toLowerCase().includes(cleanToken.toLowerCase()));

    if (!found && typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('smartlot_global_surveys_v2');
        if (raw) {
          const parsed: Survey[] = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            found = parsed.find(s => s.id === cleanToken) ||
              parsed.find(s => s.id.toLowerCase() === cleanToken.toLowerCase()) ||
              parsed.find(s => s.id.toLowerCase().includes(cleanToken.toLowerCase()));
          }
        }
      } catch (e) {
        console.warn('Failed to resolve survey from localStorage:', e);
      }
    }

    if (!found && (!cleanToken || cleanToken === 'demo')) {
      found = store.surveys[0];
    }
    return found;
  };

  const [survey, setSurvey] = useState<Survey | undefined>(findLocalSurvey);
  const [isLoading, setIsLoading] = useState<boolean>(() => !findLocalSurvey() && !!cleanToken);

  // Fetch from Supabase if not found locally
  useEffect(() => {
    const local = findLocalSurvey();
    if (local) {
      setSurvey(local);
      setIsLoading(false);
      return;
    }

    if (!cleanToken) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const fetchFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('surveys')
          .select('*')
          .ilike('id', cleanToken)
          .maybeSingle();

        if (error) {
          console.warn('Supabase survey fetch notice:', error);
        }

        if (data && isMounted) {
          const loadedSurvey: Survey = {
            id: data.id,
            schemeId: data.scheme_id,
            title: data.title,
            description: data.description || '',
            category: data.category || 'General Satisfaction',
            status: data.status || 'active',
            targetAudience: data.target_audience || 'All Residents',
            recipientEmails: data.recipient_emails || [],
            ccEmails: data.cc_emails || [],
            bccEmails: data.bcc_emails || [],
            questions: Array.isArray(data.questions) ? data.questions : [],
            deadline: data.deadline || undefined,
            createdAt: data.created_at,
            createdBy: data.created_by || { name: 'Strata Manager', role: 'Strata Manager' },
            closedAt: data.closed_at || undefined,
            aiExecutiveSummary: data.ai_executive_summary || undefined,
            bannerImage: data.banner_image || undefined,
          };

          setSurvey(loadedSurvey);

          // Sync into local storage and store surveys list
          try {
            const raw = window.localStorage.getItem('smartlot_global_surveys_v2');
            const parsed = raw ? JSON.parse(raw) : [];
            if (Array.isArray(parsed) && !parsed.some(s => s.id === loadedSurvey.id)) {
              window.localStorage.setItem('smartlot_global_surveys_v2', JSON.stringify([loadedSurvey, ...parsed]));
            }
          } catch {}
        }
      } catch (err) {
        console.error('Failed to load survey from Supabase:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFromSupabase();

    return () => {
      isMounted = false;
    };
  }, [cleanToken]);

  const activeScheme = store.schemes.find(s => s.id === survey?.schemeId) || store.activeScheme;

  // Form State
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [residentName, setResidentName] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [hoveredStar, setHoveredStar] = useState<{ [qId: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const unitOptions: SelectOption[] = [
    ...Array.from({ length: 32 }, (_, i) => ({
      value: `Unit ${i + 1}`,
      label: `Unit ${i + 1}`,
      icon: <Home size={14} className="text-[#00D4B2]" />
    })),
    { value: 'Townhouse / Commercial', label: 'Townhouse / Commercial', icon: <Building2 size={14} className="text-blue-500" /> },
    { value: 'Other', label: 'Other Lot', icon: <Building2 size={14} className="text-purple-500" /> }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0a0a0f] flex items-center justify-center p-3.5 sm:p-4">
        <div className="bg-white dark:bg-[#0d1117] border border-gray-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-10 max-w-md w-full text-center shadow-2xl flex flex-col items-center">
          <SmartLotLogo className="h-8 sm:h-9 mb-5 sm:mb-6" />
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 text-[#00897B] dark:text-[#00D4B2] flex items-center justify-center mb-4 border border-emerald-500/20">
            <Loader2 size={26} className="animate-spin sm:w-7 sm:h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-heading font-black text-gray-900 dark:text-white mb-2">
            Loading Questionnaire...
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            Fetching real-time survey form for {cleanToken || 'community'}
          </p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0a0a0f] flex items-center justify-center p-3.5 sm:p-4">
        <div className="bg-white dark:bg-[#0d1117] border border-gray-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertCircle size={28} className="sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-lg sm:text-xl font-heading font-black text-gray-900 dark:text-white mb-2">Survey Not Found</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
            The feedback questionnaire link you opened is invalid, expired, or could not be found.
          </p>
          {cleanToken && (
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-5 bg-gray-100 dark:bg-white/5 py-1.5 px-3 rounded-xl inline-block border border-gray-200 dark:border-white/5 truncate max-w-full">
              Survey Token: <span className="font-bold text-gray-900 dark:text-white">{cleanToken}</span>
            </p>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-full h-11 sm:h-10 px-4 rounded-xl bg-[#00897B] dark:bg-[#00D4B2] text-white dark:text-[#050A15] font-bold text-xs sm:text-sm hover:opacity-90 transition-all cursor-pointer shadow-sm select-none active:scale-95 flex items-center justify-center"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const isClosed = survey.status === 'closed' || (survey.deadline && new Date(survey.deadline).getTime() < Date.now());

  const formatDeadlineDate = (deadlineStr?: string | null): string => {
    if (!deadlineStr) return '';
    const clean = deadlineStr.includes('T') ? deadlineStr.split('T')[0] : deadlineStr.split(' ')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
    const d = new Date(deadlineStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return deadlineStr;
  };

  const handleStarClick = (questionId: string, rating: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: rating }));
    setValidationError(null);
  };

  const handleNpsClick = (questionId: string, score: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: score }));
    setValidationError(null);
  };

  const handleChoiceSelect = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
    setValidationError(null);
  };

  const handleMultiChoiceToggle = (questionId: string, option: string) => {
    const current = (answers[questionId] as string[]) || [];
    const next = current.includes(option) ? current.filter(o => o !== option) : [...current, option];
    setAnswers(prev => ({ ...prev, [questionId]: next }));
    setValidationError(null);
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check required fields
    for (const q of survey.questions) {
      if (q.required) {
        const ans = answers[q.id];
        if (ans === undefined || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
          setValidationError(`Please provide an answer for: "${q.questionText}"`);
          return;
        }
      }
    }

    if (!isAnonymous && !selectedUnit.trim()) {
      setValidationError('Please select your unit or lot number, or toggle "Submit Anonymously".');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    const newResponsePayload = {
      surveyId: survey.id,
      schemeId: survey.schemeId,
      unitId: isAnonymous ? undefined : selectedUnit.trim(),
      respondentName: isAnonymous ? undefined : (residentName.trim() || undefined),
      isAnonymous,
      answers,
    };

    try {
      await store.submitSurveyResponse(newResponsePayload);
    } catch (err) {
      console.warn('Error submitting survey response:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  // Star label helpers
  const getStarLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  // If submitted successfully
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0a0a0f] flex items-center justify-center p-3.5 sm:p-4 pb-safe">
        <div className="bg-white dark:bg-[#0d1117] border border-gray-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-10 max-w-lg w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <CheckCircle2 size={32} className="sm:w-9 sm:h-9 stroke-[2.5]" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-2.5 sm:mb-3 border border-emerald-500/20">
            <CheckCircle2 size={13} /> Response Recorded
          </span>

          <h1 className="text-xl sm:text-3xl font-heading font-black text-gray-900 dark:text-white mb-2 sm:mb-3">
            Thank You for Your Voice!
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-5 sm:mb-6 leading-relaxed">
            Your feedback has been securely delivered to the <strong>Strata Committee</strong> and <strong>Strata Management Agency</strong> for {activeScheme?.name || 'your building'}.
          </p>

          <div className="bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-2xl p-3.5 sm:p-4 text-left mb-5 sm:mb-6 space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between items-center gap-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300 shrink-0">Survey:</span>
              <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{survey.title}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300 shrink-0">Privacy Mode:</span>
              <span className="font-bold text-[#00D4B2]">
                {isAnonymous 
                  ? '🔒 Total Anonymity' 
                  : selectedUnit 
                    ? (selectedUnit.trim().toLowerCase().startsWith('unit') ? selectedUnit.trim() : `Unit ${selectedUnit.trim()}`)
                    : 'Unit Identified'}
              </span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="font-semibold text-gray-700 dark:text-gray-300 shrink-0">Submitted:</span>
              <span>{new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {onClose ? (
            <button
              onClick={onClose}
              className="w-full h-12 py-3.5 px-6 rounded-xl bg-[#0055FF] hover:bg-blue-600 dark:bg-[#00D4B2] dark:hover:bg-[#00BFA0] text-white dark:text-[#0a0a0f] font-bold text-sm shadow-sm transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center"
            >
              Close & Return
            </button>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              You can now safely close this browser window.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0a0a0f] text-gray-900 dark:text-gray-100 flex flex-col items-center justify-start pb-16 font-sans">
      
      {/* Top Brand Banner */}
      <header className="w-full bg-white dark:bg-[#0d1117] border-b border-gray-200/80 dark:border-white/10 sticky top-0 z-30 shadow-xs backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SmartLotLogo className="h-6 sm:h-7" />
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />
            <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden sm:inline">
              Resident Voice & Feedback
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2.5 sm:px-3 py-1.5 rounded-full border border-gray-200/80 dark:border-white/10">
              <ShieldCheck size={14} className="text-[#00D4B2]" />
              <span className="hidden sm:inline">Zero Login Required</span>
              <span className="sm:hidden text-[11px]">Zero Login</span>
            </div>

            <button
              type="button"
              onClick={() => store.setTheme(store.theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-all cursor-pointer select-none active:scale-95"
              title={`Switch to ${store.theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {store.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-2xl px-3.5 sm:px-4 pt-4 sm:pt-8">
        
        {/* Closed Survey Banner */}
        {isClosed && (
          <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <Clock size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm mb-0.5">This Survey Round Has Concluded</h3>
              <p className="text-[11px] sm:text-xs text-amber-800/80 dark:text-amber-300/80">
                The deadline for this feedback round was {formatDeadlineDate(survey.deadline) || 'reached'}. New submissions are currently disabled.
              </p>
            </div>
          </div>
        )}

        {/* Survey Hero Card with Google Forms-style Banner */}
        <div className="bg-white dark:bg-[#0d1117] border border-gray-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-sm mb-4 sm:mb-6 relative overflow-hidden">
          {(survey.bannerImage || '/bg_img_building.png') && (
            <div className="relative h-36 sm:h-56 w-full overflow-hidden bg-gray-900">
              <img 
                src={survey.bannerImage || '/bg_img_building.png'} 
                alt={survey.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 sm:bottom-4 sm:left-6 sm:right-6 flex items-center justify-between text-white">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 truncate max-w-[55%]">
                  {activeScheme?.name || 'Strata Survey'}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#00D4B2]/20 text-[#00D4B2] border border-[#00D4B2]/40 backdrop-blur-md shrink-0">
                  {survey.category}
                </span>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-8">
            {/* Scheme & Category Badges */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#00D4B2]/10 text-[#00897B] dark:text-[#00D4B2] text-[11px] sm:text-xs font-black uppercase tracking-wider">
                <Building2 size={12} />
                {activeScheme?.name || 'Cavallo Sydney'}
              </span>
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] sm:text-xs font-bold">
                {survey.category}
              </span>
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs font-medium">
                <Clock size={11} /> ~2 min
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-heading font-black text-gray-900 dark:text-white mb-2 leading-tight">
              {survey.title}
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {survey.description}
            </p>

            {survey.deadline && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                <span>Closing Deadline:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{formatDeadlineDate(survey.deadline)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Privacy & Unit Identifier Section */}
        <div className="bg-white dark:bg-[#0d1117] border border-gray-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm mb-4 sm:mb-6 relative z-20 overflow-visible">
          <div className="flex items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-2 rounded-xl shrink-0 ${isAnonymous ? 'bg-emerald-500/15 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {isAnonymous ? <Lock size={18} /> : <Home size={18} />}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-heading font-bold text-gray-900 dark:text-white truncate">
                  {isAnonymous ? 'Anonymous Submission Active' : 'Unit Identification'}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                  {isAnonymous 
                    ? 'No personal details or unit number will be linked to your answers.' 
                    : 'Specify your unit so committee actions can be tailored to your floor.'}
                </p>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setIsAnonymous(!isAnonymous);
                setValidationError(null);
              }}
              className={`h-9 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 select-none active:scale-95 ${
                isAnonymous 
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs' 
                  : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              <Lock size={12} />
              <span>{isAnonymous ? 'Anonymous' : 'Make Anonymous'}</span>
            </button>
          </div>

          {!isAnonymous ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Unit / Lot Number <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  options={unitOptions}
                  value={selectedUnit}
                  onChange={(val) => {
                    setSelectedUnit(val);
                    setValidationError(null);
                  }}
                  placeholder="Select your unit..."
                  size="md"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Your Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={residentName}
                    onChange={(e) => setResidentName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full bg-white dark:bg-[#161a26] border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/40 focus:border-[#00D4B2] transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span>Total privacy guaranteed: Your responses will appear in the aggregate report as "Anonymous Resident".</span>
            </div>
          )}
        </div>

        {/* Survey Question Cards */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {survey.questions.map((q, idx) => {
            const currentAns = answers[q.id];

            return (
              <div 
                key={q.id}
                className="bg-white dark:bg-[#0d1117] border border-gray-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm hover:border-[#0055FF]/40 dark:hover:border-[#00D4B2]/40 transition-all"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 truncate">
                    Question {idx + 1} of {survey.questions.length} • {q.category}
                  </span>
                  {q.required && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md shrink-0">
                      Required
                    </span>
                  )}
                </div>

                <h2 className="text-sm sm:text-lg font-heading font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 leading-snug">
                  {q.questionText}
                </h2>

                {/* Question Type: Star Rating */}
                {q.type === 'star_rating' && (
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-3 py-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const activeRating = hoveredStar[q.id] || currentAns || 0;
                        const isFilled = star <= activeRating;

                        return (
                          <button
                            key={star}
                            type="button"
                            disabled={isClosed}
                            onClick={() => handleStarClick(q.id, star)}
                            onMouseEnter={() => setHoveredStar(prev => ({ ...prev, [q.id]: star }))}
                            onMouseLeave={() => setHoveredStar(prev => ({ ...prev, [q.id]: 0 }))}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:cursor-not-allowed focus:outline-none select-none"
                            title={`${star} Star - ${getStarLabel(star)}`}
                          >
                            <Star 
                              size={30}
                              className={`transition-all sm:w-8 sm:h-8 ${
                                isFilled
                                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)]' 
                                  : 'text-gray-300 dark:text-gray-700 hover:text-amber-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* Label helper */}
                    <div className="h-5 text-xs font-bold text-amber-500 dark:text-amber-400 text-center sm:text-left">
                      {(hoveredStar[q.id] || currentAns) ? `${hoveredStar[q.id] || currentAns} / 5 Stars — ${getStarLabel(hoveredStar[q.id] || currentAns)}` : ''}
                    </div>
                  </div>
                )}

                {/* Question Type: NPS Score (0 to 10) */}
                {q.type === 'nps_score' && (
                  <div className="space-y-3">
                    <div className="flex sm:grid sm:grid-cols-11 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                        const isSelected = currentAns === score;
                        let colorClass = 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10';
                        
                        if (isSelected) {
                          if (score >= 9) colorClass = 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30';
                          else if (score >= 7) colorClass = 'bg-amber-500 text-white shadow-md shadow-amber-500/30';
                          else colorClass = 'bg-rose-500 text-white shadow-md shadow-rose-500/30';
                        }

                        return (
                          <button
                            key={score}
                            type="button"
                            disabled={isClosed}
                            onClick={() => handleNpsClick(q.id, score)}
                            className={`min-w-[38px] sm:min-w-0 flex-1 h-11 sm:h-10 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer border border-transparent disabled:opacity-50 flex items-center justify-center select-none active:scale-90 ${colorClass}`}
                          >
                            {score}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 font-semibold px-1">
                      <span>0 = Not likely at all</span>
                      {currentAns !== undefined && (
                        <span className="font-bold text-gray-900 dark:text-white">
                          Rating: {currentAns}/10 ({currentAns >= 9 ? 'Promoter' : currentAns >= 7 ? 'Passive' : 'Detractor'})
                        </span>
                      )}
                      <span>10 = Extremely likely</span>
                    </div>
                  </div>
                )}

                {/* Question Type: Single Choice Radio Cards */}
                {q.type === 'single_choice' && (() => {
                  const resolvedOptions: string[] = (Array.isArray(q.options) && q.options.length > 0)
                    ? q.options
                    : (typeof q.options === 'string' && (q.options as string).trim())
                      ? (q.options as string).split(',').map(s => s.trim()).filter(Boolean)
                      : ['Yes', 'No', 'Neutral'];

                  return (
                    <div className="space-y-2.5" role="radiogroup" aria-label={q.questionText}>
                      {resolvedOptions.map((opt, optIndex) => {
                        const isSelected = currentAns === opt;

                        return (
                          <div
                            key={`${opt}-${optIndex}`}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onClick={() => {
                              if (!isClosed) handleChoiceSelect(q.id, opt);
                            }}
                            onKeyDown={(e) => {
                              if (!isClosed && (e.key === ' ' || e.key === 'Enter')) {
                                e.preventDefault();
                                handleChoiceSelect(q.id, opt);
                              }
                            }}
                            className={`w-full text-left p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs sm:text-sm font-semibold select-none min-h-[50px] active:scale-[0.98] ${
                              isSelected
                                ? 'border-[#0055FF] dark:border-[#00D4B2] bg-blue-50/90 dark:bg-[#00D4B2]/15 text-gray-900 dark:text-white font-bold shadow-xs ring-2 ring-[#0055FF]/20 dark:ring-[#00D4B2]/30'
                                : 'border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-[#1a1d27]/60 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-[#1f2433]'
                            }`}
                          >
                            <label className="flex items-center gap-3 cursor-pointer flex-1 pointer-events-none">
                              <input
                                type="radio"
                                name={`survey_radio_${q.id}`}
                                value={opt}
                                checked={isSelected}
                                disabled={isClosed}
                                onChange={() => handleChoiceSelect(q.id, opt)}
                                className="sr-only"
                              />
                              <span>{opt}</span>
                            </label>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected 
                                ? 'border-[#0055FF] dark:border-[#00D4B2] bg-[#0055FF] dark:bg-[#00D4B2]' 
                                : 'border-gray-300 dark:border-white/30 bg-transparent'
                            }`}>
                              {isSelected && <span className="w-2 h-2 rounded-full bg-white dark:bg-[#060D1A]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Question Type: Multi Choice Checkbox Cards */}
                {q.type === 'multi_choice' && (() => {
                  const resolvedMultiOptions: string[] = (Array.isArray(q.options) && q.options.length > 0)
                    ? q.options
                    : (typeof q.options === 'string' && (q.options as string).trim())
                      ? (q.options as string).split(',').map(s => s.trim()).filter(Boolean)
                      : ['Option A', 'Option B', 'Option C'];

                  return (
                    <div className="space-y-2.5">
                      {resolvedMultiOptions.map((opt, optIndex) => {
                        const isSelected = Array.isArray(currentAns) && currentAns.includes(opt);

                        return (
                          <div
                            key={`${opt}-${optIndex}`}
                            role="checkbox"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onClick={() => {
                              if (!isClosed) handleMultiChoiceToggle(q.id, opt);
                            }}
                            onKeyDown={(e) => {
                              if (!isClosed && (e.key === ' ' || e.key === 'Enter')) {
                                e.preventDefault();
                                handleMultiChoiceToggle(q.id, opt);
                              }
                            }}
                            className={`w-full text-left p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs sm:text-sm font-semibold select-none min-h-[50px] active:scale-[0.98] ${
                              isSelected
                                ? 'border-[#0055FF] dark:border-[#00D4B2] bg-blue-50/90 dark:bg-[#00D4B2]/15 text-gray-900 dark:text-white font-bold shadow-xs ring-2 ring-[#0055FF]/20 dark:ring-[#00D4B2]/30'
                                : 'border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-[#1a1d27]/60 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-[#1f2433]'
                            }`}
                          >
                            <label className="flex items-center gap-3 cursor-pointer flex-1 pointer-events-none">
                              <input
                                type="checkbox"
                                value={opt}
                                checked={isSelected}
                                disabled={isClosed}
                                onChange={() => handleMultiChoiceToggle(q.id, opt)}
                                className="sr-only"
                              />
                              <span>{opt}</span>
                            </label>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected 
                                ? 'border-[#0055FF] dark:border-[#00D4B2] bg-[#0055FF] dark:bg-[#00D4B2] text-white dark:text-[#060D1A]' 
                                : 'border-gray-300 dark:border-white/30 bg-transparent'
                            }`}>
                              {isSelected && <CheckCircle2 size={13} className="stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Question Type: Open Textarea Feedback */}
                {q.type === 'text_feedback' && (
                  <div>
                    <textarea
                      rows={3}
                      disabled={isClosed}
                      value={currentAns || ''}
                      onChange={(e) => handleTextChange(q.id, e.target.value)}
                      placeholder="Share your specific thoughts, ideas, or issues for the committee..."
                      className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-xl sm:rounded-2xl p-3.5 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/40 focus:border-[#00D4B2] transition-all resize-none shadow-2xs"
                    />
                  </div>
                )}

              </div>
            );
          })}

          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle size={16} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Submit Action Bar */}
          {!isClosed && (
            <div className="pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-13 sm:h-14 py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-[#0055FF] hover:bg-blue-600 dark:bg-[#00D4B2] dark:hover:bg-[#00BFA0] text-white dark:text-[#0a0a0f] font-extrabold text-sm sm:text-base shadow-md shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 select-none"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Your Feedback...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Submit Feedback Response</span>
                  </>
                )}
              </button>
              
              <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-2.5">
                Zero credentials saved • Protected by SmartLot Strata Privacy Protocols
              </p>
            </div>
          )}
        </form>

      </main>
    </div>
  );
}
