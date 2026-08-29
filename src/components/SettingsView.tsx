import React from 'react';
import { Moon, Sun, Monitor, Shield, Sparkles, Check } from 'lucide-react';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  activePersonaName: string;
  activePersonaRole: string;
}

export function SettingsView({ 
  theme, 
  setTheme, 
  activePersonaName, 
  activePersonaRole 
}: SettingsViewProps) {
  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-full bg-[#F4F6F9] dark:bg-[#0a0a0f]">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0d1117] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-[#00D4B2]/10 relative overflow-hidden">
        {/* Subtle glow in dark mode */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D4B2]/0 via-transparent to-[#0055FF]/0 dark:from-[#00D4B2]/5 dark:via-transparent dark:to-[#0055FF]/5 pointer-events-none rounded-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0055FF]/10 dark:bg-[#0055FF]/15 text-[#0055FF] dark:text-[#6699ff] border border-[#0055FF]/20 text-xs font-bold uppercase tracking-wider mb-2">
            System Preferences
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Preferences & Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage system theme choices, scheme integrations, and user preferences.</p>
        </div>
      </div>

      {/* Profile Summary Card */}
      <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#00D4B2]/10 dark:bg-white/5 border border-[#00D4B2]/30 dark:border-white/10 text-[#00D4B2] font-black text-xl flex items-center justify-center select-none shadow-sm">
            {activePersonaName ? activePersonaName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{activePersonaName}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-1">{activePersonaRole}</p>
            <div className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-2 border border-emerald-500/20">
              <Shield size={10} /> Active Member Session
            </div>
          </div>
        </div>
      </div>

      {/* Theme Selection Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight uppercase">Display Theme Preference</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Toggle between light and dark modes to align with your preference.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Light Theme Card */}
          <div 
            onClick={() => setTheme('light')}
            className={`group p-5 rounded-[28px] border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[160px] ${
              theme === 'light' 
                ? 'border-indigo-500 bg-white ring-1 ring-indigo-500/50 shadow-md scale-[1.01]' 
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0d1117] dark:bg-[#0d1117] hover:bg-gray-50 dark:hover:bg-white/5 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Sun size={20} />
              </div>
              {theme === 'light' && (
                <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">Light Theme</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">High-contrast readability tailored for bright environments.</p>
            </div>
          </div>

          {/* Dark Theme Card */}
          <div 
            onClick={() => setTheme('dark')}
            className={`group p-5 rounded-[28px] border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[160px] ${
              theme === 'dark' 
                ? 'border-[#00D4B2] bg-[#121316] dark:bg-[#0d1117] ring-1 ring-[#00D4B2]/50 shadow-md scale-[1.01]' 
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0d1117] dark:bg-[#0d1117] hover:bg-gray-50 dark:hover:bg-white/5 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#00D4B2]/10 text-[#00D4B2] flex items-center justify-center">
                <Moon size={20} />
              </div>
              {theme === 'dark' && (
                <div className="w-5 h-5 rounded-full bg-[#00D4B2] text-black flex items-center justify-center font-bold text-xs">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">Dark Theme</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Sleek visual styling, ideal for reducing eye strain in low-light environments.</p>
            </div>
          </div>
        </div>
      </div>

      {/* General Compliance / Audit Section */}
      <div className="bg-gray-50 dark:bg-[#0d1117] dark:bg-[#0d1117]/50 p-6 rounded-3xl border border-gray-200/60 dark:border-gray-800 space-y-3">
        <h4 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#00D4B2]" /> Global Scheme Sandbox Preferences
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
          Preferences set here apply across all switchable schemes ({theme === 'dark' ? 'Dark theme active' : 'Light theme active'}). Context state modifications sync automatically to your local storage device.
        </p>
      </div>
    </div>
  );
}

