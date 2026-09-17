// @smartlot/component GuestSurveyView
// Mobile-first, zero-login standalone feedback view for residents.
import React, { useState } from 'react';
import { SmartLotLogo } from './core/SmartLotLogo';
import { Survey, SurveyQuestion } from '../types';
import { SmartLotStore } from '../store/smartLotStore';
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
  HelpCircle
} from 'lucide-react';

interface GuestSurveyViewProps {
  surveyToken: string;
  store: SmartLotStore;
  onClose?: () => void;
}

export function GuestSurveyView({ surveyToken, store, onClose }: GuestSurveyViewProps) {
  // Find matching survey by ID or token
  const survey: Survey | undefined = 
    store.surveys.find(s => s.id === surveyToken) ||
    store.surveys.find(s => s.id.toLowerCase().includes(surveyToken.toLowerCase())) ||
    store.surveys[0]; // fallback to first active survey if demo

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

  if (!survey) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#0d1117] border border-gray-200/80 dark:border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-heading font-black text-gray-900 dark:text-white mb-2">Survey Not Found</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            The feedback questionnaire link you opened is invalid or may have been removed.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm hover:opacity-90 transition-all cursor-pointer"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const isClosed = survey.status === 'closed' || (survey.deadline && new Date(survey.deadline).getTime() < Date.now());

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

  const handleSubmit = (e: React.FormEvent) => {
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

    setTimeout(() => {
      store.submitSurveyResponse({
        surveyId: survey.id,
        schemeId: survey.schemeId,
        unitId: isAnonymous ? undefined : selectedUnit.trim(),
        respondentName: isAnonymous ? undefined : (residentName.trim() || undefined),
        isAnonymous,
        answers,
      });
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
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
      <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#0d1117] border border-gray-200/80 dark:border-white/10 rounded-3xl p-8 sm:p-10 max-w-lg w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={36} className="stroke-[2.5]" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-3 border border-emerald-500/20">
            <CheckCircle2 size={13} /> Response Recorded
          </span>

          <h1 className="text-2xl sm:text-3xl font-heading font-black text-gray-900 dark:text-white mb-3">
            Thank You for Your Voice!
          </h1>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Your feedback has been securely delivered to the <strong>Strata Committee</strong> and <strong>Strata Management Agency</strong> for {activeScheme?.name || 'your building'}.
          </p>

          <div className="bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-2xl p-4 text-left mb-6 space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Survey:</span>
              <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{survey.title}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Privacy Mode:</span>
              <span className="font-bold text-[#00D4B2]">
                {isAnonymous ? '🔒 Total Anonymity' : `Unit ${selectedUnit || 'Submitted'}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Submitted:</span>
              <span>{new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {onClose ? (
            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-xl bg-[#0055FF] hover:bg-blue-600 dark:bg-[#00D4B2] dark:hover:bg-[#00BFA0] text-white dark:text-[#0a0a0f] font-bold text-sm shadow-sm transition-all cursor-pointer"
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
      <header className="w-full bg-white dark:bg-[#0d1117] border-b border-gray-200/80 dark:border-white/10 sticky top-0 z-30 shadow-xs backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SmartLotLogo className="h-7" />
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />
            <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden sm:inline">
              Resident Voice & Feedback
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-200/80 dark:border-white/10">
              <ShieldCheck size={14} className="text-[#00D4B2]" />
              <span className="hidden sm:inline">Zero Login Required</span>
              <span className="sm:hidden">Zero Login</span>
            </div>

            <button
              type="button"
              onClick={() => store.setTheme(store.theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-all cursor-pointer"
              title={`Switch to ${store.theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {store.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-2xl px-4 pt-6 sm:pt-8">
        
        {/* Closed Survey Banner */}
        {isClosed && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <Clock size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-sm mb-0.5">This Survey Round Has Concluded</h3>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                The deadline for this feedback round was {survey.deadline || 'reached'}. New submissions are currently disabled.
              </p>
            </div>
          </div>
        )}

        {/* Survey Hero Card */}
        <div className="bg-white dark:bg-[#0d1117] border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm mb-6 relative overflow-hidden">

          {/* Scheme & Category Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D4B2]/10 text-[#00A38C] dark:text-[#00D4B2] text-xs font-black uppercase tracking-wider">
              <Building2 size={13} />
              {activeScheme?.name || 'Cavallo Sydney'}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
              {survey.category}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs font-medium">
              <Clock size={12} /> ~2 min
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-heading font-black text-gray-900 dark:text-white mb-2 leading-tight">
            {survey.title}
          </h1>

          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {survey.description}
          </p>

          {survey.deadline && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Closing Deadline:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{survey.deadline}</span>
            </div>
          )}
        </div>

        {/* Privacy & Unit Identifier Section */}
        <div className="bg-white dark:bg-[#0d1117] border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${isAnonymous ? 'bg-emerald-500/15 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {isAnonymous ? <Lock size={18} /> : <Home size={18} />}
              </div>
              <div>
                <h3 className="text-sm font-heading font-bold text-gray-900 dark:text-white">
                  {isAnonymous ? 'Anonymous Submission Active' : 'Unit Identification'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Unit / Lot Number <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => {
                    setSelectedUnit(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#00D4B2] cursor-pointer"
                >
                  <option value="">Select your unit...</option>
                  {Array.from({ length: 32 }, (_, i) => `Unit ${i + 1}`).map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                  <option value="Townhouse / Commercial">Townhouse / Commercial</option>
                  <option value="Other">Other Lot</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Your Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#00D4B2]"
                />
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
        <form onSubmit={handleSubmit} className="space-y-5">
          {survey.questions.map((q, idx) => {
            const currentAns = answers[q.id];

            return (
              <div 
                key={q.id}
                className="bg-white dark:bg-[#0d1117] border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm hover:border-[#0055FF]/40 dark:hover:border-[#00D4B2]/40 transition-all"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Question {idx + 1} of {survey.questions.length} • {q.category}
                  </span>
                  {q.required && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">
                      Required
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-lg font-heading font-bold text-gray-900 dark:text-white mb-4">
                  {q.questionText}
                </h2>

                {/* Question Type: Star Rating */}
                {q.type === 'star_rating' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3">
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
                            className="p-1 sm:p-2 rounded-xl transition-all transform hover:scale-115 active:scale-95 cursor-pointer disabled:cursor-not-allowed focus:outline-none"
                            title={`${star} Star - ${getStarLabel(star)}`}
                          >
                            <Star 
                              size={32}
                              className={`transition-all ${
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
                    <div className="h-5 text-xs font-bold text-amber-500 dark:text-amber-400">
                      {(hoveredStar[q.id] || currentAns) ? `${hoveredStar[q.id] || currentAns} / 5 Stars — ${getStarLabel(hoveredStar[q.id] || currentAns)}` : ''}
                    </div>
                  </div>
                )}

                {/* Question Type: NPS Score (0 to 10) */}
                {q.type === 'nps_score' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
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
                            className={`py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer border border-transparent disabled:opacity-50 ${colorClass}`}
                          >
                            {score}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 font-semibold px-1">
                      <span>0 = Not likely at all</span>
                      <span>10 = Extremely likely</span>
                    </div>
                  </div>
                )}

                {/* Question Type: Single Choice Radio Cards */}
                {q.type === 'single_choice' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isSelected = currentAns === opt;

                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={isClosed}
                          onClick={() => handleChoiceSelect(q.id, opt)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs sm:text-sm font-semibold ${
                            isSelected
                              ? 'border-[#0055FF] dark:border-[#00D4B2] bg-blue-50/60 dark:bg-[#00D4B2]/10 text-gray-900 dark:text-white font-bold shadow-xs'
                              : 'border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-[#1a1d27]/60 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
                          }`}
                        >
                          <span>{opt}</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#0055FF] dark:border-[#00D4B2] bg-[#0055FF] dark:bg-[#00D4B2]' : 'border-gray-300 dark:border-white/20'
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Question Type: Multi Choice Checkbox Cards */}
                {q.type === 'multi_choice' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isSelected = Array.isArray(currentAns) && currentAns.includes(opt);

                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={isClosed}
                          onClick={() => handleMultiChoiceToggle(q.id, opt)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs sm:text-sm font-semibold ${
                            isSelected
                              ? 'border-[#0055FF] dark:border-[#00D4B2] bg-blue-50/60 dark:bg-[#00D4B2]/10 text-gray-900 dark:text-white font-bold shadow-xs'
                              : 'border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-[#1a1d27]/60 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20'
                          }`}
                        >
                          <span>{opt}</span>
                          <span className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isSelected ? 'border-[#0055FF] dark:border-[#00D4B2] bg-[#0055FF] dark:bg-[#00D4B2] text-white dark:text-[#0a0a0f]' : 'border-gray-300 dark:border-white/20'
                          }`}>
                            {isSelected && <CheckCircle2 size={12} className="stroke-[3]" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Question Type: Open Textarea Feedback */}
                {q.type === 'text_feedback' && (
                  <div>
                    <textarea
                      rows={3}
                      disabled={isClosed}
                      value={currentAns || ''}
                      onChange={(e) => handleTextChange(q.id, e.target.value)}
                      placeholder="Share your specific thoughts, ideas, or issues for the committee..."
                      className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#00D4B2] resize-none"
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
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-xl bg-[#0055FF] hover:bg-blue-600 dark:bg-[#00D4B2] dark:hover:bg-[#00BFA0] text-white dark:text-[#0a0a0f] font-bold text-base shadow-md shadow-blue-500/20 active:scale-[0.99] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
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
              
              <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-3">
                Zero credentials saved • Protected by SmartLot Strata Privacy Protocols
              </p>
            </div>
          )}
        </form>

      </main>
    </div>
  );
}
