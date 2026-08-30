import React, { useState } from "react";
import { Building, User, Mail, Lock, ArrowRight, ArrowLeft, ShieldCheck, Users, Briefcase, Eye, EyeOff } from "lucide-react";
import { SmartLotLogo } from "./core/SmartLotLogo";
import { CustomSelect, SelectOption } from "./core/CustomSelect";
import { supabase } from "../lib/supabase";

interface ResidentLoginViewProps {
  onLoginSuccess: (
    role: string, 
    name: string, 
    siteInfo?: { id: string; name: string; lots: number; unit?: string }
  ) => void;
  onAdminLogin: () => void;
  onBack: () => void;
}

const ROLE_OPTIONS: SelectOption[] = [
  { 
    value: "Strata Manager", 
    label: "Strata Manager", 
    description: "I professionally manage strata schemes" 
  },
  { 
    value: "Committee Member", 
    label: "Committee Member", 
    description: "I'm an elected strata committee representative" 
  }
];

export function ResidentLoginView({ onLoginSuccess, onAdminLogin, onBack }: ResidentLoginViewProps) {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);
  
  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup State
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("Strata Manager");
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      // Successfully logged in via Supabase!
      // In a real app, we'd fetch their profile and memberships here
      // For now, we simulate passing them through to the main app which will handle loading
      onLoginSuccess("Resident", "Authenticated User"); // This will be handled by the store listener now
      
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            full_name: fullName,
            role: selectedRole
          }
        }
      });

      if (signUpError) throw signUpError;
      
      // On success, they either need to verify email or they are logged in automatically
      if (data.session) {
        onLoginSuccess(selectedRole, fullName);
      } else {
        setError("Account created! Please check your email for the confirmation link.");
      }
      
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F6F9] dark:bg-[#0a0a0f] p-4 font-sans py-12">
      <div className="bg-white dark:bg-[#0d1117] w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col md:flex-row min-h-[620px] border border-gray-100 dark:border-white/5">
        
        {/* Left Visual Branding Panel */}
        <div className="w-full md:w-5/12 bg-[#0B1121] p-10 text-white flex flex-col justify-between relative overflow-hidden rounded-t-3xl md:rounded-tr-none md:rounded-l-3xl">
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
              <SmartLotLogo className="h-12" textColor="text-white" />
            </div>

            <div>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-6 leading-relaxed">
                Log service requests, manage scheme members, assign role permissions, and vote on community decisions.
              </p>
            </div>
          </div>
          
          <div className="relative z-10 space-y-6 mt-12 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/10 transition-all cursor-default">
              <div className="flex items-center gap-3 text-white font-bold text-sm mb-2">
                <ShieldCheck className="text-[#00D4B2]" size={20} /> Verified Compliance
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">Secure role-based matrix strictly enforcing state legislative boundaries between tenants and owners.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:bg-white/10 transition-all cursor-default">
              <div className="flex items-center gap-3 text-white font-bold text-sm mb-2">
                <Briefcase className="text-[#0055FF]" size={20} /> Multi-Site Operations
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">Switch portfolios dynamically with complete data isolation and instant scheme context updating.</p>
            </div>
          </div>
          
          <div className="absolute top-[-20%] right-[-20%] w-[400px] h-[400px] bg-[#00D4B2]/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-20%] w-[400px] h-[400px] bg-[#0055FF]/10 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* Right Auth Panel */}
        <div className="w-full md:w-7/12 bg-white dark:bg-[#0d1117] p-10 md:p-14 flex flex-col justify-center relative rounded-b-3xl md:rounded-bl-none md:rounded-r-3xl">
          
          <div className="flex items-center justify-between mb-8">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft size={14} /> Back to Home
            </button>

            <div className="flex bg-gray-100 dark:bg-[#1a1d27] p-1 rounded-2xl w-48 text-xs font-bold border border-gray-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className={`flex-1 py-2 rounded-xl transition-all ${authMode === "signin" ? "bg-white dark:bg-[#121316] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`flex-1 py-2 rounded-xl transition-all ${authMode === "signup" ? "bg-white dark:bg-[#121316] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"}`}
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              {authMode === "signin" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-8 font-medium">
              {authMode === "signin" 
                ? "Enter your details to access your dashboard." 
                : "Join your strata community and manage your property."}
            </p>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/10 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2 mb-4">
                <ShieldCheck size={14} className="shrink-0" /> {error}
              </div>
            )}

            {authMode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/8 text-gray-900 dark:text-white dark:text-white rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/30 focus:border-[#00D4B2] transition-all"
                      placeholder="e.g. sm1@strata.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold text-gray-700">Password</label>
                    <a href="#" className="text-[11px] font-bold text-[#0055FF] hover:underline">Forgot password?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                    <input 
                      type={showLoginPassword ? "text" : "password"} 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/8 text-gray-900 dark:text-white dark:text-white rounded-2xl py-3 pl-12 pr-12 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/30 focus:border-[#00D4B2] transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0B1121] hover:bg-[#15203A] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-70"
                >
                  {isLoading ? "Signing In..." : "Sign In"} {!isLoading && <ArrowRight size={18} />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5 z-10 pointer-events-none" />
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/8 text-gray-900 dark:text-white dark:text-white rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/30 focus:border-[#00D4B2] transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5 z-10 pointer-events-none" />
                    <input 
                      type="email" 
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/8 text-gray-900 dark:text-white dark:text-white rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/30 focus:border-[#00D4B2] transition-all"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5 z-10 pointer-events-none" />
                    <input 
                      type={showSignupPassword ? "text" : "password"} 
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#1a1d27] border border-gray-200 dark:border-white/8 text-gray-900 dark:text-white dark:text-white rounded-2xl py-3 pl-12 pr-12 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00D4B2]/30 focus:border-[#00D4B2] transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 transition-colors cursor-pointer z-20"
                    >
                      {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <CustomSelect
                    label="Classification / Role"
                    options={ROLE_OPTIONS}
                    value={selectedRole}
                    onChange={setSelectedRole}
                    direction="down"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#00D4B2] hover:bg-[#00A38C] text-[#0B1121] font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-70"
                >
                  {isLoading ? "Creating Account..." : "Create Account"} {!isLoading && <ArrowRight size={18} />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


