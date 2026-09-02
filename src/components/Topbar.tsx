import React from "react";
import { Building2, ChevronDown, CheckCircle2, Plus } from "lucide-react";
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
}

export function Topbar({ 
  schemes, 
  activeScheme, 
  setActiveScheme, 
  activePersona, 
  onAddSchemeClick,
  onLogout
}: TopbarProps) {
  const isResidentOrTenant = activePersona.role === 'Resident' || activePersona.role === 'Tenant' || activePersona.role === 'On-Site Resident';
  const canCreateSites = !isResidentOrTenant;
  const hasMultipleSchemes = schemes.length > 1;

  return (
    <div className="h-20 bg-white/50 dark:bg-[#0B1121]/50 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between px-8 sticky top-0 z-20 font-sans">
      
      {/* Scheme Switcher & Site Creation */}
      <div className="flex items-center gap-4">
        {activeScheme && activeScheme.id !== 'NO_SCHEME' ? (
          <div className="relative group">
            <button className={`flex items-center gap-2 bg-white dark:bg-[#121316] border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm px-4 py-2 rounded-xl transition-all ${
              canCreateSites || hasMultipleSchemes ? 'cursor-pointer' : 'cursor-default'
            }`}>
              <Building2 size={18} className="text-[#0055FF] dark:text-[#00D4B2]" />
              <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">Scheme: {activeScheme.id}</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">- {(activeScheme?.name || "").split("-")[1]?.trim() || activeScheme?.name || "Unnamed Scheme"}</span>
              {(canCreateSites || hasMultipleSchemes) && <ChevronDown size={16} className="text-gray-400 ml-1 transition-transform group-hover:rotate-180" />}
            </button>
            
            {/* Dropdown Menu - Lists user's schemes + Add New Strata Site option */}
            {(canCreateSites || hasMultipleSchemes) && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#121316] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top z-30">
                <div className="p-2 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Your Strata Schemes ({schemes.length})
                  </div>
                  {schemes.map(scheme => (
                    <button
                      key={scheme.id}
                      onClick={() => setActiveScheme(scheme)}
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
                        onClick={onAddSchemeClick}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#0055FF] dark:text-[#00D4B2] hover:bg-[#0055FF]/5 dark:hover:bg-[#00D4B2]/5 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus size={14} />
                        + Add New Strata Site
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
      <div className="relative group flex items-center">
        <div className="text-right mr-3 hidden sm:block">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{activePersona.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{activePersona.role} • {activePersona.context}</div>
        </div>
        <button className="flex items-center gap-2 bg-white dark:bg-[#121316] border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm p-2 rounded-full transition-all cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#0F172A] dark:bg-gray-800 flex items-center justify-center text-white font-bold text-xs">
            {activePersona.name.split(" ").map(n => n[0]).join("")}
          </div>
          <ChevronDown size={16} className="text-gray-400 mr-1" />
        </button>

        {/* Dropdown Menu */}
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-[#121316] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right p-2 text-left">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Logged In As</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{activePersona.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{activePersona.email}</div>
          </div>
          <div className="pt-2">
            <button
              onClick={onLogout}
              className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold cursor-pointer transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
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