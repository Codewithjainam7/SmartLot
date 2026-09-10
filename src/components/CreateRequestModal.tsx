import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  ActivityType, 
  ActivityPriority, 
  ActivityLocation, 
  ContactPreference 
} from '../types';
import { useMorphingPopover } from './core/morphing-popover';
import { 
  Wrench, 
  AlertTriangle, 
  MessageSquareWarning, 
  Home, 
  Repeat, 
  Upload, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Sparkles,
  Send,
  ShieldAlert,
  FileText,
  Clock,
  Check,
  HelpCircle,
  Paperclip,
  PartyPopper,
  ExternalLink,
  Camera,
  ChevronDown
} from 'lucide-react';
import { CustomSelect } from './core/CustomSelect';


// ─── Prop types ───────────────────────────────────────────────────────────────

interface CreateRequestModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit: (data: {
    requestType: ActivityType | string;
    title: string;
    description: string;
    attachmentUrl?: string;
    attachmentUrls?: string[];
    priority: ActivityPriority | string;
    dueDate?: string;
    buildingName?: string;
    unit?: string;
    location?: string;
    contactPreference?: ContactPreference;
    strataManagerEmail?: string;
  }) => string;  // returns the generated activity ID
  requestorName: string;
  requestorEmail?: string;
  requestorPhone?: string;
  defaultBuildingName?: string;
  defaultUnit?: string;
  defaultManagerEmail?: string;
  onViewActivity?: (activityId: string) => void;
}


const ACTIVITY_TYPES: { value: ActivityType; label: string; desc: string; icon: React.ReactNode }[] = [
  { 
    value: 'Common Property Repair', 
    label: 'Maintenance / Repair', 
    desc: 'Gates, doors, building facade, fences, intercoms, or shared driveway.',
    icon: <Wrench size={16} className="text-[#0055FF] dark:text-[#00D4B2]" /> 
  },
  { 
    value: 'Maintenance / Vendor', 
    label: 'Maintenance / Vendor', 
    desc: 'Scheduled servicing, HVAC, garden, lifts, cleaning, or pest control.',
    icon: <Repeat size={16} className="text-[#00D4B2]" /> 
  },
  { 
    value: 'General Request', 
    label: 'General Inquiry / Request', 
    desc: 'Key fobs, access permissions, moving-in notices, or general enquiries.',
    icon: <FileText size={16} className="text-[#6366F1]" /> 
  },
  { 
    value: 'Complaint', 
    label: 'Complaint / By-law Breach', 
    desc: 'Noise disturbance, unauthorized parking, rubbish disposal, or by-law breaches.',
    icon: <MessageSquareWarning size={16} className="text-[#FFB020]" /> 
  },
  { 
    value: 'Administrative Request', 
    label: 'Administrative Request', 
    desc: 'Strata roll updates, levy notices, AGM minutes, or insurance certificates.',
    icon: <Building size={16} className="text-[#8B5CF6]" /> 
  },
  { 
    value: 'Urgent Issue', 
    label: 'Urgent Issue / Emergency', 
    desc: 'Burst pipes, gas leaks, water penetration, or immediate safety hazards.',
    icon: <AlertTriangle size={16} className="text-[#FF4757]" /> 
  },
];

const LOCATIONS: ActivityLocation[] = [
  'Common area',
  'Front entrance',
  'Lift',
  'Lobby',
  'Car park',
  'Garden',
  'Bin room',
  'Roof',
  'Pool',
  'Other',
  'Not applicable',
];

const PRIORITIES: { value: ActivityPriority; label: string; desc: string; color: string }[] = [
  { value: 'Low', label: 'Low', desc: 'Standard non-urgent request', color: 'text-gray-400 border-gray-500/20' },
  { value: 'Medium', label: 'Medium', desc: 'Standard review target', color: 'text-blue-400 border-blue-500/20' },
  { value: 'High', label: 'High', desc: 'Urgent attention within 24h', color: 'text-amber-400 border-amber-500/30' },
  { value: 'Urgent', label: 'Urgent', desc: 'Immediate safety or property hazard', color: 'text-red-400 border-red-500/40' },
];

// ─── Confirmation Screen ──────────────────────────────────────────────────────

