// @smartlot/component
import React, { useState } from 'react';
import { Vendor, WorkOrder, ResidentRequest, RequestQuote, CreateVendorPayload } from '../store/smartLotStore';
import { CustomSelect, SelectOption } from './core/CustomSelect';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Phone, 
  Mail,
  Star, 
  Key, 
  CheckCircle2, 
  Clock,
  Wrench,
  Plus,
  FileText,
  Search,
  Building2,
  Vote,
  Check,
  Calendar,
  DollarSign,
  X,
  FileCheck2,
  Camera,
  Download,
  HelpCircle,
  FileDown,
  ChevronDown
} from 'lucide-react';

interface VendorViewProps {
  vendors: Vendor[];
  workOrders: WorkOrder[];
  requests?: ResidentRequest[];
  onOpenGuestPortal: (workOrderId: string) => void;
  onVerifyWorkOrder: (workOrderId: string) => void;
  onSignOffWorkOrder?: (workOrderId: string, signOffNotes?: string) => void;
  onRequestQuotes?: (requestId: string, scope: string, quotes: RequestQuote[]) => void;
  onVoteForQuote?: (requestId: string, quoteId: string) => void;
  onAwardQuote?: (requestId: string, quoteId: string, budgetCap?: number, pin?: string) => void;
  onAddVendor?: (payload: CreateVendorPayload) => void;
  onUpdateVendorInsurance?: (vendorId: string, status: 'Active' | 'Expired Ins.' | 'Pending Verification', expiryDate: string) => void;
  activePersonaName?: string;
  activePersonaRole?: string;
  activeSchemeName?: string;
  activeSchemeId?: string;
}

