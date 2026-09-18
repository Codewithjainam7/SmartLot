// @smartlot/component GuestPortalView
// Verified Contractor Dispatch & Repair Completion Portal
// Styled cleanly to match SmartLot's official design system (Light / Dark modes, Plus Jakarta Sans, refined rounded-3xl cards)
import React, { useState, useRef } from 'react';
import { WorkOrder, SmartLotStore } from '../store/smartLotStore';
import { SmartLotLogo } from './core/SmartLotLogo';
import { 
  DollarSign, 
  Upload, 
  CheckCircle2, 
  ShieldCheck, 
  Camera, 
  Send,
  ArrowLeft,
  Building2,
  Calendar,
  Wrench,
  Sun,
  Moon,
  Clock,
  Check,
  AlertCircle
} from 'lucide-react';

interface GuestPortalViewProps {
  workOrder: WorkOrder;
  store?: SmartLotStore;
  onSubmitCompletion: (workOrderId: string, photoUrl: string, finalCost: number) => void;
  onBack: () => void;
}

export function GuestPortalView({ workOrder, store, onSubmitCompletion, onBack }: GuestPortalViewProps) {
  const [photoUrl, setPhotoUrl] = useState(
    workOrder.completionPhoto || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop'
  );
  const [finalCost, setFinalCost] = useState(workOrder.finalCost || workOrder.budgetCap);
  const [completionNotes, setCompletionNotes] = useState(
    workOrder.signOffNotes || 'Completed replacement and safety testing. Equipment verified operational.'
  );
  const [isSubmitted, setIsSubmitted] = useState(
    workOrder.status === 'completion_submitted' || workOrder.status === 'completed'
  );

  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitCompletion(workOrder.id, photoUrl, Number(finalCost));
    setIsSubmitted(true);
  };

  const isDarkMode = store?.theme === 'dark';

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0B1121] text-gray-900 dark:text-gray-100 flex flex-col items-center justify-start pb-16 font-sans">
      
      {/* Top Header Bar matching SmartLot design */}
      <header className="w-full bg-white dark:bg-[#0d1117] border-b border-gray-200 dark:border-white/10 sticky top-0 z-30 shadow-xs backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SmartLotLogo className="h-7" />
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />
            <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden sm:inline">
              Contractor Dispatch Portal
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Verified Contractor Dispatch</span>
              <span className="sm:hidden text-[11px]">Verified</span>
            </div>

            {store?.setTheme && (
              <button
                type="button"
                onClick={() => store.setTheme(isDarkMode ? 'light' : 'dark')}
                className="w-8 h-8 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-all cursor-pointer"
                title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            )}

            <button 
              onClick={onBack} 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer border border-gray-200 dark:border-white/10"
            >
              <ArrowLeft size={14} /> Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-2xl px-4 pt-6 sm:pt-8 space-y-6">
        
        {/* Work Order Information Card */}
        <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-white/5 pb-4">
            <div className="space-y-0.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Work Order Reference
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                {workOrder.id}
              </h1>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${
                workOrder.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : workOrder.status === 'completion_submitted' || isSubmitted
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
              }`}>
                {isSubmitted && workOrder.status !== 'completed' 
                  ? 'Submitted For Review' 
                  : workOrder.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
              Authorized Scope of Work
            </span>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">
              {workOrder.scopeOfWork}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/5">
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                Assigned Contractor
              </span>
              <div className="text-sm font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-1.5">
                <Wrench size={14} className="text-blue-600 dark:text-[#00D4B2]" />
                <span>{workOrder.vendorName}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/5">
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                Approved Budget Cap
              </span>
              <div className="text-sm font-black text-gray-900 dark:text-white mt-1">
                ${workOrder.budgetCap?.toLocaleString()} <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">ex GST</span>
              </div>
            </div>
          </div>

        </div>

        {/* Completion Form or Success View */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
            
            <div className="border-b border-gray-100 dark:border-white/5 pb-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Camera size={18} className="text-blue-600 dark:text-[#00D4B2]" /> 
                Upload On-Site Completion Proof
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Please attach a photo demonstrating that the repairs have been finished on site.
              </p>
            </div>

            {/* On-Site Photo Upload */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                On-Site Completion Photo <span className="text-red-500 font-bold">*</span>
              </label>
              
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />

              <div 
                onClick={() => photoInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-white/15 rounded-2xl p-4 flex flex-col items-center justify-center bg-gray-50 dark:bg-white/5 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
              >
                {photoUrl ? (
                  <div className="w-full">
                    <img 
                      src={photoUrl} 
                      alt="Work Completion Proof" 
                      className="w-full h-52 object-cover rounded-xl border border-gray-200 dark:border-white/10 mb-2.5 shadow-xs" 
                    />
                    <div className="flex items-center justify-center gap-1 text-xs text-blue-600 dark:text-[#00D4B2] font-bold group-hover:underline">
                      <Camera size={14} /> Click to change completion photo
                    </div>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center">
                    <Upload size={28} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white transition-colors mb-2" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">
                      Click to choose or capture photo
                    </span>
                    <span className="text-[11px] text-gray-400 mt-1">Supports PNG, JPG, or camera roll</span>
                  </div>
                )}
              </div>
            </div>

            {/* Work Completion Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Work Summary & Technician Notes
              </label>
              <textarea
                rows={3}
                value={completionNotes}
                onChange={e => setCompletionNotes(e.target.value)}
                placeholder="Briefly describe what repairs or maintenance were carried out..."
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs outline-none focus:border-blue-500 dark:focus:border-[#00D4B2] transition-colors"
              />
            </div>

            {/* Final Amount Billed Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Final Amount Billed ($ ex GST) <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={finalCost}
                  onChange={e => setFinalCost(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm outline-none focus:border-blue-500 dark:focus:border-[#00D4B2] transition-colors"
                />
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Approved cap is ${workOrder.budgetCap?.toLocaleString()} ex GST.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-[#0055FF] hover:bg-blue-600 text-white rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
              >
                Submit Completion to Building Manager <Send size={16} />
              </button>
            </div>
          </form>
        ) : (
          /* Completion Submitted Confirmation Card */
          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-3xl p-7 sm:p-8 shadow-xs text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-500/20">
                <Check size={13} /> Work Completed
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                Completion Submitted
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-md mx-auto leading-relaxed">
                Work completion proof photo and final billed amount of{' '}
                <strong className="text-gray-900 dark:text-white">${finalCost.toLocaleString()} ex GST</strong>{' '}
                have been submitted to Strata Management for review and final sign-off.
              </p>
            </div>

            {/* Proof Thumbnail */}
            {photoUrl && (
              <div className="max-w-xs mx-auto rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xs">
                <img src={photoUrl} alt="Submitted work proof" className="w-full h-36 object-cover" />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Update Completion Details
              </button>
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Return to Work Orders
              </button>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
