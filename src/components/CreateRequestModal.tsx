// @smartlot/component
import React, { useState } from 'react';
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
  Paperclip
} from 'lucide-react';

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
  }) => void;
  requestorName: string;
  requestorEmail?: string;
  requestorPhone?: string;
  defaultBuildingName?: string;
  defaultUnit?: string;
}

const ACTIVITY_TYPES: { value: ActivityType; label: string; desc: string; icon: React.ReactNode }[] = [
  { 
    value: 'Common Property Repair', 
    label: 'Common Property Repair', 
    desc: 'Gates, doors, building facade, fences, intercoms, or shared driveway.',
    icon: <Wrench size={16} className="text-[#0055FF]" /> 
  },
  { 
    value: 'Maintenance / Vendor', 
    label: 'Maintenance / Vendor', 
    desc: 'Scheduled servicing, HVAC, garden, lifts, cleaning, or pest control.',
    icon: <Repeat size={16} className="text-[#00D4B2]" /> 
  },
  { 
    value: 'General Request', 
    label: 'General Request', 
    desc: 'Key fobs, access permissions, moving-in notices, or general enquiries.',
    icon: <FileText size={16} className="text-[#6366F1]" /> 
  },
  { 
    value: 'Complaint', 
    label: 'Complaint', 
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
    label: 'Urgent Issue', 
    desc: 'Burst pipes, gas leaks, water penetration, or immediate safety hazards.',
    icon: <AlertTriangle size={16} className="text-[#FF4757]" /> 
  },
];

const LOCATIONS: ActivityLocation[] = [
  'Front entrance',
  'Lift',
  'Lobby',
  'Car park',
  'Common area',
  'Garden',
  'Bin room',
  'Roof',
  'Pool',
  'Other',
  'Not applicable',
];

const PRIORITIES: { value: ActivityPriority; label: string; desc: string; color: string }[] = [
  { value: 'Low', label: 'Low', desc: 'Standard non-urgent request', color: 'text-gray-400 border-gray-500/20' },
  { value: 'Normal', label: 'Normal', desc: '48h target review', color: 'text-blue-400 border-blue-500/20' },
  { value: 'High', label: 'High', desc: 'Urgent attention within 24h', color: 'text-amber-400 border-amber-500/30' },
  { value: 'Urgent', label: 'Urgent', desc: 'Immediate safety or property hazard', color: 'text-red-400 border-red-500/40' },
];

