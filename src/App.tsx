import React, { useState, useEffect } from 'react';
import { useSmartLotStore } from './store/smartLotStore';
import { PERSONAS, Persona } from './types';
import { supabase } from './lib/supabase';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './components/Dashboard';
import { TriageView } from './components/TriageView';
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

  // Pre-fill parameters when redirecting from landing page simulating a persona
  const [prefillPersona, setPrefillPersona] = useState<string | null>(null);
  const [joinSchemeId, setJoinSchemeId] = useState<string | null>(null);

  useEffect(() => {
    const parseUrl = () => {
      const hashMatch = window.location.hash.match(/^#\/join\/([A-Za-z0-9_-]+)/);
      const pathMatch = window.location.pathname.match(/^\/join\/([A-Za-z0-9_-]+)/);
      const schemeId = hashMatch ? hashMatch[1] : (pathMatch ? pathMatch[1] : null);

      if (schemeId) {
        setJoinSchemeId(schemeId);
      } else {
        setJoinSchemeId(null);
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
  }, [sessionState]);

  // Handle theme state preferences dynamically
  useEffect(() => {
    if (store.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [store.theme]);

  const pendingTriageCount = store.residentRequests.filter(r => r.status === 'pending_triage' || r.status === 'new').length;

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
    
    // Anyone creating a new site automatically becomes Strata Admin
    const userRole = siteInfo ? (isFreshSignup ? role : 'Strata Admin') : role;

    // Look up matching seeded persona to preserve their portfolio memberships
    const seeded = !isFreshSignup ? [...PERSONAS, ...store.customPersonas].find(p => p.name.toLowerCase() === name.toLowerCase() || p.id === personaId) : null;
    const memberships = seeded?.memberships || (isFreshSignup ? [] : [
      {
        schemeId: scheme.id,
        roles: [userRole as any]
      }
    ]);

    const newPersona = {
      ...seeded,
      id: personaId,
      role: userRole,
      name: name,
      context: siteInfo ? (isFreshSignup ? 'Unit 10' : `Unit 1 (${siteInfo.name})`) : 'Unit 10',
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
          unitId: (userRole.includes('Manager') || userRole.includes('Admin')) ? 'HQ / Management' : 'Unit 1',
          lotNumber: (userRole.includes('Manager') || userRole.includes('Admin')) ? 0 : 1,
          status: 'Active' as const,
          joinedAt: new Date().toISOString().split('T')[0],
        },
        ...prev
      ];
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    store.setIsLoggedIn(false);
    setSessionState('landing');
  };

  // Render unauthenticated screens
  if (joinSchemeId) {
    return (
      <JoinSchemeView 
        schemeId={joinSchemeId}
        onJoinSuccess={async (role, name, siteInfo) => {
          window.location.hash = '';
          if (window.history.pushState) {
            window.history.pushState('', '', '/');
          }
          setJoinSchemeId(null);
          await handleLoginSuccess(role, name, siteInfo);
        }}
        onBackToLanding={() => {
          window.location.hash = '';
          if (window.history.pushState) {
            window.history.pushState('', '', '/');
          }
          setJoinSchemeId(null);
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
        onDeleteMember={store.deleteMember}
        onDeleteScheme={store.deleteScheme}
        onAddScheme={store.addScheme}
        onTriageRequest={store.triageRequest}
        onCloseRequest={store.closeResidentRequest}
        onAddComment={store.addCommentToRequest}
        globalRolePermissions={store.rolePermissions['GLOBAL'] || {}}
        onToggleGlobalPermission={(role, perm) => store.togglePermission('GLOBAL', role, perm)}
        onSwitchToScheme={(schemeId) => {
          const target = store.schemes.find(s => s.id === schemeId);
          if (target) {
            store.setActiveScheme(target);
            window.location.hash = '';
            setSessionState('dashboard');
          }
        }}
      />
    );
  }

  if (sessionState === 'login') {
    return (
      <ResidentLoginView 
        onLoginSuccess={handleLoginSuccess} 
        onAdminLogin={() => {
          window.location.hash = '#/admin';
          setSessionState('admin_console');
        }}
        onBack={() => setSessionState('landing')}
      />
    );
  }

  // Handle active scheme switcher filters dynamically
  const filteredRequests = store.residentRequests.filter(r => {
    return r.schemeId === store.activeScheme.id;
  });

  return (
    <div className="flex h-screen bg-[#F4F6F9] dark:bg-[#0B1121] font-sans text-gray-900 dark:text-gray-100 overflow-hidden relative">
      
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
          schemes={store.schemes}
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
          
           {/* Dashboard View */}
          {store.activeView === 'dashboard' && (
            <Dashboard store={store} />
          )}

          {/* Team Access View (User Management View with active scheme and permissions matrix) */}
          {store.activeView === 'user_management' && (
            (store.activePersona.role.includes('Admin') || store.activePersona.role.includes('Manager')) ? (
              <UserManagementView 
                members={store.members.filter(m => m.schemeId === store.activeScheme.id)}
                activePersonaName={store.activePersona.name}
                onAddMember={store.addMember}
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

          {/* Requests Module */}
          {store.activeView === 'requests' && (
            <ResidentRequestsView 
              requests={filteredRequests}
              onSubmitRequest={store.submitResidentRequest}
              onCloseRequest={store.closeResidentRequest}
              onAddComment={store.addCommentToRequest}
              activePersonaName={store.activePersona.name}
              activePersonaRole={store.activePersona.role}
            />
          )}

          {/* Manager Triage View */}
          {store.activeView === 'triage' && (
            <TriageView 
              cases={filteredRequests as any}
              onSubmitCase={store.submitResidentRequest as any}
              onTriageCase={store.triageRequest}
              activePersonaRole={store.activePersona.role}
            />
          )}

          {/* Settings & Preferences View */}
          {store.activeView === 'settings' && (
            <SettingsView 
              theme={store.theme}
              setTheme={store.setTheme}
              activePersonaName={store.activePersona.name}
              activePersonaRole={store.activePersona.role}
            />
          )}

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
