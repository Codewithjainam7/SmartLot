import React, { createContext, useContext, useState, useId } from 'react';
import { AnimatePresence, motion, Variants, Transition } from 'motion/react';
import { X } from 'lucide-react';

interface DialogContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  dialogId: string;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function Dialog({
  children,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  children: React.ReactNode;
  variants?: Variants;
  transition?: Transition;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const isOpen = isControlled ? externalOpen : internalOpen;

  const setIsOpen = (val: boolean) => {
    if (externalOnOpenChange) externalOnOpenChange(val);
    if (!isControlled) setInternalOpen(val);
  };
  const dialogId = useId();

  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen, dialogId }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const context = useContext(DialogContext);
  if (!context) return null;

  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        onClick?.();
        context.setIsOpen(true);
      }}
    >
      {children}
    </button>
  );
}

export function DialogContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = useContext(DialogContext);
  if (!context) return null;

  const customVariants: Variants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: 40,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 40,
    },
  };

  const customTransition: Transition = {
    type: 'spring',
    bounce: 0,
    duration: 0.25,
  };

  return (
    <AnimatePresence>
      {context.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0B1121]/50 backdrop-blur-sm"
            onClick={() => context.setIsOpen(false)}
          />
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={customVariants}
            transition={customTransition}
            className={`relative z-10 rounded-3xl shadow-2xl overflow-hidden bg-white ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DialogHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xl font-bold text-gray-900 ${className}`}>{children}</h2>;
}

export function DialogDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;
}

export function DialogClose({ className = '' }: { className?: string }) {
  const context = useContext(DialogContext);
  if (!context) return null;

  return (
    <button
      type="button"
      onClick={() => context.setIsOpen(false)}
      className={`absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ${className}`}
    >
      <X size={18} />
    </button>
  );
}
