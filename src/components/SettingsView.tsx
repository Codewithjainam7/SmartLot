// @smartlot/component
import React from 'react';
import { useState } from 'react';
import { Moon, Sun, Monitor, Shield, Sparkles, Check, User, Mail, Phone, Lock, Save, CheckCircle2, AlertCircle } from 'lucide-react';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  activePersonaName: string;
  activePersonaRole: string;
  activePersonaEmail?: string;
  activePersonaPhone?: string;
  activePersonaUnit?: string;
  onUpdateProfile?: (updates: { name: string; email: string; phone: string; password?: string }) => Promise<void> | void;
}

export function SettingsView({ 
  theme, 
  setTheme, 
  activePersonaName, 
  activePersonaRole,
  activePersonaEmail = '',
  activePersonaPhone = '',
  activePersonaUnit = '',
  onUpdateProfile
}: SettingsViewProps) {
  const [name, setName] = useState(activePersonaName || '');
  const [email, setEmail] = useState(activePersonaEmail || '');
  const [phone, setPhone] = useState(activePersonaPhone || '0400 000 000');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    setErrorMessage('');
    setIsSaving(true);
    try {
      if (onUpdateProfile) {
        await onUpdateProfile({
          name,
          email,
          phone,
          password: password || undefined,
        });
      }
      setIsSaved(true);
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update account details');
    } finally {
      setIsSaving(false);
    }
  };
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

      {/* Account Profile Summary Card */}
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

      
      {/* Account Details & Personal Information Form */}
      <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <User size={18} className="text-[#00D4B2]" /> Account Details & Personal Information
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
            Update your registered account credentials, contact information, and security password.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 font-medium">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSaved && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} />
            <span>Account preferences and personal details updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Full Legal Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Sarah Jones"
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/50 transition-all pl-10"
                />
                <User size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@strata.com.au"
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/50 transition-all pl-10"
                />
                <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Mobile Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0400 000 000"
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/50 transition-all pl-10"
                />
                <Phone size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>

            {/* Role & Unit Context (Read-Only) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Assigned Role & Unit
              </label>
              <div className="flex items-center gap-2 bg-gray-50/50 dark:bg-[#1a1d27]/50 border border-gray-200/60 dark:border-white/5 rounded-2xl px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                <Shield size={16} className="text-[#00D4B2]" />
                <span>{activePersonaRole} {activePersonaUnit ? '• ' + activePersonaUnit : ''}</span>
              </div>
            </div>
          </div>

          {/* Password Update Fields */}
          <div className="pt-4 border-t border-gray-100 dark:border-white/5">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Lock size={14} className="text-gray-400" /> Change Password (Optional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (leave blank to keep current)"
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/50 transition-all pl-10"
                />
                <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/50 transition-all pl-10"
                />
                <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setName(activePersonaName || '');
                setEmail(activePersonaEmail || '');
                setPhone(activePersonaPhone || '0400 000 000');
                setPassword('');
                setConfirmPassword('');
                setErrorMessage('');
              }}
              className="px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-semibold text-xs hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00D4B2] to-[#0055FF] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
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
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0d1117] hover:bg-gray-50 dark:hover:bg-white/5 opacity-75 hover:opacity-100'
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
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0d1117] hover:bg-gray-50 dark:hover:bg-white/5 opacity-75 hover:opacity-100'
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
      <div className="bg-gray-50 dark:bg-[#0d1117]/50 p-6 rounded-3xl border border-gray-200/60 dark:border-gray-800 space-y-3">
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


// End SettingsView

// Subcomponent: Account Preferences Form
// Settings: Notification Preferences and Themes
// Animation: Toggle Switch Smooth Slide
// Refactor: Refine settings theme toggle state persistence
