// @smartlot/core
import { motion, useInView, Variants, Transition } from 'motion/react';
import React, { useRef } from 'react';

export type InViewProps = {
  children: React.ReactNode;
  variants?: Variants;
  transition?: Transition;
  viewOptions?: Parameters<typeof useInView>[1];
  as?: React.ElementType;
  className?: string;
};

export function InView({
  children,
  variants,
  transition,
  viewOptions,
  as = 'div',
  className = '',
}: InViewProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, viewOptions);

  const defaultVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.09,
      },
    },
  };

  const MotionComponent = (motion as any)[as] || motion.div;

  return (
    <MotionComponent
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants ?? defaultVariants}
      transition={transition}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}
