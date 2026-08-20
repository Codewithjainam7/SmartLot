import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  X, 
  Key, 
  UserCheck, 
  Sparkles 
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [selectedPath, setSelectedPath] = useState<'A' | 'B' | 'C'>('A');

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

          {/* Modal Container Spring Scale & Slide Animation */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
            className="relative bg-white w-full max-w-4xl rounded-3xl p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121316]/5 text-[#121316] text-xs font-bold uppercase tracking-wider mb-1">
                  Universal Scheme Provisioning Engine
                </div>
                <h2 className="text-2xl font-bold text-gray-900">3-Pathway Building Onboarding</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Path Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Path A */}
              <button
                type="button"
                onClick={() => setSelectedPath('A')}
                className={`p-6 rounded-2xl border text-left space-y-3 transition-all cursor-pointer ${
                  selectedPath === 'A' 
                    ? 'border-[#121316] bg-[#121316] text-white shadow-xl scale-[1.02]' 
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-900'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  selectedPath === 'A' ? 'bg-[#D8F235] text-[#121316]' : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  Path A
                </div>
                <div>
                  <h3 className="font-bold text-base">Self-Service Committee Freemium</h3>
                  <p className={`text-xs mt-1 ${selectedPath === 'A' ? 'text-gray-300' : 'text-gray-500'}`}>
                    1 Committee Member signs up, provisions scheme SP10482, and generates instant occupant invite links.
                  </p>
                </div>
              </button>

              {/* Path B */}
              <button
                type="button"
                onClick={() => setSelectedPath('B')}
                className={`p-6 rounded-2xl border text-left space-y-3 transition-all cursor-pointer ${
                  selectedPath === 'B' 
                    ? 'border-[#121316] bg-[#121316] text-white shadow-xl scale-[1.02]' 
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-900'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  selectedPath === 'B' ? 'bg-[#8B8CF8] text-white' : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  Path B
                </div>
                <div>
                  <h3 className="font-bold text-base">Strata Agency Bulk Portfolio</h3>
                  <p className={`text-xs mt-1 ${selectedPath === 'B' ? 'text-gray-300' : 'text-gray-500'}`}>
                    Agency uploads multi-building CSV/Excel portfolio manifest with pre-mapped entitlements and lot allocations.
                  </p>
                </div>
              </button>

              {/* Path C */}
              <button
                type="button"
                onClick={() => setSelectedPath('C')}
                className={`p-6 rounded-2xl border text-left space-y-3 transition-all cursor-pointer ${
                  selectedPath === 'C' 
                    ? 'border-[#121316] bg-[#121316] text-white shadow-xl scale-[1.02]' 
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-900'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  selectedPath === 'C' ? 'bg-[#10B981] text-white' : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  Path C
                </div>
                <div>
                  <h3 className="font-bold text-base">Super Admin Concierge</h3>
                  <p className={`text-xs mt-1 ${selectedPath === 'C' ? 'text-gray-300' : 'text-gray-500'}`}>
                    SmartLot team provisions complex schemes, imports legacy MYBOS/BuildingLink databases, and verifies ABNs.
                  </p>
                </div>
              </button>

            </div>

            {/* Selected Pathway Live Simulation Details */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Universal Join Link Format</span>
                <span className="text-xs font-mono font-bold text-[#8B8CF8] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  smartlot.io/join/SP10482
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-100">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Key size={16} className="text-[#8B8CF8]" /> Automatic Scheme Isolation
                  </div>
                  <p className="text-gray-500 leading-relaxed">
                    Every member joining via SP10482 link automatically inherits universal scheme context restrictions.
                  </p>
                </div>

                <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-100">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <UserCheck size={16} className="text-[#10B981]" /> Zero-Friction Invites
                  </div>
                  <p className="text-gray-500 leading-relaxed">
                    Lot Owners receive digital voting access; Tenants receive noticeboard and maintenance reporting access.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-[#121316] hover:bg-black text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                <Sparkles size={16} className="text-[#D8F235]" /> Complete Pathway Simulation
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
