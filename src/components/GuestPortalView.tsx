import React, { useState, useRef } from 'react';
import { WorkOrder } from '../store/smartLotStore';
import { BorderTrail } from './core/border-trail';
import { 
  Key, 
  DollarSign, 
  Upload, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Camera, 
  Send,
  ArrowLeft
} from 'lucide-react';

interface GuestPortalViewProps {
  workOrder: WorkOrder;
  onSubmitCompletion: (workOrderId: string, photoUrl: string, finalCost: number, invoicePdf?: string) => void;
  onBack: () => void;
}

export function GuestPortalView({ workOrder, onSubmitCompletion, onBack }: GuestPortalViewProps) {
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop');
  const [invoicePdfName, setInvoicePdfName] = useState('Invoice_SP10482_WO.pdf');
  const [invoiceAttached, setInvoiceAttached] = useState(false);
  const [finalCost, setFinalCost] = useState(workOrder.budgetCap);
  const [isSubmitted, setIsSubmitted] = useState(workOrder.status === 'completion_submitted' || workOrder.status === 'completed');

  const photoInputRef = useRef<HTMLInputElement>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInvoicePdfName(file.name);
    setInvoiceAttached(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitCompletion(workOrder.id, photoUrl, Number(finalCost), invoicePdfName);
    setIsSubmitted(true);
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto h-full bg-[#0B1121] text-white flex flex-col items-center justify-start">
      
      {/* Top Bar */}
      <div className="w-full max-w-md flex items-center justify-between py-4 mb-4 border-b border-white/10">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white cursor-pointer transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
          <ShieldCheck size={12} /> Verified Contractor Dispatch
        </div>
      </div>

      <div className="w-full max-w-md bg-[#1E2026] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5 relative overflow-hidden">
        <BorderTrail size={90} />

        {/* Header Title */}
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Work Order {workOrder.id}</span>
          <h2 className="text-lg font-bold text-white mt-1 leading-snug">{workOrder.scopeOfWork}</h2>
          <p className="text-xs text-gray-400 mt-1">Assigned Vendor: <span className="text-white font-bold">{workOrder.vendorName}</span></p>
        </div>

        {/* Job Details & Budget Cap */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
            <div className="text-sm font-bold text-emerald-400 mt-1 capitalize">
              {workOrder.status === 'completion_submitted' ? 'Submitted for Review' : workOrder.status.replace('_', ' ')}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Approved Budget</span>
            <div className="text-sm font-bold text-white mt-1">
              ${workOrder.budgetCap.toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">ex GST</span>
            </div>
          </div>
        </div>

        {/* Completion Form */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Camera size={16} className="text-[#0055FF]" /> Upload Completion Proof
            </h3>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">On-Site Completion Photo</label>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <div 
                onClick={() => photoInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center bg-white/5 text-center cursor-pointer hover:bg-white/10 transition-colors group"
              >
                {photoUrl ? (
                  <div className="w-full">
                    <img src={photoUrl} alt="Preview" className="w-full h-36 object-cover rounded-xl border border-white/10 mb-2" />
                    <span className="text-[11px] text-[#00D4B2] font-semibold group-hover:underline block">Click to change completion photo</span>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="text-gray-400 mb-1 group-hover:text-white transition-colors" />
                    <span className="text-xs text-gray-300 font-medium">Click to upload completion photo</span>
                  </>
                )}
              </div>
            </div>

            {/* Final Cost Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Final Amount Billed ($ ex GST)</label>
              <input
                type="number"
                required
                value={finalCost}
                onChange={e => setFinalCost(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm outline-none focus:border-[#00D4B2]"
              />
            </div>

            {/* Invoice PDF Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Attach Final Invoice PDF</label>
              <input
                ref={invoiceInputRef}
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                className="hidden"
                onChange={handleInvoiceUpload}
              />
              <div 
                onClick={() => invoiceInputRef.current?.click()}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00D4B2]/40 p-3.5 rounded-2xl flex items-center justify-between text-xs text-gray-300 cursor-pointer transition-all"
              >
                <span className="flex items-center gap-2 font-medium truncate max-w-[240px]">
                  <FileText size={16} className="text-[#0055FF] dark:text-[#00D4B2] shrink-0" />
                  <span className="truncate">{invoicePdfName}</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                  {invoiceAttached ? 'Uploaded' : 'Click to Upload'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#00D4B2] hover:bg-[#00A38C] text-[#0B1121] rounded-2xl py-4 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              Submit Completion to Building Manager <Send size={16} />
            </button>
          </form>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Completion Submitted</h3>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                Completion invoice and photo of <span className="font-bold text-white">${finalCost.toLocaleString()}</span> have been submitted to Strata Management for review and invoice sign-off.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="w-full bg-white/10 hover:bg-white/15 text-white rounded-xl py-2 text-xs font-semibold cursor-pointer transition-colors"
              >
                Update Completion Details
              </button>
              <button
                type="button"
                onClick={onBack}
                className="w-full bg-[#0055FF] hover:bg-blue-600 text-white rounded-xl py-2.5 text-xs font-bold cursor-pointer transition-colors"
              >
                Return to Work Orders
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
