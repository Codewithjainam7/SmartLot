import React from 'react';
import { ResidentRequest } from '../store/smartLotStore';
import { 
  MorphingPopover, 
  MorphingPopoverTrigger, 
  MorphingPopoverContent 
} from './core/morphing-popover';
import { CreateRequestFormContent } from './CreateRequestModal';
import { 
  Wrench, 
  Plus, 
  ShieldCheck, 
  ArrowRight,
  User,
  Mail,
  Home
} from 'lucide-react';

interface ResidentDashboardViewProps {
  requests: ResidentRequest[];
  onNavigateToRequests: () => void;
  onOpenCreateRequest?: () => void;
  onSubmitRequest: (data: any) => void;
  activePersonaName: string;
  activePersonaRole: string;
}

export function ResidentDashboardView({
  requests,
  onNavigateToRequests,
  onSubmitRequest,
  activePersonaName,
  activePersonaRole,
}: ResidentDashboardViewProps) {
  const myRequests = requests.filter(r => r.requestorName === activePersonaName);
  const pendingCount = myRequests.filter(r => r.status === 'pending_triage' || r.status === 'new').length;

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-full bg-[#F4F6F9]">
      
      {/* Welcome Banner with Android-Style Morphing Button */}
      <div className="bg-gradient-to-r from-[#121316] to-[#1E2026] text-white rounded-3xl p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D8F235]/10 text-[#D8F235] text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck size={14} /> SP10482 • Unit 10 Active
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {activePersonaName}</h1>
          <p className="text-sm text-gray-300">
            Logged in as <span className="text-white font-bold">{activePersonaRole}</span>. Manage your service requests and view scheme updates.
          </p>
        </div>

        {/* Morphing Capsule Button -> Center Dialog Transformation */}
        <MorphingPopover>
          <MorphingPopoverTrigger>
            <div className="bg-[#D8F235] hover:bg-[#c4db30] text-[#121316] px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 shrink-0 cursor-pointer">
              <Plus size={20} /> Create New Request
            </div>
          </MorphingPopoverTrigger>

          <MorphingPopoverContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CreateRequestFormContent 
              onSubmit={onSubmitRequest}
              requestorName={activePersonaName}
            />
          </MorphingPopoverContent>
        </MorphingPopover>
      </div>

      {/* Primary Card: Service Requests Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Requests Hub Card */}
        <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#8B8CF8]/10 text-[#6366F1] flex items-center justify-center font-bold">
              <Wrench size={24} />
            </div>

            <div>
              <span className="text-xs font-extrabold text-[#8B8CF8] uppercase tracking-wider">Service & Repairs</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-0.5">Requests Module</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Log requests across 5 categories, track real-time manager triage status (New, Approved, Rejected), and manage your lot issues.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs pt-2">
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-gray-400 font-bold uppercase">All Requests</span>
                <div className="text-2xl font-extrabold text-gray-900 mt-0.5">{requests.length}</div>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-gray-400 font-bold uppercase">My Requests</span>
                <div className="text-2xl font-extrabold text-[#8B8CF8] mt-0.5">{myRequests.length}</div>
              </div>
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-100">
                <span className="text-amber-800 font-bold uppercase">Pending Triage</span>
                <div className="text-2xl font-extrabold text-amber-900 mt-0.5">{pendingCount}</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={onNavigateToRequests}
              className="w-full bg-[#121316] hover:bg-black text-white py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              Open Requests List View <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Profile & Lot Overview Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">My Lot Profile</h3>
          
          <div className="bg-gray-50 p-4 rounded-2xl space-y-3 text-xs border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Home size={20} />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">Unit 10 (Lot 10)</div>
                <div className="text-gray-500">Strata Scheme SP10482</div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 space-y-1.5 text-gray-600">
              <div className="flex justify-between"><span className="font-bold text-gray-400">Name:</span> <span className="font-bold text-gray-900">{activePersonaName}</span></div>
              <div className="flex justify-between"><span className="font-bold text-gray-400">Role:</span> <span className="font-semibold text-gray-800">{activePersonaRole}</span></div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Requests List */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900">Recent Service Requests</h3>

        <div className="space-y-3">
          {requests.slice(0, 3).map(req => (
            <div key={req.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-gray-400">{req.id} • {req.unit}</span>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-gray-200 text-gray-700">{req.status}</span>
                </div>
                <h4 className="font-bold text-sm text-gray-900 mt-0.5">{req.title}</h4>
              </div>

              <button
                onClick={onNavigateToRequests}
                className="text-xs font-bold text-[#8B8CF8] hover:text-[#6366F1] cursor-pointer"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
