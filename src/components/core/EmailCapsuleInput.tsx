import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Mail, X, Plus, Check, User, Sparkles } from 'lucide-react';

export interface SchemeMemberInfo {
  email: string;
  name?: string;
  role?: string;
  unitId?: string;
}

export interface EmailCapsuleInputProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  schemeMembers?: SchemeMemberInfo[];
  schemeName?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const EmailCapsuleInput: React.FC<EmailCapsuleInputProps> = ({
  emails,
  onChange,
  schemeMembers = [],
  schemeName = 'Scheme',
  placeholder = 'Type email and press Enter or comma...',
  className = '',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lookup map for fast member info resolution
  const memberMap = useMemo(() => {
    const map = new Map<string, SchemeMemberInfo>();
    schemeMembers.forEach(m => {
      if (m.email) {
        map.set(m.email.trim().toLowerCase(), m);
      }
    });
    return map;
  }, [schemeMembers]);

  // Set of current lowercased emails for fast presence check
  const emailSet = useMemo(() => {
    return new Set(emails.map(e => e.trim().toLowerCase()));
  }, [emails]);

  // Scheme members not currently queued
  const unaddedMembers = useMemo(() => {
    return schemeMembers.filter(m => !emailSet.has(m.email.trim().toLowerCase()));
  }, [schemeMembers, emailSet]);

  // Autocomplete suggestions based on input value
  const suggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return [];
    return unaddedMembers.filter(m => {
      const matchName = m.name?.toLowerCase().includes(query);
      const matchEmail = m.email.toLowerCase().includes(query);
      const matchUnit = m.unitId?.toLowerCase().includes(query);
      const matchRole = m.role?.toLowerCase().includes(query);
      return matchName || matchEmail || matchUnit || matchRole;
    }).slice(0, 5);
  }, [inputValue, unaddedMembers]);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions.length]);

  // Helper to add an individual email or list of emails
  const addEmails = (rawCandidates: string[]) => {
    const toAdd: string[] = [];
    rawCandidates.forEach(raw => {
      // Strip angle brackets if pasted in format "Name <email@domain.com>"
      const match = raw.match(/<([^>]+)>/);
      const email = (match ? match[1] : raw).trim();
      if (!email) return;

      const lower = email.toLowerCase();
      if (
        !emailSet.has(lower) &&
        !toAdd.some(e => e.toLowerCase() === lower) &&
        email.includes('@')
      ) {
        toAdd.push(email);
      }
    });

    if (toAdd.length > 0) {
      onChange([...emails, ...toAdd]);
    }
  };

  // Helper to remove an email
  const removeEmail = (emailToRemove: string) => {
    const lower = emailToRemove.trim().toLowerCase();
    onChange(emails.filter(e => e.trim().toLowerCase() !== lower));
  };

  // Commit current text input
  const commitInput = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // Check if user entered multiple separated by comma or semicolon
    const parts = trimmed.split(/[,;\s]+/).map(p => p.trim()).filter(Boolean);
    addEmails(parts);
    setInputValue('');
  };

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (suggestions.length > 0) {
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % suggestions.length);
      }
    } else if (e.key === 'ArrowUp') {
      if (suggestions.length > 0) {
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        addEmails([suggestions[highlightedIndex].email]);
        setInputValue('');
      } else {
        commitInput();
      }
    } else if (e.key === ',' || e.key === ';') {
      e.preventDefault();
      commitInput();
    } else if (e.key === 'Tab' && inputValue.trim()) {
      e.preventDefault();
      if (suggestions.length > 0 && highlightedIndex >= 0) {
        addEmails([suggestions[highlightedIndex].email]);
        setInputValue('');
      } else {
        commitInput();
      }
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      removeEmail(emails[emails.length - 1]);
    } else if (e.key === 'Escape') {
      setInputValue('');
    }
  };

  // Handle paste with multi-email splitting
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const parts = pastedText.split(/[,;\r\n\s]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1 || parts[0]?.includes('@')) {
      e.preventDefault();
      addEmails(parts);
      setInputValue('');
    }
  };

  // Quick Action: Add all scheme members
  const handleAddAllScheme = () => {
    const allEmails = schemeMembers.map(m => m.email).filter(Boolean);
    addEmails(allEmails);
  };

  // Quick Action: Clear all
  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Outer Capsule Field Container */}
      <div
        ref={containerRef}
        onClick={() => inputRef.current?.focus()}
        className={`w-full min-h-[58px] bg-white dark:bg-[#121622] border rounded-2xl p-2.5 transition-all shadow-2xs cursor-text flex flex-wrap items-center gap-2 relative ${
          isFocused
            ? 'border-[#00897B] dark:border-[#00D4B2] ring-2 ring-[#00897B]/30 dark:ring-[#00D4B2]/30'
            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
        }`}
      >
        {/* Rendered Email Capsules */}
        {emails.map(email => {
          const member = memberMap.get(email.trim().toLowerCase());
          return (
            <div
              key={email}
              className="group inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-[#00897B]/10 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2] border border-[#00897B]/25 dark:border-[#00D4B2]/30 shadow-2xs hover:border-[#00897B]/45 dark:hover:border-[#00D4B2]/50 transition-all select-none"
            >
              {/* Avatar / Mail Icon */}
              <span className="w-4 h-4 rounded-full bg-[#00897B]/20 dark:bg-[#00D4B2]/25 text-[#00897B] dark:text-[#00D4B2] flex items-center justify-center shrink-0">
                <Mail size={10} strokeWidth={2.5} />
              </span>

              {/* Recipient Details */}
              {member ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-gray-900 dark:text-white leading-none">
                    {member.name}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 opacity-80 leading-none">
                    &lt;{email}&gt;
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#00897B]/15 dark:bg-[#00D4B2]/20 text-[#00897B] dark:text-[#00D4B2] uppercase tracking-wider border border-[#00897B]/20 dark:border-[#00D4B2]/20 leading-none">
                    {member.unitId ? `${member.unitId} • ` : ''}{member.role}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200 leading-none">
                    {email}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200/70 dark:bg-white/10 text-gray-600 dark:text-gray-400 uppercase tracking-wider leading-none">
                    External
                  </span>
                </div>
              )}

              {/* Remove Capsule Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEmail(email);
                }}
                className="w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors ml-0.5 cursor-pointer shrink-0"
                title={`Remove ${email}`}
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </div>
          );
        })}

        {/* Inline Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          disabled={disabled}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            // Small timeout to allow clicking a suggestion
            setTimeout(() => {
              commitInput();
            }, 200);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={emails.length === 0 ? placeholder : 'Add another recipient...'}
          className="bg-transparent border-none outline-none text-xs sm:text-sm font-mono text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 flex-1 min-w-[170px] py-1"
        />

        {/* Autocomplete Dropdown Popover */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white dark:bg-[#121622] border border-gray-200 dark:border-white/15 rounded-2xl shadow-xl overflow-hidden py-1.5">
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Matching Scheme Residents ({suggestions.length})
            </div>
            {suggestions.map((m, idx) => (
              <button
                key={m.email}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur
                  addEmails([m.email]);
                  setInputValue('');
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                  idx === highlightedIndex
                    ? 'bg-[#00897B]/10 dark:bg-[#00D4B2]/15 text-[#00897B] dark:text-[#00D4B2]'
                    : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[#00897B]/15 dark:bg-[#00D4B2]/20 text-[#00897B] dark:text-[#00D4B2] flex items-center justify-center text-[10px] font-black shrink-0">
                    {m.name ? m.name.charAt(0).toUpperCase() : <User size={12} />}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs truncate block">{m.name}</span>
                    <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate block">
                      {m.email}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                    {m.unitId ? `${m.unitId} • ` : ''}{m.role}
                  </span>
                  <Plus size={13} className="text-[#00897B] dark:text-[#00D4B2]" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Helper Bar & Quick-Add Scheme Members */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px]">
        {/* Quick Add Suggestions Row */}
        {unaddedMembers.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1 shrink-0">
              <Sparkles size={12} className="text-[#00897B] dark:text-[#00D4B2]" />
              <span>Quick add from {schemeName}:</span>
            </span>
            {unaddedMembers.slice(0, 4).map(m => (
              <button
                key={m.email}
                type="button"
                onClick={() => addEmails([m.email])}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium bg-gray-100 dark:bg-white/5 hover:bg-[#00897B]/10 dark:hover:bg-[#00D4B2]/15 text-gray-700 dark:text-gray-300 hover:text-[#00897B] dark:hover:text-[#00D4B2] border border-gray-200 dark:border-white/10 hover:border-[#00897B]/30 dark:hover:border-[#00D4B2]/30 transition-all cursor-pointer text-[11px]"
                title={`Add ${m.name} (${m.email})`}
              >
                <Plus size={10} strokeWidth={2.5} />
                <span className="font-bold">{m.name}</span>
                <span className="opacity-60 text-[10px]">({m.unitId || m.role})</span>
              </button>
            ))}
            {unaddedMembers.length > 4 && (
              <button
                type="button"
                onClick={handleAddAllScheme}
                className="text-[11px] font-bold text-[#00897B] dark:text-[#00D4B2] hover:underline cursor-pointer"
              >
                +{unaddedMembers.length - 4} more
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[#00897B] dark:text-[#00D4B2] font-semibold">
            <Check size={13} strokeWidth={3} />
            <span>All {schemeMembers.length} enrolled scheme residents are queued</span>
          </div>
        )}

        {/* Batch Actions */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          {unaddedMembers.length > 0 && (
            <button
              type="button"
              onClick={handleAddAllScheme}
              className="font-bold text-[#00897B] dark:text-[#00D4B2] hover:underline cursor-pointer"
            >
              Add All ({unaddedMembers.length})
            </button>
          )}
          {emails.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-gray-400 hover:text-rose-500 hover:underline cursor-pointer font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
