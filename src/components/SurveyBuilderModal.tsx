// @smartlot/component SurveyBuilderModal
// Interactive questionnaire builder for Strata Managers & Committee Members with AI question generation and recipient auto-fill.
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ClipboardCheck,
  Wand2,
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Check, 
  Mail, 
  Users, 
  Clock, 
  Building2, 
  HelpCircle, 
  FileText, 
  Send,
  Star,
  CheckCircle2,
  ShieldCheck,
  ListFilter,
  BarChart3,
  Award,
  Sparkles,
  Wrench,
  Tag,
  Calendar,
  CalendarClock,
  ChevronRight,
  Image as ImageIcon,
  Palette,
  Upload
} from 'lucide-react';
import { SurveyQuestion, SurveyCategory, SurveyQuestionType, Survey } from '../types';
import { STRATA_SURVEY_TEMPLATES } from '../services/aiSurveyService';
import { SmartLotStore } from '../store/smartLotStore';
import { useMorphingPopover } from './core/morphing-popover';
import { CustomSelect, SelectOption } from './core/CustomSelect';
import { EmailCapsuleInput } from './core/EmailCapsuleInput';

function useMorphingPopoverContext() {
  try {
    return useMorphingPopover();
  } catch {
    return null;
  }
}

const PRESET_SURVEY_BANNERS = [
  {
    id: 'building',
    label: 'Modern Architecture',
    tag: 'Strata Building',
    url: '/bg_img_building.png',
  },
  {
    id: 'sunset_apartments',
    label: 'Sunset Duplex',
    tag: 'Residential',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'waterfront',
    label: 'Waterfront Living',
    tag: 'Contemporary',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'courtyard',
    label: 'Garden & Courtyard',
    tag: 'Community',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'abstract_cyan',
    label: 'Teal Geometric',
    tag: 'Modern Abstract',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  },
];

const SURVEY_CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'Annual Satisfaction', label: 'Annual Satisfaction', icon: <Star size={14} className="text-amber-500 fill-amber-400" /> },
  { value: 'Strata Management Performance', label: 'Strata Management Performance', icon: <Award size={14} className="text-blue-500" /> },
  { value: 'Building & Amenities', label: 'Building & Amenities', icon: <Building2 size={14} className="text-emerald-500" /> },
  { value: 'Cleanliness & Maintenance', label: 'Cleanliness & Maintenance', icon: <Sparkles size={14} className="text-purple-500" /> },
  { value: 'Renovation & Upgrades', label: 'Renovation & Upgrades', icon: <Wrench size={14} className="text-amber-600" /> },
  { value: 'General Feedback', label: 'General Feedback', icon: <FileText size={14} className="text-[#00D4B2]" /> },
];

const QUESTION_TYPE_OPTIONS: SelectOption[] = [
  { value: 'star_rating', label: '1-5 Star Rating', icon: <Star size={13} className="text-amber-500 fill-amber-400" /> },
  { value: 'nps_score', label: '0-10 Net Promoter Score', icon: <BarChart3 size={13} className="text-cyan-500" /> },
  { value: 'single_choice', label: 'Single Choice Radio', icon: <CheckCircle2 size={13} className="text-blue-500" /> },
  { value: 'multi_choice', label: 'Multi Choice Checkboxes', icon: <ListFilter size={13} className="text-purple-500" /> },
  { value: 'text_feedback', label: 'Open Text Feedback', icon: <FileText size={13} className="text-emerald-500" /> },
];

export interface SurveyBuilderFormContentProps {
  store: SmartLotStore;
  onClose?: () => void;
  onSurveyCreated?: (newSurvey: Survey) => void;
  surveyToEdit?: Survey | null;
  onSurveyUpdated?: (updatedSurvey: Survey) => void;
}