export function CreateRequestFormContent({
  onSubmit,
  requestorName,
  requestorEmail = "",
  requestorPhone = "",
  defaultBuildingName = "",
  defaultUnit = "",
  defaultManagerEmail = "",
  onClose,
}: {
  onSubmit: (data: any) => void;
  requestorName: string;
  requestorEmail?: string;
  requestorPhone?: string;
  defaultBuildingName?: string;
  defaultUnit?: string;
  defaultManagerEmail?: string;
  onClose?: () => void;
}) {
  const morphContext = useMorphingPopoverContext();

  // Form State
  const [buildingName, setBuildingName] = useState(defaultBuildingName);
  const [unit, setUnit] = useState(defaultUnit);
  const [strataManagerEmail, setStrataManagerEmail] = useState(defaultManagerEmail);
  const [activityType, setActivityType] = useState<ActivityType>('Common Property Repair');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ActivityPriority>('Normal');
  const [location, setLocation] = useState<ActivityLocation>('Common area');
  const [contactPreference, setContactPreference] = useState<ContactPreference>('Email');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDismiss = () => {
    if (morphContext) {
      morphContext.setIsOpen(false);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setIsSubmitting(true);

    onSubmit({
      buildingName: buildingName || defaultBuildingName || 'My Building',
      unit: unit || defaultUnit || 'Unit 1',
      activityType,
      requestType: activityType,
      title,
      description,
      priority,
      location,
      contactPreference,
      strataManagerEmail: strataManagerEmail || defaultManagerEmail || undefined,
      attachmentUrl: photos[0] || undefined,
      attachmentUrls: photos,
    });

    setIsSubmitting(false);
    handleDismiss();
  };

  return (
    <div className="space-y-5 text-left">
      {/* Modal Header */}
      <div className="flex items-start justify-between border-b border-gray-100 dark:border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0055FF]/10 text-[#0055FF] dark:text-[#00D4B2] border border-[#0055FF]/20 text-[10px] font-black uppercase tracking-wider mb-1">
            Activity Management
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
            Initiate Building Activity
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            SmartLot acts as your communication conduit. No prior building onboarding required.
          </p>
        </div>
        <button 
          onClick={handleDismiss} 
          className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleFinalSubmit} className="space-y-4">
        
        {/* ROW 1: Building (Search/Select) & Unit */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Building size={13} className="text-[#0055FF] dark:text-[#00D4B2]" /> 
              <span>Building / Address</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cavalier Apartments or 14-16 Coronation Ave"
              value={buildingName}
              onChange={e => setBuildingName(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-[#161a26] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Home size={13} className="text-[#0055FF] dark:text-[#00D4B2]" /> 
              <span>Unit / Lot</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Unit 12"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-[#161a26] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
            />
          </div>
        </div>

        {/* Conduit Notification Route (Strata Manager Email) */}
        <div className="bg-gray-50/70 dark:bg-[#121622] rounded-2xl p-3 border border-gray-200/80 dark:border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
              <Mail size={13} className="text-[#0055FF] dark:text-[#00D4B2]" />
              <span>Strata Manager Email (Conduit Recipient)</span>
            </span>
            <span className="text-[10px] text-[#00D4B2] font-semibold">No SmartLot account required</span>
          </div>
          <input
            type="email"
            value={strataManagerEmail}
            onChange={e => setStrataManagerEmail(e.target.value)}
            placeholder="e.g. manager@agency.com"
            className="w-full h-9 px-3 rounded-xl bg-white dark:bg-[#161a26] border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
          />
          <p className="text-[10px] text-gray-400 leading-normal">
            SmartLot sends your request to this address with your unique reference. The manager can simply click <strong>Reply All</strong> from their inbox without registering.
          </p>
        </div>

        {/* ROW 2: Activity Type & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Wrench size={13} className="text-[#0055FF] dark:text-[#00D4B2]" />
              <span>Activity Type</span>
              <span className="text-red-500">*</span>
            </label>
            <select
              value={activityType}
              onChange={e => setActivityType(e.target.value as ActivityType)}
              className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#161a26] border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2] cursor-pointer"
            >
              {ACTIVITY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <MapPin size={13} className="text-[#0055FF] dark:text-[#00D4B2]" />
              <span>Location (Optional)</span>
            </label>
            <select
              value={location}
              onChange={e => setLocation(e.target.value as ActivityLocation)}
              className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#161a26] border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2] cursor-pointer"
            >
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ROW 3: Title */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <FileText size={13} className="text-[#0055FF] dark:text-[#00D4B2]" />
            <span>Activity Title</span>
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Front security gate not closing"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl bg-gray-50 dark:bg-[#161a26] border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
          />
        </div>

        {/* ROW 4: Priority Selector Pills */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <Clock size={13} className="text-[#0055FF] dark:text-[#00D4B2]" />
            <span>Priority Level</span>
            <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITIES.map(p => {
              const isSelected = priority === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`h-9 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    isSelected
                      ? p.value === 'Urgent'
                        ? 'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20'
                        : p.value === 'High'
                        ? 'bg-[#FFB020] text-black border-amber-500 shadow-md shadow-amber-500/20'
                        : 'bg-[#0055FF] text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-gray-50 dark:bg-[#161a26] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ROW 5: Detailed Description */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <FileText size={13} className="text-[#0055FF] dark:text-[#00D4B2]" />
            <span>Detailed Description</span>
            <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            placeholder="Describe the issue, past communications, and any specific access instructions..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-[#161a26] border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2]"
          />
        </div>

        {/* ROW 6: Photos / Attachments */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <Paperclip size={13} className="text-[#0055FF] dark:text-[#00D4B2]" />
            <span>Photos / Attachments</span>
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            {photos.map((url, idx) => (
              <div key={idx} className="relative group w-20 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xs">
                <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setPhotos(prev => [
                  ...prev,
                  'https://images.unsplash.com/photo-1584463623578-3019808d4b38?w=800&auto=format&fit=crop'
                ]);
              }}
              className="h-16 px-4 rounded-xl border border-dashed border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-[#161a26] hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center text-[10px] font-bold cursor-pointer transition-colors"
            >
              <Upload size={14} className="mb-0.5" />
              <span>+ Add Photo</span>
            </button>
          </div>
        </div>

        {/* ROW 7: Contact Preference & Submitter Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/10 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-700 dark:text-gray-300">Contact Preference:</span>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-600 dark:text-gray-300">
              <input
                type="radio"
                name="contactPref"
                checked={contactPreference === 'Email'}
                onChange={() => setContactPreference('Email')}
                className="text-[#0055FF]"
              />
              <span>Email (CC'd)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-600 dark:text-gray-300">
              <input
                type="radio"
                name="contactPref"
                checked={contactPreference === 'SmartLot notifications'}
                onChange={() => setContactPreference('SmartLot notifications')}
                className="text-[#0055FF]"
              />
              <span>In-App Only</span>
            </label>
          </div>

          <div className="text-[11px] text-gray-400">
            Submitter: <strong className="text-gray-800 dark:text-gray-200">{requestorName}</strong>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-white/10">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Send size={14} />
            <span>Create Activity & Dispatch Conduit Email</span>
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
}: CreateRequestModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0B1121]/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0d1117] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 dark:border-white/10 p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        <CreateRequestFormContent 
          onSubmit={onSubmit}
          requestorName={requestorName}
          requestorEmail={requestorEmail}
          requestorPhone={requestorPhone}
          defaultBuildingName={defaultBuildingName}
          defaultUnit={defaultUnit}
          onClose={onClose}
        />
      </div>
    </div>
  );
}