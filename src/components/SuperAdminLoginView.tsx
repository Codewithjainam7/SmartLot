import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, Lock, User, Eye, EyeOff } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1121] flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans transition-colors duration-300">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#FF4757]/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#0055FF]/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <button
        onClick={onBack}
        className="absolute top-8 left-8 p-3 rounded-full bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 shadow-sm transition-all z-20 border border-gray-200 dark:border-transparent"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-[#FF4757]/10 to-[#FF4757]/5 dark:from-[#FF4757]/20 dark:to-[#FF4757]/5 rounded-3xl border border-[#FF4757]/20 shadow-[0_0_30px_rgba(255,71,87,0.15)]">
              <ShieldAlert size={40} className="text-[#FF4757]" />
            </div>
          </div>
          <SmartLotLogo className="h-8 mx-auto" textColor="text-gray-900 dark:text-white" />
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Super Admin Portal</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Restricted portal. Authorized personnel only.</p>
        </div>

        <div className="bg-white/80 dark:bg-[#121316]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-8 rounded-3xl shadow-xl dark:shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-[#FF4757]/10 border border-[#FF4757]/20 text-[#FF4757] px-4 py-3 rounded-xl text-xs font-bold text-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Admin ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0a0a0f] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#FF4757]/50 focus:ring-1 focus:ring-[#FF4757]/50 transition-all font-medium"
                  placeholder="Enter your Admin ID"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0a0a0f] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:border-[#FF4757]/50 focus:ring-1 focus:ring-[#FF4757]/50 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF4757] hover:bg-[#ff3042] text-white font-black py-4 rounded-xl text-sm transition-all shadow-[0_4px_14px_rgba(255,71,87,0.4)] hover:shadow-[0_6px_20px_rgba(255,71,87,0.6)] disabled:opacity-50 mt-4 uppercase tracking-widest flex justify-center items-center"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Authenticate'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
