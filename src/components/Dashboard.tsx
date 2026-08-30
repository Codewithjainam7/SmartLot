import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { UnitDetailCard } from './UnitDetailCard';
import { 
  Users, 
  AlertTriangle, 
  Vote, 
  ClipboardList, 
  Zap, 
  ArrowRight, 
  Share2, 
  Phone, 
  Mail, 
  FileText, 
  Settings, 
  ShieldCheck,
  Building,
  Plus,
  X 
} from 'lucide-react';

interface DashboardProps {
  store: any;
}

export function Dashboard({ store }: DashboardProps) {
  const activeScheme = store.activeScheme;
  const members = store.members.filter(m => m.schemeId === activeScheme.id);
  const pendingRequests = store.residentRequests.filter(r => r.status === 'pending_triage' && r.schemeId === activeScheme.id);
  const vacantCount = store.units.filter((u: any) => u.status === 'Vacant' && u.schemeId === activeScheme.id).length;

  // Setup Popup states
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

  // Prefill details based on selected name
  useEffect(() => {
    handleBuildingTypeChange('custom');
  }, [store.activePersona?.name]);

  // Trigger popup after 5 seconds of mounting if there are no schemes
  useEffect(() => {
    // Tie the popup strictly to the specific user's ID so it shows up for new accounts!
    const userId = store.activePersona?.id || 'unknown';
    const hasSeenPopup = localStorage.getItem(`smartlot_hasSeenSetupPopup_${userId}`);
    
    if (store.schemes.length === 0 && !hasSeenPopup) {
      // Trigger almost immediately on account creation instead of making them wait 5 seconds
      const timer = setTimeout(() => {
        setShowSetupPopup(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [store.schemes.length, store.activePersona?.id]);

  const handleCreateSchemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const createdScheme = await store.addScheme(newSchemeId, newSchemeName, newLotsCount);
    store.setActiveScheme(createdScheme);

    const userId = store.activePersona?.id || 'unknown';
    localStorage.setItem(`smartlot_hasSeenSetupPopup_${userId}`, 'true');

    // Anyone who creates a site always becomes Strata Admin for that site
    // They can assign themselves Strata Manager and other roles from Team Access later
    const memberships = [
      {
        schemeId: newSchemeId,
        roles: ['Strata Admin' as any]
      }
    ];

    store.setActivePersona((prev: any) => ({
      ...prev,
      role: 'Strata Admin',
      memberships: memberships,
      context: `Unit 1 (${newSchemeName})`
    }));

    setShowSetupPopup(false);
  };

  const handleDismissPopup = () => {
    setShowSetupPopup(false);
    const userId = store.activePersona?.id || 'unknown';
    localStorage.setItem(`smartlot_hasSeenSetupPopup_${userId}`, 'true');
  };

  return (
    <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full overflow-y-auto bg-[#F4F6F9] dark:bg-[#0a0a0f] relative">
      
      {/* Column 1: Metrics & Worklist */}
      <div className="lg:col-span-3 space-y-6">
        {/* 2x2 Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <MetricTile icon={<Users size={16} />} label="Residents" value={members.length.toString()} />
          <MetricTile icon={<AlertTriangle size={16} />} label="Issues" value={pendingRequests.length.toString()} highlight={pendingRequests.length > 0} />
          <MetricTile icon={<Vote size={16} />} label="Votes" value="0" />
          <MetricTile icon={<ClipboardList size={16} />} label="Lots" value={activeScheme.lots.toString()} />
        </div>

        {/* Worklist */}
        <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Active Directory</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">All</span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {members.length > 0 ? (
              members.map(member => (
                <div key={member.id}>
                  <WorklistItem 
                    unit={member.unitId || `Lot ${member.lotNumber}`} 
                    owner={member.name} 
                  />
                </div>
              ))
            ) : (
              <div className="text-[10px] text-gray-400 text-center py-6">
                No registered occupants yet.
              </div>
            )}
          </div>

          {/* Quick Invite CTA inside Directory */}
          <button
            onClick={() => store.setActiveView('user_management')}
            className="w-full mt-4 bg-[#0B1121] dark:bg-white dark:text-[#0B1121] hover:bg-black dark:hover:bg-gray-100 text-[#00D4B2] dark:text-[#0B1121] rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[#00D4B2]/10"
          >
            <Plus size={14} /> Invite Occupant / Tenant
          </button>
        </div>
      </div>

      {/* Column 2: Main Content Area */}
      <div className="lg:col-span-6 space-y-6">
        <UnitDetailCard store={store} />

        {/* Feed / Timeline */}
        <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Activity Log</h3>
            <button className="text-sm font-semibold text-[#0055FF] hover:text-[#0033CC]">View All</button>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
              <span className="text-xs font-semibold">No recent activity</span>
            </div>
          </div>
        </div>
      </div>

      {/* Column 3: Right Action Column */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Financial Health demo card removed */}

        {/* Electric Lime Card - Quick Action */}
        {vacantCount > 0 && (
          <div className="bg-[#00D4B2] rounded-3xl p-6 shadow-md border border-[#00A38C]">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-[#0B1121] text-[#00D4B2] flex items-center justify-center">
                <Zap size={20} />
              </div>
              <span className="bg-[#0B1121]/10 text-[#0B1121] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                Action Required
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#0B1121] mb-2 leading-tight">Missing Resident Registrations</h3>
            <p className="text-sm text-[#0B1121]/70 mb-6 font-medium">
              {vacantCount} {vacantCount === 1 ? 'unit has' : 'units have'} not completed profile setup.
            </p>
            
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between border border-[#0B1121]/10 mb-2">
              <span className="text-xs font-semibold text-[#0B1121] truncate">
                {activeScheme.id === 'NO_SCHEME' ? 'smartlot.io/register' : `smartlot.io/join/${activeScheme.id}`}
              </span>
              <button className="text-[#0B1121] hover:bg-white/50 p-1.5 rounded-lg transition-colors">
                <Share2 size={16} />
              </button>
            </div>

            {/* Quick Invite SMS / Email Toggles */}
            {store.hasPermission('Role & Permission Setup') && (
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                <button 
                  onClick={() => alert('Invite sent via Email!')} 
                  className="bg-white/20 hover:bg-white/35 text-[#0B1121] text-[10px] font-black py-2 rounded-xl border border-[#0B1121]/15 flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Mail size={11} /> Email Invite
                </button>
                <button 
                  onClick={() => alert('Invite sent via SMS!')} 
                  className="bg-white/20 hover:bg-white/35 text-[#0B1121] text-[10px] font-black py-2 rounded-xl border border-[#0B1121]/15 flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Phone size={11} /> SMS Invite
                </button>
              </div>
            )}

            <button className="w-full bg-[#0B1121] hover:bg-black text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all">
              Send Reminders <ArrowRight size={16} />
            </button>
          </div>
        )}
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
                className="bg-[#0B1121] text-white w-full max-w-md rounded-[32px] p-8 border border-white/10 shadow-2xl relative z-10 space-y-6 overflow-hidden animate-in"
              >
                {/* Close Button */}
                <button 
                  type="button"
                  onClick={() => setShowSetupPopup(false)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors cursor-pointer bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/5 z-50"
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
                  <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                    {info.desc}
                  </p>
                </div>

                {/* Strata Option Selector */}
                <div className="relative z-10">
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Australian Strata Classification</label>
                  <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 text-center relative z-0">
                    {(['duplex', 'townhouse', 'apartment', 'custom'] as const).map(type => {
                      const isActive = buildingType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleBuildingTypeChange(type)}
                          className={`relative py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer outline-none z-10 ${
                            isActive ? 'text-[#0B1121]' : 'text-gray-400 hover:text-white'
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
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Strata Scheme ID</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. SP101"
                      value={newSchemeId}
                      onChange={e => setNewSchemeId(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white text-sm outline-none font-bold placeholder:text-gray-600 hover:border-white/20 hover:bg-white/[0.08] focus:border-[#00D4B2] focus:bg-white/10 focus:ring-2 focus:ring-[#00D4B2]/25 focus:shadow-[0_0_15px_rgba(0,212,178,0.15)] transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Building/Site Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Sunset Duplex"
                      value={newSchemeName}
                      onChange={e => setNewSchemeName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white text-sm outline-none font-bold placeholder:text-gray-600 hover:border-white/20 hover:bg-white/[0.08] focus:border-[#00D4B2] focus:bg-white/10 focus:ring-2 focus:ring-[#00D4B2]/25 focus:shadow-[0_0_15px_rgba(0,212,178,0.15)] transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Unit Lots Size</label>
                    <input 
                      type="number"
                      disabled={buildingType !== 'custom'}
                      value={newLotsCount}
                      onChange={e => setNewLotsCount(parseInt(e.target.value) || 2)}
                      className={`w-full px-4 py-3.5 rounded-2xl border text-sm outline-none font-bold transition-all duration-200 ${
                        buildingType !== 'custom'
                          ? 'border-white/5 bg-white/5 text-gray-500 cursor-not-allowed'
                          : 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/[0.08] focus:border-[#00D4B2] focus:bg-white/10 focus:ring-2 focus:ring-[#00D4B2]/25 focus:shadow-[0_0_15px_rgba(0,212,178,0.15)]'
                      }`}
                    />
                    <span className="text-[10px] text-gray-500 mt-2 block">
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

function MetricTile({ icon, label, value, highlight }: { icon: React.ReactNode, label: string, value: string, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border transition-colors ${
      highlight ? 'bg-[#FF4757]/10 border-[#FF4757]/20' : 'bg-white dark:bg-[#0d1117] border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-gray-700'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${
        highlight ? 'bg-[#FF6B6B] text-white shadow-[0_0_15px_rgba(255,107,107,0.3)]' : 'bg-[#F2F4F8] dark:bg-white/5 text-gray-600 dark:text-gray-400'
      }`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{value}</div>
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function WorklistItem({ unit, owner, active, alert }: { unit: string, owner: string, active?: boolean, alert?: boolean }) {
  return (
    <button className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
      active 
        ? 'bg-[#00D4B2] text-[#0B1121] ring-1 ring-[#00A38C]' 
        : 'hover:bg-gray-50 dark:hover:bg-white/5 bg-white dark:bg-[#0d1117] border border-transparent dark:border-white/5'
    }`}>
      <div className="text-left">
        <div className={`text-sm font-bold ${active ? 'text-[#0B1121]' : 'text-gray-900 dark:text-white'}`}>{unit}</div>
        <div className={`text-xs mt-0.5 ${active ? 'text-[#0B1121]/70' : 'text-gray-500 dark:text-gray-400'}`}>{owner}</div>
      </div>
      {alert && (
        <div className="w-2 h-2 rounded-full bg-[#FF6B6B] shadow-[0_0_8px_rgba(255,107,107,0.6)]"></div>
      )}
    </button>
  );
}

function FeedItem({ type, title, desc, time, hasAssignPermission }: { type: 'verified' | 'alert' | 'system', title: string, desc: string, time: string, hasAssignPermission?: boolean }) {
  const getIcon = () => {
    switch (type) {
      case 'verified': return <ShieldCheck size={14} className="text-[#059669]" />;
      case 'alert': return <AlertTriangle size={14} className="text-[#EF4444]" />;
      case 'system': return <Settings size={14} className="text-[#0033CC]" />;
    }
  };

  const getBg = () => {
    switch (type) {
      case 'verified': return 'bg-[#6EE7B7]/20 border-[#6EE7B7]/30';
      case 'alert': return 'bg-[#FF6B6B]/20 border-[#FF6B6B]/30';
      case 'system': return 'bg-[#0055FF]/20 border-[#0055FF]/30';
    }
  };

  return (
    <div className="relative flex items-start group">
      <div className="absolute left-[14px] mt-2 w-2.5 h-2.5 rounded-full bg-white dark:bg-[#1a1d27] border-2 border-gray-300 dark:border-gray-600 group-hover:border-[#00D4B2] transition-colors z-10 shadow-sm" />
      
      <div className="ml-8 w-full">
        <div className="bg-white dark:bg-[#0d1117] border border-gray-100 dark:border-white/5 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1.5 justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${getBg()}`}>
                {getIcon()}
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h4>
            </div>
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{time}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-8">{desc}</p>
          
          {type === 'alert' && hasAssignPermission && (
            <div className="pl-8 pt-2">
              <button 
                onClick={() => alert('Plumbing Specialist dispatched. Work Order #WO-105 created.')}
                className="w-full bg-[#0B1121] dark:bg-[#00D4B2]/10 dark:border dark:border-[#00D4B2]/20 hover:bg-black dark:hover:bg-[#00D4B2]/20 text-white dark:text-[#00D4B2] text-[10px] font-extrabold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[#00D4B2]/10"
              >
                <Zap size={11} /> Assign Service Provider
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

