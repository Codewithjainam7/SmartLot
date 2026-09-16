// @smartlot/component SurveyBuilderModal
// Interactive questionnaire builder for Strata Managers & Committee Members with AI question generation and recipient auto-fill.
import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
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
  ListFilter
} from 'lucide-react';
import { SurveyQuestion, SurveyCategory, SurveyQuestionType, Survey } from '../types';
import { STRATA_SURVEY_TEMPLATES } from '../services/aiSurveyService';
import { SmartLotStore } from '../store/smartLotStore';

interface SurveyBuilderModalProps {
  store: SmartLotStore;
  isOpen: boolean;
  onClose: () => void;
  onSurveyCreated?: (newSurvey: Survey) => void;
}

export function SurveyBuilderModal({ store, isOpen, onClose, onSurveyCreated }: SurveyBuilderModalProps) {
  if (!isOpen) return null;

  const activeScheme = store.activeScheme;
  const currentMembers = store.members.filter(m => m.schemeId === activeScheme.id && m.email);

  // Modal Step State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [title, setTitle] = useState(`Annual Strata Satisfaction Survey ${new Date().getFullYear()}`);
  const [description, setDescription] = useState(
    `We invite all residents and lot owners at ${activeScheme.name} to share their feedback to guide our Strata Committee and Management priorities for the coming year.`
  );
  const [category, setCategory] = useState<SurveyCategory>('Annual Satisfaction');
  const [deadline, setDeadline] = useState('');
  
  // Questions State
  const [questions, setQuestions] = useState<SurveyQuestion[]>(() => {
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
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'owners' | 'tenants'>('all');
  const [recipientEmails, setRecipientEmails] = useState<string>(() => {
    return currentMembers.map(m => m.email).filter(Boolean).join(', ');
  });
  const [ccEmails, setCcEmails] = useState<string>('');
  const [bccEmails, setBccEmails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    let filtered = currentMembers;
    if (filter === 'owners') {
      filtered = currentMembers.filter(m => m.role.toLowerCase().includes('owner') || m.role.toLowerCase().includes('committee'));
    } else if (filter === 'tenants') {
      filtered = currentMembers.filter(m => m.role.toLowerCase().includes('tenant') || m.role.toLowerCase().includes('resident'));
    }
    const emails = filtered.map(m => m.email).filter(Boolean).join(', ');
    setRecipientEmails(emails);
  };

  // Question manipulation handlers
  const handleAddQuestion = () => {
    const newQ: SurveyQuestion = {
      id: `q_user_${Date.now()}`,
      questionText: 'New Question',
      category: 'General Feedback',
      type: 'star_rating',
      required: true,
      order: questions.length + 1,
    };
    setQuestions(prev => [...prev, newQ]);
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
      .split(',')
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

    try {
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
        questions,
        createdBy: {
          name: store.activePersona.name,
          role: store.activePersona.role,
          email: store.activePersona.email,
        },
      });

      onSurveyCreated?.(newSurvey);
      onClose();
    } catch (err) {
      console.error('Error creating survey:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0E1628] border border-gray-200 dark:border-gray-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00D4B2] to-[#0055FF] text-white flex items-center justify-center shadow-md shadow-[#00D4B2]/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>Create Feedback Questionnaire</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#00D4B2]/10 text-[#00A38C] dark:text-[#00D4B2]">
                  {activeScheme.name}
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Design custom surveys with AI or strata templates and dispatch guest links via email.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper Navigation */}
        <div className="px-6 py-2.5 bg-gray-100/60 dark:bg-black/30 border-b border-gray-200 dark:border-gray-800/80 flex items-center justify-between shrink-0 text-xs font-bold">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 cursor-pointer transition-all ${
                currentStep === 1 ? 'text-[#0055FF] dark:text-[#00D4B2] font-black' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                currentStep === 1 ? 'bg-[#0055FF] dark:bg-[#00D4B2] text-white dark:text-black' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'
              }`}>1</span>
              <span>Survey Details & AI</span>
            </button>

            <span className="text-gray-300 dark:text-gray-700">&rarr;</span>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`flex items-center gap-2 cursor-pointer transition-all ${
                currentStep === 2 ? 'text-[#0055FF] dark:text-[#00D4B2] font-black' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                currentStep === 2 ? 'bg-[#0055FF] dark:bg-[#00D4B2] text-white dark:text-black' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'
              }`}>2</span>
              <span>Questions ({questions.length})</span>
            </button>

            <span className="text-gray-300 dark:text-gray-700">&rarr;</span>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={`flex items-center gap-2 cursor-pointer transition-all ${
                currentStep === 3 ? 'text-[#0055FF] dark:text-[#00D4B2] font-black' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                currentStep === 3 ? 'bg-[#0055FF] dark:bg-[#00D4B2] text-white dark:text-black' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'
              }`}>3</span>
              <span>Audience & Dispatch</span>
            </button>
          </div>

          <span className="text-gray-400 text-[11px]">Step {currentStep} of 3</span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: Details & AI Generation */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* AI Quick Generator Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#00D4B2]/10 via-blue-500/10 to-purple-500/10 border border-[#00D4B2]/30 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-[#00A38C] dark:text-[#00D4B2] font-black text-xs uppercase tracking-wider">
                  <Sparkles size={15} />
                  <span>AI Survey Question Generator</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                  Describe what you want to assess (e.g. <em>"Evaluate elevator reliability, noise insulation after 10 PM, and lobby renovations"</em>). AI will automatically compose strata-tailored questions.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Ask residents about recent lift repairs and weekend visitor parking..."
                    className="flex-1 bg-white dark:bg-[#15203B] border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#00D4B2]"
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
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4B2] to-[#0055FF] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-[#00D4B2]/20 flex items-center justify-center gap-2 hover:opacity-95 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isGeneratingAI ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        <span>Generate with AI</span>
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
                      className="text-left p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#15203B]/50 hover:border-[#00D4B2] dark:hover:border-[#00D4B2] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-gray-900 dark:text-white group-hover:text-[#0055FF] dark:group-hover:text-[#00D4B2] transition-colors">
                          {tmpl.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
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
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Survey Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#15203B] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#00D4B2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Category Focus
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SurveyCategory)}
                    className="w-full bg-gray-50 dark:bg-[#15203B] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#00D4B2] cursor-pointer"
                  >
                    <option value="Annual Satisfaction">Annual Satisfaction</option>
                    <option value="Strata Management Performance">Strata Management Performance</option>
                    <option value="Building & Amenities">Building & Amenities</option>
                    <option value="Cleanliness & Maintenance">Cleanliness & Maintenance</option>
                    <option value="Renovation & Upgrades">Renovation & Upgrades</option>
                    <option value="General Feedback">General Feedback</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Welcome Description for Residents
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#15203B] border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#00D4B2] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Closing Deadline Date (Optional Auto-Expiry)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full sm:w-64 bg-gray-50 dark:bg-[#15203B] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#00D4B2] cursor-pointer"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Leave blank for an open, continuous feedback collection round.
                </p>
              </div>

            </div>
          )}

          {/* STEP 2: Questions Editor */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                    Survey Questions ({questions.length})
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Reorder, adjust categories, or customize question types for residents.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-1.5 rounded-xl bg-[#00D4B2]/15 text-[#00A38C] dark:text-[#00D4B2] hover:bg-[#00D4B2]/25 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Question</span>
                </button>
              </div>

              {questions.map((q, idx) => (
                <div 
                  key={q.id}
                  className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111A2E] shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 flex items-center justify-center text-xs font-black">
                      {idx + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        disabled={idx === questions.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Question"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={q.questionText}
                    onChange={(e) => handleUpdateQuestion(q.id, { questionText: e.target.value })}
                    placeholder="Enter question text..."
                    className="w-full bg-gray-50 dark:bg-[#15203B] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#00D4B2]"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-gray-400 font-bold mb-1">Type</label>
                      <select
                        value={q.type}
                        onChange={(e) => handleUpdateQuestion(q.id, { type: e.target.value as SurveyQuestionType })}
                        className="w-full bg-gray-50 dark:bg-[#15203B] border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-900 dark:text-white cursor-pointer"
                      >
                        <option value="star_rating">⭐ 1-5 Star Rating</option>
                        <option value="nps_score">📊 0-10 Net Promoter Score</option>
                        <option value="single_choice">🔘 Single Choice Radio</option>
                        <option value="multi_choice">☑️ Multi Choice Checkboxes</option>
                        <option value="text_feedback">✍️ Open Text Feedback</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-400 font-bold mb-1">Category Tag</label>
                      <input
                        type="text"
                        value={q.category}
                        onChange={(e) => handleUpdateQuestion(q.id, { category: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-[#15203B] border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => handleUpdateQuestion(q.id, { required: e.target.checked })}
                          className="rounded text-[#00D4B2] focus:ring-[#00D4B2]"
                        />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Required Question</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3: Audience & Dispatch */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Audience Preset Selector (MCQ A1) */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  1-Click Target Audience Pre-Filling:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleFilterRecipients('all')}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      audienceFilter === 'all'
                        ? 'border-[#00D4B2] bg-[#00D4B2]/10 text-gray-900 dark:text-white font-extrabold shadow-xs'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#15203B]/50 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black">All Building Residents</span>
                      <Users size={14} className="text-[#00D4B2]" />
                    </div>
                    <p className="text-[11px] opacity-80">
                      All {currentMembers.length} enrolled lots & occupants at {activeScheme.name}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFilterRecipients('owners')}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      audienceFilter === 'owners'
                        ? 'border-[#00D4B2] bg-[#00D4B2]/10 text-gray-900 dark:text-white font-extrabold shadow-xs'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#15203B]/50 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black">Lot Owners Only</span>
                      <Building2 size={14} className="text-blue-500" />
                    </div>
                    <p className="text-[11px] opacity-80">
                      Proprietors, investors & committee members
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFilterRecipients('tenants')}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      audienceFilter === 'tenants'
                        ? 'border-[#00D4B2] bg-[#00D4B2]/10 text-gray-900 dark:text-white font-extrabold shadow-xs'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#15203B]/50 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black">Tenants Only</span>
                      <Mail size={14} className="text-purple-500" />
                    </div>
                    <p className="text-[11px] opacity-80">
                      On-site renters & day-to-day occupants
                    </p>
                  </button>
                </div>
              </div>

              {/* Email Addresses Textarea */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Recipient Inboxes (To: Comma-separated) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={recipientEmails}
                  onChange={(e) => setRecipientEmails(e.target.value)}
                  placeholder="cameron.chair@cavalloscm.org, joana.treasurer@cavalloscm.org, ..."
                  className="w-full bg-gray-50 dark:bg-[#15203B] border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs sm:text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#00D4B2]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    CC Inboxes (e.g. Managing Agency, Building Manager)
                  </label>
                  <input
                    type="text"
                    value={ccEmails}
                    onChange={(e) => setCcEmails(e.target.value)}
                    placeholder="peter.bm@cavallosydney.com.au"
                    className="w-full bg-gray-50 dark:bg-[#15203B] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#00D4B2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    BCC Inboxes (Blind Carbon Copy)
                  </label>
                  <input
                    type="text"
                    value={bccEmails}
                    onChange={(e) => setBccEmails(e.target.value)}
                    placeholder="audit@smartlot.com"
                    className="w-full bg-gray-50 dark:bg-[#15203B] border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#00D4B2]"
                  />
                </div>
              </div>

              {/* Zero Login Explainer Card */}
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm mb-0.5">Zero-Login Direct Guest Access</h4>
                  <p className="leading-relaxed opacity-90">
                    Residents who receive this invitation email do not need a password, account, or app installation. Clicking the link takes them directly to a mobile-friendly feedback page where they can submit anonymously or select their unit.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-black/20">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep - 1) as any)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                &larr; Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((currentStep + 1) as any)}
                className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-extrabold text-xs sm:text-sm hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <span>&rarr;</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting || questions.length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0055FF] to-[#00D4B2] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/25 hover:opacity-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Publishing & Sending Emails...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Publish & Dispatch Emails</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
