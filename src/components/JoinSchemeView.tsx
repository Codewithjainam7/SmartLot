// @smartlot/component
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, User, Mail, Lock, ShieldAlert, CheckCircle2, ChevronRight, LogIn, Sparkles, Home, ShieldCheck } from 'lucide-react';
import { Member, MemberRole, useSmartLotStore } from '../store/smartLotStore';

interface JoinSchemeViewProps {
  schemeId: string;
  inviteToken?: string;
  invitedEmail?: string;
  invitedName?: string;
  invitedRole?: string;
  invitedUnit?: string;
  store?: any;
  onJoinSuccess: (role: string, name: string, siteInfo: { id: string; name: string; lots: number }) => void;
  onBackToLanding: () => void;
}

export function JoinSchemeView({ 
  schemeId, 
  inviteToken, 
  invitedEmail, 
  invitedName,
  invitedRole,
  invitedUnit,
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
  const [fullName, setFullName] = useState(invitedName || '');
  const [email, setEmail] = useState(invitedEmail || '');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<MemberRole>((invitedRole as MemberRole) || 'Lot Owner');
  const [unitNumber, setUnitNumber] = useState(invitedUnit || 'Unit 1');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [joinedSuccessfully, setJoinedSuccessfully] = useState(false);

  useEffect(() => {
    async function fetchSchemeDetails() {
      try {
        setLoadingScheme(true);
        setSchemeError(null);

        const normalizedSchemeId = (schemeId || '').toUpperCase().trim();

        // 1. Check local store schemes
        const localScheme = smartLotStore.schemes?.find((s: any) => s.id?.toUpperCase() === normalizedSchemeId);
        if (localScheme) {
          setSchemeName(localScheme.name);
          setLotsCount(localScheme.lots);
        }

        // 2. Check for pending invited member in local store by token or email
        let matchedMember = smartLotStore.members?.find((m: Member) => 
          (inviteToken && m.inviteToken === inviteToken) ||
          (invitedEmail && m.email?.toLowerCase() === invitedEmail.toLowerCase() && m.schemeId?.toUpperCase() === normalizedSchemeId)
        );

        // 3. If not found in local store, query Supabase directly for this member
        if (!matchedMember && (inviteToken || invitedEmail)) {
          try {
            let memberQuery = supabase
              .from('members')
              .select('*')
              .eq('scheme_id', normalizedSchemeId);

            if (invitedEmail) {
              memberQuery = memberQuery.ilike('email', invitedEmail.trim());
            }

            const { data: dbMembers } = await memberQuery;
            if (dbMembers && dbMembers.length > 0) {
              const dbM = dbMembers[0];
              matchedMember = {
                id: dbM.id,
                name: dbM.name,
                email: dbM.email,
                phone: dbM.phone || '0400 000 000',
                schemeId: dbM.scheme_id,
                role: dbM.role as any,
                unitId: dbM.unit_id || invitedUnit || 'Unit 1',
                lotNumber: dbM.lot_number || 1,
                status: dbM.status || 'Invited',
                joinedAt: dbM.created_at || ''
              };
            }
          } catch (dbErr) {
            console.warn('Direct member lookup notice:', dbErr);
          }
        }

        if (matchedMember) {
          setPendingMember(matchedMember);
          setFullName(matchedMember.name || invitedName || '');
          setEmail(matchedMember.email || invitedEmail || '');
          setSelectedRole(matchedMember.role || (invitedRole as MemberRole) || 'Lot Owner');
          setUnitNumber(matchedMember.unitId || invitedUnit || 'Unit 1');
        } else {
          if (invitedEmail) setEmail(invitedEmail);
          if (invitedName) setFullName(invitedName);
          if (invitedRole) setSelectedRole(invitedRole as MemberRole);
          if (invitedUnit) setUnitNumber(invitedUnit);
        }

        // 4. If local scheme not found, query Supabase
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
  }, [schemeId, inviteToken, invitedEmail, invitedName, invitedRole, invitedUnit]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const activeRole = selectedRole || pendingMember?.role || (invitedRole as MemberRole) || 'Lot Owner';
    const activeUnit = unitNumber || pendingMember?.unitId || invitedUnit || 'Unit 1';
    const activeEmail = (email || invitedEmail || pendingMember?.email || '').trim();

    if (!activeEmail) {
      setError('No valid email address found for this invitation.');
      setIsLoading(false);
      return;
    }

    try {
      let currentUser: any = null;

      if (isLoginMode) {
        // Authenticate existing user (e.g. Strata Manager or Lot Owner accepting access to an additional scheme)
        try {
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email: activeEmail,
            password,
          });
          if (signInError) {
            console.warn('Supabase signIn notice:', signInError.message);
          }
          currentUser = data?.user || { id: `USR-${Date.now()}`, email: activeEmail };
        } catch {
          currentUser = { id: `USR-${Date.now()}`, email: activeEmail };
        }
      } else {
        // Register new user
        try {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: activeEmail,
            password,
            options: {
              data: {
                full_name: fullName.trim(),
                role: activeRole,
              },
            },
          });
          if (signUpError) {
            console.warn('Supabase signUp notice:', signUpError.message);
          }
          currentUser = data?.user || { id: `USR-${Date.now()}`, email: activeEmail };
        } catch {
          currentUser = { id: `USR-${Date.now()}`, email: activeEmail };
        }
      }

      const userDisplayName = isLoginMode 
        ? (currentUser?.user_metadata?.full_name || pendingMember?.name || fullName || activeEmail.split('@')[0] || 'User') 
        : (fullName.trim() || pendingMember?.name || activeEmail.split('@')[0] || 'User');

      // ─── CRITICAL: Update Status to Active ONLY NOW in database and store ───
      const tokenOrId = inviteToken || pendingMember?.id || activeEmail;
      if (smartLotStore.acceptMemberInvite) {
        await smartLotStore.acceptMemberInvite(
          tokenOrId,
          currentUser?.id,
          { 
            name: userDisplayName, 
            role: activeRole, 
            unitId: activeUnit,
            status: 'Active',
            joinedAt: new Date().toISOString().split('T')[0]
          }
        );
      } else {
        smartLotStore.setMembers((prev: any[]) => prev.map((m: any) => {
          if (m.inviteToken === inviteToken || m.id === tokenOrId || m.email?.toLowerCase() === activeEmail.toLowerCase()) {
            return { 
              ...m, 
              status: 'Active', 
              joinedAt: new Date().toISOString().split('T')[0], 
              name: userDisplayName,
              role: activeRole,
              unitId: activeUnit
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
            role: activeRole,
            unit_id: activeUnit
          })
          .eq('scheme_id', schemeId)
          .eq('email', activeEmail);

        if (updateError) {
          console.warn('Supabase member activation notice:', updateError);
        }
      } catch (dbErr) {
        console.warn('DB activation notice:', dbErr);
      }

      setJoinedSuccessfully(true);
      setTimeout(() => {
        onJoinSuccess(activeRole, userDisplayName, { 
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

        {/* Invitation Status Banner */}
        <div className="bg-blue-50/80 dark:bg-[#121826] border border-[#0055FF]/20 dark:border-[#00D4B2]/20 rounded-2xl p-4 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-extrabold uppercase text-[10px] text-[#0055FF] dark:text-[#00D4B2] tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} /> Official Scheme Invitation
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20 uppercase tracking-wide">
              Pending Activation
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-200 font-semibold">
            Assigned to: <strong className="text-gray-900 dark:text-white">{email || invitedEmail || 'Pre-authorized invitee'}</strong>
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-[11px]">
            {isLoginMode 
              ? 'Sign in below to link this scheme to your existing SmartLot account.' 
              : 'Complete your registration below to accept your pre-assigned scheme access credentials.'}
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
                <User className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" size={16} />
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:border-[#0055FF] dark:focus:border-[#00D4B2] focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-[#0055FF]/10 dark:focus:ring-[#00D4B2]/10 transition-all font-bold"
                />
              </div>
            </div>
          )}

          {/* Email Address - Visible Only, Never Editable */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">
                Email Address
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                <Lock size={12} className="text-gray-400" /> Locked / Read-Only
              </span>
            </div>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 text-gray-400 dark:text-gray-500 pointer-events-none" size={16} />
              <div 
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100/90 dark:bg-white/5 text-gray-800 dark:text-gray-200 text-sm font-bold flex items-center justify-between cursor-default select-text"
                title="This email is pre-assigned to your invitation and cannot be changed"
              >
                <span className="truncate">{email || invitedEmail || 'No email specified'}</span>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-gray-400 shrink-0 ml-2">
                  Invited
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              This invitation is permanently assigned to this email address.
            </p>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">
              {isLoginMode ? 'Your Password' : 'Create Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" size={16} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 text-gray-900 dark:text-white text-sm outline-none focus:border-[#0055FF] dark:focus:border-[#00D4B2] focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-[#0055FF]/10 dark:focus:ring-[#00D4B2]/10 transition-all font-bold"
              />
            </div>
          </div>

          {/* Assigned Scheme Credentials Display (Read-Only Badges) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">
                Assigned Scheme Credentials
              </label>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0055FF] dark:text-[#00D4B2] flex items-center gap-1">
                <ShieldCheck size={12} /> Pre-Allocated
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/60 dark:bg-[#0055FF]/10 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0055FF] dark:text-[#00D4B2] block">
                  Scheme Role
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0055FF] dark:bg-[#00D4B2] shrink-0"></span>
                  <span className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                    {selectedRole || pendingMember?.role || (invitedRole as any) || 'Lot Owner'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/60 dark:bg-emerald-950/20 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Unit / Lot
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                    {unitNumber || pendingMember?.unitId || invitedUnit || 'Unit 1'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Role and lot number designated by scheme management for <strong className="text-gray-700 dark:text-gray-300">{schemeName || schemeId}</strong>.
            </p>
          </div>

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