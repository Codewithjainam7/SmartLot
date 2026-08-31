import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
  Home,
  Sparkles,
  Building,
  X
} from 'lucide-react';

interface ResidentDashboardViewProps {
  requests: ResidentRequest[];
  onNavigateToRequests: () => void;
  onOpenCreateRequest?: () => void;
  onSubmitRequest: (data: any) => void;
  activePersonaName: string;
  activePersonaRole: string;
  activePersonaMemberships?: any[];
  onAddScheme: (id: string, name: string, lots: number) => any;
  setActiveScheme: (scheme: any) => void;
  setActivePersona: (persona: any) => void;
  schemes: any[];
  setMembers?: React.Dispatch<React.SetStateAction<any[]>>;
}

export function ResidentDashboardView({
  requests,
  onNavigateToRequests,
  onSubmitRequest,
  activePersonaName,
  activePersonaRole,
  activePersonaMemberships = [],
  onAddScheme,
  setActiveScheme,
  setActivePersona,
  schemes,
  setMembers,
}: ResidentDashboardViewProps) {
  const [showSetupPopup, setShowSetupPopup] = useState(false);
  const [buildingType, setBuildingType] = useState<'duplex' | 'townhouse' | 'apartment' | 'custom'>('duplex');
  const [newSchemeId, setNewSchemeId] = useState('SP101');
  const [newSchemeName, setNewSchemeName] = useState('Sunset Duplex');
  const [newLotsCount, setNewLotsCount] = useState(2);

  const handleBuildingTypeChange = (type: 'duplex' | 'townhouse' | 'apartment' | 'custom') => {
    setBuildingType(type);
    if (type === 'duplex') {
      setNewSchemeId('SP101');
      setNewSchemeName('Sunset Duplex');
      setNewLotsCount(2);
    } else if (type === 'townhouse') {
      setNewSchemeId('SP102');
      setNewSchemeName('Coronation Townhouses');
      setNewLotsCount(4);
    } else if (type === 'apartment') {
      setNewSchemeId('SP103');
      setNewSchemeName('Cavaller Apartments');
      setNewLotsCount(32);
    } else {
      setNewSchemeId('SP104');
      setNewSchemeName('My New Strata Scheme');
      setNewLotsCount(8);
    }
  };

  // Prefill setup details dynamically
  useEffect(() => {
    handleBuildingTypeChange('custom');
  }, [activePersonaName]);

  // Trigger popup after 5 seconds of mounting if the user has no scheme memberships linked
  useEffect(() => {
    const hasNoMemberships = !activePersonaMemberships || activePersonaMemberships.length === 0;

    if (hasNoMemberships) {
      const timer = setTimeout(() => {
        setShowSetupPopup(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activePersonaName, activePersonaMemberships]);

  const handleCreateSchemeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Create the scheme in store
    const createdScheme = onAddScheme(newSchemeId, newSchemeName, newLotsCount);
    
    // 2. Set active scheme
    setActiveScheme(createdScheme);

    // Determine target role assignment based on who setup the scheme
    const assignRole = activePersonaName === 'Emma Wilson' ? 'Strata Manager' : 'Strata Admin';

    // 3. Link memberships for activePersona
    const memberships = [
      {
        schemeId: newSchemeId,
        roles: [assignRole as any]
      }
    ];

    setActivePersona((prev: any) => ({
      ...prev,
      role: assignRole,
      memberships: memberships,
      context: activePersonaName === 'Emma Wilson' ? 'Cavaller HQ' : `Unit 1 (${newSchemeName})`
    }));

    setShowSetupPopup(false);
  };

  const myRequests = requests.filter(r => r.requestorName === activePersonaName);
  const pendingCount = myRequests.filter(r => r.status === 'pending_triage' || r.status === 'new').length;

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-full bg-[#F4F6F9] dark:bg-[#0a0a0f]">
      
      {/* Welcome Banner with Android-Style Morphing Button */}
      <div className="bg-gradient-to-r from-[#0B1121] to-[#1E2026] text-white rounded-3xl p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4B2]/10 text-[#00D4B2] text-xs font-extrabold uppercase tracking-wider">
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
            <div className="bg-[#00D4B2] hover:bg-[#00A38C] text-[#0B1121] px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 shrink-0 cursor-pointer">
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
        <div className="md:col-span-2 bg-white dark:bg-[#0d1117] rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-sm space-y-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0055FF]/10 text-[#0033CC] flex items-center justify-center font-bold">
              <Wrench size={24} />
            </div>

            <div>
              <span className="text-xs font-extrabold text-[#0055FF] uppercase tracking-wider">Service & Repairs</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">Requests Module</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
                Log requests across 5 categories, track real-time manager triage status (New, Approved, Rejected), and manage your lot issues.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs pt-2">
              <div className="bg-gray-50 dark:bg-[#1a1d27] p-3.5 rounded-2xl border border-gray-100 dark:border-white/5">
                <span className="text-gray-400 dark:text-gray-500 font-bold uppercase">All Requests</span>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">{requests.length}</div>
              </div>
              <div className="bg-gray-50 dark:bg-[#1a1d27] p-3.5 rounded-2xl border border-gray-100 dark:border-white/5">
                <span className="text-gray-400 dark:text-gray-500 font-bold uppercase">My Requests</span>
                <div className="text-2xl font-extrabold text-[#0055FF] mt-0.5">{myRequests.length}</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                <span className="text-amber-800 dark:text-amber-400 font-bold uppercase">Pending Triage</span>
                <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-300 mt-0.5">{pendingCount}</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
            <button
              onClick={onNavigateToRequests}
              className="w-full bg-[#0B1121] hover:bg-black text-white py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              Open Requests List View <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Profile & Lot Overview Card */}
        <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">My Lot Profile</h3>
          
          <div className="bg-gray-50 dark:bg-[#1a1d27] p-4 rounded-2xl space-y-3 text-xs border border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0055FF]/10 text-[#0033CC] flex items-center justify-center font-bold">
                <Home size={20} />
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-white text-sm">Unit 10 (Lot 10)</div>
                <div className="text-gray-500 dark:text-gray-400 dark:text-gray-500">Strata Scheme SP10482</div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-white/8 space-y-1.5 text-gray-600 dark:text-gray-300">
              <div className="flex justify-between"><span className="font-bold text-gray-400 dark:text-gray-500">Name:</span> <span className="font-bold text-gray-900 dark:text-white">{activePersonaName}</span></div>
              <div className="flex justify-between"><span className="font-bold text-gray-400 dark:text-gray-500">Role:</span> <span className="font-semibold text-gray-850 dark:text-gray-200">{activePersonaRole}</span></div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Requests List */}
      <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Service Requests</h3>

        <div className="space-y-3">
          {requests.slice(0, 3).map(req => (
            <div key={req.id} className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#1a1d27]/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-gray-400 dark:text-gray-500">{req.id} • {req.unit}</span>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300">{req.status}</span>
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-0.5">{req.title}</h4>
              </div>

              <button
                onClick={onNavigateToRequests}
                className="text-xs font-bold text-[#0055FF] hover:text-[#0033CC] cursor-pointer"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5-Second Strata Scheme Creation Popup */}
      <AnimatePresence>
        {showSetupPopup && (() => {
          const info = (() => {
            switch (buildingType) {
              case 'duplex':
                return {
                  title: 'Setup Your Duplex Strata',
                  subtitle: 'Duplex Strata (2 Lots)',
                  desc: "Let's register your Sunset Duplex site details to activate Strata Admin features."
                };
              case 'townhouse':
                return {
                  title: 'Setup Your Townhouse Strata',
                  subtitle: 'Townhouse Strata (4 Lots)',
                  desc: "Let's register your Coronation Townhouses site details to activate Strata Admin features."
                };
              case 'apartment':
                return {
                  title: 'Setup Your Apartment Block Strata',
                  subtitle: 'Apartment Strata (32 Lots)',
                  desc: "Let's register your Cavaller Apartments site details to activate Strata Manager features."
                };
              default:
                return {
                  title: 'Setup Your Strata Scheme',
                  subtitle: 'Custom Strata Scheme',
                  desc: "Enter your building site details to activate Strata Administration features."
                };
            }
          })();

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0B1121]/75 backdrop-blur-md"
                onClick={() => setShowSetupPopup(false)}
              />

              {/* Modal Box */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="bg-[#0B1121] text-white w-full max-w-md rounded-[32px] p-8 border border-white/10 shadow-2xl relative z-10 space-y-6 overflow-hidden"
              >
                {/* Close Button */}
                <button 
                  type="button"
                  onClick={() => setShowSetupPopup(false)}
                  className="absolute top-6 right-6 text-gray-400 dark:text-gray-500 hover:text-white transition-colors cursor-pointer bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/5 z-50"
                >
                  <X size={16} />
                </button>

                {/* Decorative Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4B2]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="text-center space-y-2.5 relative z-10 pt-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#00D4B2]/10 text-[#00D4B2] flex items-center justify-center mx-auto border border-[#00D4B2]/20 animate-pulse">
                    <Building size={28} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-[#00D4B2] tracking-widest uppercase bg-[#00D4B2]/10 px-2.5 py-0.5 rounded-full border border-[#00D4B2]/25 inline-block">
                      {info.subtitle}
                    </span>
                    <h3 className="text-2xl font-bold tracking-tight text-white mt-1">{info.title}</h3>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed max-w-xs mx-auto">
                    {info.desc}
                  </p>
                </div>

                {/* Strata Option Selector */}
                <div className="relative z-10">
                  <label className="block text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Australian Strata Classification</label>
                  <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 text-center relative z-0">
                    {(['duplex', 'townhouse', 'apartment', 'custom'] as const).map(type => {
                      const isActive = buildingType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleBuildingTypeChange(type)}
                          className={`relative py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer outline-none z-10 ${
                            isActive ? 'text-[#0B1121]' : 'text-gray-400 dark:text-gray-500 hover:text-white'
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="activeTabDashboardPopup"
                              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                              className="absolute inset-0 bg-[#00D4B2] rounded-xl -z-10 shadow-md"
                            />
                          )}
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={handleCreateSchemeSubmit} className="space-y-4 relative z-10">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Strata Scheme ID</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. SP101"
                      value={newSchemeId}
                      onChange={e => setNewSchemeId(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white text-sm outline-none font-bold focus:border-[#00D4B2]/50 focus:bg-white/10 transition-all placeholder:text-gray-600 dark:text-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Building/Site Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Sunset Duplex"
                      value={newSchemeName}
                      onChange={e => setNewSchemeName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white text-sm outline-none font-bold focus:border-[#00D4B2]/50 focus:bg-white/10 transition-all placeholder:text-gray-600 dark:text-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Unit Lots Size</label>
                    <input 
                      type="number"
                      disabled={buildingType !== 'custom'}
                      value={newLotsCount}
                      onChange={e => setNewLotsCount(parseInt(e.target.value) || 2)}
                      className={`w-full px-4 py-3.5 rounded-2xl border text-sm outline-none font-bold transition-all ${
                        buildingType !== 'custom'
                          ? 'border-white/5 bg-white/5 text-gray-500 dark:text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'border-white/10 bg-white/5 text-white focus:border-[#00D4B2]/50 focus:bg-white/10'
                      }`}
                    />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2 block">
                      {buildingType !== 'custom'
                        ? `Lots size is preset to ${newLotsCount} for this Australian strata template.`
                        : 'Enter the total number of lots in this strata scheme.'}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#00D4B2] hover:bg-[#00A38C] text-[#0B1121] py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer shadow-lg shadow-[#00D4B2]/15 mt-4"
                  >
                    <span>Activate Strata Scheme</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}



// End ResidentDashboardView
