// @smartlot/component SurveyBuilderModal
// Premium Google Forms-style Questionnaire Builder designed for high readability, modern polish, and ease of use (55+ friendly).
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ClipboardCheck,
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Copy,
  Star,
  CheckCircle2,
  ListFilter,
  FileText,
  BarChart3,
  Calendar,
  Users,
  Send,
  Building2,
  Award,
  Sparkles,
  Wrench,
  Tag,
  Check,
  Home,
  ShieldCheck,
  Clock,
  ChevronDown
} from 'lucide-react';
import { SurveyQuestion, SurveyCategory, SurveyQuestionType, Survey } from '../types';
import { SmartLotStore } from '../store/smartLotStore';
import { CustomSelect, SelectOption } from './core/CustomSelect';
import { CustomCheckbox } from './core/CustomCheckbox';

const SURVEY_CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'Annual Satisfaction', label: 'Annual Satisfaction', icon: <Star size={15} className="text-amber-500 fill-amber-400" /> },
  { value: 'Strata Management Performance', label: 'Strata Management Performance', icon: <Award size={15} className="text-blue-500" /> },
  { value: 'Building & Amenities', label: 'Building & Amenities', icon: <Building2 size={15} className="text-emerald-500" /> },
  { value: 'Cleanliness & Maintenance', label: 'Cleanliness & Maintenance', icon: <Sparkles size={15} className="text-purple-500" /> },
  { value: 'Renovation & Upgrades', label: 'Renovation & Upgrades', icon: <Wrench size={15} className="text-amber-600" /> },
  { value: 'General Feedback', label: 'General Feedback', icon: <FileText size={15} className="text-[#00D4B2]" /> },
];

const QUESTION_TYPE_OPTIONS: SelectOption[] = [
  { value: 'star_rating', label: '1 to 5 Star Rating', icon: <Star size={14} className="text-amber-500 fill-amber-400" /> },
  { value: 'single_choice', label: 'Single Choice (Select One)', icon: <CheckCircle2 size={14} className="text-blue-500" /> },
  { value: 'multi_choice', label: 'Multiple Choice (Select Multiple)', icon: <ListFilter size={14} className="text-purple-500" /> },
  { value: 'text_feedback', label: 'Written Answer (Text Box)', icon: <FileText size={14} className="text-emerald-500" /> },
  { value: 'nps_score', label: 'Rating Scale (0 to 10)', icon: <BarChart3 size={14} className="text-cyan-500" /> },
];

export interface SurveyBuilderFormContentProps {
  store: SmartLotStore;
  onClose?: () => void;
  onSurveyCreated?: (newSurvey: Survey) => void;
  surveyToEdit?: Survey | null;
  onSurveyUpdated?: (updatedSurvey: Survey) => void;
}

