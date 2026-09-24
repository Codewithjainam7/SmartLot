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
  Copy,
  Calendar,
  DollarSign,
  X,
  FileCheck2,
  Camera,
  Download,
  HelpCircle,
  FileDown,
  ChevronDown,
  MessageSquare,
  Send,
  LayoutGrid,
  List,
  Trash2,
  Eye
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
  onDeleteVendor?: (vendorId: string) => void;
  onUpdateVendorInsurance?: (vendorId: string, status: 'Active' | 'Expired Ins.' | 'Pending Verification', expiryDate: string) => void;
  onAddComment?: (requestId: string, text: string) => void;
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
  onDeleteVendor,
  onUpdateVendorInsurance,
  onAddComment,
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
  const [workOrderViewMode, setWorkOrderViewMode] = useState<'table' | 'cards'>('table');
  const [directoryViewMode, setDirectoryViewMode] = useState<'table' | 'cards'>('table');
  const [tendersViewMode, setTendersViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedWoId, setCopiedWoId] = useState<string | null>(null);

  // Modals state
  const [signOffModalWo, setSignOffModalWo] = useState<WorkOrder | null>(null);
  const [signOffNotes, setSignOffNotes] = useState('');
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [selectedVendorForDetails, setSelectedVendorForDetails] = useState<Vendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [vendorOnboardingMode, setVendorOnboardingMode] = useState<'manual' | 'invite'>('manual');
  const [inviteVendorSent, setInviteVendorSent] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [isCopiedInvite, setIsCopiedInvite] = useState(false);
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
  const [newVendorWebsite, setNewVendorWebsite] = useState('');
  const [newVendorExperience, setNewVendorExperience] = useState('5');
  const [newVendorExpiry, setNewVendorExpiry] = useState('2027-12-31');
  const [newVendorInsuranceDocName, setNewVendorInsuranceDocName] = useState('');
  
  // Directory filter state
  const [directoryCategoryFilter, setDirectoryCategoryFilter] = useState('All');
  const [directoryInsuranceFilter, setDirectoryInsuranceFilter] = useState<'All' | 'Active' | 'Pending Review' | 'Expired'>('All');

  // New Tender Form State
  const [tenderRequestId, setTenderRequestId] = useState<string>('');
  const [tenderScope, setTenderScope] = useState('');
  const [tenderBudget, setTenderBudget] = useState('3500');
  const [selectedVendorsForTender, setSelectedVendorsForTender] = useState<string[]>([]);
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [adHocVendorName, setAdHocVendorName] = useState('');
  const [adHocVendorEmail, setAdHocVendorEmail] = useState('');
  const [adHocVendorQuoteAmount, setAdHocVendorQuoteAmount] = useState('3100');

  // Poll comment state — keyed by requestId
  const [tenderCommentInputs, setTenderCommentInputs] = useState<Record<string, string>>({});
  const [tenderPollComments, setTenderPollComments] = useState<Record<string, { authorName: string; authorRole: string; text: string; postedAt: string }[]>>({});

  // Filter requests that are in quoting state or have quotes
  const allTenderRequests = requests.filter(r => 
    r.tenderStatus === 'quoting' || (r.tenderQuotes && r.tenderQuotes.length > 0)
  );

  const tenderRequests = allTenderRequests.filter(r => 
    !r.schemeId || r.schemeId === activeSchemeId
  );

  // If activeScheme has no tenders but other schemes have active quote tenders, offer quick switch or fallback
  const displayTenderRequests = tenderRequests.length > 0 ? tenderRequests : allTenderRequests;

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

  // Filter vendors with Sort & Filter support
  const filteredVendors = vendors.filter(v => {
    if (directoryCategoryFilter !== 'All' && v.category !== directoryCategoryFilter) return false;
    if (directoryInsuranceFilter === 'Active' && v.insuranceStatus !== 'Active') return false;
    if (directoryInsuranceFilter === 'Pending Review' && v.insuranceStatus !== 'Pending Verification') return false;
    if (directoryInsuranceFilter === 'Expired' && (v.insuranceStatus === 'Active' || v.insuranceStatus === 'Pending Verification')) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.abn.toLowerCase().includes(q) ||
      v.licenseNo.toLowerCase().includes(q) ||
      (v.website && v.website.toLowerCase().includes(q))
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
    if (!newVendorName.trim()) return;

    if (vendorOnboardingMode === 'invite') {
      // Invite flow: generate encrypted registration link with site details
      const rawToken = `${encodeURIComponent(newVendorName.trim())}:${encodeURIComponent(newVendorEmail.trim())}:${encodeURIComponent(newVendorCategory)}:${activeSchemeId}`;
      const token = btoa(rawToken).replace(/=+$/, '');
      const baseUrl = typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://smartlot-five.vercel.app';
      const inviteUrl = `${baseUrl}/#trade-portal?vendor_token=${encodeURIComponent(token)}`;
      setGeneratedInviteUrl(inviteUrl);
      setInviteVendorSent(true);
      return;
    }

    if (!onAddVendor) return;

    const isExpired = new Date(newVendorExpiry) < new Date();
    onAddVendor({
      name: newVendorName.trim(),
      category: newVendorCategory,
      abn: newVendorAbn.trim() || '44 100 200 300',
      licenseNo: newVendorLicense.trim() || 'LIC-NSW-99999',
      phone: newVendorPhone.trim() || '02 9000 1111',
      email: newVendorEmail.trim() || 'info@contractor.com.au',
      website: newVendorWebsite.trim() || undefined,
      yearsOfExperience: Number(newVendorExperience) || 5,
      insuranceStatus: isExpired ? 'Expired Ins.' : 'Active',
      insuranceExpiry: newVendorExpiry,
      certificateOfCurrencyUrl: newVendorInsuranceDocName ? `https://storage.smartlot.internal/docs/${newVendorInsuranceDocName}` : undefined,
      rating: 5.0
    });

    setShowAddVendorModal(false);
    setNewVendorName('');
    setNewVendorAbn('');
    setNewVendorLicense('');
    setNewVendorPhone('');
    setNewVendorEmail('');
    setNewVendorWebsite('');
    setNewVendorExperience('5');
    setNewVendorInsuranceDocName('');
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
    <div className="flex-1 p-3.5 sm:p-6 md:p-8 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8 space-y-4 sm:space-y-6 overflow-y-auto h-full bg-[#F4F6F9] dark:bg-[#0a0a0f] text-gray-900 dark:text-gray-100">
      
      {/* ── Top Header Banner (Matches ResidentRequestsView & VotingHubView) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
        {/* Subtle glow in dark mode */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D4B2]/0 via-transparent to-[#0055FF]/0 dark:from-[#00D4B2]/5 dark:via-transparent dark:to-[#0055FF]/5 pointer-events-none rounded-2xl sm:rounded-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0055FF]/10 dark:bg-[#00D4B2]/10 text-[#0055FF] dark:text-[#00D4B2] border border-[#0055FF]/20 dark:border-[#00D4B2]/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            Trades & Work Orders Lifecycle
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Wrench size={22} className="text-[#0055FF] dark:text-[#00D4B2] shrink-0" />
            <span>{isCommitteeMember ? 'Trades & Quote Poll' : 'Trades & Work Orders'}</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-xl bg-blue-500/10 text-[#0055FF] dark:text-[#00D4B2] border border-blue-500/20">
              {activeSchemeName || 'Active Scheme'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isCommitteeMember
              ? 'Review pending contractor quote tenders and cast your official committee vote on preferred trades.'
              : 'Contractor dispatch, digital work order sign-off with photo proof, and commercial quote tenders.'}
          </p>
        </div>

        {/* Action Buttons (Restricted for Committee Members) */}
        {!isCommitteeMember && (
          <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <button
              onClick={() => setShowCreateTenderModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer min-h-[40px]"
            >
              <Vote size={15} />
              <span>Get Quotes (Tender Job)</span>
            </button>
            <button
              onClick={() => setShowAddVendorModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-white/10 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer min-h-[40px]"
            >
              <Plus size={15} />
              <span>Add Verified Trade</span>
            </button>
          </div>
        )}
      </div>

      {/* ── KPI Operational Metrics ────────────────────────────────────── */}
      {!isCommitteeMember ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* 1. Active Work Orders */}
          <div 
            onClick={() => {
              setActiveTab('work_orders');
              setWorkOrderFilter('all');
            }}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group ${
              activeTab === 'work_orders' && workOrderFilter === 'all'
                ? 'bg-white dark:bg-[#0d1117] border-[#0055FF] dark:border-[#00D4B2] shadow-sm ring-1 ring-[#0055FF]/20 dark:ring-[#00D4B2]/30'
                : 'bg-white dark:bg-[#0d1117] border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Work Orders</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Wrench size={15} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              {workOrders.filter(wo => wo.status !== 'completed').length}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Ongoing repair jobs</span>
            </div>
          </div>

          {/* 2. Quotes Under Review */}
          <div 
            onClick={() => setActiveTab('tenders')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group ${
              activeTab === 'tenders'
                ? 'bg-white dark:bg-[#0d1117] border-[#0055FF] dark:border-[#00D4B2] shadow-sm ring-1 ring-[#0055FF]/20 dark:ring-[#00D4B2]/30'
                : 'bg-white dark:bg-[#0d1117] border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quotes Under Review</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Vote size={15} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0055FF] dark:text-[#00D4B2]">
              {tenderRequests.length}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              <span>Repair tenders active</span>
            </div>
          </div>

          {/* 3. Needs Sign-Off (Interactive + Refined Amber Accent) */}
          <div 
            onClick={() => {
              setActiveTab('work_orders');
              setWorkOrderFilter('needs_signoff');
            }}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group ${
              workOrderFilter === 'needs_signoff' && activeTab === 'work_orders'
                ? 'bg-amber-500/10 dark:bg-amber-500/10 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                : 'bg-white dark:bg-[#0d1117] border-gray-100 dark:border-white/5 hover:border-amber-500/40 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Needs Sign-Off</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Clock size={15} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {workOrders.filter(wo => wo.status === 'completion_submitted').length}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Photos submitted</span>
            </div>
          </div>

          {/* 4. Verified Directory */}
          <div 
            onClick={() => setActiveTab('directory')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group ${
              activeTab === 'directory'
                ? 'bg-white dark:bg-[#0d1117] border-[#0055FF] dark:border-[#00D4B2] shadow-sm ring-1 ring-[#0055FF]/20 dark:ring-[#00D4B2]/30'
                : 'bg-white dark:bg-[#0d1117] border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Verified Directory</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <ShieldCheck size={15} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {vendors.filter(v => v.insuranceStatus === 'Active').length}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              <span>Insured trades</span>
            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#0d1117] rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-white/5 shadow-sm">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Quote Polls Requiring Your Vote</span>
            <div className="text-2xl font-black text-[#0055FF] dark:text-[#00D4B2] mt-1">
              {tenderRequests.length}
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Active committee polls</span>
          </div>
          <div className="bg-white dark:bg-[#0d1117] rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-white/5 shadow-sm">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Your Voting Status</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {tenderRequests.filter(r => r.tenderQuotes?.some(q => q.committeeVotes?.includes(activePersonaName))).length} / {tenderRequests.length}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Ballots cast by you</span>
          </div>
        </div>
      )}

      {/* ── Main Navigation & Unified Controls Bar ───────────────────── */}
      <div className="bg-white dark:bg-[#0d1117] p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-3.5">
        {/* Top Controls Row: Segmented Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Primary Tabs */}
          <div className="flex items-center bg-gray-100 dark:bg-[#1a1d27] p-1 rounded-xl border border-transparent dark:border-white/5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('work_orders')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 select-none shrink-0 ${
                activeTab === 'work_orders'
                  ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#00D4B2] border dark:border-[#00D4B2]/20 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Wrench size={13} />
              <span>Work Orders</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                activeTab === 'work_orders'
                  ? 'bg-blue-500/10 text-blue-600 dark:bg-[#00D4B2]/20 dark:text-[#00D4B2]'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-500'
              }`}>
                {workOrders.filter(w => !w.schemeId || w.schemeId === activeSchemeId).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tenders')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 select-none shrink-0 ${
                activeTab === 'tenders'
                  ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#00D4B2] border dark:border-[#00D4B2]/20 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Vote size={13} />
              <span>Quotes & Tenders</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                activeTab === 'tenders'
                  ? 'bg-blue-500/10 text-blue-600 dark:bg-[#00D4B2]/20 dark:text-[#00D4B2]'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-500'
              }`}>
                {tenderRequests.length}
              </span>
            </button>

            {!isCommitteeMember && (
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 select-none shrink-0 ${
                  activeTab === 'directory'
                    ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#00D4B2] border dark:border-[#00D4B2]/20 shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <ShieldCheck size={13} />
                <span>Verified Trades</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  activeTab === 'directory'
                    ? 'bg-blue-500/10 text-blue-600 dark:bg-[#00D4B2]/20 dark:text-[#00D4B2]'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                }`}>
                  {vendors.length}
                </span>
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'work_orders'
                  ? 'Search work orders, trades...'
                  : activeTab === 'tenders'
                  ? 'Search quote tenders, scopes...'
                  : 'Search accredited trades, ABN...'
              }
              className="w-full pl-8.5 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#121622] border border-gray-200/80 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#0055FF] dark:focus:border-[#00D4B2] transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Controls Row: Tab-Specific Filter Chips + Unified View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
          {activeTab === 'work_orders' && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x">
              {(() => {
                const schemeOrders = workOrders.filter(w => !w.schemeId || w.schemeId === activeSchemeId);
                const needsSignoffCount = schemeOrders.filter(w => w.status === 'completion_submitted').length;
                const inProgressCount = schemeOrders.filter(w => w.status === 'issued' || w.status === 'in_progress').length;
                const completedCount = schemeOrders.filter(w => w.status === 'completed').length;

                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setWorkOrderFilter('all')}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        workOrderFilter === 'all'
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-xs'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      All ({schemeOrders.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorkOrderFilter('needs_signoff')}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        workOrderFilter === 'needs_signoff'
                          ? 'bg-amber-500 text-black font-extrabold shadow-xs'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${workOrderFilter === 'needs_signoff' ? 'bg-black' : 'bg-amber-500 animate-pulse'}`} />
                      <span>Needs Sign-Off ({needsSignoffCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorkOrderFilter('in_progress')}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        workOrderFilter === 'in_progress'
                          ? 'bg-[#0055FF] text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${workOrderFilter === 'in_progress' ? 'bg-white' : 'bg-blue-500'}`} />
                      <span>In Progress ({inProgressCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorkOrderFilter('completed')}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        workOrderFilter === 'completed'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${workOrderFilter === 'completed' ? 'bg-white' : 'bg-emerald-500'}`} />
                      <span>Completed ({completedCount})</span>
                    </button>
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === 'tenders' && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
              <span>Showing</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{displayTenderRequests.length}</span>
              <span>Active Commercial Quote Tenders</span>
            </div>
          )}

          {activeTab === 'directory' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mr-1">Trade:</span>
              {['All', 'Lift & Vertical Transport', 'Plumbing & Drainage', 'Electrical & Lighting', 'Fire & Safety Services'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setDirectoryCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    directoryCategoryFilter === cat
                      ? 'bg-[#0055FF] text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  {cat === 'All' ? 'All Trades' : cat.split('&')[0].trim()}
                </button>
              ))}

              <div className="h-3.5 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block" />

              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mr-1">Insurance:</span>
              {(['All', 'Active', 'Pending Review', 'Expired'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setDirectoryInsuranceFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    directoryInsuranceFilter === status
                      ? status === 'Pending Review'
                        ? 'bg-amber-500 text-black font-extrabold shadow-xs'
                        : 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  <span>{status}</span>
                  {status === 'Pending Review' && vendors.some(v => v.insuranceStatus === 'Pending Verification') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Unified View Mode Switcher (Table vs Cards) */}
          <div className="flex items-center bg-gray-100 dark:bg-[#1a1d27] p-1 rounded-xl border border-transparent dark:border-white/5 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'work_orders') setWorkOrderViewMode('table');
                else if (activeTab === 'tenders') setTendersViewMode('table');
                else setDirectoryViewMode('table');
              }}
              className={`flex px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer items-center gap-1.5 select-none ${
                (activeTab === 'work_orders' ? workOrderViewMode : activeTab === 'tenders' ? tendersViewMode : directoryViewMode) === 'table'
                  ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#00D4B2] border dark:border-[#00D4B2]/20 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
              title="Enterprise Table View"
            >
              <List size={13} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'work_orders') setWorkOrderViewMode('cards');
                else if (activeTab === 'tenders') setTendersViewMode('cards');
                else setDirectoryViewMode('cards');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                (activeTab === 'work_orders' ? workOrderViewMode : activeTab === 'tenders' ? tendersViewMode : directoryViewMode) === 'cards'
                  ? 'bg-white dark:bg-[#0d1117] text-gray-900 dark:text-[#00D4B2] border dark:border-[#00D4B2]/20 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: ACTIVE WORK ORDERS */}
      {activeTab === 'work_orders' && (
        <div className="space-y-4">
          {filteredWorkOrders.length === 0 ? (
            <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-12 border border-dashed border-gray-200 dark:border-white/10 text-center space-y-3">
              <Wrench size={36} className="mx-auto text-gray-400 opacity-60" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">No Work Orders Found</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                No work orders match the selected filter. You can select an approved quote in the Tenders tab to issue a new work order.
              </p>
            </div>
          ) : workOrderViewMode === 'table' ? (
            <div className="bg-white dark:bg-[#0d1117] rounded-2xl sm:rounded-3xl border border-gray-200/90 dark:border-white/10 shadow-xs overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[780px] text-left text-xs border-collapse font-sans table-auto">
                  <thead>
                    <tr className="bg-gray-50/90 dark:bg-[#121622] text-gray-500 dark:text-gray-400 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-200/80 dark:border-white/10 select-none">
                      <th className="py-3.5 px-4 w-[16%]">WO ID & Ticket</th>
                      <th className="py-3.5 px-4 w-[22%]">Contractor / Trade</th>
                      <th className="py-3.5 px-4 w-[26%]">Scope of Work</th>
                      <th className="py-3.5 px-4 w-[14%]">Agreed Budget</th>
                      <th className="py-3.5 px-4 w-[12%]">Status</th>
                      <th className="py-3.5 px-4 w-[10%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                    {filteredWorkOrders.map(wo => {
                      const isNeedsSignoff = wo.status === 'completion_submitted';
                      return (
                        <tr 
                          key={wo.id}
                          className={`transition-colors ${
                            isNeedsSignoff 
                              ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08] border-l-4 border-l-amber-500 dark:border-l-amber-400' 
                              : 'border-l-4 border-l-transparent hover:bg-gray-50/80 dark:hover:bg-white/[0.02]'
                          }`}
                        >
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-gray-200">
                                {wo.id}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(wo.id);
                                  setCopiedWoId(wo.id);
                                  setTimeout(() => setCopiedWoId(null), 2000);
                                }}
                                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
                                title="Copy Work Order ID"
                              >
                                {copiedWoId === wo.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                              </button>
                            </div>
                            <div className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-mono">
                              <span>Case:</span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">{wo.caseId}</span>
                            </div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                              {wo.submittedAt ? `Submitted: ${wo.submittedAt}` : 'Dispatched Work Order'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-teal-500/10 dark:from-blue-500/20 dark:to-teal-500/20 text-[#0055FF] dark:text-[#00D4B2] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                {wo.vendorName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-gray-900 dark:text-white text-xs truncate">
                                  {wo.vendorName}
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                  {vendors.find(v => v.id === wo.vendorId)?.category || 'Contractor'}
                                </div>
                                {wo.vendorPhone && (
                                  <div className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                                    <Phone size={10} /> {wo.vendorPhone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            <div className="text-xs text-gray-800 dark:text-gray-200 line-clamp-2 leading-relaxed font-medium">
                              {wo.scopeOfWork}
                            </div>
                            {wo.signOffNotes && (
                              <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1.5 flex items-center gap-1 font-medium bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md w-fit border border-amber-200/60 dark:border-amber-900/40">
                                <span>Note:</span>
                                <span className="italic">{wo.signOffNotes}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            <div className="font-mono font-bold text-gray-900 dark:text-white text-xs">
                              ${wo.budgetCap?.toLocaleString()} <span className="text-[10px] text-gray-400 font-sans font-normal">ex GST</span>
                            </div>
                            {wo.status === 'completed' && wo.finalCost ? (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Paid: ${wo.finalCost.toLocaleString()}
                              </div>
                            ) : (
                              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-sans">
                                Cap Approved
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            {wo.status === 'completion_submitted' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>Needs Sign-Off</span>
                              </span>
                            ) : wo.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Completed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span>In Progress</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 align-top text-right">
                            {isNeedsSignoff ? (
                              <button
                                onClick={() => {
                                  setSignOffModalWo(wo);
                                  setSignOffNotes('');
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                              >
                                <CheckCircle2 size={13} />
                                <span>Sign Off</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => onOpenGuestPortal(wo.id)}
                                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
                                title="Open contractor dispatch portal"
                              >
                                <ExternalLink size={12} className="text-[#0055FF] dark:text-[#00D4B2]" />
                                <span>Portal</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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

                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] block">Encrypted Access Token</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Active Token
                          </span>
                        </div>
                        {(() => {
                          const token = btoa(`${wo.id}:${wo.schemeId || 'SP101'}:${wo.vendorId}`).replace(/=+$/, '');
                          const fullContractorUrl = `https://smartlot-five.vercel.app/?wo_token=${token}`;
                          const isCopied = copiedWoId === wo.id;

                          return (
                            <div className="mt-1.5 space-y-1.5">
                              <div className="font-mono text-[10px] text-gray-700 dark:text-gray-300 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 px-2 py-1 rounded-lg truncate select-all" title={fullContractorUrl}>
                                {fullContractorUrl}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(fullContractorUrl);
                                  setCopiedWoId(wo.id);
                                  setTimeout(() => setCopiedWoId(null), 2500);
                                }}
                                className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                  isCopied
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/15 text-gray-900 dark:text-white border border-gray-200 dark:border-white/15'
                                }`}
                                title="Copy full encrypted dispatch link to clipboard"
                              >
                                {isCopied ? <Check size={12} className="text-white" /> : <Copy size={12} className="text-blue-600 dark:text-[#00D4B2]" />}
                                <span>{isCopied ? 'Link Copied to Clipboard!' : 'Copy Contractor Link'}</span>
                              </button>
                            </div>
                          );
                        })()}
                      </div>
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
                              <CheckCircle2 size={14} className="text-emerald-500" />
                              <span className="font-semibold">Repair Verification Photo</span>
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

      {/* TAB 2: QUOTE COMPARISONS & TENDERS */}
      {activeTab === 'tenders' && (
        <div className="space-y-6">
          <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Vote size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  {isCommitteeMember ? 'Committee Quote Voting Poll' : 'Commercial Tender Comparisons & Committee Polls'}
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

          {/* View Mode Toggle: Table first, Cards second */}
          {displayTenderRequests.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                Showing <span className="text-[#0055FF] dark:text-[#00D4B2] font-mono">{displayTenderRequests.length}</span> Active Quote Tenders
              </span>
              <div className="flex items-center gap-1 bg-gray-200/70 dark:bg-[#1a1f2e] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTendersViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tendersViewMode === 'table'
                      ? 'bg-white dark:bg-[#0d1117] text-[#0055FF] dark:text-[#00D4B2] shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Enterprise comparative table"
                >
                  <List size={13} />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTendersViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tendersViewMode === 'cards'
                      ? 'bg-white dark:bg-[#0d1117] text-[#0055FF] dark:text-[#00D4B2] shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Side-by-side card poll"
                >
                  <LayoutGrid size={13} />
                  <span>Cards</span>
                </button>
              </div>
            </div>
          )}

          {displayTenderRequests.length === 0 ? (
            <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-12 border border-dashed border-gray-200 dark:border-white/10 text-center space-y-3">
              <Vote size={36} className="mx-auto text-gray-400 opacity-60" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">No Active Quote Tenders</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                No tickets currently have active quotes. Click "Get Quotes (Tender Job)" to invite trades for a building repair.
              </p>
            </div>
          ) : tendersViewMode === 'table' ? (
            <div className="bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[850px] text-left text-xs border-collapse font-sans table-auto">
                  <thead>
                    <tr className="bg-gray-100/90 dark:bg-[#151a28] text-gray-700 dark:text-gray-200 font-black uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-white/10 select-none">
                      <th className="py-3.5 px-4 w-[20%]">Issue & Scheme</th>
                      <th className="py-3.5 px-4 w-[24%]">Scope Brief</th>
                      <th className="py-3.5 px-4 w-[28%]">Contractor Quotes Comparison</th>
                      <th className="py-3.5 px-4 w-[16%]">Leading Trade</th>
                      <th className="py-3.5 px-4 w-[12%] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                    {displayTenderRequests.map(req => {
                      const quotes = req.tenderQuotes || [];
                      const recommendedQuote = quotes.find(q => q.recommended) || quotes[0];
                      const totalVotes = quotes.reduce((sum, q) => sum + (q.committeeVotes?.length || 0), 0);
                      const mostVotedQuote = [...quotes].sort((a, b) => (b.committeeVotes?.length || 0) - (a.committeeVotes?.length || 0))[0];

                      return (
                        <tr key={req.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-4 align-top">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span className="font-mono font-black text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                {req.priority}
                              </span>
                              {req.schemeId && (
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                  {req.schemeId}
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-gray-900 dark:text-white text-xs">
                              {req.title}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              Reported by {req.requestorName} • {req.createdAt}
                            </div>
                          </td>
                          <td className="py-4 px-4 align-top">
                            <div className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                              {req.tenderScope || req.description}
                            </div>
                            {quotes.length > 0 && (
                              <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mt-1">
                                Quotes: <span className="font-mono">{quotes.length} received</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 align-top">
                            <div className="space-y-1.5">
                              {quotes.map(q => {
                                const userVoted = q.committeeVotes?.includes(activePersonaName);
                                return (
                                  <div 
                                    key={q.id}
                                    className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border text-xs ${
                                      userVoted
                                        ? 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                                        : 'bg-gray-50/60 dark:bg-white/5 border-gray-100 dark:border-white/5'
                                    }`}
                                  >
                                    <div className="min-w-0 flex items-center gap-1.5 truncate">
                                      <span className="font-bold text-gray-900 dark:text-white truncate text-[11px]">
                                        {q.vendorName}
                                      </span>
                                      {q.recommended && (
                                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[9px]">
                                          Rec
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="font-mono font-bold text-gray-900 dark:text-white text-[11px]">
                                        ${q.amount?.toLocaleString()}
                                      </span>
                                      {onVoteForQuote && isCommitteeMember && (
                                        <button
                                          onClick={() => onVoteForQuote(req.id, q.id)}
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                            userVoted
                                              ? 'bg-[#0055FF] text-white'
                                              : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-blue-100'
                                          }`}
                                        >
                                          {userVoted ? 'Voted' : 'Vote'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4 align-top">
                            {mostVotedQuote ? (
                              <div className="space-y-1">
                                <div className="font-bold text-gray-900 dark:text-white text-xs">
                                  {mostVotedQuote.vendorName}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                                  <Vote size={12} className="text-blue-500" />
                                  <span>{mostVotedQuote.committeeVotes?.length || 0} of {totalVotes} votes</span>
                                </div>
                                {recommendedQuote && recommendedQuote.id === mostVotedQuote.id && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <CheckCircle2 size={10} /> Recommended
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">No votes cast yet</span>
                            )}
                          </td>
                          <td className="py-4 px-4 align-top text-right space-y-1.5">
                            <button
                              type="button"
                              onClick={() => setTendersViewMode('cards')}
                              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 transition-colors"
                            >
                              <span>View Poll</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            displayTenderRequests.map(req => (
              <div 
                key={req.id}
                className="bg-white dark:bg-[#0d1117] rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-white/10 shadow-xs space-y-6"
              >
                {/* Tender Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-[#0055FF] dark:text-[#00D4B2] uppercase tracking-wider">
                        {req.priority} Priority
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#0055FF] dark:text-[#00D4B2] border border-blue-500/20 text-[10px] font-bold uppercase">
                        Quotes Received
                      </span>
                      {req.schemeId && (
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-[10px] font-bold uppercase">
                          Scheme: {req.schemeId}
                        </span>
                      )}
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
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[#0055FF] dark:text-[#00D4B2] border border-blue-500/20 text-[9px] font-black uppercase">
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

                            {/* Committee Voting Chips - Strictly Committee Members according to Permission Matrix */}
                            <div className="pt-2 border-t border-gray-200/60 dark:border-white/5 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <Vote size={12} /> Committee Votes ({votesCount})
                                </span>
                                {votesCount > 0 && (
                                  <span className="text-[10px] text-gray-500 truncate max-w-[120px]" title={quote.committeeVotes?.join(', ')}>
                                    {quote.committeeVotes?.join(', ')}
                                  </span>
                                )}
                              </div>
                              {isCommitteeMember ? (
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
                              ) : (
                                <div className="py-1.5 px-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 text-[11px] text-gray-500 text-center font-medium">
                                  <span>Committee Ballot ({votesCount} vote{votesCount === 1 ? '' : 's'})</span>
                                </div>
                              )}
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
                                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                                      : 'bg-[#0055FF] hover:bg-blue-600 text-white dark:bg-[#00D4B2] dark:hover:bg-[#00b89a] dark:text-black shadow-xs'
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

                {/* Poll Remarks — Committee can post, everyone can read */}
                <div className="border-t border-gray-100 dark:border-white/5 pt-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <MessageSquare size={13} />
                    <span>Remarks</span>
                    {(tenderPollComments[req.id]?.length || 0) > 0 && (
                      <span className="ml-auto text-[11px] font-bold text-gray-400 normal-case tracking-normal">
                        {tenderPollComments[req.id].length} {tenderPollComments[req.id].length === 1 ? 'remark' : 'remarks'}
                      </span>
                    )}
                  </div>

                  {/* Posted remarks */}
                  {(tenderPollComments[req.id]?.length || 0) > 0 && (
                    <div className="space-y-2">
                      {tenderPollComments[req.id].map((c, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5"
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0055FF] to-[#00D4B2] flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5">
                            {c.authorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-gray-900 dark:text-white">{c.authorName}</span>
                              <span className="text-[10px] text-gray-400">{c.postedAt}</span>
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input — strictly committee members only per workflow */}
                  {isCommitteeMember && (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0055FF] to-[#00D4B2] flex items-center justify-center text-white text-[10px] font-black shrink-0">
                        {(activePersonaName || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5">
                        <input
                          type="text"
                          value={tenderCommentInputs[req.id] || ''}
                          onChange={e => setTenderCommentInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && (tenderCommentInputs[req.id] || '').trim()) {
                              const text = (tenderCommentInputs[req.id] || '').trim();
                              const now = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
                              setTenderPollComments(prev => ({
                                ...prev,
                                [req.id]: [
                                  ...(prev[req.id] || []),
                                  { authorName: activePersonaName || 'Committee Member', authorRole: activePersonaRole || 'Committee Member', text, postedAt: `Today at ${now}` }
                                ]
                              }));
                              if (onAddComment) onAddComment(req.id, text);
                              setTenderCommentInputs(prev => ({ ...prev, [req.id]: '' }));
                            }
                          }}
                          placeholder="Add a remark on this poll…"
                          className="flex-1 bg-transparent text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none"
                        />
                        <button
                          type="button"
                          disabled={!(tenderCommentInputs[req.id] || '').trim()}
                          onClick={() => {
                            const text = (tenderCommentInputs[req.id] || '').trim();
                            if (!text) return;
                            const now = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
                            setTenderPollComments(prev => ({
                              ...prev,
                              [req.id]: [
                                ...(prev[req.id] || []),
                                { authorName: activePersonaName || 'Committee Member', authorRole: activePersonaRole || 'Committee Member', text, postedAt: `Today at ${now}` }
                              ]
                            }));
                            if (onAddComment) onAddComment(req.id, text);
                            setTenderCommentInputs(prev => ({ ...prev, [req.id]: '' }));
                          }}
                          className="text-[#0055FF] dark:text-[#00D4B2] hover:opacity-70 transition-opacity disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Send size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: VERIFIED TRADES DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Accredited Building Contractors
              </h3>
              <p className="text-xs text-gray-500">
                Manage accredited vendor network, view credentials, or onboard new trades
              </p>
            </div>
            {!isCommitteeMember && (
              <div className="flex items-center gap-2">
                <a
                  href="#trade-portal"
                  className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border border-gray-200/80 dark:border-white/10"
                  title="Open live Contractor Self-Registration Portal"
                >
                  <ExternalLink size={14} className="text-[#0055FF] dark:text-[#00D4B2]" /> Open Trade Portal
                </a>
                <button
                  onClick={() => setShowAddVendorModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <Plus size={15} /> Add / Invite Contractor
                </button>
              </div>
            )}
          </div>

          {/* Pending Applications Alert Banner for Strata Manager */}
          {!isCommitteeMember && vendors.some(v => v.insuranceStatus === 'Pending Verification') && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>Trade Portal Applications Awaiting Approval</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black">
                      {vendors.filter(v => v.insuranceStatus === 'Pending Verification').length} Pending
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Contractors registered via the external onboarding portal have uploaded their Certificate of Currency for verification.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDirectoryInsuranceFilter('Pending Review')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shrink-0 transition-all cursor-pointer shadow-sm"
              >
                Review Applications
              </button>
            </div>
          )}

          {/* Sort & Filter Bar with View Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-[#0d1117] rounded-xl border border-gray-200 dark:border-white/10 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider mr-1">Filter Trade:</span>
              {['All', 'Lift & Vertical Transport', 'Plumbing & Drainage', 'Electrical & Lighting', 'Fire & Safety Services'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setDirectoryCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    directoryCategoryFilter === cat
                      ? 'bg-[#0055FF] text-white'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block" />

              <span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider mr-1">Insurance:</span>
              {(['All', 'Active', 'Pending Review', 'Expired'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setDirectoryInsuranceFilter(status)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    directoryInsuranceFilter === status
                      ? status === 'Pending Review' 
                        ? 'bg-amber-500 text-black font-black' 
                        : 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  <span>{status}</span>
                  {status === 'Pending Review' && vendors.some(v => v.insuranceStatus === 'Pending Verification') && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            {/* View Mode Switcher: Table first, Cards second */}
            <div className="flex items-center gap-1 bg-gray-200/70 dark:bg-[#1a1f2e] p-1 rounded-xl shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => setDirectoryViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  directoryViewMode === 'table'
                    ? 'bg-white dark:bg-[#0d1117] text-[#0055FF] dark:text-[#00D4B2] shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Enterprise table view"
              >
                <List size={13} />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setDirectoryViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  directoryViewMode === 'cards'
                    ? 'bg-white dark:bg-[#0d1117] text-[#0055FF] dark:text-[#00D4B2] shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Card grid layout"
              >
                <LayoutGrid size={13} />
                <span>Cards</span>
              </button>
            </div>
          </div>

          {directoryViewMode === 'table' ? (
            <div className="bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[800px] text-left text-xs border-collapse font-sans table-auto">
                  <thead>
                    <tr className="bg-gray-100/90 dark:bg-[#151a28] text-gray-700 dark:text-gray-200 font-black uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-white/10 select-none">
                      <th className="py-3.5 px-4 w-[22%]">Contractor Name & ABN</th>
                      <th className="py-3.5 px-4 w-[18%]">Category & License</th>
                      <th className="py-3.5 px-4 w-[18%]">Insurance Status</th>
                      <th className="py-3.5 px-4 w-[22%]">Contact Info</th>
                      <th className="py-3.5 px-4 w-[10%]">Rating</th>
                      <th className="py-3.5 px-4 w-[10%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                    {filteredVendors.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-bold text-gray-900 dark:text-white text-xs">
                            {v.name}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                            ABN: {v.abn}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {v.yearsOfExperience || 5} Years Exp.
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                            {v.category}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                            Lic: {v.licenseNo}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          {v.insuranceStatus === 'Active' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#10B981] dark:bg-emerald-950/30 text-[10px] font-bold uppercase">
                              <ShieldCheck size={11} /> Active
                            </span>
                          ) : v.insuranceStatus === 'Pending Verification' ? (
                            <button
                              onClick={() => setSelectedVendorForDetails(v)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase border border-amber-500/30 cursor-pointer animate-pulse"
                              title="Click to review contractor submission"
                            >
                              <Clock size={11} /> Pending Review
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setInsuranceVerifyVendor(v);
                                setNewInsuranceExpiry('2027-12-31');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-[#FF6B6B] dark:bg-red-950/30 text-[10px] font-bold uppercase cursor-pointer"
                              title="Click to update insurance"
                            >
                              <AlertTriangle size={11} /> Expired Ins.
                            </button>
                          )}
                          <div className="text-[10px] text-gray-400 mt-1">
                            Exp: {v.insuranceExpiry}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <div className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <Phone size={11} className="text-gray-400" /> {v.phone}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                            <Mail size={11} className="text-gray-400" /> {v.email}
                          </div>
                          {v.website && (
                            <div className="text-[10px] text-blue-500 flex items-center gap-1 mt-0.5">
                              <ExternalLink size={10} /> {v.website.replace('https://', '')}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 align-top">
                          <span className="inline-flex items-center gap-1 text-[#FFB020] font-bold text-xs">
                            <Star size={12} fill="currentColor" /> {v.rating}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 align-top text-right space-y-1">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedVendorForDetails(v)}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all cursor-pointer"
                            >
                              Details
                            </button>
                            {!isCommitteeMember && (
                              <button
                                type="button"
                                onClick={() => setVendorToDelete(v)}
                                className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                                title="Delete vendor"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredVendors.map(v => (
              <div 
                key={v.id} 
                className={`bg-white dark:bg-[#0d1117] rounded-2xl p-5 border shadow-xs space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between ${
                  v.insuranceStatus === 'Pending Verification'
                    ? 'border-amber-500/50 dark:border-amber-500/40 ring-1 ring-amber-500/20'
                    : 'border-gray-200 dark:border-white/10'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{v.name}</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{v.category}</span>
                    </div>
                    {v.insuranceStatus === 'Active' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-[#10B981] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold uppercase flex items-center gap-1 shrink-0">
                        <ShieldCheck size={12} /> Active Ins.
                      </span>
                    ) : v.insuranceStatus === 'Pending Verification' ? (
                      <button
                        onClick={() => setSelectedVendorForDetails(v)}
                        className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 text-[10px] font-black uppercase flex items-center gap-1 shrink-0 cursor-pointer border border-amber-500/30 animate-pulse"
                        title="Click to review contractor submission"
                      >
                        <Clock size={12} /> Pending Review
                      </button>
                    ) : !isCommitteeMember ? (
                      <button
                        onClick={() => {
                          setInsuranceVerifyVendor(v);
                          setNewInsuranceExpiry('2027-12-31');
                        }}
                        className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-500/15 text-[#FF6B6B] dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/25 border border-red-200 dark:border-red-500/20 text-[10px] font-bold uppercase flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Click to update insurance"
                      >
                        <AlertTriangle size={12} /> Expired Ins. (Renew)
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-500/15 text-[#FF6B6B] dark:text-red-400 border border-red-200 dark:border-red-500/20 text-[10px] font-bold uppercase flex items-center gap-1 shrink-0">
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
                      <span className={
                        v.insuranceStatus === 'Active' 
                          ? 'text-emerald-600 font-bold' 
                          : v.insuranceStatus === 'Pending Verification'
                          ? 'text-amber-500 font-bold'
                          : 'text-red-500 font-bold'
                      }>
                        {v.insuranceExpiry}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <a 
                      href={`tel:${v.phone}`} 
                      className="flex items-center gap-1 text-blue-600 dark:text-[#00D4B2] font-semibold hover:underline cursor-pointer"
                    >
                      <Phone size={12} /> {v.phone}
                    </a>
                    <span className="flex items-center gap-1 text-[#FFB020] font-bold"><Star size={12} fill="currentColor" /> {v.rating}</span>
                  </div>

                  {/* Strata Manager Action Buttons: View Details & Delete */}
                  {!isCommitteeMember && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedVendorForDetails(v)}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setVendorToDelete(v)}
                        className="py-1.5 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-bold transition-all cursor-pointer"
                        title="Delete vendor"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
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

      {/* MODAL 3: VENDOR ONBOARDING (MANUAL OR INVITE LINK - STRATA MANAGER WORKFLOW) */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl p-6 md:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200 font-sans max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-sans text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-normal">
                    Vendor Onboarding
                  </h3>
                  <span className="text-xs text-gray-500">Strata Manager Accredited Trades Workflow</span>
                </div>
              </div>
              <button 
                onClick={() => setShowAddVendorModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Workflow Mode Tabs */}
            <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setVendorOnboardingMode('manual')}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  vendorOnboardingMode === 'manual'
                    ? 'bg-white dark:bg-[#0055FF] text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Onboard Vendor Manually
              </button>
              <button
                type="button"
                onClick={() => setVendorOnboardingMode('invite')}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  vendorOnboardingMode === 'invite'
                    ? 'bg-white dark:bg-[#0055FF] text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Send Vendor Invite (Email)
              </button>
            </div>

            {vendorOnboardingMode === 'invite' ? (
              <form onSubmit={handleCreateVendorSubmit} className="space-y-4 font-sans">
                <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl text-xs text-blue-900 dark:text-blue-300 space-y-1">
                  <span className="font-bold">Automated Vendor Invitation Workflow</span>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400">
                    Sends an invitation email with site details and an encrypted registration link for the vendor to submit their company credentials and Certificate of Currency for review.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Company Name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newVendorName}
                    onChange={e => setNewVendorName(e.target.value)}
                    placeholder="e.g. Apex Electrical Solutions"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#0055FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Vendor Email Address <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newVendorEmail}
                    onChange={e => setNewVendorEmail(e.target.value)}
                    placeholder="vendor@company.com.au"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0055FF]"
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Service Speciality *"
                    options={categoryOptions}
                    value={newVendorCategory}
                    onChange={setNewVendorCategory}
                  />
                </div>

                {inviteVendorSent && generatedInviteUrl ? (
                  <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/50 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Invitation generated and email dispatched to {newVendorEmail}!</span>
                    </div>

                    <p className="text-[11px] text-gray-600 dark:text-gray-300">
                      The contractor has been sent an email containing their secure registration link. You can also copy the link or test the live portal directly below:
                    </p>

                    <div className="p-2 bg-white dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl text-[10px] font-mono text-gray-700 dark:text-gray-300 truncate select-all">
                      {generatedInviteUrl}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedInviteUrl);
                          setIsCopiedInvite(true);
                          setTimeout(() => setIsCopiedInvite(false), 2500);
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isCopiedInvite 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-white dark:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-100'
                        }`}
                      >
                        {isCopiedInvite ? <Check size={13} /> : <Copy size={13} />}
                        <span>{isCopiedInvite ? 'Copied to Clipboard!' : 'Copy Portal Link'}</span>
                      </button>

                      <a
                        href={generatedInviteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <ExternalLink size={13} />
                        <span>Open Trade Portal</span>
                      </a>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddVendorModal(false);
                      setInviteVendorSent(false);
                      setGeneratedInviteUrl(null);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                  >
                    {inviteVendorSent ? 'Done' : 'Cancel'}
                  </button>
                  {!inviteVendorSent && (
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#0055FF] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Mail size={15} /> Send Email Invite With Site Details
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateVendorSubmit} className="space-y-3.5 font-sans">
                {/* Manual Onboarding Form - Strict workflow fields */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Company Name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newVendorName}
                    onChange={e => setNewVendorName(e.target.value)}
                    placeholder="e.g. Kone Elevator Maintenance NSW"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#0055FF]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Email Address <span className="text-red-500 font-bold">*</span>
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
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Company Website
                    </label>
                    <input
                      type="text"
                      value={newVendorWebsite}
                      onChange={e => setNewVendorWebsite(e.target.value)}
                      placeholder="https://company.com.au"
                      className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#0055FF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Phone No <span className="text-red-500 font-bold">*</span>
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
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newVendorExperience}
                      onChange={e => setNewVendorExperience(e.target.value)}
                      placeholder="e.g. 8"
                      className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#0055FF]"
                    />
                  </div>
                </div>

                <div>
                  <CustomSelect
                    label="Service Speciality *"
                    options={categoryOptions}
                    value={newVendorCategory}
                    onChange={setNewVendorCategory}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Licence No <span className="text-red-500 font-bold">*</span>
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
                </div>

                {/* Upload Insurance Docs / Certificate of Currency */}
                <div className="p-3 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                      Upload Insurance Docs (Certificate of Currency) <span className="text-red-500 font-bold">*</span>
                    </label>
                    {newVendorInsuranceDocName && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <Check size={12} /> {newVendorInsuranceDocName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/15 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 cursor-pointer flex items-center gap-1.5">
                      <FileText size={13} />
                      <span>{newVendorInsuranceDocName ? 'Change File' : 'Attach PDF / Doc'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setNewVendorInsuranceDocName(e.target.files[0].name);
                          }
                        }}
                      />
                    </label>
                    <span className="text-[11px] text-gray-400">Min $20M Public Liability required</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                      Policy Expiry Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newVendorExpiry}
                      onChange={e => setNewVendorExpiry(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white font-bold outline-none"
                    />
                  </div>
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
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={16} /> Verify & Submit Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 5: VIEW VENDOR DETAILS (WORKFLOW: SELECT A VENDOR -> VIEW DETAILS) */}
      {selectedVendorForDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl p-6 md:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-white/5 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedVendorForDetails.name}
                  </h3>
                  {selectedVendorForDetails.insuranceStatus === 'Active' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase flex items-center gap-1">
                      <ShieldCheck size={11} /> Active
                    </span>
                  ) : selectedVendorForDetails.insuranceStatus === 'Pending Verification' ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase flex items-center gap-1 border border-amber-500/30">
                      <Clock size={11} /> Awaiting Approval
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase flex items-center gap-1">
                      <AlertTriangle size={11} /> Expired
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{selectedVendorForDetails.category}</span>
              </div>
              <button 
                onClick={() => setSelectedVendorForDetails(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                <span className="text-gray-400 text-[11px] font-semibold">Service Speciality</span>
                <p className="font-bold text-gray-900 dark:text-white">{selectedVendorForDetails.category}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                <span className="text-gray-400 text-[11px] font-semibold">Licence Number</span>
                <p className="font-bold text-gray-900 dark:text-white">{selectedVendorForDetails.licenseNo}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                <span className="text-gray-400 text-[11px] font-semibold">Australian Business Number (ABN)</span>
                <p className="font-bold text-gray-900 dark:text-white">{selectedVendorForDetails.abn}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                <span className="text-gray-400 text-[11px] font-semibold">Years of Experience</span>
                <p className="font-bold text-gray-900 dark:text-white">{selectedVendorForDetails.yearsOfExperience || '5+'} Years</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                <span className="text-gray-400 text-[11px] font-semibold">Phone Number</span>
                <p className="font-bold text-gray-900 dark:text-white">{selectedVendorForDetails.phone}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                <span className="text-gray-400 text-[11px] font-semibold">Email Address</span>
                <p className="font-bold text-gray-900 dark:text-white truncate">{selectedVendorForDetails.email}</p>
              </div>
            </div>

            {selectedVendorForDetails.website && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs flex items-center justify-between">
                <span className="text-gray-400 font-semibold">Company Website:</span>
                <a 
                  href={selectedVendorForDetails.website} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-blue-600 dark:text-[#00D4B2] font-bold hover:underline flex items-center gap-1"
                >
                  {selectedVendorForDetails.website} <ExternalLink size={12} />
                </a>
              </div>
            )}

            {selectedVendorForDetails.certificateOfCurrencyUrl && (
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300 font-semibold flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-500" />
                  Submitted Certificate of Currency:
                </span>
                <a 
                  href={selectedVendorForDetails.certificateOfCurrencyUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-blue-600 dark:text-[#00D4B2] font-bold hover:underline flex items-center gap-1"
                >
                  View / Download Doc <Download size={12} />
                </a>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <FileCheck2 size={15} /> Insurance Documentation
                </span>
                <span>Expiry: {selectedVendorForDetails.insuranceExpiry}</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                {selectedVendorForDetails.insuranceStatus === 'Pending Verification' 
                  ? 'Application received via Trade Portal. Review submitted insurance policy before approving vendor into building network.'
                  : 'Verified Certificate of Currency on record for Australian strata compliance.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5 gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVendorToDelete(selectedVendorForDetails);
                    setSelectedVendorForDetails(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                >
                  Delete Vendor
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Workflow diagram action: Strata Manager Approval vs Rejected */}
                {selectedVendorForDetails.insuranceStatus === 'Pending Verification' && !isCommitteeMember ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (onDeleteVendor) {
                          onDeleteVendor(selectedVendorForDetails.id);
                        }
                        setSelectedVendorForDetails(null);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-xs font-bold transition-all cursor-pointer"
                    >
                      Reject Application
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateVendorInsurance) {
                          onUpdateVendorInsurance(selectedVendorForDetails.id, 'Active', selectedVendorForDetails.insuranceExpiry);
                        }
                        setSelectedVendorForDetails(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Approve & Save Vendor
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedVendorForDetails(null)}
                    className="px-5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CONFIRM DELETE VENDOR (WORKFLOW: DELETE VENDOR -> CONFIRM DELETE) */}
      {vendorToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Confirm Delete Vendor
                </h3>
                <span className="text-xs text-gray-500">This action cannot be undone</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              Are you sure you want to permanently remove <strong>{vendorToDelete.name}</strong> from the accredited vendor directory?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setVendorToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteVendor && vendorToDelete) {
                    onDeleteVendor(vendorToDelete.id);
                  }
                  setVendorToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
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
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>Issued</span>
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>In Progress</span>
        </span>
      );
    case 'completion_submitted':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span>Needs Sign-Off</span>
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Completed</span>
        </span>
      );
  }
}
