import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

export function TextMorph({ children, className = '' }: { children: string; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={children}
        initial={{ opacity: 0, y: 5, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -5, filter: 'blur(4px)' }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={`inline-block ${className}`}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}
