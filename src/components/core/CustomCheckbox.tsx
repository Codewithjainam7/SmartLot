import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function CustomCheckbox({
  checked,
  onChange,
  label,
  className = '',
}: CustomCheckboxProps) {
  return (
    <label className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${className}`}>
      <div 
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          checked 
            ? 'bg-[#121316] border-[#121316] shadow-sm' 
            : 'bg-gray-50 border-gray-300 hover:border-gray-400 hover:bg-white'
        }`}
      >
        {checked && (
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 15 }}
            transition={{ type: 'spring', stiffness: 500, damping: 24 }}
          >
            <Check size={12} className="text-[#D8F235] stroke-[3]" />
          </motion.div>
        )}
      </div>

      {label && (
        <span className="text-xs font-bold text-gray-700">
          {label}
        </span>
      )}
    </label>
  );
}
