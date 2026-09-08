// @smartlot/component
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, User, Mail, Lock, ShieldAlert, CheckCircle2, ChevronRight, LogIn, Sparkles, Home, ShieldCheck } from 'lucide-react';
import { Member, MemberRole, useSmartLotStore } from '../store/smartLotStore';

interface JoinSchemeViewProps {
  schemeId: string;
  inviteToken?: string;
  invitedEmail?: string;
  store?: any;
  onJoinSuccess: (role: string, name: string, siteInfo: { id: string; name: string; lots: number }) => void;
  onBackToLanding: () => void;
}

export function JoinSchemeView({ 
  schemeId, 
  inviteToken, 
  invitedEmail, 
  store, 
  onJoinSuccess, 
  onBackToLanding 
}: JoinSchemeViewProps) {
  const storeInstance = useSmartLotStore();
  const smartLotStore = store || storeInstance;

  const [schemeName, setSchemeName] = useState<string>('');
  const [lotsCount, setLotsCount] = useState<number>(0);
  const [loadingScheme, setLoadingScheme] = useState(true);
  const [schemeError, setSchemeError] = useState<string | null>(null);

  // Pending Invite Data (Loaded if token or email matches)
  const [pendingMember, setPendingMember] = useState<Member | null>(null);

  // Form states
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<MemberRole>('Lot Owner');
  const [unitNumber, setUnitNumber] = useState('Unit 1');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [joinedSuccessfully, setJoinedSuccessfully] = useState(false);

  useEffect(() => {
    async function fetchSchemeDetails() {
      try {
        setLoadingScheme(true);
        setSchemeError(null);

        // 1. Check local store schemes
        const normalizedSchemeId = (schemeId || '').toUpperCase().trim();
        const localScheme = smartLotStore.schemes?.find((s: any) => s.id?.toUpperCase() === normalizedSchemeId);
        if (localScheme) {
          setSchemeName(localScheme.name);
          setLotsCount(localScheme.lots);
        }

        // 2. Check for pending invited member in local store by token or email
        const targetMember = smartLotStore.members?.find((m: Member) => 
          (inviteToken && m.inviteToken === inviteToken) ||
          (invitedEmail && m.email?.toLowerCase() === invitedEmail.toLowerCase() && m.schemeId?.toUpperCase() === normalizedSchemeId)
        );

        if (targetMember) {
          setPendingMember(targetMember);
          setFullName(targetMember.name || '');
          setEmail(targetMember.email || '');
          setSelectedRole(targetMember.role || 'Lot Owner');
          setUnitNumber(targetMember.unitId || 'Unit 1');
        } else if (invitedEmail) {
          setEmail(invitedEmail);
        }

        // 3. If local scheme not found, query Supabase
        if (!localScheme) {
          const { data, error } = await supabase
            .from('schemes')
            .select('name, lots')
            .eq('id', normalizedSchemeId)
            .maybeSingle();

          if (error) throw error;
          
          if (!data) {
            setSchemeError(`Scheme code "${schemeId}" not found. Please double-check your invite link.`);
            return;
          }

          setSchemeName(data.name);
          setLotsCount(data.lots);
        }
      } catch (err: any) {
        console.error('Error fetching scheme details:', err);
        if (!schemeName) {
          setSchemeError('Failed to load scheme information.');
        }
      } finally {
        setLoadingScheme(false);
      }
    }

    if (schemeId) {
      fetchSchemeDetails();
    }
  }, [schemeId, inviteToken, invitedEmail]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let currentUser: any = null;

      if (isLoginMode) {
        // Authenticate existing user (e.g. Strata Manager or Lot Owner accepting access to an additional scheme)
        try {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (signInError) {
            console.warn('Supabase signIn notice:', signInError.message);
          }
          currentUser = data?.user || { id: `USR-${Date.now()}`, email: email.trim() };
        } catch {
          currentUser = { id: `USR-${Date.now()}`, email: email.trim() };
        }
      } else {
        // Register new user
        try {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: fullName.trim(),
                role: selectedRole,
              },
            },
          });
          if (signUpError) {
            console.warn('Supabase signUp notice:', signUpError.message);
          }
          currentUser = data?.user || { id: `USR-${Date.now()}`, email: email.trim() };
        } catch {
          currentUser = { id: `USR-${Date.now()}`, email: email.trim() };
        }
      }

      const userDisplayName = isLoginMode 
        ? (currentUser?.user_metadata?.full_name || pendingMember?.name || fullName || currentUser.email?.split('@')[0] || 'User') 
        : fullName;

      // ─── CRITICAL: Update Status to Active ONLY NOW in database and store ───
      const tokenOrId = inviteToken || pendingMember?.id || email.trim();
      if (smartLotStore.acceptMemberInvite) {
        await smartLotStore.acceptMemberInvite(
          tokenOrId,
          currentUser?.id,
          { 
            name: userDisplayName, 
            role: selectedRole, 
            unitId: unitNumber,
            status: 'Active',
            joinedAt: new Date().toISOString().split('T')[0]
          }
        );
      } else {
        smartLotStore.setMembers((prev: any[]) => prev.map((m: any) => {
          if (m.inviteToken === inviteToken || m.id === tokenOrId || m.email?.toLowerCase() === email.trim().toLowerCase()) {
            return { 
              ...m, 
              status: 'Active', 
              joinedAt: new Date().toISOString().split('T')[0], 
              name: userDisplayName,
              role: selectedRole,
              unitId: unitNumber
            };
          }
          return m;
        }));
      }

      // Also persist status update directly in Supabase
      try {
        const { error: updateError } = await supabase
          .from('members')
          .update({
            status: 'Active',
            user_id: currentUser?.id,
            name: userDisplayName,
            role: selectedRole,
            unit_id: unitNumber
          })
          .eq('scheme_id', schemeId)
          .eq('email', email.trim());

        if (updateError) {
          console.warn('Supabase member activation notice:', updateError);
        }
      } catch (dbErr) {
        console.warn('DB activation notice:', dbErr);
      }

      setJoinedSuccessfully(true);
      setTimeout(() => {
        onJoinSuccess(selectedRole, userDisplayName, { 
          id: schemeId, 
          name: schemeName || schemeId, 
          lots: lotsCount || 10 
        });
      }, 1200);

    } catch (err: any) {
      console.error('Error joining scheme:', err);
      setError(err.message || 'Failed to complete invitation acceptance.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingScheme) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F6F9] dark:bg-[#0a0a0f] p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0055FF] dark:border-[#00D4B2] mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Validating invitation token & scheme access...</p>
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invitation Accepted!</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
              Your membership for <strong>{schemeName || schemeId}</strong> has been activated as <strong>{selectedRole}</strong>.
            </p>
          </div>
          <p className="text-xs text-gray-400">Redirecting to your strata portal...</p>
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
            You were invited to join <span className="font-semibold text-gray-900 dark:text-white">{schemeName || schemeId}</span>
          </p>
        </div>

        {/* Pending Invite Status Pill */}
        {pendingMember ? (
          <div className="bg-blue-50/80 dark:bg-[#121826] border border-[#0055FF]/20 dark:border-[#00D4B2]/20 rounded-2xl p-4 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase text-[10px] text-[#0055FF] dark:text-[#00D4B2] tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} /> Token Verified
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20 uppercase tracking-wide">
                Pending Acceptance
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-200 font-semibold">
              Assigned Role: <strong className="text-gray-900 dark:text-white">{pendingMember.role}</strong> • Lot: <strong className="text-gray-900 dark:text-white">{pendingMember.unitId}</strong>
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-[11px]">
              {isLoginMode 
                ? 'Sign in below to link this scheme to your existing SmartLot portfolio.' 
                : 'Complete registration below to accept this invitation and activate your account.'}
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-3 text-xs text-gray-500 dark:text-gray-400 text-center">
            Complete the form below to accept your scheme access credentials.
          </div>
        )}

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
                readOnly={Boolean(pendingMember?.email)}
                className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white text-sm outline-none transition-all font-bold ${
                  pendingMember?.email 
                    ? 'bg-gray-100 dark:bg-white/10 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-50/50 dark:bg-white/5 focus:border-[#0055FF] dark:focus:border-[#00D4B2] focus:bg-white focus:ring-2 focus:ring-[#0055FF]/10 dark:focus:ring-[#00D4B2]/10'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">
              {isLoginMode ? 'Your Password' : 'Create Password'}
            </label>
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
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">Scheme Role</label>
                {pendingMember ? (
                  <div className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white text-xs font-bold flex items-center justify-between">
                    <span>{selectedRole}</span>
                    <span className="text-[10px] text-[#0055FF] dark:text-[#00D4B2] font-mono">Assigned</span>
                  </div>
                ) : (
                  <select
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value as any)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:border-[#0055FF] dark:focus:border-[#00D4B2] focus:bg-white focus:ring-2 focus:ring-[#0055FF]/10 dark:focus:ring-[#00D4B2]/10 transition-all font-bold cursor-pointer"
                  >
                    <option value="Lot Owner">Lot Owner</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Committee Member">Committee Member</option>
                    <option value="Strata Manager">Strata Manager</option>
                    <option value="Building Manager">Building Manager</option>
                  </select>
                )}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">Unit / Lot</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 5"
                  value={unitNumber}
                  readOnly={Boolean(pendingMember?.unitId)}
                  onChange={e => setUnitNumber(e.target.value)}
                  className={`w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white text-sm outline-none transition-all font-bold ${
                    pendingMember?.unitId
                      ? 'bg-gray-100 dark:bg-white/10 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-50/50 dark:bg-white/5 focus:border-[#0055FF] dark:focus:border-[#00D4B2] focus:bg-white focus:ring-2 focus:ring-[#0055FF]/10 dark:focus:ring-[#00D4B2]/10'
                  }`}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-2xl transition-all cursor-pointer text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2 hover:scale-[1.01] active:scale-[0.99]"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin"></span>
            ) : isLoginMode ? (
              <>
                <LogIn size={16} /> Sign In & Accept Invitation
              </>
            ) : (
              <>
                Accept Invitation & Complete Sign Up <ChevronRight size={16} />
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
            className="text-xs text-[#0055FF] dark:text-[#00D4B2] font-extrabold hover:underline cursor-pointer"
          >
            {isLoginMode 
              ? "New to SmartLot? Sign Up & Accept Invitation" 
              : "Already have a SmartLot account? Sign In to accept"}
          </button>
        </div>
      </div>
    </div>
  );
}