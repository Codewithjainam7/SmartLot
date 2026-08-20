import React, { createContext, useContext, useState, useId } from 'react';
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
  const { isOpen, setIsOpen, uniqueId } = useMorphingPopover();

  return (
    <motion.div
      layoutId={`morphing-popover-container-${uniqueId}`}
      onClick={() => setIsOpen(!isOpen)}
      className={`cursor-pointer inline-block ${className}`}
      transition={{ 
        type: 'spring', 
        stiffness: 320, 
        damping: 28, 
        mass: 0.8 
      }}
    >
      {children}
    </motion.div>
  );
}

export function MorphingPopoverContent({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const { isOpen, setIsOpen, uniqueId } = useMorphingPopover();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Subtle Backdrop Blur & Fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 bg-[#121316]/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Fluid Container Transform Card */}
          <motion.div
            layoutId={`morphing-popover-container-${uniqueId}`}
            className={`relative bg-white rounded-3xl p-8 shadow-2xl z-10 overflow-hidden ${className}`}
            transition={{ 
              type: 'spring', 
              stiffness: 320, 
              damping: 28, 
              mass: 0.8 
            }}
          >
            {/* Inner Content Smooth Fade */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