export function VendorView({ 
  vendors, 
  workOrders, 
  requests = [],
  onOpenGuestPortal, 
  onVerifyWorkOrder,
  onSignOffWorkOrder,
  onRequestQuotes,
  onVoteForQuote,
  onAwardQuote,
  onAddVendor,
  onUpdateVendorInsurance,
  activePersonaName = 'Emma Wilson',
  activePersonaRole = 'Strata Manager',
  activeSchemeName = 'Cavalier Grand Residences',
  activeSchemeId = 'SP103'
}: VendorViewProps) {
  const isCommitteeMember = Boolean(activePersonaRole?.toLowerCase().includes('committee'));
  const isManagerOrAdmin = Boolean(activePersonaRole?.includes('Manager') || activePersonaRole?.includes('Admin'));

  const [activeTab, setActiveTab] = useState<'work_orders' | 'tenders' | 'directory'>(
    isCommitteeMember ? 'tenders' : 'work_orders'
  );
  const [workOrderFilter, setWorkOrderFilter] = useState<'all' | 'needs_signoff' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [signOffModalWo, setSignOffModalWo] = useState<WorkOrder | null>(null);
  const [signOffNotes, setSignOffNotes] = useState('');
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showCreateTenderModal, setShowCreateTenderModal] = useState(false);
  const [insuranceVerifyVendor, setInsuranceVerifyVendor] = useState<Vendor | null>(null);
  const [newInsuranceExpiry, setNewInsuranceExpiry] = useState('2027-12-31');

  // New Vendor Form State
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState('Lift & Vertical Transport');
  const [newVendorAbn, setNewVendorAbn] = useState('');
  const [newVendorLicense, setNewVendorLicense] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [newVendorExpiry, setNewVendorExpiry] = useState('2027-12-31');

  // New Tender Form State
  const [tenderRequestId, setTenderRequestId] = useState<string>('');
  const [tenderScope, setTenderScope] = useState('');
  const [tenderBudget, setTenderBudget] = useState('3500');
  const [selectedVendorsForTender, setSelectedVendorsForTender] = useState<string[]>([]);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [adHocVendorName, setAdHocVendorName] = useState('');
  const [adHocVendorEmail, setAdHocVendorEmail] = useState('');
  const [adHocVendorQuoteAmount, setAdHocVendorQuoteAmount] = useState('3100');

  // Filter requests that are in quoting state or have quotes
  const tenderRequests = requests.filter(r => 
    (!r.schemeId || r.schemeId === activeSchemeId) && 
    (r.tenderStatus === 'quoting' || (r.tenderQuotes && r.tenderQuotes.length > 0))
  );

  // Filter work orders
  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesScheme = !wo.schemeId || wo.schemeId === activeSchemeId;
    if (!matchesScheme) return false;

    if (workOrderFilter === 'needs_signoff' && wo.status !== 'completion_submitted') return false;
    if (workOrderFilter === 'in_progress' && wo.status !== 'issued' && wo.status !== 'in_progress') return false;
    if (workOrderFilter === 'completed' && wo.status !== 'completed') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        wo.id.toLowerCase().includes(q) ||
        wo.vendorName.toLowerCase().includes(q) ||
        wo.scopeOfWork.toLowerCase().includes(q) ||
        wo.caseId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter vendors
  const filteredVendors = vendors.filter(v => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.abn.toLowerCase().includes(q) ||
      v.licenseNo.toLowerCase().includes(q)
    );
  });

  const categoryOptions: SelectOption[] = [
    { value: 'Lift & Vertical Transport', label: 'Lift & Vertical Transport' },
    { value: 'Plumbing & Drainage', label: 'Plumbing & Drainage' },
    { value: 'Electrical & Lighting', label: 'Electrical & Lighting' },
    { value: 'Fire & Safety Services', label: 'Fire & Safety Services' },
    { value: 'Roofing & Waterproofing', label: 'Roofing & Waterproofing' },
    { value: 'Mechanical & Acoustic Services', label: 'Mechanical & Acoustic Services' },
    { value: 'General Building Maintenance', label: 'General Building Maintenance' },
  ];

  const requestOptions: SelectOption[] = requests
    .filter(r => !r.schemeId || r.schemeId === activeSchemeId)
    .map(r => ({
      value: r.id,
      label: r.title,
      description: `Raised by ${r.requestorName} • ${r.priority} Priority`
    }));

  const handleCreateVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim() || !onAddVendor) return;

    const isExpired = new Date(newVendorExpiry) < new Date();
    onAddVendor({
      name: newVendorName.trim(),
      category: newVendorCategory,
      abn: newVendorAbn.trim() || '44 100 200 300',
      licenseNo: newVendorLicense.trim() || 'LIC-NSW-99999',
      phone: newVendorPhone.trim() || '02 9000 1111',
      email: newVendorEmail.trim() || 'info@contractor.com.au',
      insuranceStatus: isExpired ? 'Expired Ins.' : 'Active',
      insuranceExpiry: newVendorExpiry,
      rating: 5.0
    });

    setShowAddVendorModal(false);
    setNewVendorName('');
    setNewVendorAbn('');
    setNewVendorLicense('');
    setNewVendorPhone('');
    setNewVendorEmail('');
  };

  const handleCreateTenderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenderRequestId || !onRequestQuotes) return;

    const quotes: RequestQuote[] = [];

    // Selected directory vendors
    selectedVendorsForTender.forEach(vId => {
      const v = vendors.find(item => item.id === vId);
      if (v) {
        quotes.push({
          id: `QTE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          vendorId: v.id,
          vendorName: v.name,
          contactEmail: v.email,
          contactPhone: v.phone,
          isAccredited: true,
          insuranceStatus: v.insuranceStatus,
          insuranceExpiry: v.insuranceExpiry,
          amount: Math.round(Number(tenderBudget) * (0.9 + Math.random() * 0.2)),
          scopeNotes: `Full attendance and repair as per building brief: ${tenderScope || 'As requested'}`,
          warranty: '12 Months Comprehensive',
          estimatedDays: 1,
          submittedAt: 'Today, Just now',
          recommended: quotes.length === 0,
          committeeVotes: []
        });
      }
    });

    // Ad-Hoc Vendor if entered
    if (adHocVendorName.trim()) {
      quotes.push({
        id: `QTE-${Date.now()}-adhoc`,
        vendorId: `VND-ADHOC-${Date.now()}`,
        vendorName: adHocVendorName.trim(),
        contactEmail: adHocVendorEmail.trim() || 'quotes@contractor.com.au',
        contactPhone: '0400 999 888',
        isAccredited: false,
        insuranceStatus: 'Pending Verification',
        insuranceExpiry: '2026-10-01',
        amount: Number(adHocVendorQuoteAmount) || 3100,
        scopeNotes: `Independent contractor estimate for: ${tenderScope || 'Repair scope'}`,
        warranty: '6 Months Parts',
        estimatedDays: 2,
        submittedAt: 'Today, Just now',
        recommended: false,
        committeeVotes: []
      });
    }

    onRequestQuotes(tenderRequestId, tenderScope, quotes);
    setShowCreateTenderModal(false);
    setActiveTab('tenders');
  };

  const handleConfirmSignOff = () => {
    if (!signOffModalWo) return;
    if (onSignOffWorkOrder) {
      onSignOffWorkOrder(signOffModalWo.id, signOffNotes);
    } else {
      onVerifyWorkOrder(signOffModalWo.id);
    }
    setSignOffModalWo(null);
    setSignOffNotes('');
  };

  return (
    <div className="flex-1 p-3.5 sm:p-6 md:p-8 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8 space-y-4 sm:space-y-6 overflow-y-auto h-full bg-[#F4F6F9] dark:bg-[#0B1121] text-gray-900 dark:text-gray-100">
      
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1 sm:space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0055FF]/10 dark:bg-[#00D4B2]/10 text-[#0055FF] dark:text-[#00D4B2] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <Wrench size={13} /> Trades & Work Orders Lifecycle
          </div>
          <h1 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isCommitteeMember ? 'Trades & Quote Poll' : 'Trades & Work Orders'}
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
            {isCommitteeMember
              ? 'Review pending vendor quote polls and cast your official vote on preferred trades.'
              : 'Compare quotes from local trades, issue digital work orders with key PINs, verify repair completion photos, and sign off invoices.'}
          </p>
        </div>

        {/* Action Buttons (Restricted for Committee Members) */}
        {!isCommitteeMember && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowCreateTenderModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer min-h-[44px]"
            >
              <Vote size={15} /> Get Quotes (Tender Job)
            </button>
            <button
              onClick={() => setShowAddVendorModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer min-h-[44px]"
            >
              <Plus size={15} /> Add Verified Trade
            </button>
          </div>
        )}
      </div>

      {/* Senior-Friendly KPI Summary Cards */}
      {!isCommitteeMember ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-white dark:bg-[#0d1117] rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border border-gray-200 dark:border-white/10 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Active Work Orders</span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">
              {workOrders.filter(wo => wo.status !== 'completed').length}
            </div>
            <span className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-medium">Ongoing repair jobs</span>
          </div>

          <div className="bg-white dark:bg-[#0d1117] rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border border-gray-200 dark:border-white/10 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Quotes Under Review</span>
            <div className="text-xl sm:text-2xl font-black text-[#0055FF] dark:text-[#00D4B2] mt-1">
              {tenderRequests.length}
            </div>
            <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium">Repair tenders</span>
          </div>

          <div className="bg-white dark:bg-[#0d1117] rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border border-amber-200 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/10 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">Needs Sign-Off</span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {workOrders.filter(wo => wo.status === 'completion_submitted').length}
            </div>
            <span className="text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-500 font-medium">Photos submitted</span>
          </div>

          <div className="bg-white dark:bg-[#0d1117] rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border border-gray-200 dark:border-white/10 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Verified Directory</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {vendors.filter(v => v.insuranceStatus === 'Active').length}
            </div>
            <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium">Insured trades</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#0d1117] rounded-xl sm:rounded-2xl p-4 md:p-5 border border-gray-200 dark:border-white/10 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Quote Polls Requiring Your Vote</span>
            <div className="text-2xl font-black text-[#0055FF] dark:text-[#00D4B2] mt-1">
              {tenderRequests.length}
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Active committee polls</span>
          </div>
          <div className="bg-white dark:bg-[#0d1117] rounded-xl sm:rounded-2xl p-4 md:p-5 border border-gray-200 dark:border-white/10 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Your Voting Status</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {tenderRequests.filter(r => r.tenderQuotes?.some(q => q.committeeVotes?.includes(activePersonaName))).length} / {tenderRequests.length}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Ballots cast by you</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation (Restricted to Quote Poll for Committee Members) */}
      {!isCommitteeMember ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-gray-200 dark:border-white/10 pb-3 sm:pb-4">
          <div className="flex overflow-x-auto no-scrollbar touch-pan-x items-center gap-1.5 sm:gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200/80 dark:border-white/10 max-w-full">
            <button
              onClick={() => setActiveTab('work_orders')}
              className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 min-h-[38px] ${
                activeTab === 'work_orders'
                  ? 'bg-white dark:bg-[#0B1121] text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Work Orders ({workOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('tenders')}
              className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none active:scale-95 min-h-[38px] ${
                activeTab === 'tenders'
                  ? 'bg-white dark:bg-[#0B1121] text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Quotes & Tenders ({tenderRequests.length})
              {tenderRequests.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 min-h-[38px] ${
                activeTab === 'directory'
                  ? 'bg-white dark:bg-[#0B1121] text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Verified Trades ({vendors.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search trades, orders..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#0055FF] dark:focus:border-[#00D4B2] min-h-[40px]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="border-b border-gray-200 dark:border-white/10 pb-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 text-blue-700 dark:text-[#00D4B2] text-xs font-bold">
            <Vote size={14} /> Active Quote Polls ({tenderRequests.length})
          </div>
        </div>
      )}

      {/* TAB 1: ACTIVE WORK ORDERS */}
      {activeTab === 'work_orders' && (
        <div className="space-y-4">
          {/* Sub-filter chips */}
          <div className="flex overflow-x-auto no-scrollbar touch-pan-x items-center gap-1.5 sm:gap-2 pb-1">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mr-1 shrink-0">Filter:</span>
            <button
              onClick={() => setWorkOrderFilter('all')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none active:scale-95 min-h-[34px] ${
                workOrderFilter === 'all'
                  ? 'bg-[#0055FF] text-white'
                  : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
              }`}
            >
              All ({workOrders.length})
            </button>
            <button
              onClick={() => setWorkOrderFilter('needs_signoff')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 select-none active:scale-95 min-h-[34px] ${
                workOrderFilter === 'needs_signoff'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Clock size={12} /> Needs Sign-Off ({workOrders.filter(w => w.status === 'completion_submitted').length})
            </button>
            <button
              onClick={() => setWorkOrderFilter('in_progress')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none active:scale-95 min-h-[34px] ${
                workOrderFilter === 'in_progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
              }`}
            >
              In Progress ({workOrders.filter(w => w.status === 'issued' || w.status === 'in_progress').length})
            </button>
            <button
              onClick={() => setWorkOrderFilter('completed')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none active:scale-95 min-h-[34px] ${
                workOrderFilter === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
              }`}
            >
              Completed ({workOrders.filter(w => w.status === 'completed').length})
            </button>
          </div>

          {filteredWorkOrders.length === 0 ? (
            <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-12 border border-dashed border-gray-200 dark:border-white/10 text-center space-y-3">
              <Wrench size={36} className="mx-auto text-gray-400 opacity-60" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">No Work Orders Found</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                No work orders match the selected filter. You can select an approved quote in the Tenders tab to issue a new work order.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorkOrders.map(wo => (
                <div 
                  key={wo.id}
                  className={`p-6 rounded-3xl border transition-all ${
                    wo.status === 'completion_submitted'
                      ? 'bg-white dark:bg-[#0d1117] border-amber-300 dark:border-amber-500/40 shadow-md ring-2 ring-amber-400/20'
                      : 'bg-white dark:bg-[#0d1117] border-gray-200 dark:border-white/10 shadow-xs'
                  } space-y-4`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-black text-[#0055FF] dark:text-[#00D4B2] uppercase tracking-wider">
                          {wo.id}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                          Linked Issue: {wo.caseId}
                        </span>
                        <WorkOrderStatusBadge status={wo.status} />
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                        {wo.scopeOfWork}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Button to view contractor dispatch portal */}
                      <button
                        onClick={() => onOpenGuestPortal(wo.id)}
                        className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white text-xs font-bold flex items-center gap-1.5 border border-gray-200 dark:border-white/10 transition-all cursor-pointer"
                        title="View contractor dispatch portal"
                      >
                        <ExternalLink size={13} className="text-[#0055FF] dark:text-[#00D4B2]" />
                        <span>View Contractor Portal</span>
                      </button>

                      {wo.status === 'completion_submitted' && !isCommitteeMember && (
                        <button
                          onClick={() => setSignOffModalWo(wo)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer animate-pulse"
                        >
                          <CheckCircle2 size={14} />
                          <span>Review & Sign Off</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Core Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                      <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] block">Contractor</span>
                      <div className="font-bold text-gray-900 dark:text-white mt-0.5 truncate">{wo.vendorName}</div>
                      {wo.vendorPhone && (
                        <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone size={11} /> {wo.vendorPhone}
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                      <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] block">Budget Cap</span>
                      <div className="font-black text-gray-900 dark:text-white text-sm mt-0.5">
                        ${wo.budgetCap.toLocaleString()} <span className="text-[10px] font-normal text-gray-500">ex GST</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Approved by Strata</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                      <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] block">Status</span>
                      <div className="font-bold text-gray-900 dark:text-white text-sm mt-0.5 capitalize">
                        {wo.status.replace('_', ' ')}
                      </div>
                      <span className="text-[10px] text-gray-400 block">Digital Work Order</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                      <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] block">Encrypted Contractor Link</span>
                      <div className="font-mono text-[11px] text-blue-600 dark:text-[#00D4B2] truncate mt-0.5 font-semibold" title={`https://smartlot-five.vercel.app/work-orders/${btoa(wo.id).replace(/=+$/, '')}`}>
                        https://smartlot-five.vercel.app/wo/enc_{btoa(wo.id).substring(0, 10)}...
                      </div>
                      <span className="text-[10px] text-gray-400 block">Secure Token Dispatch</span>
                    </div>
                  </div>

                  {/* Tradesperson Proof Submission Panel */}
                  {wo.status === 'completion_submitted' && (
                    <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/40 p-4 md:p-5 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-900/40 pb-3">
                        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                          <Clock size={16} className="text-amber-600" />
                          <span>Tradie Submitted Completion Proof ({wo.submittedAt || 'Today'})</span>
                        </div>
                        <div className="text-sm font-black text-gray-900 dark:text-white">
                          Final Billed Cost: <span className="text-emerald-600 dark:text-emerald-400">${wo.finalCost?.toLocaleString()}</span> ex GST
                          {wo.finalCost && wo.finalCost <= wo.budgetCap ? (
                            <span className="ml-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                              Within Budget Cap
                            </span>
                          ) : (
                            <span className="ml-2 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                              Exceeds Cap
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {wo.completionPhoto ? (
                            <img 
                              src={wo.completionPhoto} 
                              alt="On-site completion proof" 
                              className="w-20 h-20 rounded-xl object-cover border-2 border-amber-400 shadow-xs"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-400">
                              <Camera size={20} />
                            </div>
                          )}
                          <div className="space-y-1 text-xs">
                            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                              <Camera size={14} className="text-blue-500" /> On-Site Repair Photo Attached
                            </div>
                            <div className="text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                              <FileText size={14} className="text-amber-500" />
                              <span className="font-semibold">{wo.invoicePdf || 'Tax_Invoice.pdf'}</span>
                            </div>
                            <p className="text-[11px] text-gray-500">
                              Uploaded by {wo.vendorName} via zero-login mobile form.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSignOffModalWo(wo)}
                          className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <CheckCircle2 size={16} />
                          <span>Sign Off & Close Job</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Completed Sign-off info */}
                  {wo.status === 'completed' && (
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/30 p-3 rounded-2xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                        <CheckCircle2 size={15} />
                        <span>Signed off by <strong>{wo.signedOffBy || 'Strata Manager'}</strong> on {wo.signedOffAt ? new Date(wo.signedOffAt).toLocaleDateString() : 'Confirmed'}</span>
                      </div>
                      <span className="font-black text-gray-900 dark:text-white">Paid: ${wo.finalCost?.toLocaleString()}</span>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUOTE COMPARISONS & TENDERS (The Broken Lift Journey) */}
      {activeTab === 'tenders' && (
        <div className="space-y-6">
          <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Vote size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  {isCommitteeMember ? 'Committee Quote Voting Poll' : 'Committee Quote Poll & Comparison (The "Broken Lift" Lifecycle)'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {isCommitteeMember 
                    ? 'Review available contractor options below and cast your official committee vote on your preferred trade.' 
                    : 'Under Australian strata rules, compare 2–3 trade quotes side-by-side with insurance compliance checks before awarding the work order.'}
                </p>
              </div>
            </div>
            {!isCommitteeMember && (
              <button
                onClick={() => setShowCreateTenderModal(true)}
                className="px-4 py-2 rounded-xl bg-[#0055FF] text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm hover:bg-blue-600"
              >
                <Plus size={14} /> Request New Quotes
              </button>
            )}
          </div>

          {tenderRequests.length === 0 ? (
            <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-12 border border-dashed border-gray-200 dark:border-white/10 text-center space-y-3">
              <Vote size={36} className="mx-auto text-gray-400 opacity-60" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">No Active Quote Tenders</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                No tickets currently have active quotes. Click "Get Quotes (Tender Job)" to invite trades for a building repair.
              </p>
            </div>
          ) : (
            tenderRequests.map(req => (
              <div 
                key={req.id}
                className="bg-white dark:bg-[#0d1117] rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-white/10 shadow-xs space-y-6"
              >
                {/* Tender Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#0055FF] dark:text-[#00D4B2] uppercase tracking-wider">
                        {req.priority} Priority
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0055FF] text-[10px] font-bold uppercase">
                        Quotes Received
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {req.title}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Scope Brief: <span className="text-gray-800 dark:text-gray-200 font-medium">{req.tenderScope || req.description}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Reported By</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{req.requestorName}</span>
                    <span className="text-[11px] text-gray-500 block">{req.createdAt}</span>
                  </div>
                </div>

                {/* Side-by-Side Quote Comparison / Voting Poll Cards */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-between">
                    <span>{isCommitteeMember ? `Vote Poll Ballot (${req.tenderQuotes?.length || 0} Trades)` : `Received Contractor Quotes (${req.tenderQuotes?.length || 0})`}</span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold lowercase">
                      {isCommitteeMember ? 'click below to cast your ballot' : 'committee members can click to vote'}
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {req.tenderQuotes?.map(quote => {
                      const hasExpiredInsurance = quote.insuranceStatus === 'Expired Ins.';
                      const isWinning = quote.isSelected;
                      const votesCount = quote.committeeVotes?.length || 0;
                      const hasMyVote = quote.committeeVotes?.includes(activePersonaName);

                      return (
                        <div 
                          key={quote.id}
                          className={`rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                            isWinning
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                              : quote.recommended
                              ? 'bg-blue-50/20 dark:bg-blue-950/10 border-[#0055FF]/40 shadow-xs'
                              : 'bg-gray-50/70 dark:bg-white/[0.02] border-gray-200 dark:border-white/10'
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Card Top: Name & Badges */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                    {quote.vendorName}
                                  </h4>
                                  {quote.recommended && (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#0055FF] text-[9px] font-black uppercase">
                                      Recommended
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-gray-500">
                                  {quote.isAccredited ? 'Verified Directory Trade' : 'Ad-Hoc Trade'}
                                </span>
                              </div>

                              {/* Price */}
                              {!isCommitteeMember && (
                                <div className="text-right">
                                  <div className="text-lg font-black text-gray-900 dark:text-white">
                                    ${quote.amount.toLocaleString()}
                                  </div>
                                  <span className="text-[9px] font-bold text-gray-400 uppercase">ex GST</span>
                                </div>
                              )}
                            </div>

                            {/* Insurance & Accreditation Gate Badge */}
                            <div className="pt-2 border-t border-gray-200/60 dark:border-white/5">
                              {!hasExpiredInsurance ? (
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <ShieldCheck size={14} className="shrink-0" />
                                  <span>Public Liability Insurance: Valid (Exp {quote.insuranceExpiry || '2028'})</span>
                                </div>
                              ) : (
                                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-[11px] text-red-700 dark:text-red-400 space-y-1">
                                  <div className="flex items-center gap-1 font-bold">
                                    <AlertTriangle size={13} />
                                    <span>Insurance Expired ({quote.insuranceExpiry})</span>
                                  </div>
                                  <p className="text-[10px] leading-tight">
                                    Requires valid Certificate of Currency before site entry.
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Scope & Warranty Details */}
                            {!isCommitteeMember ? (
                              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5">
                                <p className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-3">
                                  {quote.scopeNotes}
                                </p>
                                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                                  <span>Warranty: <strong className="text-gray-700 dark:text-gray-200">{quote.warranty || '12 Months'}</strong></span>
                                  <span>Duration: <strong className="text-gray-700 dark:text-gray-200">{quote.estimatedDays || 1} day</strong></span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 dark:text-gray-400 py-1">
                                <span className="text-[11px] font-medium bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-lg inline-block">
                                  Trade Option • {quote.isAccredited ? 'Verified Directory Contractor' : 'Invited Trade'}
                                </span>
                              </div>
                            )}

                            {/* Committee Voting Chips */}
                            <div className="pt-2 border-t border-gray-200/60 dark:border-white/5 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <Vote size={12} /> Committee Votes ({votesCount})
                                </span>
                                {votesCount > 0 && (
                                  <span className="text-[10px] text-gray-500 truncate max-w-[120px]">
                                    {quote.committeeVotes?.join(', ')}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => onVoteForQuote && onVoteForQuote(req.id, quote.id)}
                                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 ${
                                  hasMyVote
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                                }`}
                              >
                                {hasMyVote ? <Check size={14} /> : <Vote size={14} />}
                                <span>{hasMyVote ? 'I Voted for This Quote' : 'Vote for This Quote'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Action: Select Quote & Issue Work Order */}
                          {!isCommitteeMember && (
                            <div className="pt-2 border-t border-gray-200/60 dark:border-white/5">
                              {isWinning ? (
                                <div className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                                  <CheckCircle2 size={14} /> Quote Awarded & Work Order Issued
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (hasExpiredInsurance) {
                                      alert(`Insurance Warning: ${quote.vendorName}'s Public Liability Insurance is expired. Please verify their Certificate of Currency before dispatching to site.`);
                                    }
                                    onAwardQuote && onAwardQuote(req.id, quote.id, quote.amount);
                                  }}
                                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    hasExpiredInsurance
                                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                      : 'bg-[#0B1121] dark:bg-[#00D4B2] hover:bg-black dark:hover:bg-[#00b89a] text-white dark:text-black shadow-xs'
                                  }`}
                                >
                                  <span>Select & Issue Work Order</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: VERIFIED TRADES DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Accredited Building Contractors
            </h3>
            {!isCommitteeMember && (
              <button
                onClick={() => setShowAddVendorModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#0055FF] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus size={14} /> Add New Contractor
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredVendors.map(v => (
              <div 
                key={v.id} 
                className="bg-white dark:bg-[#0d1117] rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{v.name}</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{v.category}</span>
                  </div>
                  {v.insuranceStatus === 'Active' ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#10B981] text-[10px] font-bold uppercase flex items-center gap-1 shrink-0">
                      <ShieldCheck size={12} /> Active Ins.
                    </span>
                  ) : !isCommitteeMember ? (
                    <button
                      onClick={() => {
                        setInsuranceVerifyVendor(v);
                        setNewInsuranceExpiry('2027-12-31');
                      }}
                      className="px-2.5 py-1 rounded-full bg-red-100 text-[#FF6B6B] hover:bg-red-200 text-[10px] font-bold uppercase flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Click to update insurance"
                    >
                      <AlertTriangle size={12} /> Expired Ins. (Renew)
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-red-100 text-[#FF6B6B] text-[10px] font-bold uppercase flex items-center gap-1 shrink-0">
                      <AlertTriangle size={12} /> Expired Ins.
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5 pt-2 border-t border-gray-100 dark:border-white/5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">ABN:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{v.abn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trade License:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{v.licenseNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Insurance Expiry:</span>
                    <span className={v.insuranceStatus === 'Active' ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                      {v.insuranceExpiry}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-white/5">
                  <a 
                    href={`tel:${v.phone}`} 
                    className="flex items-center gap-1.5 text-blue-600 dark:text-[#00D4B2] font-semibold hover:underline cursor-pointer min-h-[36px] py-1 px-2 rounded-lg bg-blue-50 dark:bg-[#00D4B2]/10 active:scale-95 transition-all"
                  >
                    <Phone size={12} /> {v.phone}
                  </a>
                  <span className="flex items-center gap-1 text-[#FFB020] font-bold"><Star size={12} fill="currentColor" /> {v.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: MANAGER SIGN-OFF & TICKET CLOSURE */}
      {signOffModalWo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl p-6 md:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="font-sans text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-normal">
                    Strata Manager Work Order Sign-Off
                  </h3>
                  <span className="text-xs text-gray-500">Work Order {signOffModalWo.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSignOffModalWo(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Photo & Cost Review */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase">Repair Scope</span>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{signOffModalWo.scopeOfWork}</p>
                <div className="text-xs text-gray-500">Contractor: <strong>{signOffModalWo.vendorName}</strong></div>
              </div>

              {signOffModalWo.completionPhoto && (
                <div>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1.5">Submitted On-Site Completion Photo:</span>
                  <img 
                    src={signOffModalWo.completionPhoto} 
                    alt="On-site work proof" 
                    className="w-full h-44 object-cover rounded-2xl border border-gray-200 dark:border-white/10"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Approved Budget Cap</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">${signOffModalWo.budgetCap.toLocaleString()} ex GST</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
                  <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">Final Billed Cost</span>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">${signOffModalWo.finalCost?.toLocaleString()} ex GST</span>
                </div>
              </div>

              {/* Sign-Off Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Manager Sign-Off Note (Will be recorded in scheme audit trail)
                </label>
                <textarea
                  rows={2}
                  value={signOffNotes}
                  onChange={e => setSignOffNotes(e.target.value)}
                  placeholder="e.g. Lift tested on site by building manager, fully operational. Invoiced within approved budget."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setSignOffModalWo(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOff}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 size={16} /> Confirm Sign-Off & Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE TENDER / REQUEST QUOTES MODAL */}
      {showCreateTenderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl p-6 md:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Vote size={22} />
                </div>
                <div>
                  <h3 className="font-sans text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-normal">
                    Request Contractor Quotes (Tender)
                  </h3>
                  <span className="text-xs text-gray-500">Collect up to 3 quotes under Australian strata rules</span>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateTenderModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTenderSubmit} className="space-y-4 font-sans">
              {/* Linked Request Dropdown */}
              <div>
                <CustomSelect
                  label="Select Building Issue / Ticket *"
                  options={requestOptions}
                  value={tenderRequestId}
                  onChange={val => {
                    setTenderRequestId(val);
                    const found = requests.find(r => r.id === val);
                    if (found) {
                      setTenderScope(found.description);
                    }
                  }}
                  placeholder="Choose an open repair ticket..."
                />
              </div>

              {/* Scope Brief */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Scope of Work Brief for Contractors <span className="text-red-500 font-bold">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={tenderScope}
                  onChange={e => setTenderScope(e.target.value)}
                  placeholder="e.g. Attend site to inspect hydraulic motor on Lift 1, diagnose error code E-41, and replace faulty power inverter unit."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF]"
                />
              </div>

              {/* Target Budget */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Estimated / Target Budget ($ ex GST) <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={tenderBudget}
                  onChange={e => setTenderBudget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF]"
                />
              </div>

              {/* Choose Verified Directory Trades (Dropdown Multi-Select) */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Invite Verified Directory Trades (Select 1–3) <span className="text-red-500 font-bold">*</span>
                </label>
                
                <button
                  type="button"
                  onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161a26] hover:bg-white dark:hover:bg-[#1f2434] focus:outline-none focus:ring-2 focus:ring-[#0055FF] dark:focus:ring-[#00D4B2] transition-all flex items-center justify-between text-xs text-gray-900 dark:text-white cursor-pointer shadow-xs"
                >
                  <div className="flex flex-wrap items-center gap-1.5 flex-1 mr-2">
                    {selectedVendorsForTender.length === 0 ? (
                      <span className="text-gray-400 dark:text-gray-500 font-normal">
                        Select accredited contractors to quote...
                      </span>
                    ) : (
                      selectedVendorsForTender.map(id => {
                        const v = vendors.find(item => item.id === id);
                        if (!v) return null;
                        return (
                          <span 
                            key={v.id} 
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0055FF]/10 dark:bg-[#00D4B2]/10 text-[#0055FF] dark:text-[#00D4B2] text-[11px] font-bold border border-[#0055FF]/20 dark:border-[#00D4B2]/20"
                          >
                            <span className="truncate max-w-[130px]">{v.name}</span>
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVendorsForTender(selectedVendorsForTender.filter(item => item !== v.id));
                              }}
                              className="hover:text-red-500 cursor-pointer ml-0.5"
                            >
                              <X size={12} />
                            </span>
                          </span>
                        );
                      })
                    )}
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`text-gray-400 transition-transform duration-200 shrink-0 ${isVendorDropdownOpen ? 'rotate-180 text-gray-700 dark:text-white' : ''}`}
                  />
                </button>

                {/* Dropdown Menu Panel */}
                {isVendorDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-[#0d1117] rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl p-2 max-h-56 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/5 mb-1">
                      <span>Accredited Directory Trades ({vendors.length})</span>
                      <span className="text-[#0055FF] dark:text-[#00D4B2] font-semibold">{selectedVendorsForTender.length} selected</span>
                    </div>

                    {vendors.map(v => {
                      const isSelected = selectedVendorsForTender.includes(v.id);
                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedVendorsForTender(selectedVendorsForTender.filter(id => id !== v.id));
                            } else {
                              setSelectedVendorsForTender([...selectedVendorsForTender, v.id]);
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer text-xs ${
                            isSelected 
                              ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40' 
                              : 'hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                              isSelected 
                                ? 'bg-[#0055FF] border-[#0055FF] text-white' 
                                : 'border-gray-300 dark:border-white/20 bg-white dark:bg-transparent'
                            }`}>
                              {isSelected && <Check size={12} className="stroke-[3]" />}
                            </div>
                            <div className="truncate">
                              <span className="font-bold text-gray-900 dark:text-white block truncate">{v.name}</span>
                              <span className="text-[10px] text-gray-400 block">{v.category} • License {v.licenseNo}</span>
                            </div>
                          </div>

                          <div className="shrink-0 ml-2">
                            {v.insuranceStatus === 'Active' ? (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                <ShieldCheck size={11} /> Active
                              </span>
                            ) : (
                              <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
                                <AlertTriangle size={11} /> Expired
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Or Add Ad-Hoc Trade */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-2">
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase">
                  Optionally Invite an Ad-Hoc / New Contractor (via Email)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={adHocVendorName}
                    onChange={e => setAdHocVendorName(e.target.value)}
                    placeholder="Trade Company Name"
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white"
                  />
                  <input
                    type="email"
                    value={adHocVendorEmail}
                    onChange={e => setAdHocVendorEmail(e.target.value)}
                    placeholder="Email for Quote Link"
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCreateTenderModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!tenderRequestId || (selectedVendorsForTender.length === 0 && !adHocVendorName.trim())}
                  className="px-5 py-2.5 rounded-xl bg-[#0055FF] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Vote size={15} /> Send Tender Brief & Collect Quotes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD CONTRACTOR TO DIRECTORY */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl p-6 md:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-sans text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-normal">
                    Add Contractor & Insurance Check
                  </h3>
                  <span className="text-xs text-gray-500">Record ABN, trade license, and Certificate of Currency</span>
                </div>
              </div>
              <button 
                onClick={() => setShowAddVendorModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateVendorSubmit} className="space-y-3.5 font-sans">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Company / Trading Name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newVendorName}
                  onChange={e => setNewVendorName(e.target.value)}
                  placeholder="e.g. Kone Elevator Maintenance NSW"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF]"
                />
              </div>

              <div>
                <CustomSelect
                  label="Trade Category *"
                  options={categoryOptions}
                  value={newVendorCategory}
                  onChange={setNewVendorCategory}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    ABN <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newVendorAbn}
                    onChange={e => setNewVendorAbn(e.target.value)}
                    placeholder="51 824 931 002"
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#0055FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Trade License No. <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newVendorLicense}
                    onChange={e => setNewVendorLicense(e.target.value)}
                    placeholder="LIC-NSW-39812A"
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#0055FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Phone <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={newVendorPhone}
                    onChange={e => setNewVendorPhone(e.target.value)}
                    placeholder="02 9844 2001"
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#0055FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Dispatch Email <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newVendorEmail}
                    onChange={e => setNewVendorEmail(e.target.value)}
                    placeholder="dispatch@trades.com.au"
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#0055FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Public Liability Insurance Expiry (Certificate of Currency) <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={newVendorExpiry}
                  onChange={e => setNewVendorExpiry(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white font-bold outline-none focus:border-[#0055FF]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle2 size={16} /> Register & Validate Trade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: VERIFY / RENEW INSURANCE CERTIFICATE */}
      {insuranceVerifyVendor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={22} className="text-emerald-500" />
                <h3 className="font-sans text-base font-bold text-gray-900 dark:text-white tracking-normal">
                  Verify Certificate of Currency
                </h3>
              </div>
              <button onClick={() => setInsuranceVerifyVendor(null)} className="text-gray-400 hover:text-white cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              Update the Public Liability insurance record for <strong>{insuranceVerifyVendor.name}</strong> after receiving their renewed Certificate of Currency.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                New Insurance Expiry Date
              </label>
              <input
                type="date"
                value={newInsuranceExpiry}
                onChange={e => setNewInsuranceExpiry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInsuranceVerifyVendor(null)}
                className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateVendorInsurance && insuranceVerifyVendor) {
                    onUpdateVendorInsurance(insuranceVerifyVendor.id, 'Active', newInsuranceExpiry);
                  }
                  setInsuranceVerifyVendor(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 size={14} /> Confirm Valid Insurance
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function WorkOrderStatusBadge({ status }: { status: WorkOrder['status'] }) {
  switch (status) {
    case 'issued':
      return <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">Issued</span>;
    case 'in_progress':
      return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold uppercase">In Progress</span>;
    case 'completion_submitted':
      return <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-bold uppercase animate-pulse">Needs Sign-Off</span>;
    case 'completed':
      return <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">Completed & Signed Off</span>;
  }
}
