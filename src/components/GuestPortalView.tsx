// @smartlot/component
import React, { useState } from 'react';
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
  const [finalCost, setFinalCost] = useState(workOrder.budgetCap);
  const [isSubmitted, setIsSubmitted] = useState(workOrder.status === 'completion_submitted' || workOrder.status === 'completed');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitCompletion(workOrder.id, photoUrl, Number(finalCost), 'Invoice_SP10482_WO.pdf');
    setIsSubmitted(true);
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto h-full bg-[#0B1121] text-white flex flex-col items-center justify-start">
      
      {/* Top Mobile Bar */}
      <div className="w-full max-w-md flex items-center justify-between py-4 mb-4 border-b border-white/10">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white">
          <ArrowLeft size={16} /> Return to App
        </button>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D4B2]/10 text-[#00D4B2] text-[10px] font-extrabold uppercase">
          <ShieldCheck size={12} /> Frictionless Mobile Guest Portal (Zero Login)
        </div>
      </div>

      <div className="w-full max-w-md bg-[#1E2026] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
        <BorderTrail size={90} />

        {/* Header Title */}
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Work Order {workOrder.id}</span>
          <h2 className="text-xl font-bold text-white mt-1">{workOrder.scopeOfWork}</h2>
          <p className="text-xs text-gray-400 mt-1">Dispatched to <span className="text-white font-bold">{workOrder.vendorName}</span></p>
        </div>

        {/* Site Access PIN & Budget Cap */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Site Access Code</span>
            <div className="text-lg font-black text-[#00D4B2] flex items-center gap-1 mt-1">
              <Key size={18} /> PIN {workOrder.siteAccessPin}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Approved Budget Cap</span>
            <div className="text-lg font-black text-white mt-1">
              ${workOrder.budgetCap.toLocaleString()} <span className="text-[10px] text-gray-400 font-semibold">ex GST</span>
            </div>
          </div>
        </div>

        {/* Completion Form */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Camera size={16} className="text-[#0055FF]" /> Upload Completion Proof
            </h3>

            {/* Photo Upload Simulation */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">On-Site Completion Photo</label>
              <div className="border-2 border-dashed border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center bg-white/5 text-center cursor-pointer hover:bg-white/10 transition-colors">
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl border border-white/10 mb-2" />
                ) : (
                  <Upload size={24} className="text-gray-400 mb-1" />
                )}
                <span className="text-xs text-gray-300 font-medium">Photo attached automatically</span>
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

            {/* Invoice PDF Upload Simulation */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Attach Final Invoice PDF</label>
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between text-xs text-gray-300">
                <span className="flex items-center gap-2 font-medium">
                  <FileText size={16} className="text-[#0055FF]" /> Invoice_SP10482_WO.pdf
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-[#00D4B2]/100/20 px-2 py-0.5 rounded-full">Ready</span>
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
          <div className="bg-[#00D4B2]/100/10 border border-emerald-500/30 p-6 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#10B981] text-white flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-white">Job Completion Submitted!</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Your completion photo, invoice PDF, and final cost of <span className="font-bold text-white">${finalCost}</span> have been routed directly to the Strata Building Manager for verification.
            </p>
            <button
              onClick={onBack}
              className="w-full bg-white/10 hover:bg-white/20 text-white rounded-xl py-2.5 text-xs font-bold transition-colors"
            >
              Return to SmartLot Dashboard
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
