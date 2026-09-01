import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';
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
        setError('Invalid Admin ID or Password. (Hint: admin / admin123)');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F6F9] dark:bg-[#0a0a0f] p-4 font-sans py-12 transition-colors duration-300">
      <div className="bg-white dark:bg-[#0d1117] w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col md:flex-row min-h-[540px] border border-gray-100 dark:border-white/5">
        
        {/* Left Visual Branding Panel - Matching SmartLot's Dark Brand Block */}
        <div className="w-full md:w-5/12 bg-[#0B1121] p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden rounded-t-3xl md:rounded-tr-none md:rounded-l-3xl">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Home
              </button>
            </div>

            <div 
              onClick={onBack}
              className="cursor-pointer hover:scale-105 transition-all w-fit"
              title="Back to Landing Page"
            >
              <SmartLotLogo className="h-10" textColor="text-white" />
            </div>

            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
                <ShieldAlert size={14} /> Restricted Portal
              </div>
              <h2 className="text-2xl font-black tracking-tight uppercase text-white">
                Super Admin Portal
              </h2>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                System-wide management, global strata permissions, and root administrator settings.
              </p>
            </div>
          </div>
          
          <div className="relative z-10 space-y-4 my-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-white font-bold text-xs mb-1">
                <ShieldCheck className="text-[#00D4B2]" size={16} /> Global Policy Control
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Configure base defaults cascading to all strata schemes.
              </p>
            </div>
          </div>

          {/* Ambient Decorative Orbs */}
          <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[300px] bg-[#00D4B2]/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-20%] w-[300px] h-[300px] bg-[#0055FF]/10 rounded-full blur-[80px] pointer-events-none" />
        </div>

        {/* Right Form Panel - Styled exact to SmartLot's Auth Form */}
        <div className="w-full md:w-7/12 bg-white dark:bg-[#0d1117] p-8 md:p-12 flex flex-col justify-center relative rounded-b-3xl md:rounded-bl-none md:rounded-r-3xl">
          
          <div className="max-w-md mx-auto w-full space-y-6">
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                System Admin Sign In
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Enter your administrative credentials to access the console.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0" />
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
                    className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/30 focus:border-[#00D4B2] transition-all"
                    placeholder="e.g. admin"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5 pointer-events-none" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl py-3 pl-12 pr-12 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/30 focus:border-[#00D4B2] transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button - Standard SmartLot Dark/Teal Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0B1121] hover:bg-[#15203A] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-70 cursor-pointer shadow-md"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Console</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                Hint: ID: <strong className="text-gray-700 dark:text-gray-300">admin</strong> | Pass: <strong className="text-gray-700 dark:text-gray-300">admin123</strong>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// End SuperAdminLoginView

// Component: Split-Panel Auth Container
// Component: Security Credential Validator
// Auth: Two-Panel Brand Container
// Auth: Credential Guard and Security Handlers