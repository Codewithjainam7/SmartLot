import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RequestStream } from '../store/smartLotStore';
import { CustomSelect, SelectOption } from './core/CustomSelect';
import { GlowSubmitButton } from './core/GlowSubmitButton';
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
  Calendar,
  Eye
} from 'lucide-react';

interface CreateRequestModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit: (data: {
    requestType: RequestStream;
    title: string;
    description: string;
    attachmentUrl?: string;
    priority: 'Low' | 'Medium' | 'High' | 'Emergency';
    dueDate?: string;
  }) => void;
  requestorName: string;
  requestorEmail?: string;
  requestorPhone?: string;
}

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'Low', label: 'Low Priority', description: 'Standard response within 7 business days' },
  { value: 'Medium', label: 'Medium Priority', description: 'Action recommended within 48 hours' },
  { value: 'High', label: 'High Priority', description: 'Urgent attention required within 24 hours' },
  { value: 'Emergency', label: 'Emergency', description: 'Immediate safety or property hazard' },
];

export function CreateRequestFormContent({
  onSubmit,
  requestorName,
  requestorEmail = "lisa@unit10.com",
  requestorPhone = "0412 888 999",
  onClose,
}: {
  onSubmit: (data: any) => void;
  requestorName: string;
  requestorEmail?: string;
  requestorPhone?: string;
  onClose?: () => void;
}) {
  const morphContext = useMorphingPopoverContext();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [requestType, setRequestType] = useState<RequestStream>('maintenance_upgrade');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=500&auto=format&fit=crop');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Emergency'>('High');
  const [dueDate, setDueDate] = useState<string>('');

  const handleNext = () => {
    if (step === 2 && (!title || !description)) return;
    if (step < 5) setStep((step + 1) as any);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as any);
  };

  const handleDismiss = () => {
    if (morphContext) {
      morphContext.setIsOpen(false);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleFinalSubmit = () => {
    onSubmit({
      requestType,
      title,
      description,
      attachmentUrl,
      priority,
      dueDate,
    });
    handleDismiss();
  };

  return (
    <div className="space-y-6">
      {/* Top Stepper Indicator */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 dark:border-white/5 pb-4">
        <div>
          <span className="text-xs font-extrabold text-[#0055FF] uppercase tracking-wider">Step {step} of 5</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {step === 1 && '1. Choose Request Type'}
            {step === 2 && '2. Add Title & Description'}
            {step === 3 && '3. Upload Attachments'}
            {step === 4 && '4. Requestor Details & Priority'}
            {step === 5 && '5. Preview & Verify Request'}
          </h2>
        </div>
        <button onClick={handleDismiss} className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
          <X size={20} />
        </button>
      </div>

      {/* STEP 1: Choose Request Type */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select the matching Australian Strata category for your request:</p>
          <TypeCard 
            type="maintenance_upgrade" 
            title="1. Maintenance & Upgrade Request" 
            desc="Shared common area repairs, lift maintenance, gate fixes." 
            icon={<Wrench size={20} className="text-[#0055FF]" />} 
            selected={requestType === 'maintenance_upgrade'} 
            onClick={() => setRequestType('maintenance_upgrade')} 
          />
          <TypeCard 
            type="emergency" 
            title="2. Emergency Request" 
            desc="Burst pipes, security hazard, electrical failure requiring urgent dispatch." 
            icon={<AlertTriangle size={20} className="text-[#FF6B6B]" />} 
            selected={requestType === 'emergency'} 
            onClick={() => setRequestType('emergency')} 
          />
          <TypeCard 
            type="complaint" 
            title="3. Complaint" 
            desc="Bylaw breaches, noise complaints, unauthorized parking." 
            icon={<MessageSquareWarning size={20} className="text-[#FFB020]" />} 
            selected={requestType === 'complaint'} 
            onClick={() => setRequestType('complaint')} 
          />
          <TypeCard 
            type="unit_request" 
            title="4. Unit Request" 
            desc="Internal lot fixtures, intercom handset issues, key fob requests." 
            icon={<Home size={20} className="text-[#10B981]" />} 
            selected={requestType === 'unit_request'} 
            onClick={() => setRequestType('unit_request')} 
          />
          <TypeCard 
            type="recurring_task" 
            title="5. Recurring Task Setup Request" 
            desc="Scheduled garden maintenance, bin cleaning, recurring pest control." 
            icon={<Repeat size={20} className="text-[#0055FF]" />} 
            selected={requestType === 'recurring_task'} 
            onClick={() => setRequestType('recurring_task')} 
          />
        </div>
      )}

      {/* STEP 2: Title & Description */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 ml-1">Request Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Main Entrance Vehicle Gate Repair"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-[#1a1d27] focus:bg-white dark:focus:bg-[#1a1d27] text-sm outline-none font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm transition-all focus:border-[#00D4B2]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 ml-1">Detailed Description</label>
            <textarea
              required
              rows={4}
              placeholder="Provide location, symptoms, and exact details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-[#1a1d27] focus:bg-white dark:focus:bg-[#1a1d27] text-sm outline-none font-semibold text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm transition-all focus:border-[#00D4B2]"
            />
          </div>
        </div>
      )}

      {/* STEP 3: Upload Attachments */}
      {step === 3 && (
        <div className="space-y-4">
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1 ml-1">Attach Photos or Inspection Docs</label>
          <div className="border-2 border-dashed border-gray-200 dark:border-white/8 dark:border-white/8 rounded-3xl p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#1a1d27] text-center hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
            {attachmentUrl ? (
              <div className="space-y-2 w-full">
                <img src={attachmentUrl} alt="Attachment Preview" className="w-full h-40 object-cover rounded-2xl border border-gray-200 dark:border-white/8 shadow-sm" />
                <span className="text-xs text-[#00A38C] font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 size={14} /> Photo Attachment Attached
                </span>
              </div>
            ) : (
              <>
                <Upload size={32} className="text-gray-400 mb-2" />
                <span className="text-sm font-semibold text-gray-700">Drag & Drop photo or file</span>
                <span className="text-xs text-gray-400 mt-1">Supports JPG, PNG, PDF up to 10MB</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: Requestor Details (Prefilled & Non-Editable) + Priority & Due Date */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/8 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Prefilled Requestor Details (Non-Editable)</span>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-gray-800"><User size={14} className="text-[#0055FF]" /> {requestorName}</div>
              <div className="flex items-center gap-1.5 font-semibold text-gray-600 dark:text-gray-300"><Mail size={14} className="text-gray-400" /> {requestorEmail}</div>
              <div className="flex items-center gap-1.5 font-semibold text-gray-600 dark:text-gray-300"><Phone size={14} className="text-gray-400" /> {requestorPhone}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              label="Set Priority"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={val => setPriority(val as any)}
            />

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 ml-1">Target Due Date (Optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-[#1a1d27] focus:bg-white dark:focus:bg-[#1a1d27] text-sm font-bold text-gray-800 dark:text-white outline-none shadow-sm transition-all focus:border-[#00D4B2]"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Preview & Verify */}
      {step === 5 && (
        <div className="bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/8 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/8 dark:border-white/8 pb-3">
            <span className="text-xs font-extrabold uppercase text-[#0055FF] tracking-wider">Request Preview</span>
            <span className="px-3 py-0.5 rounded-full bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/20 text-[10px] font-bold uppercase">Status: NEW</span>
          </div>

          <div>
            <div className="text-xs font-bold text-gray-400 uppercase">Category</div>
            <div className="text-sm font-bold text-gray-900 dark:text-white capitalize">{requestType.replace(/_/g, ' ')}</div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{description}</p>
          </div>

          {attachmentUrl && (
            <img src={attachmentUrl} alt="Attached" className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-white/8" />
          )}

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-white/8 dark:border-white/8 text-xs">
            <div><span className="text-gray-400 font-bold">Requestor:</span> <span className="font-bold text-gray-800">{requestorName}</span></div>
            <div><span className="text-gray-400 font-bold">Priority:</span> <span className="font-bold text-[#FF6B6B]">{priority}</span></div>
            <div><span className="text-gray-400 font-bold">Target Date:</span> <span className="font-semibold text-gray-700">{dueDate || 'Flexible'}</span></div>
          </div>
        </div>
      )}

      {/* Navigation Control Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5 dark:border-white/5">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/8 text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1.5 bg-gray-50 dark:bg-[#1a1d27] hover:bg-gray-100 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
        ) : (
          <div />
        )}

        {step < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="bg-[#0B1121] dark:bg-[#00D4B2]/10 dark:border dark:border-[#00D4B2]/20 hover:bg-black dark:hover:bg-[#00D4B2]/20 text-white dark:text-[#00D4B2] px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <GlowSubmitButton 
            label="Verify & Submit Request"
            loadingLabel="Submitting Request..."
            onClick={handleFinalSubmit}
            icon={<CheckCircle2 size={16} className="text-[#10B981]" />}
          />
        )}
      </div>
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
}: CreateRequestModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0B1121]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0d1117] w-full max-w-2xl rounded-3xl border border-gray-100 dark:border-white/5 dark:border-white/5 p-8 shadow-2xl z-10 space-y-6 animate-in zoom-in-95 duration-200">
        <CreateRequestFormContent 
          onSubmit={onSubmit}
          requestorName={requestorName}
          requestorEmail={requestorEmail}
          requestorPhone={requestorPhone}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

function TypeCard({ type, title, desc, icon, selected, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
        selected ? 'border-[#0055FF] bg-[#0055FF]/10 ring-1 ring-[#0055FF]' : 'border-gray-200 dark:border-white/8 dark:border-white/5 bg-gray-50 dark:bg-[#1a1d27] dark:bg-[#1a1d27] hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:bg-[#252836]'
      }`}
    >
      <div className="p-2 rounded-xl bg-white dark:bg-[#0d1117] border dark:border-white/5 shadow-sm shrink-0">{icon}</div>
      <div>
        <div className="font-bold text-sm text-gray-900 dark:text-white">{title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
      </div>
    </button>
  );
}