export const getDeadlinePreset = (daysFromNow: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

export const getEndOfMonthDeadline = (): string => {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return endOfMonth.toISOString().split('T')[0];
};

export const formatDeadlineSummary = (deadlineDateStr: string): string => {
  if (!deadlineDateStr) return 'No deadline set (Continuous open feedback round)';
  const date = new Date(deadlineDateStr);
  if (isNaN(date.getTime())) return deadlineDateStr;
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  const formatted = date.toLocaleDateString('en-AU', options);
  
  const today = new Date();
  const dStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((tStart.getTime() - dStart.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return `${formatted} (Expired)`;
  if (diffDays === 0) return `${formatted} (Closes Today)`;
  if (diffDays === 1) return `${formatted} (1 day remaining)`;
  return `${formatted} (${diffDays} days remaining)`;
};

export function SurveyBuilderFormContent({ 
  store, 
  onClose, 
  onSurveyCreated, 
  surveyToEdit, 
  onSurveyUpdated 
}: SurveyBuilderFormContentProps) {
  const morphContext = useMorphingPopoverContext();

  const handleClose = () => {
    if (morphContext) morphContext.setIsOpen(false);
    if (onClose) onClose();
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeScheme = store.activeScheme;

  // Comprehensive Scheme Members Fetching (Store Members + Units Actors)
  const schemeMembers = React.useMemo(() => {
    const memberMap = new Map<string, { email: string; name: string; role: string; unitId?: string }>();
    const currentSchemeId = (activeScheme?.id || '').toLowerCase();

    // 1. Fetch from store.members
    (store.members || [])
      .filter(m => (m.schemeId || '').toLowerCase() === currentSchemeId && m.email && m.email.trim())
      .forEach(m => {
        const cleanEmail = m.email.trim();
        const emailLower = cleanEmail.toLowerCase();
        if (cleanEmail.includes('@')) {
          memberMap.set(emailLower, {
            email: cleanEmail,
            name: m.name || cleanEmail.split('@')[0],
            role: m.role || 'Resident',
            unitId: m.unitId,
          });
        }
      });

    // 2. Fetch from store.units (unit actors)
    (store.units || [])
      .filter(u => (u.schemeId || '').toLowerCase() === currentSchemeId)
      .forEach(u => {
        (u.actors || []).forEach(a => {
          if (a.email && a.email.trim()) {
            const cleanEmail = a.email.trim();
            const emailLower = cleanEmail.toLowerCase();
            if (cleanEmail.includes('@') && !memberMap.has(emailLower)) {
              memberMap.set(emailLower, {
                email: cleanEmail,
                name: a.name || cleanEmail.split('@')[0],
                role: a.role || 'Resident',
                unitId: u.unitId,
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

  const totalEnrolled = schemeMembers.length;
  const ownerCount = ownerMembers.length;
  const tenantCount = tenantMembers.length;

  // Modal Step State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [title, setTitle] = useState(() => surveyToEdit?.title || `Annual Strata Satisfaction Survey ${new Date().getFullYear()}`);
  const [description, setDescription] = useState(
    () => surveyToEdit?.description || `We invite all residents and lot owners at ${activeScheme.name} to share their feedback to guide our Strata Committee and Management priorities for the coming year.`
  );
  const [category, setCategory] = useState<SurveyCategory>(() => surveyToEdit?.category || 'Annual Satisfaction');
  const [deadline, setDeadline] = useState(() => surveyToEdit?.deadline || getDeadlinePreset(14));
  const [bannerImage, setBannerImage] = useState<string>(() => surveyToEdit?.bannerImage || '/bg_img_building.png');
  const [isBannerPickerOpen, setIsBannerPickerOpen] = useState(false);
  const [customBannerUrl, setCustomBannerUrl] = useState('');
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);

  // File Upload Handlers for Custom Form Banner
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP, SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setBannerImage(dataUrl);
        setIsBannerPickerOpen(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBanner(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setBannerImage(dataUrl);
        setIsBannerPickerOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Questions State
  const [questions, setQuestions] = useState<SurveyQuestion[]>(() => {
    if (surveyToEdit && surveyToEdit.questions && surveyToEdit.questions.length > 0) {
      return surveyToEdit.questions;
    }
    const defaultTemplate = STRATA_SURVEY_TEMPLATES[0];
    return defaultTemplate.questions.map((q, idx) => ({
      ...q,
      id: `q_init_${idx + 1}`,
      order: idx + 1,
    }));
  });

  // AI Generator Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Recipients State (MCQ A1: All residents + role filtering + To/CC/BCC)
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'owners' | 'tenants'>(() => {
    if (surveyToEdit) {
      return surveyToEdit.targetAudience === 'Owners Only' ? 'owners' :
        surveyToEdit.targetAudience === 'Tenants Only' ? 'tenants' : 'all';
    }
    return 'all';
  });
  const [recipientEmails, setRecipientEmails] = useState<string[]>(() => {
    if (surveyToEdit && surveyToEdit.recipientEmails && surveyToEdit.recipientEmails.length > 0) {
      return surveyToEdit.recipientEmails;
    }
    return schemeMembers.map(m => m.email);
  });
  const [ccEmails, setCcEmails] = useState<string>(() => surveyToEdit?.ccEmails?.join(', ') || '');
  const [bccEmails, setBccEmails] = useState<string>(() => surveyToEdit?.bccEmails?.join(', ') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep form in sync when surveyToEdit changes
  useEffect(() => {
    if (surveyToEdit) {
      setTitle(surveyToEdit.title);
      setDescription(surveyToEdit.description);
      setCategory(surveyToEdit.category);
      setDeadline(surveyToEdit.deadline || '');
      setBannerImage(surveyToEdit.bannerImage || '/bg_img_building.png');
      setQuestions(surveyToEdit.questions || []);
      setAudienceFilter(
        surveyToEdit.targetAudience === 'Owners Only' ? 'owners' :
        surveyToEdit.targetAudience === 'Tenants Only' ? 'tenants' : 'all'
      );
      if (surveyToEdit.recipientEmails && surveyToEdit.recipientEmails.length > 0) {
        setRecipientEmails(surveyToEdit.recipientEmails);
      }
      setCcEmails(surveyToEdit.ccEmails?.join(', ') || '');
      setBccEmails(surveyToEdit.bccEmails?.join(', ') || '');
    }
  }, [surveyToEdit]);

  // Ensure recipient emails are loaded once schemeMembers is ready if initially empty
  const hasPopulatedRecipients = useRef(false);
  useEffect(() => {
    if (!surveyToEdit && !hasPopulatedRecipients.current && schemeMembers.length > 0 && recipientEmails.length === 0) {
      setRecipientEmails(schemeMembers.map(m => m.email));
      hasPopulatedRecipients.current = true;
    }
  }, [surveyToEdit, schemeMembers, recipientEmails.length]);

  const recipientCount = recipientEmails.length;

  // Scroll & input focus refs for dynamic question addition
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const questionInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [highlightedQuestionId, setHighlightedQuestionId] = useState<string | null>(null);

  // Handler: Apply Strata Template
  const handleSelectTemplate = (templateId: string) => {
    const template = STRATA_SURVEY_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    setTitle(template.name);
    setCategory(template.category);
    setDescription(template.description);
    setQuestions(template.questions.map((q, idx) => ({
      ...q,
      id: `q_${Date.now()}_${idx + 1}`,
      order: idx + 1,
    })));
  };

  // Handler: Generate with AI
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAI(true);
    try {
      const generated = await store.generateAISurveyQuestions(
        aiPrompt.trim(),
        category,
        activeScheme.name
      );
      if (generated && generated.length > 0) {
        setQuestions(generated);
        setTitle(`${aiPrompt.slice(0, 45)} Feedback Survey`);
        setCurrentStep(2); // advance to questions review
      }
    } catch (err) {
      console.error('AI Question generation error:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handler: Recipient Filter Toggle
  const handleFilterRecipients = (filter: 'all' | 'owners' | 'tenants') => {
    setAudienceFilter(filter);
    if (filter === 'owners') {
      setRecipientEmails(ownerMembers.map(m => m.email));
    } else if (filter === 'tenants') {
      setRecipientEmails(tenantMembers.map(m => m.email));
    } else {
      setRecipientEmails(schemeMembers.map(m => m.email));
    }
  };

  // Question manipulation handlers
  const handleAddQuestion = () => {
    const newId = `q_user_${Date.now()}`;
    const newQ: SurveyQuestion = {
      id: newId,
      questionText: '',
      category: 'General Feedback',
      type: 'star_rating',
      required: true,
      order: questions.length + 1,
    };
    setQuestions(prev => [...prev, newQ]);
    setHighlightedQuestionId(newId);

    // Smoothly scroll to the newly created question and focus its input for editing
    setTimeout(() => {
      const inputEl = questionInputRefs.current[newId];
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputEl.focus();
        inputEl.select();
      } else if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);

    // Auto clear highlight ring after 3 seconds
    setTimeout(() => {
      setHighlightedQuestionId(prev => prev === newId ? null : prev);
    }, 3000);
  };

  const handleUpdateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setQuestions(updated.map((q, i) => ({ ...q, order: i + 1 })));
  };

  // Final Publish Handler
  const handlePublish = async () => {
    if (!title.trim() || questions.length === 0) return;
    setIsSubmitting(true);

    const parsedRecipients = recipientEmails
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.includes('@'));

    const parsedCc = ccEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.includes('@'));

    const parsedBcc = bccEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.includes('@'));

    // Sanitize questions so choice fields always have non-empty valid options
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
          recipientEmails: parsedRecipients.length > 0 ? parsedRecipients : surveyToEdit.recipientEmails,
          ccEmails: parsedCc.length > 0 ? parsedCc : undefined,
          bccEmails: parsedBcc.length > 0 ? parsedBcc : undefined,
          deadline: deadline.trim() || undefined,
          bannerImage: bannerImage.trim() || undefined,
          questions: sanitizedQuestions,
        });
        if (updated) {
          onSurveyUpdated?.(updated);
        }
        handleClose();
      } else {
        const newSurvey = await store.createSurvey({
          schemeId: activeScheme.id,
          title: title.trim(),
          description: description.trim(),
          category,
          status: 'active',
          targetAudience: audienceFilter === 'all' ? 'All Residents' : audienceFilter === 'owners' ? 'Owners Only' : 'Tenants Only',
          recipientEmails: parsedRecipients.length > 0 ? parsedRecipients : [store.activePersona.email || 'resident@smartlot.com'],
          ccEmails: parsedCc.length > 0 ? parsedCc : undefined,
          bccEmails: parsedBcc.length > 0 ? parsedBcc : undefined,
          deadline: deadline.trim() || undefined,
          bannerImage: bannerImage.trim() || undefined,
          questions: sanitizedQuestions,
          createdBy: {
            name: store.activePersona.name,
            role: store.activePersona.role,
            email: store.activePersona.email,
          },
        });

        onSurveyCreated?.(newSurvey);
        handleClose();
      }
    } catch (err) {
      console.error('Error saving survey:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0d1117] w-full max-w-4xl h-full sm:max-h-[90vh] flex flex-col overflow-hidden">
      
      {/* Modal Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-black/20 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:pt-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] border border-emerald-500/20 dark:border-[#00D4B2]/30 flex items-center justify-center shrink-0">
            <ClipboardCheck size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-heading font-black text-gray-900 dark:text-white truncate">
                {surveyToEdit ? 'Edit Questionnaire' : 'Create Questionnaire'}
              </h2>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-[#00D4B2]/10 text-[#00897B] dark:text-[#00D4B2] border border-[#00D4B2]/20 shrink-0">
                {activeScheme.name}
              </span>
              {surveyToEdit && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 shrink-0">
                  {surveyToEdit.id}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate hidden sm:block">
              Design custom surveys with smart assistance or strata templates and dispatch guest links via email.
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer shrink-0 ml-2"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
      </div>

      {/* Stepper Navigation */}
      <div className="px-3 sm:px-6 py-2 sm:py-2.5 bg-gray-50 dark:bg-[#090e19] border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0 text-xs font-bold overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-3 sm:gap-6 min-w-max">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all ${
              currentStep === 1 ? 'text-[#00897B] dark:text-[#00D4B2] font-black' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
              currentStep === 1 ? 'bg-[#00897B] dark:bg-[#00D4B2] text-white dark:text-[#050A15] shadow-xs' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'
            }`}>1</span>
            <span className="hidden sm:inline">Survey Details & Setup</span>
            <span className="sm:hidden text-[11px]">Details</span>
          </button>

          <span className="text-gray-300 dark:text-gray-700 text-xs">&rarr;</span>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all ${
              currentStep === 2 ? 'text-[#00897B] dark:text-[#00D4B2] font-black' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
              currentStep === 2 ? 'bg-[#00897B] dark:bg-[#00D4B2] text-white dark:text-[#050A15] shadow-xs' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'
            }`}>2</span>
            <span className="hidden sm:inline">Questions ({questions.length})</span>
            <span className="sm:hidden text-[11px]">Questions ({questions.length})</span>
          </button>

          <span className="text-gray-300 dark:text-gray-700 text-xs">&rarr;</span>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all ${
              currentStep === 3 ? 'text-[#00897B] dark:text-[#00D4B2] font-black' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
              currentStep === 3 ? 'bg-[#00897B] dark:bg-[#00D4B2] text-white dark:text-[#050A15] shadow-xs' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'
            }`}>3</span>
            <span className="hidden sm:inline">Audience & Dispatch</span>
            <span className="sm:hidden text-[11px]">Audience</span>
          </button>
        </div>

        <span className="text-gray-400 text-[10px] sm:text-[11px] shrink-0 ml-2">Step {currentStep} of 3</span>
      </div>

      {/* Modal Scrollable Body */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          
          {/* STEP 1: Details & AI Generation */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Form Header Banner (Google Forms Style) */}
              <div className="space-y-3">
                {/* Hidden File Input for Custom Banner Upload */}
                <input
                  ref={bannerFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerFileChange}
                />

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-[#00897B] dark:text-[#00D4B2]" />
                      <span>Form Header Banner</span>
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] border border-emerald-200 dark:border-[#00D4B2]/30">
                      Google Forms Style
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {bannerImage && (
                      <button
                        type="button"
                        onClick={() => setBannerImage('')}
                        className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      >
                        Remove Banner
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="px-3 py-1 rounded-xl bg-[#00897B]/10 dark:bg-[#00D4B2]/15 hover:bg-[#00897B]/20 dark:hover:bg-[#00D4B2]/25 text-[#00897B] dark:text-[#00D4B2] border border-[#00897B]/25 dark:border-[#00D4B2]/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Upload size={13} strokeWidth={2.5} />
                      <span>Upload Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBannerPickerOpen(!isBannerPickerOpen)}
                      className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Palette size={13} />
                      <span>{isBannerPickerOpen ? 'Close Themes' : 'Browse Themes'}</span>
                    </button>
                  </div>
                </div>

                {/* Active Banner Preview Card with Drag-and-Drop */}
                {bannerImage ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingBanner(true);
                    }}
                    onDragLeave={() => setIsDraggingBanner(false)}
                    onDrop={handleBannerDrop}
                    className={`relative h-36 sm:h-44 w-full rounded-2xl overflow-hidden border shadow-xs group bg-gray-900 transition-all ${
                      isDraggingBanner
                        ? 'border-[#00D4B2] ring-4 ring-[#00D4B2]/40 scale-[1.01]'
                        : 'border-gray-200 dark:border-white/10'
                    }`}
                  >
                    <img
                      src={bannerImage}
                      alt="Form Header Banner Preview"
                      className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#00D4B2] font-mono mb-0.5 block">
                            BANNER PREVIEW • VISIBLE TO RESIDENTS
                          </span>
                          <h4 className="text-white font-extrabold text-sm sm:text-base truncate">
                            {title || 'Survey Questionnaire Banner'}
                          </h4>
                        </div>
                        <div className="hidden group-hover:flex items-center gap-1.5 shrink-0 bg-black/60 backdrop-blur-md rounded-xl p-1 border border-white/20">
                          <button
                            type="button"
                            onClick={() => bannerFileInputRef.current?.click()}
                            className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Upload size={11} />
                            <span>Upload New</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsBannerPickerOpen(true)}
                            className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Palette size={11} />
                            <span>Themes</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {isDraggingBanner && (
                      <div className="absolute inset-0 bg-[#00897B]/80 dark:bg-[#00D4B2]/80 backdrop-blur-xs flex flex-col items-center justify-center text-white dark:text-[#050A15] z-20">
                        <Upload size={32} className="animate-bounce mb-1" />
                        <span className="text-sm font-black">Drop image here to update banner</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingBanner(true);
                    }}
                    onDragLeave={() => setIsDraggingBanner(false)}
                    onDrop={handleBannerDrop}
                    className={`w-full p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 text-center ${
                      isDraggingBanner
                        ? 'border-[#00D4B2] bg-[#00D4B2]/10 ring-4 ring-[#00D4B2]/30 scale-[1.01]'
                        : 'border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-white/[0.02]'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#00897B]/10 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] flex items-center justify-center">
                      <Upload size={22} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-0.5 max-w-sm">
                      <div className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
                        Add a Custom Form Header Banner
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                        Drag and drop an image file here, or choose an upload method below.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-xl bg-[#00897B] dark:bg-[#00D4B2] text-white dark:text-[#050A15] text-xs font-black hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Upload size={13} strokeWidth={2.5} />
                        <span>Upload From Computer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsBannerPickerOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Palette size={13} />
                        <span>Pick Preset Theme</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-400">Supports PNG, JPG, WebP, SVG • 16:9 or 3:1 recommended</span>
                  </div>
                )}

                {/* Expandable Curated Preset & Custom URL / File Picker */}
                {isBannerPickerOpen && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-gray-200 dark:border-white/10 shadow-sm space-y-4 animate-in fade-in zoom-in-98 duration-200">
                    {/* Custom File Upload & URL Bar */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Upload size={13} className="text-[#00897B] dark:text-[#00D4B2]" />
                        <span>Custom Banner Upload:</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => bannerFileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-[#00897B]/10 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] border border-[#00897B]/30 dark:border-[#00D4B2]/30 hover:bg-[#00897B]/20 dark:hover:bg-[#00D4B2]/25 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs shrink-0"
                        >
                          <Upload size={14} strokeWidth={2.5} />
                          <span>Choose File from Computer</span>
                        </button>
                        <div className="flex-1 flex gap-2">
                          <input
                            type="url"
                            value={customBannerUrl}
                            onChange={(e) => setCustomBannerUrl(e.target.value)}
                            placeholder="Or paste web image URL (https://...)"
                            className="flex-1 bg-gray-50 dark:bg-[#161a26] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00D4B2]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (customBannerUrl.trim()) {
                                  setBannerImage(customBannerUrl.trim());
                                  setIsBannerPickerOpen(false);
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customBannerUrl.trim()) {
                                setBannerImage(customBannerUrl.trim());
                                setIsBannerPickerOpen(false);
                              }
                            }}
                            disabled={!customBannerUrl.trim()}
                            className="px-3 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:opacity-90 disabled:opacity-40 cursor-pointer shrink-0"
                          >
                            Apply URL
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Curated Presets Grid */}
                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5">
                      <div className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Palette size={13} className="text-[#00897B] dark:text-[#00D4B2]" />
                        <span>Or Select Curated Strata Architectural Banner:</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {PRESET_SURVEY_BANNERS.map((preset) => {
                          const isSelected = bannerImage === preset.url;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setBannerImage(preset.url);
                                setIsBannerPickerOpen(false);
                              }}
                              className={`relative h-20 rounded-xl overflow-hidden border text-left cursor-pointer group transition-all ${
                                isSelected
                                  ? 'border-[#00897B] dark:border-[#00D4B2] ring-2 ring-[#00897B]/40 dark:ring-[#00D4B2]/40 shadow-xs'
                                  : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                              }`}
                            >
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-2">
                                <span className="text-[10px] font-extrabold text-white leading-tight truncate">
                                  {preset.label}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#00897B] dark:bg-[#00D4B2] text-white dark:text-[#050A15] flex items-center justify-center text-[10px]">
                                  <Check size={10} strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Quick Strata Question Composer */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-[#00D4B2]/5 border border-emerald-200/70 dark:border-[#00D4B2]/20 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-[#00897B] dark:text-[#00D4B2] font-black text-xs uppercase tracking-wider">
                  <Wand2 size={15} />
                  <span>Strata Question Assistant</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 font-medium">
                  Describe building areas to assess (e.g. <em>"Evaluate lift reliability, corridor acoustics after 10 PM, and pool maintenance"</em>). SmartLot will compose strata-tailored questions.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Ask residents about recent lift repairs and weekend visitor parking..."
                    className="flex-1 bg-white dark:bg-[#121622] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/40 focus:border-[#00D4B2] transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGenerateAI();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI || !aiPrompt.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#00897B] hover:bg-[#00796B] dark:bg-[#00D4B2] dark:hover:bg-[#00BFA0] text-white dark:text-[#050A15] font-black text-xs sm:text-sm shadow-sm shadow-[#00897B]/20 dark:shadow-[#00D4B2]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 transition-all"
                  >
                    {isGeneratingAI ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={15} />
                        <span>Generate Questions</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Template Quick Selectors */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Or Load a Curated Australian Strata Template:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STRATA_SURVEY_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl.id)}
                      className="text-left p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121622] hover:border-[#00897B] dark:hover:border-[#00D4B2] hover:shadow-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-gray-900 dark:text-white group-hover:text-[#00897B] dark:group-hover:text-[#00D4B2] transition-colors">
                          {tmpl.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] border border-emerald-200 dark:border-[#00D4B2]/30">
                          {tmpl.questions.length} Qs
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                        {tmpl.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Survey Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Annual Building Satisfaction Survey"
                    className="w-full bg-white dark:bg-[#121622] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/40 focus:border-[#00D4B2] transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Category Focus
                  </label>
                  <CustomSelect
                    options={SURVEY_CATEGORY_OPTIONS}
                    value={category}
                    onChange={(val) => setCategory(val as SurveyCategory)}
                    size="md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Welcome Description for Residents
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain why this survey is being held..."
                  className="w-full bg-white dark:bg-[#121622] border border-gray-200 dark:border-white/10 rounded-xl p-3.5 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/40 focus:border-[#00D4B2] transition-all resize-none shadow-2xs"
                />
              </div>

              {/* Closing Deadline & Auto-Expiry Settings */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/90 dark:bg-[#060D1A] border border-gray-200 dark:border-white/10 space-y-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#00897B]/10 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] border border-[#00897B]/20 dark:border-[#00D4B2]/30 flex items-center justify-center shrink-0">
                      <CalendarClock size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        Survey Closing Deadline & Auto-Expiry
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Choose submission timeframe for residents before feedback collection closes.
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 w-fit ${
                    deadline
                      ? 'bg-emerald-50 dark:bg-[#00D4B2]/10 text-[#00897B] dark:text-[#00D4B2] border-emerald-200 dark:border-[#00D4B2]/30'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/5'
                  }`}>
                    {deadline ? `📅 Closes: ${deadline}` : '♾️ Open Round (No Expiry)'}
                  </span>
                </div>

                {/* Quick Pick Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeadline(getDeadlinePreset(7))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      deadline === getDeadlinePreset(7)
                        ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15] border-[#00897B] dark:border-[#00D4B2] shadow-xs'
                        : 'bg-white dark:bg-[#121622] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    7 Days
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeadline(getDeadlinePreset(14))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      deadline === getDeadlinePreset(14)
                        ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15] border-[#00897B] dark:border-[#00D4B2] shadow-xs'
                        : 'bg-white dark:bg-[#121622] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    14 Days (Recommended)
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeadline(getDeadlinePreset(30))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      deadline === getDeadlinePreset(30)
                        ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15] border-[#00897B] dark:border-[#00D4B2] shadow-xs'
                        : 'bg-white dark:bg-[#121622] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    30 Days
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeadline(getEndOfMonthDeadline())}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      deadline === getEndOfMonthDeadline()
                        ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15] border-[#00897B] dark:border-[#00D4B2] shadow-xs'
                        : 'bg-white dark:bg-[#121622] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    End of Month
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeadline('')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      !deadline
                        ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15] border-[#00897B] dark:border-[#00D4B2] shadow-xs'
                        : 'bg-white dark:bg-[#121622] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    No Expiry
                  </button>
                </div>

                {/* Custom Date Input & Live Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                  <div className="relative w-full sm:w-56 shrink-0">
                    <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-white dark:bg-[#121622] border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/40 focus:border-[#00D4B2] cursor-pointer shadow-2xs"
                    />
                  </div>

                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-tight">
                    {deadline ? (
                      <span>
                        Auto-closes on <strong className="text-gray-900 dark:text-white font-bold">{formatDeadlineSummary(deadline)}</strong>.
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">
                        No auto-expiry date. This questionnaire remains open for submissions until manually closed.
                      </span>
                    )}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: Questions Editor */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white truncate">
                    Survey Questions ({questions.length})
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                    Reorder, adjust categories, or customize question types.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="h-9 px-3.5 rounded-xl bg-emerald-50 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] border border-emerald-200 dark:border-[#00D4B2]/30 hover:bg-emerald-100 dark:hover:bg-[#00D4B2]/25 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0 select-none active:scale-95"
                >
                  <Plus size={14} className="stroke-[2.5]" />
                  <span>Add Question</span>
                </button>
              </div>

              {questions.map((q, idx) => {
                const isHighlighted = highlightedQuestionId === q.id;

                return (
                  <div 
                    key={q.id}
                    id={`survey-question-${q.id}`}
                    className={`p-3.5 sm:p-5 rounded-2xl border transition-all duration-300 space-y-3.5 ${
                      isHighlighted
                        ? 'border-[#00897B] dark:border-[#00D4B2] ring-2 ring-[#00897B]/40 dark:ring-[#00D4B2]/40 bg-emerald-50/40 dark:bg-[#00D4B2]/10 shadow-lg shadow-[#00897B]/10 dark:shadow-[#00D4B2]/10'
                        : 'border-gray-200 dark:border-white/10 bg-gray-50/40 dark:bg-[#0e1320] shadow-2xs hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                          isHighlighted
                            ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15]'
                            : 'bg-[#00D4B2]/10 text-[#00897B] dark:text-[#00D4B2] border border-[#00D4B2]/20'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 truncate">
                          Question #{idx + 1}
                        </span>
                        {isHighlighted && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#00897B]/15 dark:bg-[#00D4B2]/20 text-[#00897B] dark:text-[#00D4B2] border border-[#00897B]/30 dark:border-[#00D4B2]/40 animate-pulse shrink-0">
                            New
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-20 cursor-pointer flex items-center justify-center transition-all shadow-2xs active:scale-90"
                          title="Move Up"
                        >
                          <MoveUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          disabled={idx === questions.length - 1}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-20 cursor-pointer flex items-center justify-center transition-all shadow-2xs active:scale-90"
                          title="Move Down"
                        >
                          <MoveDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-90"
                          title="Delete Question"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <input
                      ref={(el) => {
                        questionInputRefs.current[q.id] = el;
                      }}
                      type="text"
                      value={q.questionText}
                      onChange={(e) => handleUpdateQuestion(q.id, { questionText: e.target.value })}
                      placeholder="Enter question prompt for residents..."
                      className="w-full bg-white dark:bg-[#161a26] border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/40 focus:border-[#00D4B2] transition-all shadow-2xs"
                    />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs items-end">
                    <div>
                      <label className="block text-[11px] text-gray-500 dark:text-gray-400 font-bold mb-1.5">
                        Response Type
                      </label>
                      <CustomSelect
                        options={QUESTION_TYPE_OPTIONS}
                        value={q.type}
                        onChange={(val) => {
                          const newType = val as SurveyQuestionType;
                          const updates: Partial<SurveyQuestion> = { type: newType };
                          if ((newType === 'single_choice' || newType === 'multi_choice') && (!q.options || q.options.length === 0)) {
                            updates.options = ['Option 1', 'Option 2', 'Option 3'];
                          }
                          handleUpdateQuestion(q.id, updates);
                        }}
                        size="sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-500 dark:text-gray-400 font-bold mb-1.5">
                        Category Tag
                      </label>
                      <input
                        type="text"
                        value={q.category}
                        onChange={(e) => handleUpdateQuestion(q.id, { category: e.target.value })}
                        placeholder="e.g. Management, Facilities"
                        className="w-full h-9 bg-white dark:bg-[#161a26] border border-gray-200 dark:border-white/10 rounded-lg px-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00D4B2] shadow-2xs"
                      />
                    </div>

                    <div className="flex items-center sm:justify-end py-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuestion(q.id, { required: !q.required })}
                        className="inline-flex items-center gap-2 cursor-pointer select-none group min-h-[32px]"
                      >
                        <div 
                          className={`w-8 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
                            q.required ? 'bg-[#00897B] dark:bg-[#00D4B2]' : 'bg-gray-300 dark:bg-gray-700'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full bg-white shadow-xs transition-transform ${
                            q.required ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                          {q.required ? 'Mandatory Question' : 'Optional Question'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Options Editor for Choice Questions */}
                  {(q.type === 'single_choice' || q.type === 'multi_choice') && (
                    <div className="pt-2.5 space-y-2.5 border-t border-gray-200/60 dark:border-white/5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1.5">
                          {q.type === 'single_choice' ? (
                            <span className="w-2.5 h-2.5 rounded-full border border-blue-500 bg-blue-500/20 inline-block" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded border border-purple-500 bg-purple-500/20 inline-block" />
                          )}
                          {q.type === 'single_choice' ? 'Radio Choices (Single Select)' : 'Checkbox Choices (Multi Select)'}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const current = (q.options && q.options.length > 0) ? q.options : ['Option 1', 'Option 2'];
                            handleUpdateQuestion(q.id, { options: [...current, `Option ${current.length + 1}`] });
                          }}
                          className="h-7 px-2 text-[#00897B] dark:text-[#00D4B2] hover:underline flex items-center gap-1 font-black cursor-pointer select-none active:scale-95"
                        >
                          <Plus size={12} />
                          <span>Add Choice</span>
                        </button>
                      </div>

                      {/* Quick Choice Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-0.5">Presets:</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(q.id, { options: ['Yes', 'No', 'Unsure'] })}
                          className="px-2.5 py-1 min-h-[28px] rounded-md text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/5 transition-all cursor-pointer select-none active:scale-95"
                        >
                          Yes / No / Unsure
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(q.id, { options: ['Satisfied', 'Neutral', 'Dissatisfied'] })}
                          className="px-2.5 py-1 min-h-[28px] rounded-md text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/5 transition-all cursor-pointer select-none active:scale-95"
                        >
                          Satisfied / Neutral / Dissatisfied
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(q.id, { options: ['Daily', 'Weekly', 'Monthly', 'Rarely'] })}
                          className="px-2.5 py-1 min-h-[28px] rounded-md text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/5 transition-all cursor-pointer select-none active:scale-95"
                        >
                          Frequency
                        </button>
                      </div>

                      <div className="space-y-2">
                        {((q.options && q.options.length > 0) ? q.options : ['Option 1', 'Option 2', 'Option 3']).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            {q.type === 'single_choice' ? (
                              <div className="w-4 h-4 rounded-full border-2 border-blue-500/70 dark:border-blue-400 flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded border-2 border-purple-500/70 dark:border-purple-400 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={10} className="text-purple-500 dark:text-purple-400 stroke-[3]" />
                              </div>
                            )}
                            <input
                              type="text"
                              value={opt}
                              placeholder={`Option ${optIdx + 1}`}
                              onChange={(e) => {
                                const currentList = (q.options && q.options.length > 0) ? q.options : ['Option 1', 'Option 2', 'Option 3'];
                                const newOpts = [...currentList];
                                newOpts[optIdx] = e.target.value;
                                handleUpdateQuestion(q.id, { options: newOpts });
                              }}
                              className="flex-1 h-9 bg-white dark:bg-[#161a26] border border-gray-200 dark:border-white/10 rounded-lg px-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00D4B2]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const currentList = (q.options && q.options.length > 0) ? q.options : ['Option 1', 'Option 2', 'Option 3'];
                                const newOpts = currentList.filter((_, i) => i !== optIdx);
                                handleUpdateQuestion(q.id, { options: newOpts.length > 0 ? newOpts : ['Option 1'] });
                              }}
                              className="w-8 h-8 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer shrink-0 select-none active:scale-90"
                              title="Remove option"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}

          {/* STEP 3: Audience & Dispatch */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Audience Preset Selector (MCQ A1) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    1-Click Target Audience Pre-Filling:
                  </label>
                  <span className="text-[11px] text-[#00897B] dark:text-[#00D4B2] font-semibold">
                    Instant Auto-population
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleFilterRecipients('all')}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between group ${
                      audienceFilter === 'all'
                        ? 'border-[#00897B] dark:border-[#00D4B2] bg-[#00897B]/5 dark:bg-[#00D4B2]/10 ring-2 ring-[#00897B]/30 dark:ring-[#00D4B2]/30 shadow-xs'
                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#121622] hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50/50 dark:hover:bg-[#161b2a]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          audienceFilter === 'all'
                            ? 'bg-[#00897B]/15 dark:bg-[#00D4B2]/20 text-[#00897B] dark:text-[#00D4B2]'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white'
                        }`}>
                          <Users size={16} />
                        </div>
                        <div>
                          <span className={`text-xs font-black block ${
                            audienceFilter === 'all' ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            All Residents
                          </span>
                          <span className="text-[10px] font-semibold text-[#00897B] dark:text-[#00D4B2]">
                            {totalEnrolled} recipients
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                        audienceFilter === 'all'
                          ? 'bg-[#00897B] dark:bg-[#00D4B2] text-white dark:text-[#050A15] shadow-xs font-black'
                          : 'border-2 border-gray-300 dark:border-white/20'
                      }`}>
                        {audienceFilter === 'all' && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      All {totalEnrolled} enrolled lots & occupants at {activeScheme.name}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFilterRecipients('owners')}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between group ${
                      audienceFilter === 'owners'
                        ? 'border-[#00897B] dark:border-[#00D4B2] bg-[#00897B]/5 dark:bg-[#00D4B2]/10 ring-2 ring-[#00897B]/30 dark:ring-[#00D4B2]/30 shadow-xs'
                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#121622] hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50/50 dark:hover:bg-[#161b2a]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          audienceFilter === 'owners'
                            ? 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white'
                        }`}>
                          <Building2 size={16} />
                        </div>
                        <div>
                          <span className={`text-xs font-black block ${
                            audienceFilter === 'owners' ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            Lot Owners Only
                          </span>
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            {ownerCount} recipients
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                        audienceFilter === 'owners'
                          ? 'bg-[#00897B] dark:bg-[#00D4B2] text-white dark:text-[#050A15] shadow-xs font-black'
                          : 'border-2 border-gray-300 dark:border-white/20'
                      }`}>
                        {audienceFilter === 'owners' && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      Proprietors, strata investors & committee members
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFilterRecipients('tenants')}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between group ${
                      audienceFilter === 'tenants'
                        ? 'border-[#00897B] dark:border-[#00D4B2] bg-[#00897B]/5 dark:bg-[#00D4B2]/10 ring-2 ring-[#00897B]/30 dark:ring-[#00D4B2]/30 shadow-xs'
                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#121622] hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50/50 dark:hover:bg-[#161b2a]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          audienceFilter === 'tenants'
                            ? 'bg-purple-500/15 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white'
                        }`}>
                          <Mail size={16} />
                        </div>
                        <div>
                          <span className={`text-xs font-black block ${
                            audienceFilter === 'tenants' ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            Tenants Only
                          </span>
                          <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                            {tenantCount} recipients
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                        audienceFilter === 'tenants'
                          ? 'bg-[#00897B] dark:bg-[#00D4B2] text-white dark:text-[#050A15] shadow-xs font-black'
                          : 'border-2 border-gray-300 dark:border-white/20'
                      }`}>
                        {audienceFilter === 'tenants' && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      On-site renters, subtenants & day-to-day occupants
                    </p>
                  </button>
                </div>
              </div>

              {/* Recipient Inboxes Capsule Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <span>Recipient Inboxes (To: Capsules)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00897B]/10 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] text-[11px] font-mono font-bold border border-[#00897B]/20 dark:border-[#00D4B2]/30">
                    {recipientCount} {recipientCount === 1 ? 'recipient' : 'recipients'} queued
                  </span>
                </div>
                <EmailCapsuleInput
                  emails={recipientEmails}
                  onChange={setRecipientEmails}
                  schemeMembers={schemeMembers}
                  schemeName={activeScheme.name}
                  placeholder="Type email address and press Enter or comma..."
                />
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                  Direct one-click login tokens are generated per recipient capsule. Type or paste emails to add more.
                </p>
              </div>

              {/* CC & BCC Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    CC Inboxes (Managing Agency, Strata Manager)
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={ccEmails}
                      onChange={(e) => setCcEmails(e.target.value)}
                      placeholder="manager@agency.com.au"
                      className="w-full bg-white dark:bg-[#121622] border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/40 focus:border-[#00D4B2] transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    BCC Inboxes (Blind Carbon Copy / Audit)
                  </label>
                  <div className="relative">
                    <ShieldCheck size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={bccEmails}
                      onChange={(e) => setBccEmails(e.target.value)}
                      placeholder="compliance@smartlot.com.au"
                      className="w-full bg-white dark:bg-[#121622] border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/40 focus:border-[#00D4B2] transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Closing Deadline Confirmation Card */}
              <div className="p-4 rounded-2xl bg-gray-50/90 dark:bg-[#060D1A] border border-gray-200 dark:border-white/10 space-y-2.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#00897B]/10 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] border border-[#00897B]/20 dark:border-[#00D4B2]/30 flex items-center justify-center shrink-0">
                      <CalendarClock size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>Survey Response Window</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          deadline 
                            ? 'bg-emerald-50 dark:bg-[#00D4B2]/10 text-[#00897B] dark:text-[#00D4B2] border-emerald-200 dark:border-[#00D4B2]/30'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'
                        }`}>
                          {deadline ? 'Auto-Locks on Expiry' : 'No Expiry'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                        {deadline ? formatDeadlineSummary(deadline) : 'Continuous open collection (No expiration)'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Preset Toggles directly on Step 3 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setDeadline(getDeadlinePreset(7))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                        deadline === getDeadlinePreset(7)
                          ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15] border-[#00897B] dark:border-[#00D4B2]'
                          : 'bg-white dark:bg-[#121622] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-gray-300'
                      }`}
                    >
                      7d
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeadline(getDeadlinePreset(14))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                        deadline === getDeadlinePreset(14)
                          ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15] border-[#00897B] dark:border-[#00D4B2]'
                          : 'bg-white dark:bg-[#121622] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-gray-300'
                      }`}
                    >
                      14d (Rec)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeadline(getDeadlinePreset(30))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                        deadline === getDeadlinePreset(30)
                          ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15] border-[#00897B] dark:border-[#00D4B2]'
                          : 'bg-white dark:bg-[#121622] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-gray-300'
                      }`}
                    >
                      30d
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeadline('')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                        !deadline
                          ? 'bg-[#00897B] text-white dark:bg-[#00D4B2] dark:text-[#050A15] border-[#00897B] dark:border-[#00D4B2]'
                          : 'bg-white dark:bg-[#121622] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-gray-300'
                      }`}
                    >
                      No Expiry
                    </button>
                  </div>
                </div>
              </div>

              {/* Zero Login Explainer Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-emerald-500/5 to-transparent border border-blue-500/20 dark:border-blue-500/30 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3.5 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 mt-0.5">
                  <CheckCircle2 size={18} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                      Zero-Login Direct Guest Access
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider">
                      Frictionless
                    </span>
                  </div>
                  <p className="leading-relaxed text-gray-600 dark:text-gray-300 text-xs">
                    Residents receiving this dispatch do not need an account, password, or mobile app installation. Tapping their direct link instantly opens the response portal on any device with optional unit tagging or 100% anonymous submission.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Action Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-gray-50/90 dark:bg-black/40 backdrop-blur-xs">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep - 1) as any)}
                className="h-10 sm:h-9 px-3 sm:px-4 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-all cursor-pointer select-none active:scale-95"
              >
                &larr; Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="h-10 sm:h-9 px-3 sm:px-4 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-all cursor-pointer select-none active:scale-95"
            >
              Cancel
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep + 1) as any)}
                className="h-11 sm:h-10 px-4 sm:px-5 rounded-xl bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-extrabold text-xs sm:text-sm hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs select-none active:scale-95"
              >
                <span>Continue</span>
                <span>&rarr;</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting || questions.length === 0}
                className="h-11 sm:h-10 px-4 sm:px-6 rounded-xl bg-[#00897B] hover:bg-[#00796B] dark:bg-[#00D4B2] dark:hover:bg-[#00BFA0] text-white dark:text-[#050A15] font-black text-xs sm:text-sm shadow-md shadow-[#00897B]/20 dark:shadow-[#00D4B2]/20 hover:opacity-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 select-none active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>{surveyToEdit ? 'Saving...' : 'Publishing...'}</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>{surveyToEdit ? 'Save Changes' : 'Publish & Dispatch'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0d1117] border-0 sm:border sm:border-gray-200/80 dark:border-white/10 rounded-none sm:rounded-3xl w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] max-w-4xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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
