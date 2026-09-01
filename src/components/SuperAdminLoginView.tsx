import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, Lock, User, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
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
        setError('Invalid Admin Credentials. (Hint: admin / admin123)');
        setIsLoading(false);
      }
    }, 650);
  };

  return (
    <div className="min-h-screen bg-[#07090e] dark:bg-[#07090e] text-white flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans select-none">
      
      {/* Subtle Grid Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Decorative Ambient Radial Light Glowing Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#FF4757]/20 via-[#0055FF]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#00D4B2]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Floating Header Bar */}
      <header className="absolute top-6 left-6 right-6 flex justify-between items-center z-20 max-w-6xl mx-auto w-full px-2">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all text-xs font-semibold backdrop-blur-md cursor-pointer shadow-lg hover:border-white/20"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to App</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[#FF4757] text-[11px] font-bold tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-[#FF4757] animate-ping" />
          Restricted Portal
        </div>
      </header>

      {/* Main Authentication Card Container */}
      <div className="w-full max-w-md relative z-10 my-auto pt-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4 mb-8">
          
          {/* Centered Brand Icon Badge */}
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(255,71,87,0.2)] mb-2 relative group">
            <div className="absolute inset-0 bg-[#FF4757]/20 rounded-2xl blur-lg group-hover:blur-xl transition-all" />
            <ShieldAlert size={34} className="text-[#FF4757] relative z-10 animate-pulse" />
          </div>

          {/* Centered Logo */}
          <div className="flex justify-center items-center">
            <SmartLotLogo className="h-7" textColor="text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase mt-1">
              Super Admin Portal
            </h1>
            <p className="text-gray-400 text-xs font-medium mt-1">
              Authorized System Administrator Access Only
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#0f131c]/90 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
          
          {/* Top Subtle Red Border Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF4757] to-transparent opacity-80" />

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-xs font-bold text-center animate-shake flex items-center justify-center gap-2">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Admin ID Input Field */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block pl-1">
                Admin Identifier
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#FF4757] transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full bg-[#07090e]/80 border border-white/10 text-white rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#FF4757] focus:ring-1 focus:ring-[#FF4757] transition-all font-medium placeholder:text-gray-600"
                  placeholder="Enter System Admin ID"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Password Input Field */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block pl-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#FF4757] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#07090e]/80 border border-white/10 text-white rounded-xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:border-[#FF4757] focus:ring-1 focus:ring-[#FF4757] transition-all font-medium placeholder:text-gray-600"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#FF4757] to-[#e03545] hover:from-[#ff3042] hover:to-[#d02535] text-white font-black py-4 rounded-xl text-xs uppercase tracking-[0.15em] transition-all shadow-[0_4px_20px_rgba(255,71,87,0.35)] hover:shadow-[0_6px_28px_rgba(255,71,87,0.55)] active:scale-[0.99] disabled:opacity-50 mt-6 flex justify-center items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Authenticate Session</span>
                </>
              )}
            </button>
          </form>

          {/* Card Footer Security Badge */}
          <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] text-gray-500 font-semibold tracking-wide">
            <ShieldCheck size={14} className="text-[#00D4B2]" />
            <span>End-to-End Encrypted Admin Protocol</span>
          </div>
        </div>

        {/* Outer Hint Footer */}
        <p className="text-center text-[11px] text-gray-500 mt-6 font-mono">
          System Admin Default: <span className="text-gray-400">admin</span> / <span className="text-gray-400">admin123</span>
        </p>
      </div>
    </div>
  );
}

// End SuperAdminLoginView
