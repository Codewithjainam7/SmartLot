import React from 'react';
import { Building2, UserCircle, ChevronDown, CheckCircle2, Plus } from 'lucide-react';
import { Persona, Scheme } from '../types';

interface TopbarProps {
  schemes: Scheme[];
  activeScheme: Scheme;
  setActiveScheme: (scheme: Scheme) => void;
  personas: Persona[];
  activePersona: Persona;
  setActivePersona: (persona: Persona) => void;
  onAddSchemeClick: () => void;
}

export function Topbar({ 
  schemes, 
  activeScheme, 
  setActiveScheme, 
  personas, 
  activePersona, 
  setActivePersona,
  onAddSchemeClick
}: TopbarProps) {
  return (
    <div className="h-20 bg-white/50 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between px-8 sticky top-0 z-20">
      
      {/* Scheme Switcher */}
      <div className="flex items-center gap-6">
        <div className="relative group">
          <button className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 shadow-sm px-4 py-2 rounded-xl transition-all">
            <Building2 size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-800 text-sm">Scheme: {activeScheme.id}</span>
            <span className="text-gray-500 text-sm">- {activeScheme.name.split('-')[1]?.trim() || activeScheme.name}</span>
            <ChevronDown size={16} className="text-gray-400 ml-2" />
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top">
            <div className="p-2 space-y-1">
              {schemes.map(scheme => (
                <button
                  key={scheme.id}
                  onClick={() => setActiveScheme(scheme)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm ${
                    activeScheme.id === scheme.id ? 'bg-[#F2F4F8] font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">{scheme.id}</div>
                  <div className="text-xs text-gray-500">{scheme.lots} Lots - {scheme.name.split('-')[1]?.trim() || scheme.name}</div>
                </button>
              ))}

              <div className="border-t border-gray-100 pt-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={onAddSchemeClick}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#8B8CF8] hover:bg-[#8B8CF8]/5 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  Add New Strata Site
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="hidden md:flex items-center gap-3">
          <MetricPill label={`${activeScheme.lots} Total Lots`} />
          <MetricPill label={`${schemes.length} Active Schemes`} />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6EE7B7]/20 text-[#059669] text-xs font-semibold">
            <CheckCircle2 size={14} />
            Verified Compliance
          </div>
        </div>
      </div>

      {/* Persona Switcher Simulator */}
      <div className="relative group flex items-center">
        <div className="text-right mr-3 hidden sm:block">
          <div className="text-sm font-semibold text-gray-900">{activePersona.name}</div>
          <div className="text-xs text-gray-500">{activePersona.role} • {activePersona.context}</div>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 shadow-sm p-2 rounded-full transition-all">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B8CF8] to-[#6366F1] flex items-center justify-center text-white">
            <UserCircle size={20} />
          </div>
          <ChevronDown size={16} className="text-gray-400 mr-1" />
        </button>

        {/* Dropdown Menu */}
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Simulate Persona</div>
          </div>
          <div className="p-2 space-y-1">
            {personas.map(persona => (
              <button
                key={persona.id}
                onClick={() => setActivePersona(persona)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex flex-col ${
                  activePersona.id === persona.id ? 'bg-[#F2F4F8] text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="font-semibold">{persona.role}</span>
                <span className="text-xs text-gray-500">{persona.name} ({persona.context})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

function MetricPill({ label }: { label: string }) {
  return (
    <div className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-xs font-medium shadow-sm">
      {label}
    </div>
  );
}