const getDeadlinePreset = (daysFromNow: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

const normalizeDateInput = (val?: string | null): string => {
  if (!val) return '';
  if (val.includes('T')) return val.split('T')[0];
  if (val.includes(' ')) return val.split(' ')[0];
  return val;
};

export function SurveyBuilderFormContent({
  store,
  onClose,
  onSurveyCreated,
  surveyToEdit,
  onSurveyUpdated
}: SurveyBuilderFormContentProps) {
  const activeScheme = store.activeScheme;

  // Retrieve scheme members to automatically dispatch to owners/tenants
  const schemeMembers = React.useMemo(() => {
    const memberMap = new Map<string, { email: string; name: string; role: string }>();
    const currentSchemeId = (activeScheme?.id || '').toLowerCase();

    (store.members || [])
      .filter(m => (m.schemeId || '').toLowerCase() === currentSchemeId && m.email && m.email.trim())
      .forEach(m => {
        const cleanEmail = m.email.trim();
        if (cleanEmail.includes('@')) {
          memberMap.set(cleanEmail.toLowerCase(), {
            email: cleanEmail,
            name: m.name || cleanEmail.split('@')[0],
            role: m.role || 'Resident',
          });
        }
      });

    (store.units || [])
      .filter(u => (u.schemeId || '').toLowerCase() === currentSchemeId)
      .forEach(u => {
        (u.actors || []).forEach(a => {
          if (a.email && a.email.trim() && a.email.includes('@')) {
            const cleanEmail = a.email.trim();
            if (!memberMap.has(cleanEmail.toLowerCase())) {
              memberMap.set(cleanEmail.toLowerCase(), {
                email: cleanEmail,
                name: a.name || cleanEmail.split('@')[0],
                role: a.role || 'Resident',
              });
            }
          }
        });
      });

    return Array.from(memberMap.values());
  }, [store.members, store.units, activeScheme.id]);

  const ownerMembers = React.useMemo(() => {
    return schemeMembers.filter(m => {
      const r = (m.role || '').toLowerCase();
      return r.includes('owner') || r.includes('committee') || r.includes('proprietor') || r.includes('admin');
    });
  }, [schemeMembers]);

  const tenantMembers = React.useMemo(() => {
    return schemeMembers.filter(m => {
      const r = (m.role || '').toLowerCase();
      return r.includes('tenant') || r.includes('resident') || r.includes('occupant') || r.includes('renter');
    });
  }, [schemeMembers]);

  // Form State
  const [title, setTitle] = useState(() => surveyToEdit?.title || `Building Feedback Survey ${new Date().getFullYear()}`);
  const [description, setDescription] = useState(
    () => surveyToEdit?.description || `We invite all residents at ${activeScheme.name} to share feedback to guide our Strata Committee priorities.`
  );
  const [category, setCategory] = useState<SurveyCategory>(() => surveyToEdit?.category || 'Annual Satisfaction');
  const [deadline, setDeadline] = useState(() => normalizeDateInput(surveyToEdit?.deadline) || getDeadlinePreset(14));

  // Audience Filter: 3 clear, big options
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'owners' | 'tenants'>(() => {
    if (surveyToEdit) {
      return surveyToEdit.targetAudience === 'Owners Only' ? 'owners' :
        surveyToEdit.targetAudience === 'Tenants Only' ? 'tenants' : 'all';
    }
    return 'all';
  });

  // Questions State: defaults to 2 intuitive questions if creating new
  const [questions, setQuestions] = useState<SurveyQuestion[]>(() => {
    if (surveyToEdit && surveyToEdit.questions && surveyToEdit.questions.length > 0) {
      return surveyToEdit.questions;
    }
    return [
      {
        id: 'q_1',
        questionText: 'How satisfied are you with the overall maintenance and cleanliness of our building?',
        category: 'Cleanliness & Maintenance',
        type: 'star_rating',
        required: true,
        order: 1,
      },
      {
        id: 'q_2',
        questionText: 'Which building facilities or services do you think need the most attention?',
        category: 'Building & Amenities',
        type: 'multi_choice',
        options: ['Lifts / Elevators', 'Garden & Landscaping', 'Visitor Parking', 'Bin Room & Waste', 'Security & Intercom'],
        required: false,
        order: 2,
      },
      {
        id: 'q_3',
        questionText: 'Do you have any suggestions, comments, or concerns for the Strata Committee?',
        category: 'General Feedback',
        type: 'text_feedback',
        required: false,
        order: 3,
      },
    ];
  });

  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(() => questions[0]?.id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Refs for auto-scrolling and auto-focusing on newly added questions
  const questionInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Keep form in sync when editing changes
  useEffect(() => {
    if (surveyToEdit) {
      setTitle(surveyToEdit.title);
      setDescription(surveyToEdit.description);
      setCategory(surveyToEdit.category);
      setDeadline(normalizeDateInput(surveyToEdit.deadline) || '');
      setQuestions(surveyToEdit.questions || []);
      setAudienceFilter(
        surveyToEdit.targetAudience === 'Owners Only' ? 'owners' :
        surveyToEdit.targetAudience === 'Tenants Only' ? 'tenants' : 'all'
      );
    }
  }, [surveyToEdit]);

  // Compute selected recipients count
  const targetRecipientCount = audienceFilter === 'owners' 
    ? ownerMembers.length 
    : audienceFilter === 'tenants' 
      ? tenantMembers.length 
      : schemeMembers.length;

  // Add Question Handler with Auto-Scroll & Auto-Focus
  const handleAddQuestion = () => {
    const newId = `q_${Date.now()}`;
    const newQuestion: SurveyQuestion = {
      id: newId,
      questionText: '',
      category: 'General Feedback',
      type: 'star_rating',
      required: true,
      order: questions.length + 1,
    };

    setQuestions(prev => [...prev, newQuestion]);
    setActiveQuestionId(newId);

    // Smooth scroll and focus the new question
    setTimeout(() => {
      const el = document.getElementById(`survey-question-${newId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const input = questionInputRefs.current[newId];
      if (input) {
        input.focus();
      }
    }, 120);
  };

  // Duplicate Question Handler with Auto-Scroll
  const handleDuplicateQuestion = (idx: number) => {
    const source = questions[idx];
    const newId = `q_${Date.now()}`;
    const copy: SurveyQuestion = {
      ...source,
      id: newId,
      questionText: `${source.questionText} (Copy)`,
      options: source.options ? [...source.options] : undefined,
      order: idx + 2,
    };
    const nextQuestions = [...questions];
    nextQuestions.splice(idx + 1, 0, copy);
    setQuestions(nextQuestions.map((q, i) => ({ ...q, order: i + 1 })));
    setActiveQuestionId(newId);

    setTimeout(() => {
      const el = document.getElementById(`survey-question-${newId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const input = questionInputRefs.current[newId];
      if (input) {
        input.focus();
      }
    }, 120);
  };

  // Delete Question Handler
  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      alert('Your questionnaire needs at least one question.');
      return;
    }
    setQuestions(prev => prev.filter(q => q.id !== id).map((q, idx) => ({ ...q, order: idx + 1 })));
  };

  // Reorder Question Handler
  const handleMoveQuestion = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === questions.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const next = [...questions];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    const updated = next.map((q, i) => ({ ...q, order: i + 1 }));
    setQuestions(updated);
    const movedId = updated[targetIdx].id;
    setActiveQuestionId(movedId);

    setTimeout(() => {
      const el = document.getElementById(`survey-question-${movedId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  // Question Text Change
  const handleQuestionTextChange = (id: string, text: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, questionText: text } : q));
  };

  // Question Type Change
  const handleQuestionTypeChange = (id: string, type: SurveyQuestionType) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== id) return q;
      let options = q.options;
      if ((type === 'single_choice' || type === 'multi_choice') && (!options || options.length === 0)) {
        options = ['Option 1', 'Option 2', 'Option 3'];
      }
      return { ...q, type, options };
    }));
  };

  // Question Required Toggle
  const handleQuestionRequiredToggle = (id: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, required: !q.required } : q));
  };

  // Option Change
  const handleOptionChange = (questionId: string, optIdx: number, val: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId || !q.options) return q;
      const nextOpts = [...q.options];
      nextOpts[optIdx] = val;
      return { ...q, options: nextOpts };
    }));
  };

  // Add Option
  const handleAddOption = (questionId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q;
      const nextOpts = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
      return { ...q, options: nextOpts };
    }));
  };

  // Remove Option
  const handleRemoveOption = (questionId: string, optIdx: number) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId || !q.options) return q;
      if (q.options.length <= 1) return q;
      const nextOpts = q.options.filter((_, i) => i !== optIdx);
      return { ...q, options: nextOpts };
    }));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Please enter a title for this questionnaire.');
      return;
    }

    const hasEmptyQuestions = questions.some(q => !q.questionText.trim());
    if (hasEmptyQuestions) {
      setErrorMessage('Please ensure all questions have a question title written.');
      return;
    }

    setIsSubmitting(true);

    // Compute recipients based on selected audience
    const resolvedEmails = audienceFilter === 'owners'
      ? (ownerMembers.length > 0 ? ownerMembers.map(m => m.email) : schemeMembers.map(m => m.email))
      : audienceFilter === 'tenants'
        ? (tenantMembers.length > 0 ? tenantMembers.map(m => m.email) : schemeMembers.map(m => m.email))
        : schemeMembers.map(m => m.email);

    // Fallback if no members registered
    const finalRecipients = resolvedEmails.length > 0 
      ? resolvedEmails 
      : [store.activePersona.email || 'resident@smartlot.com'];

    // Sanitize questions
    const sanitizedQuestions: SurveyQuestion[] = questions.map(q => {
      if (q.type === 'single_choice' || q.type === 'multi_choice') {
        const validOpts = (q.options || []).map(o => o.trim()).filter(Boolean);
        return {
          ...q,
          options: validOpts.length > 0 ? validOpts : ['Yes', 'No', 'Unsure']
        };
      }
      return q;
    });

    try {
      if (surveyToEdit) {
        const updated = await store.updateSurvey(surveyToEdit.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          targetAudience: audienceFilter === 'all' ? 'All Residents' : audienceFilter === 'owners' ? 'Owners Only' : 'Tenants Only',
          recipientEmails: finalRecipients,
          deadline: deadline.trim() || undefined,
          questions: sanitizedQuestions,
        });
        if (updated) {
          onSurveyUpdated?.(updated);
        }
        onClose?.();
      } else {
        const newSurvey = await store.createSurvey({
          schemeId: activeScheme.id,
          title: title.trim(),
          description: description.trim(),
          category,
          status: 'active',
          targetAudience: audienceFilter === 'all' ? 'All Residents' : audienceFilter === 'owners' ? 'Owners Only' : 'Tenants Only',
          recipientEmails: finalRecipients,
          deadline: deadline.trim() || undefined,
          questions: sanitizedQuestions,
          createdBy: {
            name: store.activePersona.name,
            role: store.activePersona.role,
            email: store.activePersona.email,
          },
        });

        onSurveyCreated?.(newSurvey);
        onClose?.();
      }
    } catch (err) {
      console.error('Error saving questionnaire:', err);
      setErrorMessage('Could not save questionnaire. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F4F6F9] dark:bg-[#07090e] w-full max-w-4xl h-full flex flex-col min-h-0 flex-1 overflow-hidden font-sans">
      
      {/* ── Top Header Navigation Bar ────────────────────────────────────────── */}
      <header className="px-4 sm:px-8 py-3 sm:py-4 bg-white dark:bg-[#0d1117] border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between shrink-0 shadow-2xs z-30">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#00897B] to-[#004D40] dark:from-[#00D4B2] dark:to-[#00897B] text-white dark:text-[#050A15] flex items-center justify-center shrink-0 shadow-sm shadow-[#00897B]/20">
            <ClipboardCheck size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-xl font-heading font-black text-gray-900 dark:text-white truncate">
                {surveyToEdit ? 'Edit Questionnaire' : 'New Questionnaire'}
              </h2>
              <span className="text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-[#00897B]/10 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] border border-[#00897B]/20 dark:border-[#00D4B2]/30 shrink-0 truncate max-w-[130px] sm:max-w-none">
                {activeScheme.name}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate sm:whitespace-normal">
              Google Forms-style editor • Easy to answer on mobile & computer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Add Question Button in Topbar for Instant Accessibility */}
          <button
            type="button"
            onClick={handleAddQuestion}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all cursor-pointer border border-gray-200 dark:border-white/10 active:scale-95"
            title="Add a new question and jump to it"
          >
            <Plus size={14} strokeWidth={2.5} className="text-[#00897B] dark:text-[#00D4B2]" />
            <span>Add Question</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer shrink-0"
            aria-label="Close form builder"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* ── Main Scrollable Canvas ───────────────────────────────────────────── */}
      <form 
        ref={scrollContainerRef}
        onSubmit={handleSubmit} 
        className="flex-1 overflow-y-auto px-3.5 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 scroll-smooth"
      >
        
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-sm font-bold flex items-center gap-2.5 animate-in fade-in shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 animate-ping" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Header Card: Sleek Modern Branding Ribbon + Title & Description */}
        <section className="bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-200/90 dark:border-white/10 shadow-sm relative z-20 group">
          
          {/* Visual Header Ribbon Banner */}
          <div className="h-24 sm:h-32 bg-gradient-to-r from-[#0B1121] via-[#0F172A] to-[#004D40] dark:from-[#080d19] dark:via-[#0c1427] dark:to-[#002e26] p-4 sm:p-7 flex flex-col justify-between relative rounded-t-3xl overflow-hidden text-white border-b border-white/10">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D4B2]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-[#0055FF]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#00D4B2] text-[10px] sm:text-[11px] font-mono font-bold border border-white/15">
                <Building2 size={12} /> {activeScheme.id}
              </span>
              <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                <Users size={13} className="text-[#00D4B2]" />
                <span>{targetRecipientCount} {targetRecipientCount === 1 ? 'Resident' : 'Residents'} targeted</span>
              </span>
            </div>

            <div className="relative z-10">
              <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#00D4B2] font-black">
                Official Strata Questionnaire
              </span>
            </div>
          </div>

          {/* Form Title & Description Inputs */}
          <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                Questionnaire Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Resident Satisfaction Survey 2026"
                className="w-full text-lg sm:text-2xl font-black text-gray-900 dark:text-white bg-transparent border-b-2 border-gray-200 dark:border-white/10 pb-2.5 focus:outline-none focus:border-[#00897B] dark:focus:border-[#00D4B2] transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 font-heading"
                required
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                Description / Purpose for Residents
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly explain what this questionnaire is for and how resident responses will be used by the Committee..."
                className="w-full text-xs sm:text-base text-gray-800 dark:text-gray-200 bg-gray-50/80 dark:bg-[#121622] border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/30 focus:border-[#00D4B2] transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 leading-relaxed font-medium"
              />
            </div>

            {/* Quick Settings Row: Category & Closing Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-4 border-t border-gray-100 dark:border-white/5">
              <div className="space-y-1.5 relative z-30">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Tag size={14} className="text-[#00897B] dark:text-[#00D4B2]" />
                  <span>Topic / Category</span>
                </label>
                <CustomSelect
                  value={category}
                  onChange={(val) => setCategory(val as SurveyCategory)}
                  options={SURVEY_CATEGORY_OPTIONS}
                  placeholder="Select category"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#00897B] dark:text-[#00D4B2]" />
                    <span>Responses Close On</span>
                  </span>
                  {deadline && (
                    <span className="text-[11px] font-mono text-[#00897B] dark:text-[#00D4B2] font-semibold">
                      {new Date(deadline).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </label>
                
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="flex-1 min-w-0 h-11 bg-white dark:bg-[#121622] border border-gray-200 dark:border-white/10 rounded-2xl px-3 sm:px-4 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/30 focus:border-[#00D4B2] transition-all cursor-pointer shadow-2xs"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDeadline(getDeadlinePreset(7))}
                      className="px-2.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[11px] font-bold text-gray-600 dark:text-gray-300 cursor-pointer transition-all"
                      title="Set deadline to 7 days from now"
                    >
                      7d
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeadline(getDeadlinePreset(14))}
                      className="px-2.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[11px] font-bold text-gray-600 dark:text-gray-300 cursor-pointer transition-all"
                      title="Set deadline to 14 days from now"
                    >
                      14d
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 2. Target Audience Card: Who should answer? */}
        <section className="bg-white dark:bg-[#0d1117] rounded-3xl p-4 sm:p-8 border border-gray-200/90 dark:border-white/10 shadow-sm space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-[#00897B] dark:text-[#00D4B2]" />
                <span>Target Audience</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Select who will receive this questionnaire. Direct submission links will be generated automatically.
              </p>
            </div>

            <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#00897B] dark:text-[#00D4B2] text-xs font-bold border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1.5 shrink-0">
              <CheckCircle2 size={13} />
              <span>{targetRecipientCount} {targetRecipientCount === 1 ? 'Person' : 'People'} will receive this</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            
            {/* All Residents Option */}
            <div
              onClick={() => setAudienceFilter('all')}
              className={`p-3.5 sm:p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between relative group ${
                audienceFilter === 'all'
                  ? 'border-[#00897B] dark:border-[#00D4B2] bg-emerald-50/40 dark:bg-[#00D4B2]/10 ring-2 ring-[#00897B]/20 dark:ring-[#00D4B2]/30 shadow-xs'
                  : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#121622]/50 hover:bg-gray-100/60 dark:hover:bg-[#121622]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                    <Building2 size={16} />
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    audienceFilter === 'all' 
                      ? 'bg-[#00897B] dark:bg-[#00D4B2] border-[#00897B] dark:border-[#00D4B2] text-white dark:text-black scale-105' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {audienceFilter === 'all' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                  All Residents & Owners
                </h4>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                Building-wide community feedback ({schemeMembers.length} enrolled members).
              </p>
            </div>

            {/* Lot Owners Only */}
            <div
              onClick={() => setAudienceFilter('owners')}
              className={`p-3.5 sm:p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between relative group ${
                audienceFilter === 'owners'
                  ? 'border-[#00897B] dark:border-[#00D4B2] bg-emerald-50/40 dark:bg-[#00D4B2]/10 ring-2 ring-[#00897B]/20 dark:ring-[#00D4B2]/30 shadow-xs'
                  : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#121622]/50 hover:bg-gray-100/60 dark:hover:bg-[#121622]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                    <ShieldCheck size={16} />
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    audienceFilter === 'owners' 
                      ? 'bg-[#00897B] dark:border-[#00D4B2] border-[#00897B] dark:border-[#00D4B2] text-white dark:text-black scale-105' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {audienceFilter === 'owners' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                  Lot Owners Only
                </h4>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                For financial decisions, by-laws, and major works ({ownerMembers.length} owners).
              </p>
            </div>

            {/* Tenants Only */}
            <div
              onClick={() => setAudienceFilter('tenants')}
              className={`p-3.5 sm:p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between relative group ${
                audienceFilter === 'tenants'
                  ? 'border-[#00897B] dark:border-[#00D4B2] bg-emerald-50/40 dark:bg-[#00D4B2]/10 ring-2 ring-[#00897B]/20 dark:ring-[#00D4B2]/30 shadow-xs'
                  : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#121622]/50 hover:bg-gray-100/60 dark:hover:bg-[#121622]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                    <Home size={16} />
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    audienceFilter === 'tenants' 
                      ? 'bg-[#00897B] dark:border-[#00D4B2] border-[#00897B] dark:border-[#00D4B2] text-white dark:text-black scale-105' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {audienceFilter === 'tenants' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                  Tenants Only
                </h4>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                For amenities, noise, parking, and daily living ({tenantMembers.length} tenants).
              </p>
            </div>

          </div>
        </section>

        {/* 3. Questions Section: Google Forms Stacked Question Cards */}
        <section className="space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                Questions ({questions.length})
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Click any question to edit. Add choices, rating scales, or written comment boxes.
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleAddQuestion}
              className="w-full sm:w-auto h-11 sm:h-10 px-4.5 rounded-2xl bg-[#00897B] hover:bg-[#00796B] dark:bg-[#00D4B2] dark:hover:bg-[#00BFA0] text-white dark:text-[#050A15] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Add Question</span>
            </button>
          </div>

          {/* Render Stacked Question Cards */}
          {questions.map((q, idx) => {
            const isChoiceType = q.type === 'single_choice' || q.type === 'multi_choice';
            const isActive = activeQuestionId === q.id;

            return (
              <div 
                key={q.id}
                id={`survey-question-${q.id}`}
                onClick={() => setActiveQuestionId(q.id)}
                style={{ zIndex: activeQuestionId === q.id ? 30 : questions.length - idx + 5 }}
                className={`relative bg-white dark:bg-[#0d1117] rounded-3xl p-4 sm:p-7 border transition-all duration-200 shadow-sm space-y-4 scroll-mt-24 ${
                  isActive
                    ? 'border-l-6 border-l-[#00897B] dark:border-l-[#00D4B2] border-gray-300 dark:border-white/20 shadow-md ring-2 ring-[#00897B]/10 dark:ring-[#00D4B2]/15'
                    : 'border-l-4 border-l-transparent border-gray-200/90 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                }`}
              >
                {/* Question Header: Number & Question Type Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-colors shrink-0 ${
                      isActive 
                        ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15] shadow-xs' 
                        : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400">
                        Question {idx + 1} of {questions.length}
                      </span>
                      {q.required && (
                        <span className="ml-2 text-[10px] font-bold text-rose-500 uppercase tracking-wide">
                          * Required
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Type Dropdown */}
                  <div className="w-full sm:w-64 shrink-0 relative z-40">
                    <CustomSelect
                      value={q.type}
                      onChange={(newType) => handleQuestionTypeChange(q.id, newType as SurveyQuestionType)}
                      options={QUESTION_TYPE_OPTIONS}
                      placeholder="Select Question Type"
                    />
                  </div>
                </div>

                {/* Question Title Input Field */}
                <div className="space-y-1.5">
                  <input
                    ref={(el) => { questionInputRefs.current[q.id] = el; }}
                    type="text"
                    value={q.questionText}
                    onChange={(e) => handleQuestionTextChange(q.id, e.target.value)}
                    placeholder="Enter your question here (e.g., How satisfied are you with common area cleanliness?)"
                    className="w-full text-sm sm:text-lg font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-[#121622] border border-gray-200 dark:border-white/10 rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5 focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/40 focus:border-[#00D4B2] transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600 leading-snug"
                  />
                </div>

                {/* Multiple / Single Choice Options List */}
                {isChoiceType && (
                  <div className="space-y-2.5 pt-1 pl-0 sm:pl-2">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 block">
                      Options (Residents will select from these):
                    </label>

                    <div className="space-y-2">
                      {(q.options || []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2 group">
                          <div className={`w-5 h-5 border border-gray-300 dark:border-gray-600 flex items-center justify-center shrink-0 ${
                            q.type === 'single_choice' ? 'rounded-full' : 'rounded-md'
                          }`}>
                            <span className="text-[10px] font-bold text-gray-400">{optIdx + 1}</span>
                          </div>

                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(q.id, optIdx, e.target.value)}
                            placeholder={`Option ${optIdx + 1}`}
                            className="flex-1 min-w-0 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/30 focus:border-[#00D4B2]"
                          />

                          {(q.options || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(q.id, optIdx)}
                              className="p-1.5 sm:p-2 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer shrink-0 opacity-80 sm:opacity-70 group-hover:opacity-100"
                              title="Remove option"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddOption(q.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00897B] dark:text-[#00D4B2] hover:underline pt-1 cursor-pointer"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      <span>Add Another Option</span>
                    </button>
                  </div>
                )}

                {/* Visual Answer Preview for Non-Choice Types */}
                {!isChoiceType && (
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-gray-50/80 dark:bg-[#121622]/60 border border-gray-100 dark:border-white/5 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                    {q.type === 'star_rating' && (
                      <>
                        <div className="flex items-center gap-1 text-amber-400 shrink-0">
                          {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} className="fill-amber-400" />)}
                        </div>
                        <span className="font-medium text-xs">Residents tap 1 to 5 stars to answer.</span>
                      </>
                    )}
                    {q.type === 'nps_score' && (
                      <div className="flex flex-col gap-1.5 w-full min-w-0">
                        <div className="flex items-center gap-1 font-mono font-bold text-[10px] text-cyan-600 dark:text-cyan-400 overflow-x-auto py-0.5">
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <span key={n} className="w-5 h-5 shrink-0 rounded bg-cyan-100 dark:bg-cyan-950/60 flex items-center justify-center">
                              {n}
                            </span>
                          ))}
                        </div>
                        <span className="font-medium text-xs">Scale from 0 (Poor) to 10 (Excellent).</span>
                      </div>
                    )}
                    {q.type === 'text_feedback' && (
                      <>
                        <FileText size={16} className="text-emerald-500 shrink-0" />
                        <span className="font-medium text-xs">Residents type their personal thoughts in a multiline comment box.</span>
                      </>
                    )}
                  </div>
                )}

                {/* Card Action Footer: Required Checkbox & Controls */}
                <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
                  
                  {/* SmartLot Custom Checkbox for Required */}
                  <CustomCheckbox
                    checked={q.required}
                    onChange={() => handleQuestionRequiredToggle(q.id)}
                    label="Must answer (Required)"
                  />

                  {/* Card Action Buttons: Duplicate, Reorder, Delete */}
                  <div className="flex items-center gap-1 self-end xs:self-auto">
                    <button
                      type="button"
                      onClick={() => handleDuplicateQuestion(idx)}
                      className="px-2.5 py-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="Duplicate this question"
                    >
                      <Copy size={13} />
                      <span className="hidden sm:inline">Duplicate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveQuestion(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-20 transition-all cursor-pointer"
                      title="Move Question Up"
                    >
                      <MoveUp size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveQuestion(idx, 'down')}
                      disabled={idx === questions.length - 1}
                      className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-20 transition-all cursor-pointer"
                      title="Move Question Down"
                    >
                      <MoveDown size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer ml-1"
                      title="Delete Question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}

          {/* Bottom Prominent Add Question Button (High Visibility with redirect & scroll) */}
          <button
            type="button"
            onClick={handleAddQuestion}
            className="w-full py-4 sm:py-5 rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/15 hover:border-[#00897B] dark:hover:border-[#00D4B2] hover:bg-[#00897B]/5 dark:hover:bg-[#00D4B2]/5 text-gray-600 dark:text-gray-300 hover:text-[#00897B] dark:hover:text-[#00D4B2] font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer group shadow-2xs active:scale-[0.99]"
          >
            <div className="w-7 h-7 rounded-full bg-[#00897B]/10 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={16} strokeWidth={3} />
            </div>
            <span>+ Add Another Question</span>
          </button>
        </section>

      </form>

      {/* ── Sticky Bottom Action Bar ─────────────────────────────────────────── */}
      <footer className="px-4 sm:px-8 py-3.5 sm:py-4 bg-white dark:bg-[#0d1117] border-t border-gray-200/80 dark:border-white/10 flex items-center justify-between shrink-0 shadow-lg z-30">
        <button
          type="button"
          onClick={onClose}
          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 font-bold text-xs sm:text-sm transition-all cursor-pointer"
        >
          Cancel
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden md:inline text-xs text-gray-500 dark:text-gray-400 font-medium">
            {questions.length} {questions.length === 1 ? 'question' : 'questions'} • {targetRecipientCount} {targetRecipientCount === 1 ? 'recipient' : 'recipients'}
          </span>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-2xl bg-[#00897B] hover:bg-[#00796B] dark:bg-[#00D4B2] dark:hover:bg-[#00BFA0] text-white dark:text-[#050A15] font-black text-xs sm:text-base shadow-md shadow-[#00897B]/20 dark:shadow-[#00D4B2]/20 flex items-center gap-2 sm:gap-2.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving Questionnaire...</span>
              </>
            ) : (
              <>
                <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>{surveyToEdit ? 'Save Changes' : 'Publish Questionnaire'}</span>
              </>
            )}
          </button>
        </div>
      </footer>

    </div>
  );
}

export interface SurveyBuilderModalProps {
  store: SmartLotStore;
  isOpen: boolean;
  onClose: () => void;
  onSurveyCreated?: (newSurvey: Survey) => void;
  surveyToEdit?: Survey | null;
  onSurveyUpdated?: (updatedSurvey: Survey) => void;
}

export function SurveyBuilderModal({ 
  store, 
  isOpen, 
  onClose, 
  onSurveyCreated, 
  surveyToEdit, 
  onSurveyUpdated 
}: SurveyBuilderModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-modal-open', 'true');
    } else {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#0d1117] border-0 sm:border sm:border-gray-200/80 dark:border-white/10 rounded-none sm:rounded-3xl w-full h-[100dvh] sm:h-[92vh] sm:max-h-[92vh] max-w-4xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <SurveyBuilderFormContent 
          store={store} 
          onClose={onClose} 
          onSurveyCreated={onSurveyCreated} 
          surveyToEdit={surveyToEdit}
          onSurveyUpdated={onSurveyUpdated}
        />
      </div>
    </div>,
    document.body
  );
}
