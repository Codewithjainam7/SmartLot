// @smartlot/component
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, User, Mail, Lock, ShieldAlert, CheckCircle2, ChevronRight, LogIn } from 'lucide-react';
import { useSmartLotStore } from '../store/smartLotStore';

interface JoinSchemeViewProps {
  schemeId: string;
  onJoinSuccess: (role: string, name: string, siteInfo: { id: string; name: string; lots: number }) => void;
  onBackToLanding: () => void;
}

export function JoinSchemeView({ schemeId, onJoinSuccess, onBackToLanding }: JoinSchemeViewProps) {
  const store = useSmartLotStore();
  const [schemeName, setSchemeName] = useState<string>('');
  const [lotsCount, setLotsCount] = useState<number>(0);
  const [loadingScheme, setLoadingScheme] = useState(true);
  const [schemeError, setSchemeError] = useState<string | null>(null);

  // Form states
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Lot Owner' | 'Resident' | 'Tenant'>('Lot Owner');
  const [unitNumber, setUnitNumber] = useState('Unit 1');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [joinedSuccessfully, setJoinedSuccessfully] = useState(false);

  useEffect(() => {
    async function fetchSchemeDetails() {
      try {
        setLoadingScheme(true);
        setSchemeError(null);
        
        // Fetch scheme name and lots
        const { data, error } = await supabase
          .from('schemes')
          .select('name, lots')
          .eq('id', schemeId)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          setSchemeError(`Scheme code "${schemeId}" not found. Please double-check your link.`);
          return;
        }

        setSchemeName(data.name);
        setLotsCount(data.lots);
      } catch (err: any) {
        console.error('Error fetching scheme details:', err);
        setSchemeError('Failed to load scheme information.');
      } finally {
        setLoadingScheme(false);
      }
    }

    if (schemeId) {
      fetchSchemeDetails();
    }
  }, [schemeId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let currentUser = null;

      if (isLoginMode) {
        // Authenticate existing user
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        currentUser = data.user;
      } else {
        // Register new user
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: selectedRole
            }
          }
        });
        if (signUpError) throw signUpError;
        currentUser = data.user;

        if (!data.session) {
          setError('Account created! Please check your email for the confirmation link to complete joining.');
          setIsLoading(false);
          return;
        }
      }

      if (!currentUser) throw new Error('Authentication failed');

      // Check if user is already a member of this scheme
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('members')
        .select('id')
        .eq('scheme_id', schemeId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (memberCheckError) throw memberCheckError;

      const userDisplayName = isLoginMode 
        ? (currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User') 
        : fullName;

      if (existingMember) {
        // Already a member, just redirect to dashboard
        onJoinSuccess(selectedRole, userDisplayName, { id: schemeId, name: schemeName, lots: lotsCount });
        return;
      }

      // Add to members table
      const { error: insertError } = await supabase
        .from('members')
        .insert([
          {
            scheme_id: schemeId,
            user_id: currentUser.id,
            role: selectedRole,
            name: userDisplayName,
            email: currentUser.email || email,
            status: 'Active',
            unit_id: unitNumber,
            lot_number: parseInt(unitNumber.replace(/\D/g, '')) || 1
          }
        ]);

      if (insertError) throw insertError;

      setJoinedSuccessfully(true);
      setTimeout(() => {
        onJoinSuccess(selectedRole, userDisplayName, { id: schemeId, name: schemeName, lots: lotsCount });
      }, 1500);

    } catch (err: any) {
      console.error('Error joining scheme:', err);
      setError(err.message || 'Failed to complete joining request.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingScheme) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F6F9] dark:bg-[#0a0a0f] p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0055FF] dark:border-[#00D4B2] mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Validating scheme invite details...</p>
      </div>
    );
  }

  if (schemeError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F6F9] dark:bg-[#0a0a0f] p-4 text-center">
        <div className="bg-white dark:bg-[#0d1117] p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100 dark:border-white/5 space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-2xl flex items-center justify-center text-red-500 mx-auto">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invalid Invite Link</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">{schemeError}</p>
          </div>
          <button
            onClick={onBackToLanding}
            className="w-full py-3.5 bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-2xl transition-all cursor-pointer text-sm"
          >
            Back to Landing Page
          </button>
        </div>
      </div>
    );
  }

  if (joinedSuccessfully) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F6F9] dark:bg-[#0a0a0f] p-4 text-center">
        <div className="bg-white dark:bg-[#0d1117] p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100 dark:border-white/5 space-y-6">
          <div className="w-16 h-16 bg-[#00D4B2]/10 rounded-2xl flex items-center justify-center text-[#00D4B2] mx-auto animate-bounce">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Aboard!</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
              You have successfully joined <strong>{schemeName}</strong> as a {selectedRole}.
            </p>
          </div>
          <p className="text-xs text-gray-400">Loading your community portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F6F9] dark:bg-[#0a0a0f] p-4 font-sans py-12">
      <div className="bg-white dark:bg-[#0d1117] w-full max-w-lg rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-white/5 space-y-6">
        
        {/* Header / Identity */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-[#0055FF]/10 dark:bg-[#00D4B2]/10 text-[#0055FF] dark:text-[#00D4B2] px-4.5 py-2 rounded-2xl mb-4 border border-[#0055FF]/20 dark:border-[#00D4B2]/20">
            <Building2 size={18} />
            <span className="text-sm font-extrabold tracking-wide uppercase">{schemeId}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Join Strata Community</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            You were invited to join <span className="font-semibold text-gray-900 dark:text-white">{schemeName}</span>
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-2xl border border-red-200/50 dark:border-red-900/30 flex items-start gap-2">
            <ShieldAlert size={14} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          {!isLoginMode && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={16} />
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:border-[#0055FF] dark:focus:border-[#00D4B2] focus:bg-white focus:ring-2 focus:ring-[#0055FF]/10 dark:focus:ring-[#00D4B2]/10 transition-all font-bold"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-gray-400" size={16} />
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:border-[#0055FF] dark:focus:border-[#00D4B2] focus:bg-white focus:ring-2 focus:ring-[#0055FF]/10 dark:focus:ring-[#00D4B2]/10 transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={16} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:border-[#0055FF] dark:focus:border-[#00D4B2] focus:bg-white focus:ring-2 focus:ring-[#0055FF]/10 dark:focus:ring-[#00D4B2]/10 transition-all font-bold"
              />
            </div>
          </div>

          {!isLoginMode && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">Role</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as any)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:border-[#0055FF] dark:focus:border-[#00D4B2] focus:bg-white focus:ring-2 focus:ring-[#0055FF]/10 dark:focus:ring-[#00D4B2]/10 transition-all font-bold cursor-pointer"
                >
                  <option value="Lot Owner">Lot Owner</option>
                  <option value="Resident">On-Site Resident</option>
                  <option value="Tenant">Tenant</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">Unit Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Unit 5 or Lot 12"
                  value={unitNumber}
                  onChange={e => setUnitNumber(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:border-[#0055FF] dark:focus:border-[#00D4B2] focus:bg-white focus:ring-2 focus:ring-[#0055FF]/10 dark:focus:ring-[#00D4B2]/10 transition-all font-bold"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-2xl transition-all cursor-pointer text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin"></span>
            ) : isLoginMode ? (
              <>
                <LogIn size={16} /> Sign In & Join
              </>
            ) : (
              <>
                Join Scheme <ChevronRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100 dark:border-white/5">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
            }}
            className="text-xs text-[#0055FF] dark:text-[#00D4B2] font-extrabold hover:underline"
          >
            {isLoginMode ? "Need to create a new account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// End JoinSchemeView

// Subcomponent: Join Scheme Wizard
// Animation: Step Wizard Progress Bar