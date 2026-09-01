import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, KeyRound, Sparkles, Server, Zap, CheckCircle2 } from 'lucide-react';
import { SmartLotLogo } from './core/SmartLotLogo';

interface SuperAdminLoginViewProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

export function SuperAdminLoginView({ onLoginSuccess, onBack }: SuperAdminLoginViewProps) {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (adminId === 'admin' && password === 'admin123') {
        onLoginSuccess();
      } else {
        setError('Invalid Admin Identifier or Security Key. (Hint: admin / admin123)');
        setIsLoading(false);
      }
    }, 500);
  };

  const autoFillDemo = () => {
    setAdminId('admin');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F6F9] dark:bg-[#07090e] p-4 sm:p-6 font-sans py-12 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00D4B2]/10 dark:bg-[#00D4B2]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#0055FF]/10 dark:bg-[#0055FF]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Dual-Panel Auth Card */}
      <div className="bg-white dark:bg-[#0d1117] w-full max-w-4xl rounded-[32px] shadow-2xl flex flex-col md:flex-row min-h-[580px] border border-gray-200/80 dark:border-white/10 relative z-10 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
        
        {/* Left Visual Branding Panel - Rich Dark Brand Slate */}
        <div className="w-full md:w-5/12 bg-gradient-to-b from-[#0B1121] via-[#0F172A] to-[#0B1121] p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden rounded-t-[32px] md:rounded-tr-none md:rounded-l-[32px] border-b md:border-b-0 md:border-r border-white/10">
          
          {/* Top Brand Header */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 cursor-pointer shadow-sm active:scale-95"
              >
                <ArrowLeft size={14} /> Back to Home
              </button>
            </div>

            <div 
              onClick={onBack}
              className="cursor-pointer hover:opacity-90 transition-all w-fit group"
              title="Back to SmartLot Home"
            >
              <SmartLotLogo className="h-10" textColor="text-white" />
            </div>

            <div className="pt-2 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-black uppercase tracking-wider shadow-sm">
                <ShieldAlert size={14} className="animate-pulse" /> Restricted Access
              </div>
              <h2 className="text-2xl lg:text-3xl font-black tracking-tight uppercase text-white leading-tight">
                Super Admin <br /><span className="text-[#00D4B2]">Control Hub</span>
              </h2>
              <p className="text-xs text-gray-300/80 leading-relaxed font-medium">
                Root strata governance, scheme portfolios, cross-building permissions, and master operations.
              </p>
            </div>
          </div>
          
          {/* Middle Feature Highlights */}
          <div className="relative z-10 space-y-3 my-6">
            <div className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-2xl p-3.5 backdrop-blur-md transition-all">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <ShieldCheck className="text-[#00D4B2] shrink-0" size={16} />
                <span>Global Multi-Scheme Engine</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Direct CRUD management of buildings, units, and role cascades.
              </p>
            </div>

            <div className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-2xl p-3.5 backdrop-blur-md transition-all">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Zap className="text-[#0055FF] shrink-0" size={16} />
                <span>Instant Ticket Triage & Dispatch</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Manage emergency maintenance and lot disputes in real-time.
              </p>
            </div>
          </div>

          {/* Bottom Security Trust Badge */}
          <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400">
            <span className="flex items-center gap-1.5 font-semibold">
              <Server size={12} className="text-[#00D4B2]" /> 256-bit AES Encrypted
            </span>
            <span className="font-mono text-gray-500">v2.4.0 Master</span>
          </div>

          {/* Ambient Decorative Orbs */}
          <div className="absolute top-[-15%] right-[-15%] w-[260px] h-[260px] bg-[#00D4B2]/15 rounded-full blur-[70px] pointer-events-none" />
          <div className="absolute bottom-[-15%] left-[-15%] w-[260px] h-[260px] bg-[#0055FF]/15 rounded-full blur-[70px] pointer-events-none" />
        </div>

        {/* Right Form Panel */}
        <div className="w-full md:w-7/12 bg-white dark:bg-[#0d1117] p-8 md:p-12 flex flex-col justify-center relative rounded-b-[32px] md:rounded-bl-none md:rounded-r-[32px]">
          
          <div className="max-w-md mx-auto w-full space-y-6">
            
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00D4B2]/10 text-[#00A38C] text-[10px] font-black uppercase tracking-wider">
                <KeyRound size={12} /> Master Authentication
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                System Admin Sign In
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Enter your master credentials to securely authenticate into the console.
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl border border-rose-200 dark:border-rose-900/40 flex items-center gap-2.5 animate-in shake duration-200">
                <ShieldAlert size={16} className="shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Admin ID Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">
                  Admin Identifier
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5 pointer-events-none" />
                  <input 
                    type="text" 
                    value={adminId}
                    onChange={e => setAdminId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl py-3.5 pl-12 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/30 focus:border-[#00D4B2] transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                    placeholder="Enter admin identifier"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">
                  Security Passkey
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5 pointer-events-none" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl py-3.5 pl-12 pr-12 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/30 focus:border-[#00D4B2] transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer p-1"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0B1121] hover:bg-[#15203A] dark:bg-white dark:hover:bg-gray-100 text-[#00D4B2] dark:text-[#0B1121] font-black text-xs uppercase tracking-wider py-4 rounded-2xl flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-70 cursor-pointer shadow-lg shadow-[#0B1121]/10 dark:shadow-white/5 active:scale-[0.99] group"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#00D4B2] border-t-transparent rounded-full animate-spin" />
                    Validating Master Token...
                  </span>
                ) : (
                  <>
                    <span>Sign In to Master Console</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Interactive Demo Quick-Fill Pill */}
            <div className="pt-2 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={autoFillDemo}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-[#00D4B2]/10 hover:border-[#00D4B2]/30 border border-gray-200 dark:border-white/5 text-[11px] font-bold text-gray-600 dark:text-gray-400 hover:text-[#00A38C] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles size={13} className="text-[#00D4B2]" />
                <span>Auto-fill Demo Credentials (<code>admin / admin123</code>)</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// End SuperAdminLoginView