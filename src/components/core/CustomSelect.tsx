import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
};

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  direction?: 'down' | 'up';
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  className = '',
  direction = 'down',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];
  const isUp = direction === 'up';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold text-gray-600 mb-1.5 ml-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-between text-sm font-bold text-gray-900 shadow-sm cursor-pointer active:scale-[0.99]"
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 ${isOpen ? 'rotate-180 text-gray-800' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isUp ? 12 : -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isUp ? 8 : -8, scale: 0.96 }}
            transition={{ 
              type: 'spring', 
              stiffness: 420, 
              damping: 28,
              mass: 0.7
            }}
            className={`absolute ${isUp ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'} left-0 right-0 z-50 bg-[#121316] text-white rounded-2xl p-2 shadow-2xl border border-white/10 max-h-64 overflow-y-auto dark-scrollbar`}
          >
            {options.map(option => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-between cursor-pointer ${
                    isSelected 
                      ? 'bg-[#D8F235] text-[#121316] font-extrabold shadow-sm' 
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {option.icon}
                    <div>
                      <div>{option.label}</div>
                      {option.description && (
                        <div className={`text-[10px] ${isSelected ? 'text-[#121316]/70' : 'text-gray-400'}`}>{option.description}</div>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <Check size={14} className="shrink-0 text-[#121316]" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
