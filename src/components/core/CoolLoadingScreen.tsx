// @smartlot/core
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SmartLotLogoIcon } from './SmartLotLogo';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface CoolLoadingScreenProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

const DEFAULT_MESSAGES = [
  'Synchronizing Strata Registry...',
  'Connecting Realtime Building Feeds...',
  'Securing Communications & Records...',
  'Optimizing Resident Intelligence...',
];

export function CoolLoadingScreen({
  message,
  submessage,
  fullScreen = true,
}: CoolLoadingScreenProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (message) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [message]);

  const currentMessage = message || DEFAULT_MESSAGES[msgIndex];

  return (
    <div
      className={`relative flex flex-col items-center justify-center font-sans select-none overflow-hidden ${
        fullScreen
          ? 'fixed inset-0 z-[9999] bg-[#F4F6F9]/95 dark:bg-[#060D19]/95 backdrop-blur-2xl'
          : 'w-full h-full min-h-[380px] p-8'
      }`}
    >
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0055FF]/10 dark:bg-[#0055FF]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#00D4B2]/10 dark:bg-[#00D4B2]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Center Branding & Animated Aura */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Pulsing Aura Rings */}
        <div className="relative flex items-center justify-center">
          {/* Outermost pulsating ripple ring */}
          <motion.div
            animate={{
              scale: [1, 1.45, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-36 h-36 rounded-full border-2 border-[#00D4B2]/30 dark:border-[#00D4B2]/40"
          />

          {/* Rotating iridescent ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute w-28 h-28 rounded-full p-[2px] bg-gradient-to-tr from-[#0055FF] via-[#00D4B2] to-emerald-400 opacity-80"
          >
            <div className="w-full h-full rounded-full bg-[#F4F6F9] dark:bg-[#060D19]" />
          </motion.div>

          {/* Glowing central emblem badge */}
          <motion.div
            animate={{
              scale: [0.96, 1.04, 0.96],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative z-10 w-20 h-20 rounded-2xl bg-white dark:bg-[#0B1528] border border-blue-100 dark:border-white/10 shadow-xl dark:shadow-2xl dark:shadow-[#00D4B2]/10 flex items-center justify-center p-3"
          >
            <SmartLotLogoIcon className="w-12 h-12" />
          </motion.div>
        </div>

        {/* Brand Name with Tagline */}
        <div className="mt-8 flex flex-col items-center text-center">
          <div className="flex items-baseline gap-1 font-sans text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            <span>Smart</span>
            <span className="text-[#00D4B2]">Lot</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black tracking-widest text-[#0055FF] dark:text-[#00D4B2] uppercase">
            <Sparkles size={12} className="animate-spin duration-1000" />
            <span>AI STRATA MANAGEMENT OS</span>
          </div>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="mt-6 w-56 sm:w-64 h-1.5 bg-gray-200/80 dark:bg-white/10 rounded-full overflow-hidden relative shadow-inner">
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[#0055FF] to-[#00D4B2] rounded-full blur-[0.5px]"
          />
        </div>

        {/* Dynamic Status Text with Smooth Fade Transition */}
        <div className="mt-4 h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300"
            >
              <div className="w-2 h-2 rounded-full bg-[#00D4B2] animate-ping" />
              <span>{currentMessage}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {submessage && (
          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
            {submessage}
          </p>
        )}

        {/* Trust & Security Footnote */}
        <div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          <ShieldCheck size={12} className="text-[#00D4B2]" />
          <span>Encrypted Session • Multi-Tenant Compliant</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Top Global Buffering Bar
 * Sits fixed at the very top of the window and animates an iridescent laser beam
 * whenever asynchronous data loading or buffering happens!
 */
export function GlobalBufferingBar({ active = true }: { active?: boolean }) {
  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[9999] pointer-events-none overflow-hidden bg-transparent">
      <motion.div
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#0055FF] to-[#00D4B2] shadow-sm shadow-[#00D4B2]/50"
      />
    </div>
  );
}
