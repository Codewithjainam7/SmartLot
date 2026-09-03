// @smartlot/core
import { motion, Transition } from 'motion/react';
import React from 'react';

export type GlowEffectProps = {
  className?: string;
  style?: React.CSSProperties;
  colors?: string[];
  mode?: 'rotate' | 'colorShift' | 'flow' | 'static';
  blur?: 'soft' | 'medium' | 'strong' | number;
  transition?: Transition;
  duration?: number;
};

export function GlowEffect({
  className = '',
  style,
  colors = ['#00D4B2', '#0055FF', '#10B981', '#FF6B6B'],
  mode = 'colorShift',
  blur = 'medium',
  duration = 4,
}: GlowEffectProps) {
  const blurValue = typeof blur === 'number' ? `${blur}px` : blur === 'soft' ? '8px' : blur === 'strong' ? '24px' : '14px';

  return (
    <motion.div
      className={`absolute inset-0 rounded-2xl pointer-events-none ${className}`}
      style={{
        background: `linear-gradient(135deg, ${colors.join(', ')})`,
        filter: `blur(${blurValue})`,
        ...style,
      }}
      animate={{
        background: [
          `linear-gradient(0deg, ${colors.join(', ')})`,
          `linear-gradient(120deg, ${colors.join(', ')})`,
          `linear-gradient(240deg, ${colors.join(', ')})`,
          `linear-gradient(360deg, ${colors.join(', ')})`,
        ],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}
