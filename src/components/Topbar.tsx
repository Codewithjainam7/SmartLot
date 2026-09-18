// @smartlot/component
import React, { useState, useRef, useEffect } from "react";
import { Building2, ChevronDown, CheckCircle2, Plus, Menu } from "lucide-react";
import { Persona, Scheme } from "../types";

interface TopbarProps {
  schemes: Scheme[];
  activeScheme: Scheme;
  setActiveScheme: (scheme: Scheme) => void;
  personas: Persona[];
  activePersona: Persona;
  setActivePersona: (persona: Persona) => void;
  onAddSchemeClick: () => void;
  activeRoles?: string[];
  setActiveRoles?: (roles: string[]) => void;
  onLogout?: () => void;
  onOpenMobileMenu?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export function Topbar({ 
  schemes, 
  activeScheme, 
  setActiveScheme, 
  personas,
  activePersona, 
  setActivePersona, 
  onAddSchemeClick,
  onLogout,
  onOpenMobileMenu,
  isSidebarCollapsed,
  onToggleSidebarCollapse
}: TopbarProps) {
  const isResidentOrTenant = activePersona.role === 'Resident' || activePersona.role === 'Tenant' || activePersona.role === 'On-Site Resident';
  const canCreateSites = !isResidentOrTenant;
  const hasMultipleSchemes = schemes.length > 1;

  const [schemeDropdownOpen, setSchemeDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const schemeRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (schemeRef.current && !schemeRef.current.contains(event.target as Node)) {
        setSchemeDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside as any);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside as any);
    };
  }, []);

  return (
    <div className="smartlot-topbar h-16 md:h-20 bg-white/70 dark:bg-[#0B1121]/70 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between px-3 sm:px-6 md:px-8 sticky top-0 z-30 font-sans">
      
      {/* Scheme Switcher & Site Creation */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer shrink-0 active:scale-95"
        >
          <Menu size={22} />
        </button>


        {activeScheme && activeScheme.id !== 'NO_SCHEME' ? (
          <div className="relative" ref={schemeRef}>
            <button 
              type="button"
              onClick={() => {
                if (canCreateSites || hasMultipleSchemes) {
                  setSchemeDropdownOpen(prev => !prev);
                  setProfileDropdownOpen(false);
                }
              }}
              aria-label="Strata Scheme Selector"
              aria-haspopup="true"
              aria-expanded={schemeDropdownOpen}
              className={`flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-[#121316] border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm px-2.5 sm:px-4 py-2 rounded-xl transition-all text-xs sm:text-sm min-h-[40px] select-none ${
              canCreateSites || hasMultipleSchemes ? 'cursor-pointer active:scale-95' : 'cursor-default'
            }`}>
              <Building2 size={16} className="text-[#0055FF] dark:text-[#00D4B2] shrink-0" />
              <span className="font-bold text-gray-800 dark:text-gray-200">{activeScheme.id}</span>
              <span className="text-gray-500 dark:text-gray-400 hidden sm:inline truncate max-w-[140px] md:max-w-xs">- {(activeScheme?.name || "").split("-")[1]?.trim() || activeScheme?.name || "Unnamed Scheme"}</span>
              {(canCreateSites || hasMultipleSchemes) && (
                <ChevronDown size={14} className={`text-gray-400 ml-0.5 sm:ml-1 transition-transform shrink-0 ${schemeDropdownOpen ? 'rotate-180' : ''}`} />
              )}
            </button>
            
            {/* Dropdown Menu - Lists user's schemes + Add New Strata Site option */}
            {(canCreateSites || hasMultipleSchemes) && schemeDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#121316] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 transition-all duration-150 origin-top z-50 animate-in fade-in zoom-in-95">
                <div className="p-2 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Your Strata Schemes ({schemes.length})
                  </div>
                  {schemes.map(scheme => (
                    <button
                      key={scheme.id}
                      onClick={() => {
                        setActiveScheme(scheme);
                        setSchemeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors ${
                        activeScheme.id === scheme.id ? "bg-[#F2F4F8] dark:bg-white/5 font-medium text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{scheme.id}</span>
                        {activeScheme.id === scheme.id && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">Active</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{scheme.lots} Lots - {(scheme?.name || "").split("-")[1]?.trim() || scheme?.name || "Unnamed Scheme"}</div>
                    </button>
                  ))}

                  {canCreateSites && (
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onAddSchemeClick();
                          setSchemeDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#0055FF] dark:text-[#00D4B2] hover:bg-[#0055FF]/5 dark:hover:bg-[#00D4B2]/5 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus size={14} />
                        <span>Add New Strata Site</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 px-4 py-2 rounded-xl text-xs font-semibold">
            No Strata Schemes Registered
          </div>
        )}

        {/* Dedicated Quick Action: Add New Site Button (Visible to Owners, Committee, Admins & Managers) */}
        {canCreateSites && (
          <button
            type="button"
            onClick={onAddSchemeClick}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-white/5 hover:bg-[#0055FF]/10 dark:hover:bg-[#00D4B2]/10 text-gray-700 dark:text-gray-300 hover:text-[#0055FF] dark:hover:text-[#00D4B2] border border-gray-200 dark:border-white/5 transition-all cursor-pointer"
            title="Create or onboard a new Strata Scheme"
          >
            <Plus size={14} />
            <span>New Site</span>
          </button>
        )}

        {/* Quick Metrics */}
        <div className="hidden md:flex items-center gap-3">
          <MetricPill label={`${schemes.length} Active ${schemes.length === 1 ? 'Scheme' : 'Schemes'}`} />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6EE7B7]/20 dark:bg-[#6EE7B7]/10 text-[#059669] dark:text-[#34D399] text-xs font-semibold">
            <CheckCircle2 size={14} />
            Verified Compliance
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="relative flex items-center" ref={profileRef}>
        <div className="text-right mr-3 hidden sm:block">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{activePersona.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">
            {activePersona.role} • {activePersona.context}
          </div>
        </div>
        <button 
          type="button"
          onClick={() => {
            setProfileDropdownOpen(prev => !prev);
            setSchemeDropdownOpen(false);
          }}
          aria-label="User Profile and Account Menu"
          aria-haspopup="true"
          aria-expanded={profileDropdownOpen}
          className="min-w-[44px] min-h-[44px] flex items-center gap-2 bg-white dark:bg-[#121316] border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm p-1.5 sm:p-2 rounded-full transition-all cursor-pointer active:scale-95 select-none"
        >
          <div className="w-8 h-8 rounded-full bg-[#0F172A] dark:bg-gray-800 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
            {activePersona.avatarUrl ? (
              <img src={activePersona.avatarUrl} alt={activePersona.name} className="w-full h-full object-cover" />
            ) : (
              activePersona.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
            )}
          </div>
          <ChevronDown size={16} className={`text-gray-400 mr-1 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {profileDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-[#121316] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 transition-all duration-150 origin-top-right p-2 text-left z-50 animate-in fade-in zoom-in-95">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Logged In As</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{activePersona.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{activePersona.email}</div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0055FF]/10 text-[#0055FF] dark:bg-[#00D4B2]/15 dark:text-[#00D4B2] border border-[#0055FF]/20 dark:border-[#00D4B2]/30">
                  {activePersona.role}
                </span>
                {activePersona.context && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {activePersona.context}
                  </span>
                )}
                {activePersona.memberships?.some(m => m.roles.includes('Committee Member')) && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Committee Member
                  </span>
                )}
              </div>
            </div>

            <div className="pt-1.5 border-t border-gray-100 dark:border-gray-800">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">Switch Persona</div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {personas.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActivePersona(p);
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      activePersona.name === p.name 
                        ? 'bg-[#0055FF]/10 text-[#0055FF] dark:bg-[#00D4B2]/10 dark:text-[#00D4B2] font-bold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] opacity-70 font-normal ml-1 shrink-0">{p.role}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-1">
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold cursor-pointer transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function MetricPill({ label }: { label: string }) {
  return (
    <div className="px-3 py-1.5 rounded-full bg-white dark:bg-[#121316] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium shadow-sm">
      {label}
    </div>
  );
}

// UI Optimization: Interactive scheme dropdown with active badge status
// Theme: Annotate dark mode tokens and surface contrasts

// Style: Polish accessible title attributes across buttons

// Refactor: Ensure scheme selector stays synchronized during inspection