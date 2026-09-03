// @smartlot/core
import { motion, Transition } from 'motion/react';
import React from 'react';

export type BorderTrailProps = {
  className?: string;
  size?: number;
  transition?: Transition;
  style?: React.CSSProperties;
};

export function BorderTrail({
  className = '',
  size = 40,
  transition,
  style,
}: BorderTrailProps) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden">
      <motion.div
        className={`absolute bg-[#00D4B2] opacity-90 blur-[3px] ${className}`}
        style={{
          width: size,
          height: size,
          top: -size / 4,
          left: -size / 4,
          borderRadius: '50%',
          ...style,
        }}
        animate={{
          x: ['0%', '250%', '250%', '0%', '0%'],
          y: ['0%', '0%', '250%', '250%', '0%'],
        }}
        transition={
          transition ?? {
            duration: 3.5,
            ease: 'linear',
            repeat: Infinity,
          }
        }
      />
    </div>
  );
}
