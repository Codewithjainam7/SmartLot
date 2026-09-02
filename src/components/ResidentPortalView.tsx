import React, { useState } from 'react';
import { 
  Building2, 
  Home, 
  Wrench, 
  Bell, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Calendar,
  ExternalLink,
  ChevronRight,
  User,
  Sparkles
} from 'lucide-react';
import { ResidentRequest } from '../store/smartLotStore';

interface ResidentPortalViewProps {
  store: any;
  onOpenCreateRequest: () => void;
}

export function ResidentPortalView({ store, onOpenCreateRequest }: ResidentPortalViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'notices' | 'contacts'>('overview');
  const activeScheme = store.activeScheme;
  const activePersona = store.activePersona;

  // Filter requests submitted by this user or belonging to their unit
  const myRequests = (store.residentRequests || []).filter((r: ResidentRequest) => 
    r.schemeId === activeScheme.id && (
      r.requestorEmail?.toLowerCase() === activePersona.email?.toLowerCase() ||
      r.requestorName?.toLowerCase() === activePersona.name?.toLowerCase() ||
      r.unit === activePersona.context
    )
  );

  // Filter members of this scheme to identify the Strata Manager / Contacts
  const schemeMembers = (store.members || []).filter((m: any) => m.schemeId === activeScheme.id);
  const strataManager = schemeMembers.find((m: any) => m.role === 'Strata Manager' || m.role === 'Strata Admin') || {
    name: 'Strata Management Desk',
    email: 'help@smartlot.com.au',
    phone: '1300 888 777'
  };

  // Building Announcements & Notices
  const announcements = [
    {
      id: 'ann-1',
      title: 'Scheduled Common Area Window Cleaning',
      date: 'Next Tuesday, 9:00 AM - 3:00 PM',
      category: 'Maintenance',
      description: 'Professional cleaners will be attending to exterior and common lobby windows. Please keep balcony windows closed.',
      urgent: false
    },
    {
      id: 'ann-2',
      title: 'Annual Fire Alarm & Smoke Detector Testing',
      date: 'Sept 15, 2026',
      category: 'Safety',
      description: 'Mandatory fire compliance testing will be conducted across all lots. Sirens may sound intermittently.',
      urgent: true
    },
    {
      id: 'ann-3',
      title: 'Recycling & Bulk Waste Collection Guidelines',
      date: 'Ongoing Notice',
      category: 'General',
      description: 'Please ensure all cardboard boxes are flattened before placing in yellow bins. Bulk furniture collection must be pre-booked.',
      urgent: false
    }
  ];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto h-full bg-[#F4F6F9] dark:bg-[#0B1121] font-sans text-gray-900 dark:text-gray-100">
      
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0055FF] to-[#00D4B2] p-8 text-white shadow-xl shadow-[#0055FF]/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase">
              <Home size={13} />
              <span>{activePersona.context || 'Unit 1'} • {activeScheme?.name || 'Your Scheme'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome home, {activePersona.name}
            </h1>
            <p className="text-white/80 text-sm max-w-xl">
              Manage your residential maintenance, track repairs, view building notices, and connect with your strata management team.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenCreateRequest}
              className="px-5 py-3 rounded-2xl bg-white text-[#0055FF] font-bold text-sm hover:bg-white/90 shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Report an Issue</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow elements */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-60 h-60 bg-black/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/5 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-[#121316] text-[#0055FF] dark:text-[#00D4B2] shadow-sm border border-gray-200 dark:border-white/5'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-white dark:bg-[#121316] text-[#0055FF] dark:text-[#00D4B2] shadow-sm border border-gray-200 dark:border-white/5'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span>My Requests</span>
          {myRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-[#0055FF]/10 text-[#0055FF] dark:text-[#00D4B2] font-semibold">
              {myRequests.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('notices')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'notices'
              ? 'bg-white dark:bg-[#121316] text-[#0055FF] dark:text-[#00D4B2] shadow-sm border border-gray-200 dark:border-white/5'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span>Notice Board</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'contacts'
              ? 'bg-white dark:bg-[#121316] text-[#0055FF] dark:text-[#00D4B2] shadow-sm border border-gray-200 dark:border-white/5'
              : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Building Contacts
        </button>
      </div>

      {/* Tab 1: Resident Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Unit</span>
                <Home size={16} className="text-[#0055FF] dark:text-[#00D4B2]" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {activePersona.context || 'Unit 1'}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> Occupancy Verified
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Requests</span>
                <Wrench size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {myRequests.filter((r: any) => r.status !== 'resolved' && r.status !== 'closed').length}
              </div>
              <div className="text-xs text-gray-500">
                {myRequests.length} total logged
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Building Scheme</span>
                <Building2 size={16} className="text-indigo-500" />
              </div>
              <div className="text-xl font-extrabold text-gray-900 dark:text-white truncate">
                {activeScheme?.id || 'SP101'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {(activeScheme?.name || "").split("-")[1]?.trim() || activeScheme?.name || "Sunset Duplex"}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Emergency Desk</span>
                <Phone size={16} className="text-emerald-500" />
              </div>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                24/7 Active
              </div>
              <div className="text-xs text-gray-500">
                {strataManager.phone || '1300 888 777'}
              </div>
            </div>
          </div>

          {/* Two-Column Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: My Recent Requests */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Your Maintenance Requests</h2>
                  <p className="text-xs text-gray-500">Track current tickets and repairs for your unit</p>
                </div>
                <button
                  type="button"
                  onClick={onOpenCreateRequest}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0055FF]/10 text-[#0055FF] dark:text-[#00D4B2] hover:bg-[#0055FF]/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus size={13} />
                  <span>New Request</span>
                </button>
              </div>

              {myRequests.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/10 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0055FF]/10 dark:bg-white/5 flex items-center justify-center mx-auto text-[#0055FF] dark:text-[#00D4B2]">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">No Open Maintenance Issues</div>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Everything in your unit is in working order. If something requires repair or attention, let us know!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenCreateRequest}
                    className="px-4 py-2 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Report an Issue
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((req: any) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{req.title}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.priority === 'High' || req.priority === 'Critical'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          }`}>
                            {req.priority || 'Medium'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">{req.description || 'No additional details provided.'}</p>
                        <div className="text-[10px] text-gray-400 flex items-center gap-2">
                          <span>Reported: {req.createdAt || 'Recent'}</span>
                          <span>•</span>
                          <span>Unit: {req.unit || activePersona.context}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          req.status === 'resolved' || req.status === 'closed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : req.status === 'in_progress'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {req.status ? req.status.replace('_', ' ') : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right 1 Col: Strata Desk & Quick Actions */}
            <div className="space-y-6">
              {/* Management Contact Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Strata Management</h3>
                    <p className="text-xs text-gray-500">{strataManager.name}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-gray-400" />
                    <span>{strataManager.phone || '0411 888 777'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-gray-400" />
                    <span className="truncate">{strataManager.email}</span>
                  </div>
                </div>
              </div>

              {/* Latest Community Notice */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                    <Bell size={14} className="text-[#0055FF] dark:text-[#00D4B2]" />
                    <span>Latest Notice</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('notices')}
                    className="text-[10px] font-bold text-[#0055FF] dark:text-[#00D4B2] hover:underline cursor-pointer"
                  >
                    View All
                  </button>
                </div>
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-1">
                  <div className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                    {announcements[0].title}
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2">
                    {announcements[0].description}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Full My Requests List */}
      {activeTab === 'requests' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Logged Requests ({myRequests.length})</h2>
              <p className="text-xs text-gray-500">Track real-time progress and notes from your building managers</p>
            </div>
            <button
              type="button"
              onClick={onOpenCreateRequest}
              className="px-4 py-2.5 rounded-2xl bg-[#0055FF] hover:bg-[#0044CC] text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Submit New Request</span>
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <Wrench size={32} className="mx-auto text-gray-300 dark:text-gray-700" />
              <div className="font-bold text-gray-800 dark:text-gray-200">No requests submitted yet</div>
              <p className="text-xs">Click 'Submit New Request' above if you need any repairs or maintenance in your lot.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((req: any) => (
                <div 
                  key={req.id} 
                  className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{req.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.priority === 'High' || req.priority === 'Critical'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}>
                          {req.priority || 'Medium'} Priority
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">{req.description}</p>
                    </div>

                    <div className="shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        req.status === 'resolved' || req.status === 'closed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : req.status === 'in_progress'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        Status: {req.status ? req.status.replace('_', ' ') : 'Pending Review'}
                      </span>
                    </div>
                  </div>

                  {/* Audit / Timeline Notes */}
                  <div className="pt-3 border-t border-gray-200/60 dark:border-white/5 flex items-center justify-between text-xs text-gray-400">
                    <div>Unit: {req.unit || activePersona.context} • Scheme: {req.schemeId}</div>
                    <div>Logged: {req.createdAt || 'Recent'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Full Notice Board */}
      {activeTab === 'notices' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 shadow-sm space-y-6">
          <div className="pb-4 border-b border-gray-100 dark:border-white/5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Community Notice Board</h2>
            <p className="text-xs text-gray-500">Official building announcements and scheduled maintenance alerts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div 
                key={ann.id}
                className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    ann.urgent ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-[#0055FF]/10 text-[#0055FF] dark:text-[#00D4B2]'
                  }`}>
                    {ann.category}
                  </span>
                  <span className="text-xs text-gray-400">{ann.date}</span>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">{ann.title}</div>
                <p className="text-xs text-gray-600 dark:text-gray-300">{ann.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Building Contacts */}
      {activeTab === 'contacts' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 shadow-sm space-y-6">
          <div className="pb-4 border-b border-gray-100 dark:border-white/5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Emergency & Building Contacts</h2>
            <p className="text-xs text-gray-500">Authorized personnel and 24/7 on-call trades for {activeScheme?.name}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-2">
              <div className="text-xs font-bold uppercase text-indigo-500">Strata Manager</div>
              <div className="font-bold text-sm text-gray-900 dark:text-white">{strataManager.name}</div>
              <div className="text-xs text-gray-500">{strataManager.email}</div>
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{strataManager.phone || '0411 888 777'}</div>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-2">
              <div className="text-xs font-bold uppercase text-red-500">Emergency Plumber (24/7)</div>
              <div className="font-bold text-sm text-gray-900 dark:text-white">Apex Strata Plumbing</div>
              <div className="text-xs text-gray-500">Burst pipes & urgent water leaks</div>
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">1800 555 333</div>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-2">
              <div className="text-xs font-bold uppercase text-amber-500">Emergency Locksmith</div>
              <div className="font-bold text-sm text-gray-900 dark:text-white">SecureLock Services</div>
              <div className="text-xs text-gray-500">Building access & key fobs</div>
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">0412 999 888</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
