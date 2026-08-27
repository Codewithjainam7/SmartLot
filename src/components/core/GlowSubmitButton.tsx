import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TextMorph } from './text-morph';
import { Send, Loader2 } from 'lucide-react';

interface GlowSubmitButtonProps {
  label: string;
  loadingLabel?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: 'submit' | 'button';
  disabled?: boolean;
  className?: string;
}

export function GlowSubmitButton({
  label,
  loadingLabel = 'Sending Invites...',
  icon = <Send size={14} className="text-[#00D4B2]" />,
  onClick,
  type = 'submit',
  disabled = false,
  className = '',
}: GlowSubmitButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || isLoading) return;
    setIsLoading(true);

    if (onClick) {
      onClick();
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      
      {/* Smooth Glowing Aura Layer */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[#00D4B2] via-[#0055FF] to-[#10B981] blur-[6px] opacity-70"
        />
      )}

      {/* Button Body */}
      <button
        type={type}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={`relative z-10 bg-[#0B1121] hover:bg-black text-white px-7 h-12 rounded-2xl text-xs font-bold flex items-center justify-center gap-2.5 shadow-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] cursor-pointer border border-white/10 shrink-0 min-w-[180px] disabled:opacity-80 ${className}`}
      >
        {isLoading ? (
          <Loader2 size={15} className="animate-spin text-[#00D4B2] shrink-0" />
        ) : (
          icon
        )}
        
        <TextMorph className="font-bold whitespace-nowrap">
          {isLoading ? loadingLabel : label}
        </TextMorph>
      </button>

    </div>
  );
}
