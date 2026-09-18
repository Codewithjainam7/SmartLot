// @smartlot/core
import React, { useState, useEffect } from 'react';
import { useSmartLotStore } from './store/smartLotStore';
import { PERSONAS, Persona, Scheme } from './types';
import { ShieldAlert, ArrowLeft, Building2, User, Eye, Zap, LayoutDashboard, ClipboardList, Vote, Menu, MessageSquareHeart } from 'lucide-react';
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
import { CoolLoadingScreen, GlobalBufferingBar } from './components/core/CoolLoadingScreen';
import { AnimatePresence, motion } from 'motion/react';
import { ResidentPortalView } from './components/ResidentPortalView';
import { ManagerPerformanceView } from './components/ManagerPerformanceView';
import { VotingHubView } from './components/VotingHubView';
import { SurveysView } from './components/SurveysView';
import { GuestSurveyView } from './components/GuestSurveyView';
import { VendorView } from './components/VendorView';
import { GuestPortalView } from './components/GuestPortalView';

export default function App() {
  const store = useSmartLotStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [surveyToken, setSurveyToken] = useState<string | null>(null);
  const [activeGuestWorkOrderId, setActiveGuestWorkOrderId] = useState<string | null>(null);

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

  // Desktop sidebar collapse state persisted across reloads
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('smartlot_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('smartlot_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut (Ctrl+B or Cmd+B) to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        handleToggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const parseUrl = () => {
      const hashStr = window.location.hash || '';
      const pathStr = window.location.pathname || '';

      // Extract query parameters from both window.location.search and hash (?token=...)
      const searchParams = new URLSearchParams(window.location.search ? window.location.search.replace(/^\?/, '') : '');
      const hashParams = new URLSearchParams(hashStr.includes('?') ? hashStr.split('?')[1] : '');
      const getParam = (key: string) => searchParams.get(key) || hashParams.get(key);

      const token = getParam('token');
      const email = getParam('email');
      const name = getParam('name');
      const role = getParam('role');
      const unit = getParam('unit');
      const lot = getParam('lot');
      const schemeFromParam = getParam('scheme');
      const surveyParam = getParam('survey_token') || getParam('survey');
      const woTokenParam = getParam('wo_token') || getParam('token_wo');

      if (surveyParam) {
        setSurveyToken(surveyParam);
      }

      if (woTokenParam) {
        try {
          const decoded = atob(woTokenParam);
          const [woId] = decoded.split(':');
          if (woId) {
            setActiveGuestWorkOrderId(woId);
          }
        } catch {
          // If already plain ID
          setActiveGuestWorkOrderId(woTokenParam);
        }
      }

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
      const hash = window.location.hash;
      setSessionState(prev => {
        if (hash === '#/admin' && prev !== 'admin_console') {
          return 'admin_login';
        } else if ((prev === 'admin_login' || prev === 'admin_console') && hash !== '#/admin') {
          return 'landing';
        }
        return prev;
      });
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [inspectingSession]);

  // Handle theme state preferences dynamically
  useEffect(() => {
    if (store.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [store.theme]);

  const pendingTriageCount = store.residentRequests.filter(r => r.status === 'pending_triage' || r.status === 'new').length;
  const activeSurveysCount = (store.surveys || []).filter(s => (!s.schemeId || s.schemeId === store.activeScheme?.id) && s.status === 'active').length;

  // If user is website administrator or inspecting, they can see all schemes or the inspected scheme; otherwise strictly their own scheme(s)
  const isWebAdmin = store.activePersona.role === 'Website Administrator' || (store.activePersona as any).isSystemAdmin;

  // Isolate schemes strictly to the logged-in user's memberships (memoized to prevent re-render loops)
  const userSchemes = React.useMemo(() => {
    const userMemberRows = store.members.filter(m => m.email?.toLowerCase() === store.activePersona.email?.toLowerCase());
    const userSchemeIds = new Set(userMemberRows.map(m => m.schemeId));
    if (store.activePersona?.memberships) {
      store.activePersona.memberships.forEach((mb: any) => {
        if (mb.schemeId) userSchemeIds.add(mb.schemeId);
      });
    }
    return (isWebAdmin || inspectingSession)
      ? (inspectingSession ? [inspectingSession.scheme, ...store.schemes.filter(s => s.id !== inspectingSession.scheme.id)] : store.schemes)
      : (userSchemeIds.size > 0 
          ? store.schemes.filter(s => userSchemeIds.has(s.id))
          : (store.activeScheme && store.activeScheme.id !== 'NO_SCHEME' ? [store.activeScheme] : store.schemes.filter(s => s.id === 'SP101')));
  }, [store.members, store.activePersona.email, store.activePersona.memberships, isWebAdmin, inspectingSession, store.schemes, store.activeScheme]);

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

    const memberEmail = seeded?.email || `${name.toLowerCase().replace(/\s+/g, '.')}@strata.com.au`;
    const savedAvatar = typeof window !== 'undefined' ? (window.localStorage.getItem(`smartlot_avatar_${memberEmail.toLowerCase()}`) || window.localStorage.getItem('smartlot_active_avatar')) : null;

    const newPersona = {
      ...seeded,
      id: personaId,
      role: userRole,
      name: name,
      context: unitContext,
      email: memberEmail,
      avatarUrl: savedAvatar || seeded?.avatarUrl,
      memberships
    };

    store.setActivePersona(newPersona);
    store.setIsLoggedIn(true);
    setSessionState('dashboard');
    store.setActiveView('dashboard');

    // Register member context in store - deduplicate by email+schemeId
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

  // Zero-login survey guest access (Part 1)
  if (surveyToken) {
    return (
      <GuestSurveyView 
        surveyToken={surveyToken}
        store={store}
        onClose={() => {
          setSurveyToken(null);
          if (window.history.pushState) {
            window.history.pushState('', '', window.location.pathname);
          }
        }}
      />
    );
  }

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

  // Zero-Login Tradie Portal Mode
  if (activeGuestWorkOrderId) {
    const activeGuestWo = store.workOrders.find(wo => wo.id === activeGuestWorkOrderId);
    if (activeGuestWo) {
      return (
        <GuestPortalView 
          workOrder={activeGuestWo}
          store={store}
          onSubmitCompletion={(woId, photoUrl, finalCost) => {
            store.submitGuestWorkOrderCompletion(woId, photoUrl, finalCost);
          }}
          onBack={() => setActiveGuestWorkOrderId(null)}
        />
      );
    }
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

  const activeMotionsCount = store.motions.filter(
    m => (!m.schemeId || m.schemeId === store.activeScheme.id) && m.status === 'active'
  ).length;

  return (
    <div className="flex flex-col h-screen h-[100dvh] w-full overflow-x-hidden bg-[#F4F6F9] dark:bg-[#0B1121] font-sans text-gray-900 dark:text-gray-100 overflow-hidden relative">
      
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
              <div className="flex items-center gap-1 ml-1 bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full scrollbar-none shrink-0">
                {PERSONAS
                  .filter(p => p.role !== 'Super Admin' && p.role !== 'Service Provider')
                  .slice(0, 5)
                  .map(p => {
                    const isCurrent = store.activePersona.name === p.name;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => store.setActivePersona(p)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          isCurrent 
                            ? 'bg-[#00D4B2] text-black shadow-xs' 
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                        title={`Quick Switch to ${p.name} (${p.role})`}
                      >
                        {p.role.replace('Strata ', '').replace('Building ', 'Bldg ')}
                      </button>
                    );
                  })}
              </div>

              {/* Additional Personas Dropdown for overflow */}
              {PERSONAS.filter(p => p.role !== 'Super Admin').length > 5 && (
                <select
                  value={store.activePersona.name}
                  onChange={(e) => {
                    const found = PERSONAS.find(p => p.name === e.target.value);
                    if (found) store.setActivePersona(found);
                  }}
                  className="bg-black/50 border border-white/20 rounded-lg text-white text-[11px] font-bold px-2 py-0.5 outline-none cursor-pointer hover:border-white/40"
                  title="More personas"
                >
                  <option value="" disabled className="bg-gray-900 text-gray-400">More roles...</option>
                  {PERSONAS
                    .filter(p => p.role !== 'Super Admin' && p.role !== 'Service Provider')
                    .slice(5)
                    .map(p => (
                      <option key={p.name} value={p.name} className="bg-gray-900 text-white">
                        {p.name} ({p.role})
                      </option>
                    ))}
                </select>
              )}

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
        {/* Mobile Backdrop Overlay */}
        {isMobileNavOpen && (
          <div 
            onClick={() => setIsMobileNavOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200" 
          />
        )}

        {/* Main Sidebar */}
        <Sidebar 
          activeView={store.activeView}
          setActiveView={store.setActiveView}
          pendingTriageCount={pendingTriageCount}
          activeMotionsCount={activeMotionsCount}
          activeWorkOrdersCount={store.workOrders.filter(w => (!w.schemeId || w.schemeId === store.activeScheme.id) && w.status !== 'completed').length}
          activePersonaName={store.activePersona.name}
          activePersonaRole={store.activePersona.role}
          activePersonaContext={store.activePersona.context}
          activePersonaAvatar={store.activePersona.avatarUrl || null}
          activeSchemeName={store.activeScheme?.name}
          activeSchemeId={store.activeScheme?.id}
          theme={store.theme}
          onToggleTheme={() => store.setTheme(store.theme === 'dark' ? 'light' : 'dark')}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
          hasPermission={store.hasPermission}
          onLogout={handleLogout}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
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
            onOpenMobileMenu={() => setIsMobileNavOpen(true)}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebarCollapse={handleToggleSidebarCollapse}
          />
        
        {/* Global Shimmering Top Laser Bar during background syncing/buffering */}
        <GlobalBufferingBar active={store.isLoading && store.schemes.length > 0} />

        {/* Dynamic View Rendering with Fluid Page Switching Transitions */}
        <div className="flex-1 overflow-hidden relative pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          
          {/* Cool Branded Loading Screen during initial bootstrap or scheme sync */}
          {store.isLoading && store.schemes.length === 0 ? (
            <CoolLoadingScreen />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={store.activeView + '-' + store.activeScheme?.id + '-' + (store.activePersona?.role?.includes('Resident') ? 'res' : 'admin')}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.2, 0.9, 0.3, 1] }}
                className="w-full h-full flex flex-col flex-1 overflow-hidden"
              >
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
              workOrders={store.workOrders}
              vendors={store.vendors}
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
              onInitiateVotingFlow={(reqId, payload) => {
                store.initiateVotingForRequest(reqId, { caseId: reqId, ...payload });
                store.setActiveView('voting');
              }}
              onNavigateToVoting={() => {
                store.setActiveView('voting');
              }}
              onOpenGuestPortal={(woId) => setActiveGuestWorkOrderId(woId)}
              onRequestQuotes={store.requestQuotesForRequest}
              onVoteForQuote={(reqId, qteId) => store.voteForQuote(reqId, qteId, store.activePersona.name)}
              onAwardQuote={(reqId, qteId, budgetCap, pin) => store.awardQuoteAndCreateWorkOrder(reqId, qteId, budgetCap, pin, store.activePersona.name)}
              onSignOffWorkOrder={(woId, notes) => store.signOffWorkOrder(woId, notes, store.activePersona.name)}
              onNavigateToTrades={() => store.setActiveView('vendors')}
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

          {/* Voting Hub: Community & Committee Motions */}
          {store.activeView === 'voting' && (
            <VotingHubView 
              motions={store.motions}
              requests={store.residentRequests}
              onCreateMotion={store.createMotion}
              onCastBallot={store.castBallot}
              onRequestRFI={store.requestMotionRFI}
              onSubmitRevisedProposal={store.submitRevisedProposal}
              onRestartVoting={store.restartVoting}
              onSendSCMReminder={store.sendSCMReminder}
              onSendBlastReminder={store.sendBlastReminder}
              onExtendDeadline={store.extendMotionDeadline}
              onMarkUnresolved={store.markMotionUnresolved}
              onCloseVotingEarly={store.closeVotingEarly}
              onResolveMotion={store.resolveMotion}
              onAddComment={store.addMotionComment}
              onNavigateToRequest={() => store.setActiveView('requests')}
              activePersonaName={store.activePersona.name}
              activePersonaRole={store.activePersona.role}
              activeSchemeName={store.activeScheme.name}
              activeSchemeId={store.activeScheme.id}
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
              activePersonaAvatar={store.activePersona.avatarUrl || null}
              onUpdateProfile={async (updates) => {
                store.setActivePersona(prev => ({
                  ...prev,
                  name: updates.name,
                  email: updates.email,
                  avatarUrl: updates.avatarUrl !== undefined ? (updates.avatarUrl || undefined) : prev.avatarUrl,
                }));

                const targetEmail = (updates.email || store.activePersona.email || '').toLowerCase();

                // 1. Persist avatar in browser storage
                if (updates.avatarUrl) {
                  try {
                    if (targetEmail) localStorage.setItem(`smartlot_avatar_${targetEmail}`, updates.avatarUrl);
                    localStorage.setItem('smartlot_active_avatar', updates.avatarUrl);
                  } catch (e) {
                    console.warn("Could not write avatar to localStorage:", e);
                  }
                } else if (updates.avatarUrl === null) {
                  try {
                    if (targetEmail) localStorage.removeItem(`smartlot_avatar_${targetEmail}`);
                    localStorage.removeItem('smartlot_active_avatar');
                  } catch (e) {
                    console.warn("Could not remove avatar from localStorage:", e);
                  }
                }

                // 2. Persist avatar and name in Supabase profiles table
                if (targetEmail) {
                  try {
                    await supabase
                      .from('profiles')
                      .update({
                        full_name: updates.name,
                        avatar_url: updates.avatarUrl === null ? null : (updates.avatarUrl || undefined),
                      })
                      .ilike('email', targetEmail);
                  } catch (pErr) {
                    console.warn("Could not update supabase profile avatar:", pErr);
                  }
                }

                // 3. Update matching member record in store
                const existingMember = store.members.find(m => m.email?.toLowerCase() === targetEmail);
                if (existingMember) {
                  await store.updateMember(existingMember.id, {
                    name: updates.name,
                    email: updates.email,
                    phone: updates.phone,
                  });
                }

                // 4. Update auth password if provided
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

          {/* Resident Feedback & Surveys View (Part 1) */}
          {store.activeView === 'surveys' && (
            <SurveysView 
              store={store} 
              onOpenGuestView={(tok) => setSurveyToken(tok)}
            />
          )}

          {/* Trades & Work Orders Hub: Strictly Strata Managers, Admins, and Committee Members */}
          {store.activeView === 'vendors' && (
            (store.activePersona.role?.includes('Manager') || store.activePersona.role?.includes('Admin') || store.activePersona.role?.includes('Committee')) ? (
              <VendorView 
                vendors={store.vendors}
                workOrders={store.workOrders}
                requests={store.residentRequests}
                onOpenGuestPortal={(woId) => setActiveGuestWorkOrderId(woId)}
                onVerifyWorkOrder={store.verifyWorkOrder}
                onSignOffWorkOrder={(woId, notes) => store.signOffWorkOrder(woId, notes, store.activePersona.name)}
                onRequestQuotes={store.requestQuotesForRequest}
                onVoteForQuote={(reqId, qteId) => store.voteForQuote(reqId, qteId, store.activePersona.name)}
                onAwardQuote={(reqId, qteId, budgetCap, pin) => store.awardQuoteAndCreateWorkOrder(reqId, qteId, budgetCap, pin, store.activePersona.name)}
                onAddVendor={store.addVendor}
                onDeleteVendor={store.deleteVendor}
                onUpdateVendorInsurance={store.updateVendorInsurance}
                activePersonaName={store.activePersona.name}
                activePersonaRole={store.activePersona.role}
                activeSchemeName={store.activeScheme.name}
                activeSchemeId={store.activeScheme.id}
              />
            ) : (
              <div className="p-8 text-center bg-white dark:bg-[#0d1117] rounded-3xl border border-gray-200 dark:border-white/10 max-w-lg mx-auto mt-12 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <ShieldAlert size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Restricted Access</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Trades & Work Orders are managed exclusively by the Strata Management Agency and Strata Committee.
                </p>
                <button
                  onClick={() => store.setActiveView('requests')}
                  className="px-4 py-2 rounded-xl bg-[#0055FF] text-white text-xs font-bold"
                >
                  Return to My Requests
                </button>
              </div>
            )
          )}
              </motion.div>
            </AnimatePresence>
          )}

        </div>
        
      </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile Bottom Navigation"
        className="smartlot-mobile-nav fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0B1121]/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800/80 px-1 pt-1.5 pb-safe flex items-center justify-around md:hidden shadow-lg"
      >
        <button
          type="button"
          onClick={() => store.setActiveView('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer min-h-[48px] select-none active:scale-95 ${
            store.activeView === 'dashboard'
              ? 'text-[#0055FF] dark:text-[#00D4B2] font-extrabold'
              : 'text-gray-500 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <LayoutDashboard size={20} className={store.activeView === 'dashboard' ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
        </button>

        <button
          type="button"
          onClick={() => store.setActiveView('requests')}
          className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer min-h-[48px] select-none active:scale-95 ${
            store.activeView === 'requests' || store.activeView === 'triage'
              ? 'text-[#0055FF] dark:text-[#00D4B2] font-extrabold'
              : 'text-gray-500 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ClipboardList size={20} className={store.activeView === 'requests' || store.activeView === 'triage' ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5 tracking-tight">Requests</span>
          {pendingTriageCount > 0 && (
            <span className="absolute top-1 right-3 min-w-4 h-4 px-1 bg-[#FF4757] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
              {pendingTriageCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => store.setActiveView('voting')}
          className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer min-h-[48px] select-none active:scale-95 ${
            store.activeView === 'voting'
              ? 'text-[#0055FF] dark:text-[#00D4B2] font-extrabold'
              : 'text-gray-500 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Vote size={20} className={store.activeView === 'voting' ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5 tracking-tight">Voting</span>
          {activeMotionsCount > 0 && (
            <span className="absolute top-1 right-3 min-w-4 h-4 px-1 bg-[#0055FF] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
              {activeMotionsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => store.setActiveView('surveys')}
          className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer min-h-[48px] select-none active:scale-95 ${
            store.activeView === 'surveys'
              ? 'text-[#0055FF] dark:text-[#00D4B2] font-extrabold'
              : 'text-gray-500 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <MessageSquareHeart size={20} className={store.activeView === 'surveys' ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5 tracking-tight">Surveys</span>
          {activeSurveysCount > 0 && (
            <span className="absolute top-1 right-3 min-w-4 h-4 px-1 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
              {activeSurveysCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsMobileNavOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-gray-500 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer min-h-[48px] select-none active:scale-95"
        >
          <Menu size={20} />
          <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
        </button>
      </nav>

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
// Accessibility: ARIA attributes for remote inspection banner
// Documentation: Super Admin remote login impersonation session flow