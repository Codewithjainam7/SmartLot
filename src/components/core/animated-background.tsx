// @smartlot/core
import { AnimatePresence, motion } from 'motion/react';
import React, {
  children,
  cloneElement,
  useEffect,
  useState,
  useId,
} from 'react';

export function AnimatedBackground({
  children,
  defaultValue,
  onValueChange,
  className,
  transition,
  enableHover = false,
}: {
  children: React.ReactNode[];
  defaultValue?: string;
  onValueChange?: (newActiveId: string | null) => void;
  className?: string;
  transition?: any;
  enableHover?: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(defaultValue ?? null);
  const uniqueId = useId();

  const handleSetActiveId = (id: string | null) => {
    setActiveId(id);

    if (onValueChange) {
      onValueChange(id);
    }
  };

  useEffect(() => {
    if (defaultValue !== undefined) {
      setActiveId(defaultValue);
    }
  }, [defaultValue]);

  return (
    <>
      {React.Children.map(children, (child: any, index) => {
        if (!React.isValidElement(child)) return null;

        const id = child.props['data-id'] || String(index);

        const interactionProps = enableHover
          ? {
              onMouseEnter: () => handleSetActiveId(id),
              onMouseLeave: () => handleSetActiveId(null),
            }
          : {
              onClick: () => handleSetActiveId(id),
            };

        return cloneElement(
          child,

          {
            key: id,
            className: `${child.props.className || ''} relative`,
            ...interactionProps,
          },

          <>
            <AnimatePresence>
              {activeId === id && (
                <motion.div
                  layoutId={`background-${uniqueId}`}
                  className={`absolute inset-0 z-0 pointer-events-none rounded-xl bg-black/5 dark:bg-white/10 ${className || ''}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={
                    transition || {
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }
                  }
                />
              )}
            </AnimatePresence>
            <div className="relative z-10 w-full h-full">
              {child.props.children}
            </div>
          </>
        );
      })}
    </>
  );
}
