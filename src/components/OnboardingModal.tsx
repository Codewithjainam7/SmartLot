import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { useSmartLotStore } from '../store/smartLotStore';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const store = useSmartLotStore();

  // Dynamic Site Creation fields
  const [schemeName, setSchemeName] = useState('Sunset Duplex');
  const [schemeId, setSchemeId] = useState('SP101');
  const [lotsCount, setLotsCount] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = store.schemes.find(s => s.id === schemeId);
    let scheme = existing;
    if (!existing) {
      scheme = store.addScheme(schemeId, `${schemeId} - ${schemeName}`, lotsCount);
    }
    store.setActiveScheme(scheme);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Fade Animation */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#121316]/60 backdrop-blur-md" 
            onClick={onClose} 
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
            className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 space-y-5"
          >
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Strata Site</h2>
                <p className="text-xs text-gray-500 mt-0.5">Provision a new duplex, townhouse, or scheme.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scheme Details Customization Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Scheme / Site Name</label>
                  <input
                    type="text"
                    required
                    value={schemeName}
                    onChange={e => setSchemeName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold outline-none text-gray-900 focus:bg-white focus:border-black transition-all"
                    placeholder="e.g. Sunset Duplex"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Plan ID</label>
                    <input
                      type="text"
                      required
                      value={schemeId}
                      onChange={e => setSchemeId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold outline-none text-gray-900 focus:bg-white focus:border-black transition-all"
                      placeholder="e.g. SP101"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Lots Count</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={lotsCount}
                      onChange={e => setLotsCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold outline-none text-gray-900 focus:bg-white focus:border-black transition-all"
                      placeholder="e.g. 2"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#121316] hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-102 transition-all cursor-pointer"
                >
                  <Sparkles size={14} className="text-[#D8F235]" /> Create Scheme
                </button>
              </div>
            </form>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
