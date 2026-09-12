// @smartlot/core
import React, { useState, useEffect } from 'react';
import { useSmartLotStore } from './store/smartLotStore';
import { PERSONAS, Persona, Scheme } from './types';
import { ShieldAlert, ArrowLeft, Building2, User, Eye, Zap } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './components/Dashboard';
import { OnboardingModal } from './components/OnboardingModal';

// User Management & Requests Module Views
import { UserManagementView } from './components/UserManagementView';
import { ResidentLoginView } from './components/ResidentLoginView';

import { CreateRequestModal } from './components/CreateRequestModal';
import { ResidentRequestsView } from './components/ResidentRequestsView';

// Module 1 New Views
import { LandingPageView } from './components/LandingPageView';
import { AdminView } from './components/AdminView';
import { SuperAdminLoginView } from './components/SuperAdminLoginView';
import { SettingsView } from './components/SettingsView';
import { JoinSchemeView } from './components/JoinSchemeView';
import { DashboardSkeleton } from './components/core/DashboardSkeleton';
import { ResidentPortalView } from './components/ResidentPortalView';
import { ManagerPerformanceView } from './components/ManagerPerformanceView';

export default function App() {
  const store = useSmartLotStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);

  // Restore session from persisted store.isLoggedIn so reloads keep the user logged in
  const [sessionState, setSessionState] = useState<'landing' | 'login' | 'admin_login' | 'admin_console' | 'dashboard'>(
    () => {
      if (window.location.hash === '#/admin') return 'admin_login';
      return 'landing';
    }
  );

  // Remote Inspection Session state for Super Admin
  const [inspectingSession, setInspectingSession] = useState<{
    scheme: Scheme;
    previousPersona: Persona;
    originalRole: string;
  } | null>(null);

    // Pre-fill parameters when redirecting from landing page simulating a persona
  const [prefillPersona, setPrefillPersona] = useState<string | null>(null);
  const [joinSchemeId, setJoinSchemeId] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const [invitedName, setInvitedName] = useState<string | null>(null);
  const [invitedRole, setInvitedRole] = useState<string | null>(null);
  const [invitedUnit, setInvitedUnit] = useState<string | null>(null);
  const [invitedLot, setInvitedLot] = useState<string | null>(null);

  useEffect(() => {
    const parseUrl = () => {
      const hashStr = window.location.hash || '';
      const pathStr = window.location.pathname || '';

      // Extract query parameters from hash (?token=...) or window.location.search
      let queryString = '';
      if (hashStr.includes('?')) {
        queryString = hashStr.split('?')[1];
      } else if (window.location.search) {
        queryString = window.location.search.replace(/^\?/, '');
      }

      const params = new URLSearchParams(queryString);
      const token = params.get('token');
      const email = params.get('email');
      const name = params.get('name');
      const role = params.get('role');
      const unit = params.get('unit');
      const lot = params.get('lot');
      const schemeFromParam = params.get('scheme');

      // Match path or hash like #/join/SP101 or #/join?scheme=SP101 or /lander?scheme=SP101
      const hashClean = hashStr.split('?')[0];
      const pathClean = pathStr.split('?')[0];
      const hashMatch = hashClean.match(/^#\/join(?:\/([A-Za-z0-9_-]+))?/);
      const pathMatch = pathClean.match(/^\/join(?:\/([A-Za-z0-9_-]+))?/);
      const isLander = hashClean.includes('lander') || pathClean.includes('lander');

      const extractedSchemeId = hashMatch?.[1] || pathMatch?.[1] || schemeFromParam || (isLander ? schemeFromParam : null);

      if (extractedSchemeId || token) {
        setJoinSchemeId(extractedSchemeId || 'SP101');
        setInviteToken(token || null);
        setInvitedEmail(email || null);
        setInvitedName(name || null);
        setInvitedRole(role || null);
        setInvitedUnit(unit || null);
        setInvitedLot(lot || null);
      } else {
        setJoinSchemeId(null);
        setInviteToken(null);
        setInvitedEmail(null);
        setInvitedName(null);
        setInvitedRole(null);
        setInvitedUnit(null);
        setInvitedLot(null);
      }
    };
    parseUrl();
    window.addEventListener('hashchange', parseUrl);
    window.addEventListener('popstate', parseUrl);
    return () => {
      window.removeEventListener('hashchange', parseUrl);
      window.removeEventListener('popstate', parseUrl);
    };
  }, []);

  // Separate Admin console hash router trigger
  useEffect(() => {
    const checkHash = () => {
      if (inspectingSession) {
        // Active remote inspection session: do not let hash router disrupt inspection view
        return;
      }
      if (window.location.hash === '#/admin' && sessionState !== 'admin_console') {
        setSessionState('admin_login');
      } else if (sessionState === 'admin_login' || sessionState === 'admin_console') {
        if (window.location.hash !== '#/admin') {
          setSessionState('landing');
        }
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [sessionState, inspectingSession]);

  // Handle theme state preferences dynamically
  useEffect(() => {
    if (store.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [store.theme]);

  const pendingTriageCount = store.residentRequests.filter(r => r.status === 'pending_triage' || r.status === 'new').length;

  // Isolate schemes strictly to the logged-in user's memberships (MUST be at top level of component)
  const userMemberRows = store.members.filter(m => m.email?.toLowerCase() === store.activePersona.email?.toLowerCase());
  const userSchemeIds = new Set(userMemberRows.map(m => m.schemeId));
  
  // If user is website administrator or inspecting, they can see all schemes or the inspected scheme; otherwise strictly their own scheme(s)
  const isWebAdmin = store.activePersona.role === 'Website Administrator' || (store.activePersona as any).isSystemAdmin;
  const userSchemes = (isWebAdmin || inspectingSession)
    ? (inspectingSession ? [inspectingSession.scheme, ...store.schemes.filter(s => s.id !== inspectingSession.scheme.id)] : store.schemes)
    : (userSchemeIds.size > 0 
        ? store.schemes.filter(s => userSchemeIds.has(s.id))
        : (store.activeScheme && store.activeScheme.id !== 'NO_SCHEME' ? [store.activeScheme] : store.schemes.filter(s => s.id === 'SP101')));

  // Ensure activeScheme is strictly one of the user's valid schemes
  useEffect(() => {
    if (inspectingSession) {
      if (store.activeScheme.id !== inspectingSession.scheme.id) {
        store.setActiveScheme(inspectingSession.scheme);
      }
      return;
    }
    if (userSchemes.length > 0 && !userSchemes.some(s => s.id === store.activeScheme.id)) {
      store.setActiveScheme(userSchemes[0]);
    }
  }, [userSchemes, store.activeScheme?.id, inspectingSession]);

  useEffect(() => {
    if (store.isLoggedIn) {
      if (sessionState === 'landing' || sessionState === 'login') {
        setSessionState('dashboard');
      }
    } else {
      if (sessionState === 'dashboard') {
        setSessionState('landing');
      }
    }
  }, [store.isLoggedIn, sessionState]);

  const handleSelectPersona = (personaId: string) => {
    if (personaId === 'web_admin') {
      window.location.hash = '#/admin';
    } else if (personaId === 'guest') {
      setPrefillPersona(null);
      setSessionState('login');
    } else {
      const allPersonas = [...PERSONAS, ...store.customPersonas];
      const match = allPersonas.find(p => p.id === personaId);
      if (match) {
        handleLoginSuccess(match.role, match.name);
      } else {
        setPrefillPersona(personaId);
        setSessionState('login');
      }
    }
  };

  const handleLoginSuccess = async (
    role: string, 
    name: string, 
    siteInfo?: { id: string; name: string; lots: number }
  ) => {
    let scheme = store.activeScheme;
    if (siteInfo && siteInfo.id !== '') {
      // Check if scheme already exists
      const existing = store.schemes.find(s => s.id === siteInfo.id);
      if (existing) {
        scheme = existing;
      } else {
        scheme = await store.addScheme(siteInfo.id, siteInfo.name, siteInfo.lots);
      }
      store.setActiveScheme(scheme);
    }

    const personaId = name.toLowerCase().replace(/\s+/g, '_');
    const isFreshSignup = siteInfo && siteInfo.id === '';
    
    // Preserve the user's actual role from their profile/member record
    const userRole = role;

    // Look up matching seeded persona to preserve their portfolio memberships
    const seeded = !isFreshSignup ? [...PERSONAS, ...store.customPersonas].find(p => p.name.toLowerCase() === name.toLowerCase() || p.id === personaId) : null;
    const memberships = seeded?.memberships || (isFreshSignup ? [] : [
      {
        schemeId: scheme.id,
        roles: [userRole as any]
      }
    ]);

    const unitContext = (siteInfo as any)?.unit || (siteInfo ? `Unit 1 (${siteInfo.name})` : 'Unit 1');

    const newPersona = {
      ...seeded,
      id: personaId,
      role: userRole,
      name: name,
      context: unitContext,
      email: seeded?.email || `${name.toLowerCase().replace(/\s+/g, '.')}@strata.com.au`,
      memberships
    };

    store.setActivePersona(newPersona);
    store.setIsLoggedIn(true);
    setSessionState('dashboard');
    store.setActiveView('dashboard');

    // Register member context in store - deduplicate by email+schemeId
    const memberEmail = newPersona.email || `${name.toLowerCase().replace(/\s+/g, '.')}@strata.com.au`;
    store.setMembers(prev => {
      if (prev.some(m => m.email === memberEmail && m.schemeId === scheme.id)) return prev;
      return [
        {
          id: `MEM-${Date.now()}`,
          name,
          email: memberEmail,
          phone: '0400 000 000',
          schemeId: scheme.id,
          role: (userRole === 'Strata Admin' ? 'Strata Manager' : userRole) as any,
          unitId: (siteInfo as any)?.unit || ((userRole.includes('Manager') || userRole.includes('Admin')) ? 'HQ / Management' : 'Unit 1'),
          lotNumber: (siteInfo as any)?.lotNumber !== undefined
            ? Number((siteInfo as any).lotNumber)
            : ((userRole.includes('Manager') || userRole.includes('Admin')) ? 0 : 1),
          status: 'Active' as const,
          joinedAt: new Date().toISOString().split('T')[0],
        },
        ...prev
      ];
    });
  };

  const handleInspectScheme = (targetScheme: Scheme, targetPersona?: Persona) => {
    let inspectionPersona: Persona;

    if (targetPersona) {
      inspectionPersona = targetPersona;
    } else {
      // Find existing manager or member in this scheme
      const schemeMembers = store.members.filter(m => m.schemeId === targetScheme.id);
      const managerMember = schemeMembers.find(m => m.role.includes('Manager') || m.role.includes('Admin'));
      const residentMember = schemeMembers[0];

      if (managerMember) {
        inspectionPersona = {
          id: managerMember.id || `member_${managerMember.email}`,
          name: managerMember.name,
          role: managerMember.role,
          context: managerMember.unitId || targetScheme.name,
          email: managerMember.email,
          memberships: [{ schemeId: targetScheme.id, roles: [managerMember.role as any] }]
        };
      } else if (residentMember) {
        inspectionPersona = {
          id: residentMember.id || `member_${residentMember.email}`,
          name: residentMember.name,
          role: residentMember.role,
          context: residentMember.unitId || 'Unit 1',
          email: residentMember.email,
          memberships: [{ schemeId: targetScheme.id, roles: [residentMember.role as any] }]
        };
      } else {
        inspectionPersona = {
          id: `inspect_manager_${targetScheme.id}`,
          name: `${targetScheme.name} Manager`,
          role: 'Strata Manager',
          context: targetScheme.name,
          email: `manager@${targetScheme.id.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.au`,
          memberships: [{ schemeId: targetScheme.id, roles: ['Strata Manager'] }]
        };
      }
    }

    setInspectingSession({
      scheme: targetScheme,
      previousPersona: store.activePersona,
      originalRole: store.activePersona.role,
    });

    store.setActiveScheme(targetScheme);
    store.setActivePersona(inspectionPersona);
    store.setIsLoggedIn(true);
    store.setActiveView('dashboard');
    setSessionState('dashboard');
  };

  const handleExitInspection = () => {
    if (inspectingSession) {
      store.setActivePersona(inspectingSession.previousPersona);
    }
    setInspectingSession(null);
    window.location.hash = '#/admin';
    setSessionState('admin_console');
  };

  const handleSwitchInspectionRole = (newRole: string, memberId?: string) => {
    if (!inspectingSession) return;
    
    if (memberId) {
      const targetMember = store.members.find(m => m.id === memberId);
      if (targetMember) {
        store.setActivePersona({
          id: targetMember.id,
          name: targetMember.name,
          role: targetMember.role,
          context: targetMember.unitId,
          email: targetMember.email,
          memberships: [{ schemeId: inspectingSession.scheme.id, roles: [targetMember.role as any] }]
        });
        return;
      }
    }

    const roleMember = store.members.find(m => m.schemeId === inspectingSession.scheme.id && m.role === newRole);
    if (roleMember) {
      store.setActivePersona({
        id: roleMember.id,
        name: roleMember.name,
        role: roleMember.role,
        context: roleMember.unitId,
        email: roleMember.email,
        memberships: [{ schemeId: inspectingSession.scheme.id, roles: [newRole as any] }]
      });
    } else {
      store.setActivePersona(prev => ({
        ...prev,
        id: `inspect_${newRole.toLowerCase().replace(/\s+/g, '_')}`,
        role: newRole,
        name: `${inspectingSession.scheme.name} ${newRole}`,
        context: newRole.includes('Resident') || newRole.includes('Tenant') || newRole.includes('Owner') ? 'Unit 1' : inspectingSession.scheme.name,
        memberships: [{ schemeId: inspectingSession.scheme.id, roles: [newRole as any] }]
      }));
    }
  };

  const handleLogout = async () => {
    if (inspectingSession) {
      handleExitInspection();
      return;
    }
    await supabase.auth.signOut();
    store.setIsLoggedIn(false);
    setSessionState('landing');
  };

  // Render unauthenticated screens
  if (joinSchemeId) {
    return (
      <JoinSchemeView 
        schemeId={joinSchemeId}
        inviteToken={inviteToken || undefined}
        invitedEmail={invitedEmail || undefined}
        invitedName={invitedName || undefined}
        invitedRole={invitedRole || undefined}
        invitedUnit={invitedUnit || undefined}
        invitedLot={invitedLot || undefined}
        store={store}
        onJoinSuccess={async (role, name, siteInfo) => {
          window.location.hash = '';
          if (window.history.pushState) {
            window.history.pushState('', '', '/');
          }
          setJoinSchemeId(null);
          setInviteToken(null);
          setInvitedEmail(null);
          setInvitedName(null);
          setInvitedRole(null);
          setInvitedUnit(null);
          setInvitedLot(null);
          await handleLoginSuccess(role, name, siteInfo);
        }}
        onBackToLanding={() => {
          window.location.hash = '';
          if (window.history.pushState) {
            window.history.pushState('', '', '/');
          }
          setJoinSchemeId(null);
          setInviteToken(null);
          setInvitedEmail(null);
          setInvitedName(null);
          setInvitedRole(null);
          setInvitedUnit(null);
          setInvitedLot(null);
          setSessionState('landing');
        }}
      />
    );
  }

  if (sessionState === 'landing') {
    return (
      <LandingPageView 
        onSelectPersona={handleSelectPersona} 
        theme={store.theme}
        setTheme={store.setTheme}
      />
    );
  }

  if (sessionState === 'admin_login') {
    return (
      <SuperAdminLoginView 
        onLoginSuccess={() => setSessionState('admin_console')}
        onBack={() => {
          window.location.hash = '';
          setSessionState('landing');
        }}
      />
    );
  }

  if (sessionState === 'admin_console') {
    return (
      <AdminView 
        members={store.members}
        schemes={store.schemes}
        requests={store.residentRequests}
        units={store.units}
        theme={store.theme}
        setTheme={store.setTheme}
        onBackToLanding={() => {
          window.location.hash = '';
          setSessionState('landing');
        }}
        onInspectScheme={handleInspectScheme}
        onDeleteMember={store.deleteMember}
        onDeleteScheme={store.deleteScheme}
        onDeleteResidentRequest={store.deleteResidentRequest}
        onAddScheme={store.addScheme}
        onAddMember={store.addMember}
        onAddResidentRequest={store.createMasterRequest}
        onUpdateScheme={store.updateScheme}
        onUpdateMember={store.updateMember}
        onUpdateResidentRequest={store.updateResidentRequest}
        onTriageRequest={store.triageRequest}
        onCloseRequest={store.closeResidentRequest}
        onAddComment={store.addCommentToRequest}
        globalRolePermissions={store.rolePermissions['GLOBAL'] || {}}
        onToggleGlobalPermission={(role, perm) => store.togglePermission('GLOBAL', role, perm)}
        onToggleIndividualPermission={store.toggleIndividualPermission}
        onRefreshData={store.refreshData}
      />
    );
  }

  if (sessionState === 'login') {
    return (
      <ResidentLoginView 
        onLoginSuccess={handleLoginSuccess} 
        onAdminLogin={() => {
          window.location.hash = '#/admin';
          setSessionState('admin_login');
        }}
        onBack={() => setSessionState('landing')}
      />
    );
  }

  // Handle active scheme switcher filters dynamically
  const filteredRequests = store.residentRequests.filter(r => {
    // An author always sees activities they submitted even across un-onboarded schemes or scheme toggles
    const isAuthor = r.requestorName === store.activePersona.name || 
      (store.activePersona.email && r.requestorEmail === store.activePersona.email);
    const isAssigned = r.assignedToName === store.activePersona.name ||
      (store.activePersona.email && (r.assignedToEmail === store.activePersona.email || r.strataManagerEmail === store.activePersona.email));
    const isMatchingScheme = r.schemeId === store.activeScheme.id ||
      (r.buildingName && store.activeScheme.name && r.buildingName.toLowerCase() === store.activeScheme.name.toLowerCase());
    return isAuthor || isAssigned || isMatchingScheme;
  });

  return (
    <div className="flex flex-col h-screen bg-[#F4F6F9] dark:bg-[#0B1121] font-sans text-gray-900 dark:text-gray-100 overflow-hidden relative">
      
      {/* Super Admin Remote Inspection Banner */}
      {inspectingSession && (
        <aside 
          aria-label="Super Admin Remote Inspection Banner"
          className="w-full bg-gradient-to-r from-red-950 via-[#18090d] to-[#0f0c1a] border-b-2 border-red-500/40 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-white z-50 shadow-2xl shrink-0 backdrop-blur-md animate-in slide-in-from-top duration-200"
        >
          <div className="flex items-center gap-3 flex-wrap">
            {/* Pulsing Inspection Badge */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/25 text-red-300 border border-red-500/40 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <ShieldAlert size={13} className="text-red-400" />
                Remote Inspection Active
              </span>
            </div>

            <div className="h-4 w-px bg-white/20 hidden sm:block" />

            {/* Scheme Indicator */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400 font-medium">Scheme:</span>
              <span className="font-extrabold text-white bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                <Building2 size={13} className="text-[#00D4B2]" />
                <span>{inspectingSession.scheme.name}</span>
                <span className="text-gray-400 font-mono text-[10px]">({inspectingSession.scheme.id})</span>
              </span>
            </div>

            <div className="h-4 w-px bg-white/20 hidden md:block" />

            {/* Viewing As & Perspective Switcher */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-gray-400 font-medium">Viewing as:</span>
              <span className="font-bold text-[#00D4B2] bg-[#00D4B2]/10 border border-[#00D4B2]/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <User size={12} />
                <span>{store.activePersona.name}</span>
                <span className="text-gray-400 font-normal">({store.activePersona.role})</span>
              </span>

              {/* Perspective Role Switcher Buttons */}
              <div className="hidden lg:flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/10 text-[11px]">
                {(['Strata Manager', 'Lot Owner', 'Resident', 'Tenant'] as const).map(role => {
                  const isActiveRole = store.activePersona.role === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleSwitchInspectionRole(role)}
                      className={`px-2.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                        isActiveRole
                          ? 'bg-[#0055FF] text-white shadow-sm'
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                      title={`Simulate what a ${role} experiences in this building`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>

              {/* Scheme Member Dropdown */}
              {store.members.filter(m => m.schemeId === inspectingSession.scheme.id).length > 0 && (
                <select
                  value={store.members.find(m => m.email === store.activePersona.email)?.id || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSwitchInspectionRole('', e.target.value);
                    }
                  }}
                  aria-label="Switch scheme member persona"
                  className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-[#00D4B2] cursor-pointer"
                  title="Switch to specific user profile in this building"
                >
                  <option value="" disabled>Specific Member...</option>
                  {store.members
                    .filter(m => m.schemeId === inspectingSession.scheme.id)
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role} - {m.unitId})
                      </option>
                    ))}
                </select>
              )}
            </div>
          </div>

          {/* Right Action: Back to Super Admin Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExitInspection}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 border border-red-400/40"
              title="End remote inspection and return to Super Admin Console"
            >
              <ArrowLeft size={14} className="stroke-[3]" />
              <span>Back to Super Admin</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Inner Application Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Sidebar */}
        <Sidebar 
          activeView={store.activeView}
          setActiveView={store.setActiveView}
          pendingTriageCount={pendingTriageCount}
          activePersonaName={store.activePersona.name}
          activePersonaRole={store.activePersona.role}
          hasPermission={store.hasPermission}
          onLogout={handleLogout}
        />
        
        {/* Content Area */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          <Topbar 
            schemes={userSchemes}
            activeScheme={store.activeScheme} 
            setActiveScheme={store.setActiveScheme}
            personas={PERSONAS}
            activePersona={store.activePersona}
            setActivePersona={store.setActivePersona}
            onAddSchemeClick={() => setShowOnboarding(true)}
            activeRoles={store.activeRoles}
            setActiveRoles={store.setActiveRoles}
            onLogout={handleLogout}
          />
        
        {/* Dynamic View Rendering */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* Shimmer Skeleton during async data fetching */}
          {store.isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* Dashboard View: Resident Portal for Residents/Tenants, Management Dashboard for Managers/Admins */}
              {store.activeView === 'dashboard' && (
                (store.activePersona.role === 'Resident' || store.activePersona.role === 'Tenant' || store.activePersona.role === 'On-Site Resident') ? (
                  <ResidentPortalView 
                    store={store} 
                    onOpenCreateRequest={() => setShowCreateRequestModal(true)} 
                  />
                ) : (
                  <Dashboard store={store} />
                )
              )}

          {/* Team Access View (User Management View with active scheme and permissions matrix) */}
          {store.activeView === 'user_management' && (
            (store.activePersona.role.includes('Admin') || store.activePersona.role.includes('Manager') || store.activePersona.role.includes('Owner') || store.activePersona.role.includes('Committee')) ? (
              <UserManagementView 
                members={store.members.filter(m => m.schemeId === store.activeScheme.id)}
                activePersonaName={store.activePersona.name}
                onAddMember={store.addMember}
                onUpdateMember={store.updateMember}
                onUpdateStatus={store.updateMemberStatus}
                onDeleteMember={store.deleteMember}
                activeSchemeId={store.activeScheme.id}
                rolePermissions={store.rolePermissions[store.activeScheme.id] || {}}
                globalRolePermissions={store.rolePermissions['GLOBAL'] || {}}
                onTogglePermission={(role, perm) => store.togglePermission(store.activeScheme.id, role, perm)}
                onToggleIndividualPermission={store.toggleIndividualPermission}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 h-full">
                <div className="text-2xl font-bold mb-2 text-red-500 dark:text-red-400">Access Denied</div>
                <p className="text-gray-600 dark:text-gray-400">You do not have permission to view the User Management Directory.</p>
              </div>
            )
          )}

          {/* Requests & Activity Module (Unified with Triage Engine) */}
          {(store.activeView === 'requests' || store.activeView === 'triage') && (
            <ResidentRequestsView 
              requests={filteredRequests}
              onSubmitRequest={store.submitResidentRequest}
              onCloseRequest={store.closeResidentRequest}
              onAddComment={store.addCommentToRequest}
              onEditComment={store.editCommentOnRequest}
              onDeleteComment={store.deleteCommentFromRequest}
              onSimulateManagerReply={store.simulateManagerEmailReply}
              onAddInternalNote={store.addInternalNoteToRequest}
              onUpdateStatus={store.updateActivityStatus}
              onUpdatePriority={store.updateActivityPriority}
              onAssignActivity={store.assignActivity}
              onReopenActivity={store.reopenActivity}
              onTriageCase={store.triageRequest}
              initialFilter={store.activeView === 'triage' ? 'needs_triage' : undefined}
              activePersonaName={store.activePersona.name}
              activePersonaRole={store.activePersona.role}
              activePersonaEmail={store.activePersona.email}
              activePersonaPhone="0400 000 000"
              activePersonaContext={store.activePersona.context}
              activeSchemeName={store.activeScheme.name !== 'No Registered Schemes' ? store.activeScheme.name : ''}
              activeManagerEmail={
                store.members.find(m => m.schemeId === store.activeScheme.id && (m.role.includes('Manager') || m.role.includes('Admin')) && m.email !== store.activePersona.email)?.email ||
                (store.activeScheme.id === 'SP103' ? 'emma.wilson@agency.com' : 'romanjoe@gmail.com')
              }
            />
          )}

          {/* Settings & Preferences View */}
          {store.activeView === 'settings' && (
            <SettingsView 
              theme={store.theme}
              setTheme={store.setTheme}
              activePersonaName={store.activePersona.name}
              activePersonaRole={store.activePersona.role}
              activePersonaEmail={store.activePersona.email || ''}
              activePersonaPhone="0400 000 000"
              activePersonaUnit={store.activePersona.context || ''}
              onUpdateProfile={async (updates) => {
                store.setActivePersona(prev => ({
                  ...prev,
                  name: updates.name,
                  email: updates.email,
                }));
                const existingMember = store.members.find(m => m.email?.toLowerCase() === store.activePersona.email?.toLowerCase());
                if (existingMember) {
                  await store.updateMember(existingMember.id, {
                    name: updates.name,
                    email: updates.email,
                    phone: updates.phone,
                  });
                }
                if (updates.password) {
                  try {
                    await supabase.auth.updateUser({ password: updates.password });
                  } catch (pwErr) {
                    console.warn("Could not update auth password:", pwErr);
                  }
                }
              }}
            />
          )}

          {/* Strata Manager Performance View */}
          {store.activeView === 'performance' && (
            <ManagerPerformanceView store={store} />
          )}
          </>
          )}

        </div>
        
      </div>
      </div>

      {/* Onboarding Provisioning Modal */}
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} store={store} />

      {/* Backup Create Request Modal */}
      <CreateRequestModal 
        isOpen={showCreateRequestModal}
        onClose={() => setShowCreateRequestModal(false)}
        onSubmit={store.submitResidentRequest}
        requestorName={store.activePersona.name}
        requestorEmail={`${store.activePersona.name.toLowerCase().replace(/\s+/g, '.')}@unit10.com`}
        requestorPhone="0412 888 999"
      />
    </div>
  );
}

// End of App component
// Style: Apply custom scrollbar track styling for dark mode

// Style: Polish remote inspection sticky banner indicator and contrast
// Navigation: Clean session exit on popstate and hash change events
// Style: Refine perspective switcher pills with active glow indicators