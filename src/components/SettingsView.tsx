// @smartlot/component
import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Clock, 
  Camera, 
  User, 
  Mail, 
  Phone, 
  Home, 
  ChevronDown, 
  ChevronRight, 
  Lock, 
  Save, 
  Sun, 
  Moon, 
  Check, 
  Shield, 
  AlertCircle, 
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  activePersonaName: string;
  activePersonaRole: string;
  activePersonaEmail?: string;
  activePersonaPhone?: string;
  activePersonaUnit?: string;
  onUpdateProfile?: (updates: { name: string; email: string; phone: string; password?: string; avatarUrl?: string }) => Promise<void> | void;
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
  const [name, setName] = useState(activePersonaName || 'Sarah Jones');
  const [email, setEmail] = useState(activePersonaEmail || 'sarah.jones@duplex.com');
  const [phone, setPhone] = useState(activePersonaPhone || '0400 000 000');
  
  // Avatar image state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Save states
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showPasswordSection && password) {
      if (password !== confirmPassword) {
        setErrorMessage('New passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
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
          avatarUrl: avatarUrl || undefined,
        });
      }
      setIsSaved(true);
      setPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update account details');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (name || activePersonaName || 'Sarah Jones')
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-10 space-y-5 sm:space-y-6 overflow-y-auto h-full bg-[#F4F6F9] dark:bg-[#060D19] text-gray-900 dark:text-gray-100 font-sans">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
        
        {/* Hidden File Input for Avatar Photo Upload */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handlePhotoUpload}
        />

        {/* ── 1. Hero Banner with Building Background Image & Blue Gradient Theme ──────────────── */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-blue-200/70 dark:border-blue-500/20 p-5 sm:p-8 shadow-sm dark:shadow-2xl bg-gradient-to-r from-[#DFEEFF] via-[#E8F3FF] to-[#D5E9FF] dark:bg-gradient-to-r dark:from-[#051024] dark:via-[#091D3A] dark:to-[#0D2A54]">
          {/* Ambient gradient glow in both light and dark modes */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#1D63ED]/10 via-transparent to-sky-400/15 dark:from-[#0055FF]/20 dark:via-transparent dark:to-[#00D4B2]/15 pointer-events-none" />

          {/* Light Mode Banner Image: /bg_img_profile.png */}
          <div 
            className="dark:hidden absolute right-0 top-0 bottom-0 w-full sm:w-2/3 lg:w-3/5 bg-cover bg-right bg-no-repeat pointer-events-none opacity-90 sm:opacity-95 transition-opacity duration-300"
            style={{ 
              backgroundImage: "url('/bg_img_profile.png')",
              maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 12%, black 40%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 12%, black 40%)"
            }}
          />
          {/* Dark Mode Banner Image: /bg_img_building.png */}
          <div 
            className="hidden dark:block absolute right-0 top-0 bottom-0 w-full sm:w-2/3 lg:w-3/5 bg-cover bg-right bg-no-repeat pointer-events-none opacity-60 sm:opacity-90 transition-opacity duration-300"
            style={{ 
              backgroundImage: "url('/bg_img_building.png')",
              maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 12%, black 38%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 12%, black 38%)"
            }}
          />

          {/* Smooth gradient mask overlay to guarantee text contrast on the left */}
          <div className="absolute inset-y-0 left-0 w-full sm:w-3/4 md:w-3/5 bg-gradient-to-r from-[#DFEEFF] via-[#E8F3FF]/95 to-transparent dark:from-[#051024] dark:via-[#051024]/95 dark:to-transparent pointer-events-none" />

          {/* Banner Content */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-xl">
              {/* Eyebrow badge */}
              <div className="text-[11px] sm:text-xs font-black tracking-widest text-[#1D63ED] dark:text-[#00D4B2] uppercase select-none">
                SETTINGS
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-black text-gray-900 dark:text-white tracking-tight leading-none">
                Your Profile
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                Keep your information up to date so we can serve you better.
              </p>

              {/* Feature pills with vertical divider lines */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-800 dark:text-gray-200">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-[#1D63ED] dark:text-[#00D4B2]" />
                  <span>Secure</span>
                </div>
                <div className="h-3.5 w-px bg-blue-300/60 dark:bg-white/20" />
                <div className="flex items-center gap-1.5">
                  <Users size={16} className="text-[#1D63ED] dark:text-[#00D4B2]" />
                  <span>Personalized</span>
                </div>
                <div className="h-3.5 w-px bg-blue-300/60 dark:bg-white/20" />
                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-[#1D63ED] dark:text-[#00D4B2]" />
                  <span>Always up to date</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Main Profile Card ──────────────── */}
        <div className="bg-white dark:bg-[#070E1F] rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-gray-200/80 dark:border-white/10 shadow-sm dark:shadow-xl space-y-6">
          
          {/* Top Profile Bar: Shows avatar & change photo */}
          {theme === 'dark' ? (
            /* Dark Mode Layout: Avatar row with SJ, Name, Role and Change Photo button */
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#0B2533] text-[#00D4B2] border border-[#00D4B2]/30 font-black text-base flex items-center justify-center select-none shadow-sm overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white leading-tight">{name || activePersonaName}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{activePersonaRole} • {activePersonaUnit || 'Unit 1'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 sm:py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-transparent text-gray-300 hover:text-white text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Camera size={16} className="text-gray-400" />
                  <span>Change Photo</span>
                </button>
              </div>

              {/* Divider */}
              <div className="border-b border-white/5" />

              {/* Personal Information Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00D4B2]/10 text-[#00D4B2] border border-[#00D4B2]/20 flex items-center justify-center shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Personal Information</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Update your basic details here.</p>
                </div>
              </div>
            </>
          ) : (
            /* Light Mode Layout: Header with blue User icon, Personal Information and Change Photo on right */
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1D63ED] border border-blue-100 flex items-center justify-center shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <User size={22} />
                  )}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Personal Information</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Update your basic details here.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 sm:py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1D63ED] border border-blue-100 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Camera size={16} className="text-[#1D63ED]" />
                <span>Change Photo</span>
              </button>
            </div>
          )}

          {/* Form alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSaved && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          {/* 4 Input Fields Form */}
          <form id="profile-settings-form" onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              
              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Sarah Jones"
                    className="w-full bg-[#F8FAFC] dark:bg-[#050B14] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1D63ED] dark:focus:border-[#00D4B2] transition-colors"
                  />
                  <User size={16} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" />
                </div>
              </div>

              {/* 2. Email Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="sarah.jones@duplex.com"
                    className="w-full bg-[#F8FAFC] dark:bg-[#050B14] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1D63ED] dark:focus:border-[#00D4B2] transition-colors"
                  />
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" />
                </div>
              </div>

              {/* 3. Mobile Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0400 000 000"
                    className="w-full bg-[#F8FAFC] dark:bg-[#050B14] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1D63ED] dark:focus:border-[#00D4B2] transition-colors"
                  />
                  <Phone size={16} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" />
                </div>
              </div>

              {/* 4. Role & Unit (Context Selector) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Role & Unit
                </label>
                <div className="relative flex items-center justify-between bg-[#F8FAFC] dark:bg-[#050B14] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-gray-900 dark:text-white select-none">
                  <Home size={16} className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" />
                  <span className="font-medium">
                    {activePersonaRole} • {activePersonaUnit || 'Unit 1'}
                  </span>
                  <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
                </div>
              </div>

            </div>

            {/* ── 3. Change Password (Optional) Section Card ──────────────── */}
            <div className="bg-[#F8FAFC] dark:bg-[#050B14] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 transition-all">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#00D4B2]/10 text-[#1D63ED] dark:text-[#00D4B2] border border-blue-100 dark:border-[#00D4B2]/20 flex items-center justify-center shrink-0">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                      Change Password <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Keep your account secure with a strong password.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-transparent hover:bg-blue-100 dark:hover:bg-white/5 text-[#1D63ED] dark:text-gray-300 dark:hover:text-white border border-blue-100 dark:border-white/10 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <span>{showPasswordSection ? 'Cancel' : 'Change Password'}</span>
                  <ChevronRight size={14} className={`transition-transform duration-200 ${showPasswordSection ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {/* Collapsible password inputs */}
              {showPasswordSection && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswordText ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 pl-10 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1D63ED] dark:focus:border-[#00D4B2]"
                        />
                        <Lock size={15} className="absolute left-3.5 top-3 text-gray-400" />
                        <button
                          type="button"
                          onClick={() => setShowPasswordText(!showPasswordText)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPasswordText ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswordText ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full bg-white dark:bg-[#070E1F] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1D63ED] dark:focus:border-[#00D4B2]"
                        />
                        <Lock size={15} className="absolute left-3.5 top-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── 4. Bottom Row: Leaf Graphic + Slogan & Save Button ──────────────── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              {/* Botanical Leaf sprig & script slogan */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-400 dark:text-[#00D4B2]/70 shrink-0">
                  <path d="M12 40C16 32 20 20 28 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M28 10C34 10 38 15 36 21C30 22 25 18 28 10Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M20 24C14 22 10 16 13 11C18 12 21 17 20 24Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M22 30C28 30 33 34 32 39C26 39 22 35 22 30Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M15 35C11 34 8 30 10 27C14 27 16 31 15 35Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
                </svg>

                <div className="flex flex-col">
                  <span className="font-['Caveat',cursive] text-xl sm:text-2xl text-slate-500 dark:text-teal-100 tracking-wide select-none leading-tight">
                    {theme === 'dark' ? 'Simple Communities Stronger Together' : 'A better community starts with you.'}
                  </span>
                  <div className={`w-12 h-0.5 rounded-full mt-1 ${theme === 'dark' ? 'bg-[#00D4B2]' : 'bg-[#1D63ED]'}`} />
                </div>
              </div>

              {/* Save Changes Action Button */}
              <button
                type="submit"
                disabled={isSaving}
                className={`w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 ${
                  theme === 'dark'
                    ? 'bg-[#00D4B2] hover:bg-[#00e6c2] text-[#050A15] shadow-[#00D4B2]/20 font-black'
                    : 'bg-[#1D63ED] hover:bg-blue-700 text-white shadow-blue-500/25'
                }`}
              >
                {isSaving ? (
                  <span>Saving Changes...</span>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* ── 5. Display Theme Preference Cards ──────────────── */}
        <div className="space-y-3 sm:space-y-4 pt-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white tracking-tight uppercase">
              Display Theme Preference
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              Toggle between light and dark modes to align with your preference.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Light Theme Card */}
            <div 
              onClick={() => setTheme('light')}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[130px] select-none active:scale-[0.98] ${
                theme === 'light' 
                  ? 'border-[#1D63ED] bg-white ring-2 ring-[#1D63ED]/20 shadow-md' 
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#070E1F] hover:bg-gray-50 dark:hover:bg-white/5 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Sun size={20} />
                </div>
                {theme === 'light' && (
                  <div className="w-5 h-5 rounded-full bg-[#1D63ED] text-white flex items-center justify-center font-bold text-xs">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div className="mt-3">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">Light Theme</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">High-contrast readability tailored for daytime environments.</p>
              </div>
            </div>

            {/* Dark Theme Card */}
            <div 
              onClick={() => setTheme('dark')}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[130px] select-none active:scale-[0.98] ${
                theme === 'dark' 
                  ? 'border-[#00D4B2] bg-[#070E1F] ring-2 ring-[#00D4B2]/30 shadow-md' 
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#070E1F] hover:bg-gray-50 dark:hover:bg-white/5 opacity-70 hover:opacity-100'
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
              <div className="mt-3">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">Dark Theme</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Sleek visual styling, ideal for reducing eye strain in low-light environments.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 6. Compliance / Scheme Sandbox Note ──────────────── */}
        <div className="bg-white/60 dark:bg-[#070E1F]/50 p-4 sm:p-5 rounded-2xl border border-gray-200/70 dark:border-white/5 space-y-1.5">
          <h4 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Shield size={14} className="text-[#1D63ED] dark:text-[#00D4B2]" /> Global Scheme Session Security
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
            Account preferences set here apply across your active strata session ({theme === 'dark' ? 'Dark Theme' : 'Light Theme'}). Role-based permissions and unit allocations are managed by your strata committee.
          </p>
        </div>

      </div>
    </div>
  );
}

