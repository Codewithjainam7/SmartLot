// @smartlot/component
import React, { useState } from 'react';
import { MaintenanceCase, RequestStream, CaseStatus } from '../store/smartLotStore';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  HelpCircle, 
  Building2, 
  Home, 
  Send, 
  Clock,
  Vote
} from 'lucide-react';
import { 
  MorphingPopover, 
  MorphingPopoverTrigger, 
  MorphingPopoverContent 
} from './core/morphing-popover';
import { CreateRequestFormContent } from './CreateRequestModal';

interface TriageViewProps {
  cases: MaintenanceCase[];
  onSubmitCase: (data: { title: string; description: string; stream: RequestStream; urgency: 'low' | 'medium' | 'high' | 'emergency'; unit: string; reportedBy: string }) => void;
  onTriageCase: (caseId: string, action: 'approve' | 'reject', rejectionReason?: string) => void;
  activePersonaRole: string;
}

export function TriageView({ cases, onSubmitCase, onTriageCase }: TriageViewProps) {
  const [filterStream, setFilterStream] = useState<string>('all');
  const [selectedCaseForRejection, setSelectedCaseForRejection] = useState<MaintenanceCase | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  const filteredCases = cases.filter(c => filterStream === 'all' || c.stream === filterStream);

  const handleConfirmReject = () => {
    if (!selectedCaseForRejection) return;
    if (!rejectionReasonText.trim()) return;
    onTriageCase(selectedCaseForRejection.id, 'reject', rejectionReasonText);
    setSelectedCaseForRejection(null);
    setRejectionReasonText('');
  };

  return (
    <div className="flex-1 p-3.5 sm:p-6 md:p-8 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8 space-y-4 sm:space-y-8 overflow-y-auto h-full bg-[#F4F6F9] dark:bg-[#0a0a0f]">
      
      {/* Clean Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0055FF]/10 dark:bg-[#00D4B2]/10 text-[#0055FF] dark:text-[#00D4B2] border border-[#0055FF]/20 dark:border-[#00D4B2]/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            Deterministic Triage Engine
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Maintenance & Triage Inbox</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Route incoming issues through 4 standardized Australian strata streams.</p>
        </div>

        {/* Clean CTA Button */}
        <MorphingPopover>
          <MorphingPopoverTrigger>
            <div className="bg-[#0B1121] dark:bg-[#00D4B2]/10 dark:border dark:border-[#00D4B2]/20 hover:bg-black dark:hover:bg-[#00D4B2]/20 text-white dark:text-[#00D4B2] px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:scale-105 cursor-pointer w-full sm:w-auto min-h-[44px] active:scale-95">
              <Plus size={18} className="text-[#00D4B2]" /> 
              <span>Log Issue (4-Stream)</span>
            </div>
          </MorphingPopoverTrigger>

          <MorphingPopoverContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CreateRequestFormContent 
              onSubmit={onSubmitCase as any}
              requestorName="System Admin"
            />
          </MorphingPopoverContent>
        </MorphingPopover>
      </div>

      {/* Stream Selector Filter Pills */}
      <div className="flex overflow-x-auto no-scrollbar touch-pan-x items-center gap-2 sm:gap-3 sm:flex-wrap">
        <FilterPill label="All Streams" active={filterStream === 'all'} onClick={() => setFilterStream('all')} count={cases.length} />
        <FilterPill label="1. General Inquiry" active={filterStream === 'general_inquiry'} onClick={() => setFilterStream('general_inquiry')} icon={<HelpCircle size={14} />} />
        <FilterPill label="2. Emergency Repair" active={filterStream === 'emergency_repair'} onClick={() => setFilterStream('emergency_repair')} icon={<AlertTriangle size={14} className="text-[#FF6B6B]" />} />
        <FilterPill label="3. Private Lot Repair" active={filterStream === 'private_lot_repair'} onClick={() => setFilterStream('private_lot_repair')} icon={<Home size={14} />} />
        <FilterPill label="4. Common Area Repair" active={filterStream === 'common_area_repair'} onClick={() => setFilterStream('common_area_repair')} icon={<Building2 size={14} className="text-[#0055FF]" />} />
      </div>

      {/* Triage Cases Clean Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {filteredCases.map((item) => (
          <div 
            key={item.id} 
            className="bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[240px] sm:min-h-[320px]"
          >
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{item.id} • {item.unit}</span>
                <StatusBadge status={item.status} />
              </div>

              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <StreamIcon stream={item.stream || 'common_area_repair'} />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 capitalize">{(item.stream || 'common_area_repair').replace(/_/g, ' ')}</span>
              </div>

              <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2 leading-snug">{item.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3 sm:mb-4 line-clamp-3">{item.description}</p>
              
              {item.rejectionReason && (
                <div className="bg-[#FF4757]/10 border border-[#FF4757]/20 p-2.5 sm:p-3 rounded-xl text-xs text-red-700 font-medium">
                  <span className="font-bold">Rejection Reason:</span> {item.rejectionReason}
                </div>
              )}
            </div>

            <div className="pt-3 sm:pt-4 border-t border-gray-100 dark:border-white/5 space-y-2.5 sm:space-y-3 mt-auto">
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-400 dark:text-gray-500">
                <span>Reported by {item.reportedBy}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {item.createdAt}</span>
              </div>

              {/* Manager Action Buttons */}
              {item.status === 'pending_triage' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    aria-label={`Reject request ${item.referenceId || item.id}`}
                    title="Reject request with mandatory rationale"
                    onClick={() => setSelectedCaseForRejection(item)}
                    className="w-full bg-[#FF4757]/10 hover:bg-[#FF4757]/20 text-[#FF6B6B] border border-[#FF4757]/30 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer min-h-[40px] active:scale-95"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                  <button
                    type="button"
                    aria-label={`Approve request ${item.referenceId || item.id}`}
                    title="Approve request for action"
                    onClick={() => onTriageCase(item.id, 'approve')}
                    className="w-full bg-[#10B981] hover:bg-emerald-600 text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer min-h-[40px] active:scale-95"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                </div>
              )}

              {item.status === 'approved_pending_vote' && (
                <div className="bg-purple-50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/20 p-2.5 sm:p-3 rounded-xl flex items-center justify-between">
                  <div className="text-xs font-bold text-[#0055FF] flex items-center gap-1.5">
                    <Vote size={14} /> Committee Motion Active
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#0055FF] text-white">{item.linkedMotionId}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mandatory Rejection Reason Modal */}
      {selectedCaseForRejection && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCaseForRejection(null)} />
          <div className="relative bg-white dark:bg-[#0d1117] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 shadow-2xl z-10 border dark:border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/20 text-[#FF6B6B] flex items-center justify-center mb-4">
              <XCircle size={24} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">Mandatory Rejection Reason</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">You are rejecting <span className="font-bold">{selectedCaseForRejection.id}</span>. Written rationale is required for resident transparency (Max 50 words).</p>

            <textarea
              required
              rows={4}
              maxLength={250}
              placeholder="State reason (e.g. Internal unit fixture is the responsibility of the Lot Owner, not Common Area funds)..."
              value={rejectionReasonText}
              onChange={e => setRejectionReasonText(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/8 dark:border-white/8 bg-gray-50 dark:bg-[#1a1d27] dark:bg-[#1a1d27] text-sm outline-none text-gray-900 dark:text-white focus:bg-white dark:focus:bg-[#252836] mb-4 focus:ring-2 focus:ring-red-200"
            />

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <button onClick={() => setSelectedCaseForRejection(null)} className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer min-h-[44px] active:scale-95 rounded-xl">Cancel</button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReasonText.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#FF6B6B] hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer min-h-[44px] active:scale-95"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function FilterPill({ label, active, onClick, count, icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border shrink-0 whitespace-nowrap select-none active:scale-95 ${
        active 
          ? 'bg-[#0B1121] dark:bg-white/10 text-[#00D4B2] border-[#00D4B2]/30 shadow-md' 
          : 'bg-white dark:bg-[#0d1117] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border-gray-200 dark:border-white/5'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{count}</span>}
    </button>
  );
}

function StatusBadge({ status }: { status: CaseStatus }) {
  switch (status) {
    case 'pending_triage':
      return <span className="px-3 py-1 rounded-full bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/20 text-[10px] font-bold uppercase tracking-wider">Pending Triage</span>;
    case 'approved_direct_dispatch':
      return <span className="px-3 py-1 rounded-full bg-[#10B981]/20 text-[#10B981] text-[10px] font-bold uppercase tracking-wider">Approved - Direct Dispatch</span>;
    case 'approved_pending_vote':
      return <span className="px-3 py-1 rounded-full bg-[#0055FF]/20 text-[#0033CC] text-[10px] font-bold uppercase tracking-wider">Approved - Pending Vote</span>;
    case 'rejected':
      return <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/20 text-[#FF6B6B] text-[10px] font-bold uppercase tracking-wider">Rejected</span>;
    case 'resolved':
      return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">Resolved</span>;
  }
}

function StreamIcon({ stream }: { stream: RequestStream }) {
  switch (stream) {
    case 'general_inquiry': return <HelpCircle size={16} className="text-gray-500 dark:text-gray-400" />;
    case 'emergency_repair': return <AlertTriangle size={16} className="text-[#FF6B6B]" />;
    case 'private_lot_repair': return <Home size={16} className="text-[#00A38C]" />;
    case 'common_area_repair': return <Building2 size={16} className="text-[#0055FF]" />;
  }
}




// End TriageView

// Subcomponent: Workflow Triage Board
// Animation: Triage Card Drag and Drop Transition