function ConfirmationScreen({
  referenceId,
  activityTitle,
  managerEmail,
  requestorEmail,
  onClose,
  onViewActivity,
}: {
  referenceId: string;
  activityTitle: string;
  managerEmail?: string;
  requestorEmail?: string;
  onClose: () => void;
  onViewActivity?: () => void;
}) {
  // Strip 'REQ-' prefix to display as #SL-XXXXX
  const displayRef = referenceId.startsWith('REQ-')
    ? `#${referenceId.replace('REQ-', '')}`
    : referenceId;

  return (
    <motion.div
      key="confirmation"
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center gap-5 py-4"
    >
      {/* Success icon */}
      <div className="relative flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center">
          <CheckCircle2 size={38} className="text-emerald-500 dark:text-emerald-400" strokeWidth={1.5} />
        </div>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260 }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-[#00D4B2] rounded-full flex items-center justify-center"
        >
          <Check size={12} className="text-white" strokeWidth={3} />
        </motion.div>
      </div>

      {/* Headline */}
      <div className="space-y-1">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-[#00D4B2]">Activity Created</p>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
          {displayRef}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-normal">
          {activityTitle}
        </p>
      </div>

      {/* Status steps */}
      <div className="w-full max-w-xs space-y-2">
        {[
          {
            icon: <Check size={12} className="text-emerald-400" strokeWidth={3} />,
            bg: 'bg-emerald-400/10 border-emerald-400/20',
            label: 'Activity logged in SmartLot',
          },
          {
            icon: <Check size={12} className="text-[#00D4B2]" strokeWidth={3} />,
            bg: 'bg-[#00D4B2]/10 border-[#00D4B2]/20',
            label: managerEmail
              ? `Email dispatched to ${managerEmail}`
              : 'Conduit email dispatched to strata manager',
          },
          {
            icon: <Check size={12} className="text-[#0055FF]" strokeWidth={3} />,
            bg: 'bg-[#0055FF]/10 border-[#0055FF]/20',
            label: requestorEmail
              ? `You are CC'd at ${requestorEmail}`
              : "You have been CC'd on the email",
          },
        ].map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.25 }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left ${step.bg}`}
          >
            <div className="shrink-0 w-4 h-4 rounded-full border border-current/30 flex items-center justify-center">
              {step.icon}
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{step.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Reply-To info */}
      <div className="w-full max-w-xs bg-gray-50 dark:bg-[#12161F] border border-gray-200 dark:border-white/8 rounded-xl p-3 text-left">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">What happens next?</p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
          The strata manager can simply <strong className="text-gray-700 dark:text-gray-200">Reply All</strong> to the email.
          Their response will automatically appear as a comment on this activity in SmartLot.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/6 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer transition-colors"
        >
          Close
        </button>
        {onViewActivity && (
          <button
            type="button"
            onClick={onViewActivity}
            className="px-5 py-2.5 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <ExternalLink size={13} />
            <span>View Activity</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Form content ─────────────────────────────────────────────────────────────


export function CreateRequestFormContent({
  onSubmit,
  requestorName,
  requestorEmail = '',
  requestorPhone = '',
  defaultBuildingName = '',
  defaultUnit = '',
  defaultManagerEmail = '',
  knownBuildingNames = ['Cavalier Apartments', 'Ocean View Strata', 'Highland Towers', 'Coronation Ave Strata'],
  onClose,
  onViewActivity,
}: {
  onSubmit: (data: any) => any;
  requestorName: string;
  requestorEmail?: string;
  requestorPhone?: string;
  defaultBuildingName?: string;
  defaultUnit?: string;
  defaultManagerEmail?: string;
  knownBuildingNames?: string[];
  onClose?: () => void;
  onViewActivity?: (activityId: string) => void;
}) {
  const morphContext = useMorphingPopoverContext();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [activityType, setActivityType] = useState<ActivityType>('Common Property Repair');
  const [location, setLocation] = useState<ActivityLocation>('Common area');
  const [problem, setProblem] = useState('');
  const [priority, setPriority] = useState<ActivityPriority>('Medium');
  const [photos, setPhotos] = useState<string[]>([]);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; type: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── More Options (collapsible) ──────────────────────────────────────────────
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [contactPreference, setContactPreference] = useState<ContactPreference>('Email');
  const [accessInstructions, setAccessInstructions] = useState('');
  const [buildingName, setBuildingName] = useState(defaultBuildingName);
  const [unit, setUnit] = useState(defaultUnit);
  const [strataManagerEmail, setStrataManagerEmail] = useState(defaultManagerEmail);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const sizeFormatted = file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

        setFileDetails(prev => [...prev, {
          name: file.name,
          size: sizeFormatted,
          type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream')
        }]);
        setPhotos(prev => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setFileDetails(prev => prev.filter((_, i) => i !== idx));
  };

  // After submit: store the returned activity ID to show the confirmation screen
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleDismiss = () => {
    if (morphContext) morphContext.setIsOpen(false);
    onClose?.();
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim() || isSubmitting) return;
    setIsSubmitting(true);

    // Auto-generate clean title from problem description
    const firstLine = problem.trim().split(/\r?\n/)[0].trim();
    const generatedTitle = firstLine.length > 65 
      ? firstLine.slice(0, 62) + '...' 
      : (firstLine || `${activityType} at ${location}`);

    // Combine problem and additional access instructions if provided
    const finalDescription = accessInstructions.trim()
      ? `${problem.trim()}\n\nAdditional Access Instructions:\n${accessInstructions.trim()}`
      : problem.trim();

    const generatedId = onSubmit({
      buildingName:        (buildingName || defaultBuildingName || 'My Building').trim(),
      unit:                (unit || defaultUnit || 'Unit 1').trim(),
      activityType,
      requestType:         activityType,
      title:               generatedTitle,
      description:         finalDescription,
      priority,
      location,
      contactPreference,
      strataManagerEmail:  strataManagerEmail.trim() || defaultManagerEmail || undefined,
      attachmentUrl:       photos[0] ?? undefined,
      attachmentUrls:      photos,
    });

    setIsSubmitting(false);
    setSubmittedId(generatedId);
  };

  // ── Confirmation screen (post-submit) ────────────────────────────────────────
  if (submittedId !== null) {
    const firstLine = problem.trim().split(/\r?\n/)[0].trim();
    const displayTitle = firstLine.length > 65 
      ? firstLine.slice(0, 62) + '...' 
      : (firstLine || 'Building Issue Request');

    return (
      <ConfirmationScreen
        referenceId={submittedId}
        activityTitle={displayTitle}
        managerEmail={strataManagerEmail.trim() || defaultManagerEmail}
        requestorEmail={requestorEmail}
        onClose={handleDismiss}
        onViewActivity={
          onViewActivity
            ? () => { onViewActivity(submittedId); handleDismiss(); }
            : undefined
        }
      />
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 text-left">
      {/* Modal Header */}
      <div className="flex items-start justify-between pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 flex items-center justify-center text-[#0055FF] dark:text-[#00D4B2] shrink-0 shadow-2xs">
            <Wrench size={19} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Report a Building Issue
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Tell us what's happening and we'll help get it sorted.
            </p>
          </div>
        </div>
        <button 
          type="button"
          onClick={handleDismiss} 
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleFinalSubmit} className="space-y-3.5">
        {/* FIELD 1: What type of issue? */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
            What type of issue? <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            options={ACTIVITY_TYPES.map(t => ({
              value: t.value,
              label: t.label,
              description: t.desc,
              icon: t.icon,
            }))}
            value={activityType}
            onChange={val => setActivityType(val as ActivityType)}
          />
        </div>

        {/* FIELD 2: Where is it? */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
            Where is it? <span className="text-red-500">*</span>
          </label>
          <CustomSelect
            options={LOCATIONS.map(loc => ({
              value: loc,
              label: loc,
              icon: <MapPin size={15} className="text-[#0055FF] dark:text-[#00D4B2]" />
            }))}
            value={location}
            onChange={val => setLocation(val as ActivityLocation)}
          />
        </div>

        {/* FIELD 3: What's the problem? */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
            What's the problem? <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              required
              rows={4}
              maxLength={500}
              placeholder="e.g. Front security gate isn't closing..."
              value={problem}
              onChange={e => setProblem(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-[#141824] border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2] transition-all resize-none shadow-2xs"
            />
            <div className="flex justify-end pr-1 mt-0.5">
              <span className="text-[10px] text-gray-400 font-mono">
                {problem.length}/500
              </span>
            </div>
          </div>
        </div>

        {/* PRIORITY LEVEL (OUTSIDE MORE OPTIONS PER EXPLICIT USER INSTRUCTION) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-[#0055FF] dark:text-[#00D4B2]" />
              <span>Priority level</span>
              <span className="text-red-500">*</span>
            </span>
            <span className="text-[10px] font-normal text-gray-400">
              {priority === 'Medium' ? 'Standard target review' : priority === 'High' ? 'Urgent attention within 24h' : priority === 'Urgent' ? 'Immediate hazard' : 'Standard non-urgent'}
            </span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITIES.map(p => {
              const isSelected = priority === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`h-9 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs ${
                    isSelected
                      ? p.value === 'Urgent'
                        ? 'bg-red-500 text-white border-red-600 shadow-sm shadow-red-500/20 scale-[1.02]'
                        : p.value === 'High'
                        ? 'bg-[#FFB020] text-black border-amber-500 shadow-sm shadow-amber-500/20 scale-[1.02]'
                        : p.value === 'Medium'
                        ? 'bg-[#0055FF] text-white border-blue-600 shadow-sm shadow-blue-500/20 scale-[1.02]'
                        : 'bg-gray-700 text-white border-gray-800 shadow-sm scale-[1.02]'
                      : 'bg-gray-50 dark:bg-[#141824] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FIELD 4: Add a photo (optional) */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileSelect}
          />

          {photos.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3.5 rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-[#141824]/60 hover:bg-gray-100/80 dark:hover:bg-[#141824] hover:border-[#0055FF] dark:hover:border-[#00D4B2] transition-all cursor-pointer flex items-center gap-3.5 group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 text-[#0055FF] dark:text-[#00D4B2] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Camera size={19} />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-gray-900 dark:text-white">
                  Add a photo (optional)
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Helps us understand the issue better.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                <span>Attached Photos / Files ({photos.length})</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-[#0055FF] dark:text-[#00D4B2] hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                >
                  <Upload size={12} /> Add more
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {photos.map((url, idx) => {
                  const isImage = url.startsWith('data:image') || url.includes('unsplash.com') || url.match(/\.(jpg|jpeg|png|webp|gif)/i);
                  const meta = fileDetails[idx];
                  return (
                    <div
                      key={idx}
                      className="relative group h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xs"
                    >
                      {isImage ? (
                        <div className="w-20 h-16">
                          <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-28 h-16 p-2 bg-gray-50 dark:bg-[#161a26] flex flex-col justify-center">
                          <div className="flex items-center gap-1 text-[#0055FF] dark:text-[#00D4B2] mb-1">
                            <FileText size={13} />
                            <span className="text-[10px] font-bold truncate max-w-[70px]">{meta?.name || 'File'}</span>
                          </div>
                          <span className="text-[9px] text-gray-400">{meta?.size || 'Doc'}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MORE OPTIONS ACCORDION */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowMoreOptions(prev => !prev)}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-[#0055FF] dark:hover:text-[#00D4B2] transition-colors cursor-pointer py-1"
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${showMoreOptions ? 'rotate-180' : ''}`} />
            <span>More options</span>
          </button>

          <AnimatePresence>
            {showMoreOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-2"
              >
                <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-[#141824] border border-gray-200/80 dark:border-white/10 space-y-3.5 shadow-2xs text-xs">
                  
                  {/* Preferred contact */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Preferred contact
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="contactPref"
                          checked={contactPreference === 'Email'}
                          onChange={() => setContactPreference('Email')}
                          className="text-[#0055FF] focus:ring-[#0055FF]"
                        />
                        <span>Email (CC'd)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="contactPref"
                          checked={contactPreference === 'SmartLot notifications'}
                          onChange={() => setContactPreference('SmartLot notifications')}
                          className="text-[#0055FF] focus:ring-[#0055FF]"
                        />
                        <span>In-App Only</span>
                      </label>
                    </div>
                  </div>

                  {/* Additional access instructions */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                      <span>Additional access instructions (optional)</span>
                      <span className="text-[10px] text-gray-400 font-mono">{accessInstructions.length}/200</span>
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      placeholder="e.g. Gate code, entry time, etc."
                      value={accessInstructions}
                      onChange={e => setAccessInstructions(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      These details help us get your issue to the right person faster.
                    </p>
                  </div>

                  {/* Auto-filled Building & Unit Details */}
                  <div className="pt-2 border-t border-gray-200/60 dark:border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                      <span>Auto-filled property:</span>
                      <span className="font-bold text-gray-700 dark:text-gray-200">
                        {buildingName || defaultBuildingName || 'Coronation Residences'} • {unit || defaultUnit || 'Unit 2'}
                      </span>
                    </div>
                    {strataManagerEmail && (
                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                        <span>Manager conduit:</span>
                        <span className="font-mono text-gray-600 dark:text-gray-300">{strataManagerEmail}</span>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM ACTIONS */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-white/10">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !problem.trim()}
            className="px-6 py-2.5 rounded-xl bg-[#0055FF] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}

function useMorphingPopoverContext() {
  try {
    return useMorphingPopover();
  } catch {
    return null;
  }
}

export function CreateRequestModal({
  isOpen,
  onClose,
  onSubmit,
  requestorName,
  requestorEmail,
  requestorPhone,
  defaultBuildingName,
  defaultUnit,
  onViewActivity,
}: CreateRequestModalProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0B1121]/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0d1117] w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-gray-200 dark:border-white/10 p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        <CreateRequestFormContent
          onSubmit={onSubmit}
          requestorName={requestorName}
          requestorEmail={requestorEmail}
          requestorPhone={requestorPhone}
          defaultBuildingName={defaultBuildingName}
          defaultUnit={defaultUnit}
          onClose={onClose}
          onViewActivity={onViewActivity}
        />
      </div>
    </div>
  );
}
// Style: Harmonize hover scale transforms across modals
