// @smartlot/core
import React, { createContext, useContext, useState, useId, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

interface MorphingPopoverContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  uniqueId: string;
}

const MorphingPopoverContext = createContext<MorphingPopoverContextType | null>(null);

export function useMorphingPopover() {
  const context = useContext(MorphingPopoverContext);
  if (!context) throw new Error('useMorphingPopover must be used within MorphingPopover');
  return context;
}

export function MorphingPopover({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const uniqueId = useId();

  return (
    <MorphingPopoverContext.Provider value={{ isOpen, setIsOpen, uniqueId }}>
      {children}
    </MorphingPopoverContext.Provider>
  );
}

export function MorphingPopoverTrigger({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
  asChild?: boolean;
}) {
  const { isOpen, setIsOpen } = useMorphingPopover();

  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      className={`cursor-pointer inline-block ${className}`}
    >
      {children}
    </div>
  );
}

export function MorphingPopoverContent({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const { isOpen, setIsOpen } = useMorphingPopover();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-modal-open', 'true');
    } else {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-modal-open');
    };
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5">
          {/* Subtle Backdrop Blur & Fade covering full viewport */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          {/* Centered Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className={`relative bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl z-10 flex flex-col min-h-0 overflow-hidden ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
