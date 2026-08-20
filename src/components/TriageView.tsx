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

interface TriageViewProps {
  cases: MaintenanceCase[];
  onSubmitCase: (data: { title: string; description: string; stream: RequestStream; urgency: 'low' | 'medium' | 'high' | 'emergency'; unit: string; reportedBy: string }) => void;
  onTriageCase: (caseId: string, action: 'approve' | 'reject', rejectionReason?: string) => void;
  activePersonaRole: string;
}

export function TriageView({ cases, onSubmitCase, onTriageCase }: TriageViewProps) {
  const [filterStream, setFilterStream] = useState<string>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCaseForRejection, setSelectedCaseForRejection] = useState<MaintenanceCase | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Form State
  const [formStream, setFormStream] = useState<RequestStream>('common_area_repair');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const filteredCases = cases.filter(c => filterStream === 'all' || c.stream === filterStream);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDesc) return;
    onSubmitCase({
      title: formTitle,
      description: formDesc,
      stream: formStream,
      urgency: 'high',
      unit: 'Unit 10',
      reportedBy: 'Lisa Ray (Resident)',
    });
    setFormTitle('');
    setFormDesc('');
    setIsDrawerOpen(false);
  };

  const handleConfirmReject = () => {
    if (!selectedCaseForRejection) return;
    if (!rejectionReasonText.trim()) return;
    onTriageCase(selectedCaseForRejection.id, 'reject', rejectionReasonText);
    setSelectedCaseForRejection(null);
    setRejectionReasonText('');
  };

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-full bg-[#F4F6F9]">
      
      {/* Clean Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121316]/5 text-[#121316] text-xs font-bold uppercase tracking-wider mb-2">
            Deterministic Triage Engine
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance & Triage Inbox</h1>
          <p className="text-sm text-gray-500">Route incoming issues through 4 standardized Australian strata streams.</p>
        </div>

        {/* Clean CTA Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="bg-[#121316] hover:bg-black text-white px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-md cursor-pointer"
        >
          <Plus size={18} className="text-[#D8F235]" /> 
          <span>Log Issue (4-Stream)</span>
        </button>
      </div>

      {/* Stream Selector Filter Pills */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterPill label="All Streams" active={filterStream === 'all'} onClick={() => setFilterStream('all')} count={cases.length} />
        <FilterPill label="1. General Inquiry" active={filterStream === 'general_inquiry'} onClick={() => setFilterStream('general_inquiry')} icon={<HelpCircle size={14} />} />
        <FilterPill label="2. Emergency Repair" active={filterStream === 'emergency_repair'} onClick={() => setFilterStream('emergency_repair')} icon={<AlertTriangle size={14} className="text-[#FF6B6B]" />} />
        <FilterPill label="3. Private Lot Repair" active={filterStream === 'private_lot_repair'} onClick={() => setFilterStream('private_lot_repair')} icon={<Home size={14} />} />
        <FilterPill label="4. Common Area Repair" active={filterStream === 'common_area_repair'} onClick={() => setFilterStream('common_area_repair')} icon={<Building2 size={14} className="text-[#8B8CF8]" />} />
      </div>

      {/* Triage Cases Clean Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.map((item) => (
          <div 
            key={item.id} 
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[320px]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.id} • {item.unit}</span>
                <StatusBadge status={item.status} />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <StreamIcon stream={item.stream} />
                <span className="text-xs font-semibold text-gray-600 capitalize">{item.stream.replace(/_/g, ' ')}</span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{item.description}</p>
              
              {item.rejectionReason && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-xs text-red-700 font-medium">
                  <span className="font-bold">Rejection Reason:</span> {item.rejectionReason}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3 mt-auto">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Reported by {item.reportedBy}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {item.createdAt}</span>
              </div>

              {/* Manager Action Buttons */}
              {item.status === 'pending_triage' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setSelectedCaseForRejection(item)}
                    className="w-full bg-red-50 hover:bg-red-100 text-[#FF6B6B] border border-red-200 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                  <button
                    onClick={() => onTriageCase(item.id, 'approve')}
                    className="w-full bg-[#10B981] hover:bg-emerald-600 text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                </div>
              )}

              {item.status === 'approved_pending_vote' && (
                <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl flex items-center justify-between">
                  <div className="text-xs font-bold text-[#8B8CF8] flex items-center gap-1.5">
                    <Vote size={14} /> Committee Motion Active
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#8B8CF8] text-white">{item.linkedMotionId}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Log Issue Drawer / Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#121316]/50 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Submit Maintenance Request</h2>
            <p className="text-xs text-gray-500 mb-6">Select the matching Australian Strata category stream below.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Request Stream</label>
                <div className="grid grid-cols-2 gap-2">
                  <StreamOption title="1. General Inquiry" selected={formStream === 'general_inquiry'} onClick={() => setFormStream('general_inquiry')} />
                  <StreamOption title="2. Emergency Repair" selected={formStream === 'emergency_repair'} onClick={() => setFormStream('emergency_repair')} />
                  <StreamOption title="3. Private Lot Repair" selected={formStream === 'private_lot_repair'} onClick={() => setFormStream('private_lot_repair')} />
                  <StreamOption title="4. Common Area Repair" selected={formStream === 'common_area_repair'} onClick={() => setFormStream('common_area_repair')} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shared Main Gate Motor Leak"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the issue, location, and symptoms..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#121316] hover:bg-black text-white text-sm font-bold flex items-center gap-2 cursor-pointer">
                  <span>Submit Request</span> <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Rejection Reason Modal */}
      {selectedCaseForRejection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedCaseForRejection(null)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl z-10">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#FF6B6B] flex items-center justify-center mb-4">
              <XCircle size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Mandatory Rejection Reason</h3>
            <p className="text-xs text-gray-500 mb-4">You are rejecting <span className="font-bold">{selectedCaseForRejection.id}</span>. Written rationale is required for resident transparency (Max 50 words).</p>

            <textarea
              required
              rows={4}
              maxLength={250}
              placeholder="State reason (e.g. Internal unit fixture is the responsibility of the Lot Owner, not Common Area funds)..."
              value={rejectionReasonText}
              onChange={e => setRejectionReasonText(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none mb-4 focus:ring-2 focus:ring-red-200"
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedCaseForRejection(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 cursor-pointer">Cancel</button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReasonText.trim()}
                className="px-5 py-2 rounded-xl bg-[#FF6B6B] hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer"
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
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
        active 
          ? 'bg-[#121316] text-[#D8F235] shadow-md ring-1 ring-black' 
          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
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
      return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">Pending Triage</span>;
    case 'approved_direct_dispatch':
      return <span className="px-3 py-1 rounded-full bg-[#10B981]/20 text-[#10B981] text-[10px] font-bold uppercase tracking-wider">Approved - Direct Dispatch</span>;
    case 'approved_pending_vote':
      return <span className="px-3 py-1 rounded-full bg-[#8B8CF8]/20 text-[#6366F1] text-[10px] font-bold uppercase tracking-wider">Approved - Pending Vote</span>;
    case 'rejected':
      return <span className="px-3 py-1 rounded-full bg-red-100 text-[#FF6B6B] text-[10px] font-bold uppercase tracking-wider">Rejected</span>;
    case 'resolved':
      return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">Resolved</span>;
  }
}

function StreamIcon({ stream }: { stream: RequestStream }) {
  switch (stream) {
    case 'general_inquiry': return <HelpCircle size={16} className="text-gray-500" />;
    case 'emergency_repair': return <AlertTriangle size={16} className="text-[#FF6B6B]" />;
    case 'private_lot_repair': return <Home size={16} className="text-emerald-600" />;
    case 'common_area_repair': return <Building2 size={16} className="text-[#8B8CF8]" />;
  }
}

function StreamOption({ title, selected, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
        selected ? 'border-[#8B8CF8] bg-[#8B8CF8]/10 font-bold text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
    >
      <div className="text-xs">{title}</div>
    </button>
  );
}
