// @smartlot/component
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Building, ArrowRight } from 'lucide-react';
import { SmartLotStore } from '../store/smartLotStore';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: SmartLotStore;
}

export function OnboardingModal({ isOpen, onClose, store }: OnboardingModalProps) {

  // Dynamic Site Creation fields
  const [siteType, setSiteType] = useState<string>('duplex');
  const [schemeName, setSchemeName] = useState('Sunset Duplex');
  const [schemeId, setSchemeId] = useState(() => `SP${Math.floor(100 + Math.random() * 900)}`);
  const [lotsCount, setLotsCount] = useState(2);

  const handleTypeChange = (type: string) => {
    setSiteType(type);
    const rand = Math.floor(100 + Math.random() * 900);
    if (type === 'duplex') {
      setSchemeName('Sunset Duplex');
      setSchemeId(`SP${rand}`);
      setLotsCount(2);
    } else if (type === 'coronation') {
      setSchemeName('Coronation Townhouses');
      setSchemeId(`SP${rand}`);
      setLotsCount(4);
    } else if (type === 'cavaller') {
      setSchemeName('Cavaller Apartments');
      setSchemeId(`SP${rand}`);
      setLotsCount(32);
    } else {
      setSchemeName('');
      setSchemeId(`SP${rand}`);
      setLotsCount(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSchemeId = schemeId || `SP${Math.floor(100 + Math.random() * 900)}`;
    const existing = store.schemes.find((s: any) => s.id === finalSchemeId);
    let scheme = existing;
    if (!existing) {
      scheme = await store.addScheme(finalSchemeId, schemeName, lotsCount);
    }
    
    // Assign Strata Admin role to the creator of the scheme
    const assignRole = store.activePersona.name === 'Emma Wilson' ? 'Strata Manager' : 'Strata Admin';
    
    // Add scheme membership to activePersona
    const currentMemberships = store.activePersona.memberships || [];
    const hasMembership = currentMemberships.some((m: any) => m.schemeId === finalSchemeId);
    
    if (!hasMembership) {
      const updatedMemberships = [
        ...currentMemberships,
        {
          schemeId: finalSchemeId,
          roles: [assignRole]
        }
      ];
      
      store.setActivePersona((prev: any) => ({
        ...prev,
        role: assignRole,
        memberships: updatedMemberships,
        context: store.activePersona.name === 'Emma Wilson' ? 'Cavaller HQ' : `Unit 1 (${schemeName})`
      }));
      
      // Add member to the roster
      store.setMembers((prev: any) => [
        {
          id: `MEM-${100 + prev.length + 1}`,
          name: store.activePersona.name,
          email: store.activePersona.email || `${store.activePersona.name.toLowerCase().replace(/\s+/g, '.')}@strata.com.au`,
          phone: '0400 000 000',
          schemeId: finalSchemeId,
          role: assignRole,
          unitId: store.activePersona.name === 'Emma Wilson' ? 'Office' : 'Unit 1',
          lotNumber: store.activePersona.name === 'Emma Wilson' ? 0 : 1,
          status: 'Active',
          joinedAt: new Date().toISOString().split('T')[0],
        },
        ...prev
      ]);
    }

    if (scheme) {
      store.setActiveScheme(scheme);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop Fade Animation */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#0B1121]/75 backdrop-blur-md" 
            onClick={onClose} 
          />

          {/* Modal Container (Bottom Sheet on Mobile) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative bg-[#0B1121] text-white w-full sm:max-w-md rounded-t-3xl sm:rounded-[32px] p-5 sm:p-8 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-8 border border-white/10 shadow-2xl z-10 space-y-4 sm:space-y-6 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button 
              type="button"
              onClick={onClose}
              aria-label="Close onboarding modal"
              className="absolute top-4 sm:top-6 right-4 sm:right-6 text-gray-400 hover:text-white transition-colors cursor-pointer bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/5 z-50 min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <X size={16} />
            </button>

            {/* Decorative Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4B2]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Title / Header */}
            <div className="text-center space-y-2 relative z-10 pt-2 sm:pt-4">
              <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-[#00D4B2]/10 text-[#00D4B2] flex items-center justify-center mx-auto border border-[#00D4B2]/20 animate-pulse">
                <Building size={24} />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-[#00D4B2] tracking-widest uppercase bg-[#00D4B2]/10 px-2.5 py-0.5 rounded-full border border-[#00D4B2]/25 inline-block">
                  Strata Provisioning
                </span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">Create New Strata Site</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                Provision a new duplex, townhouse, or custom scheme under compliance.
              </p>
            </div>

            {/* Strata Classification Tab Selectors */}
            <div className="relative z-10">
              <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Strata Classification</label>
              <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 text-center relative z-0">
                {(['duplex', 'coronation', 'cavaller', 'custom'] as const).map(type => {
                  const isActive = siteType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeChange(type)}
                      className={`relative py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer outline-none z-10 min-h-[36px] active:scale-95 ${
                        isActive ? 'text-[#0B1121]' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="activeTabOnboarding"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          className="absolute inset-0 bg-[#00D4B2] rounded-xl -z-10 shadow-md"
                        />
                      )}
                      {type === 'coronation' ? 'Townhouse' : type === 'cavaller' ? 'Apartment' : type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scheme Details Customization Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 relative z-10">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Scheme / Site Name</label>
                  <input
                    type="text"
                    required
                    aria-label="Scheme or site name"
                    value={schemeName}
                    onChange={e => setSchemeName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white text-sm outline-none font-bold placeholder:text-gray-600 hover:border-white/20 hover:bg-white/[0.08] focus:border-[#00D4B2] focus:bg-white/10 focus:ring-2 focus:ring-[#00D4B2]/25 focus:shadow-[0_0_15px_rgba(0,212,178,0.15)] transition-all duration-200 min-h-[44px]"
                    placeholder="e.g. Sunset Duplex"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Plan ID</label>
                    <input
                      type="text"
                      required
                      aria-label="Strata Plan ID"
                      value={schemeId}
                      onChange={e => setSchemeId(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white text-sm outline-none font-bold placeholder:text-gray-600 hover:border-white/20 hover:bg-white/[0.08] focus:border-[#00D4B2] focus:bg-white/10 focus:ring-2 focus:ring-[#00D4B2]/25 focus:shadow-[0_0_15px_rgba(0,212,178,0.15)] transition-all duration-200 min-h-[44px]"
                      placeholder="e.g. SP101"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">Lots Count</label>
                    <input
                      type="number"
                      required
                      min={1}
                      aria-label="Total lots count"
                      disabled={siteType !== 'custom'}
                      value={lotsCount}
                      onChange={e => setLotsCount(Number(e.target.value))}
                      className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none font-bold transition-all duration-200 min-h-[44px] ${
                        siteType !== 'custom'
                          ? 'border-white/5 bg-white/5 text-gray-500 cursor-not-allowed'
                          : 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/[0.08] focus:border-[#00D4B2] focus:bg-white/10 focus:ring-2 focus:ring-[#00D4B2]/25 focus:shadow-[0_0_15px_rgba(0,212,178,0.15)]'
                      }`}
                      placeholder="e.g. 2"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 block">
                  {siteType !== 'custom'
                    ? `Lots size is preset to ${lotsCount} for this strata template.`
                    : 'Enter the total number of lots in this strata scheme.'}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-2xl border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer min-h-[44px] active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00D4B2] hover:bg-[#00A38C] text-[#0B1121] px-8 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-[#00D4B2]/15 active:scale-95 transition-all cursor-pointer min-h-[44px]"
                >
                  Create Scheme
                </button>
              </div>
            </form>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Animation: Welcome Step Slide Transition