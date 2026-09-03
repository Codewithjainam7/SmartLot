// @smartlot/core
import { motion, SpringOptions, Transition } from 'motion/react';
import React, { useEffect, useState } from 'react';

export type CursorProps = {
  children?: React.ReactNode;
  attachToParent?: boolean;
  className?: string;
  variants?: any;
  springConfig?: SpringOptions;
  transition?: Transition;
  onPositionChange?: (x: number, y: number) => void;
};

export function Cursor({
  children,
  className = '',
  variants,
  transition,
  onPositionChange,
}: CursorProps) {
  const [position, setPosition] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      setPosition({ x, y });
      if (onPositionChange) {
        onPositionChange(x, y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [onPositionChange]);

  return (
    <motion.div
      className={`pointer-events-none fixed top-0 left-0 z-[99999] ${className}`}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
