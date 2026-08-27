import React, { useState, useEffect } from 'react';
import { useSmartLotStore } from './store/smartLotStore';
import { PERSONAS, Persona } from './types';
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

export default function App() {
  const store = useSmartLotStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);

  // Landing page and admin navigation state
  const [sessionState, setSessionState] = useState<'landing' | 'login' | 'admin_console' | 'dashboard'>('landing');

  // Pre-fill parameters when redirecting from landing page simulating a persona
  const [prefillPersona, setPrefillPersona] = useState<string | null>(null);

  // Separate Admin console hash router trigger
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#/admin') {
        setSessionState('admin_console');
      } else if (sessionState === 'admin_console') {
        setSessionState('landing');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [sessionState]);

  const pendingTriageCount = store.residentRequests.filter(r => r.status === 'pending_triage' || r.status === 'new').length;

  const handleSelectPersona = (personaId: string) => {
    if (personaId === 'web_admin') {
      window.location.hash = '#/admin';
    } else if (personaId === 'guest') {
      setPrefillPersona(null);
      setSessionState('login');
    } else {
      // Simulate/Trigger signup with preset parameters
      setPrefillPersona(personaId);
      setSessionState('login');
    }
  };

  const handleLoginSuccess = (
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
        scheme = store.addScheme(siteInfo.id, `${siteInfo.id} - ${siteInfo.name}`, siteInfo.lots);
      }
      store.setActiveScheme(scheme);
    }

    const personaId = name.toLowerCase().replace(/\s+/g, '_');
    const isFreshSignup = siteInfo && siteInfo.id === '';
    
    // Anyone creating a new site automatically becomes Strata Admin
    const userRole = siteInfo ? (isFreshSignup ? role : 'Strata Admin') : role;

    // Look up matching seeded persona to preserve their portfolio memberships
    const seeded = !isFreshSignup ? PERSONAS.find(p => p.name.toLowerCase() === name.toLowerCase() || p.id === personaId) : null;
    const memberships = seeded?.memberships || (isFreshSignup ? [] : [
      {
        schemeId: scheme.id,
        roles: [userRole as any]
      }
    ]);

    const newPersona = {
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

    // Register member context in store if not present
    const memberExists = store.members.some(m => m.name === name);
    if (!memberExists) {
      store.setMembers(prev => [
        {
          id: `MEM-${100 + store.members.length + 1}`,
          name,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@strata.com.au`,
          phone: '0400 000 000',
          schemeId: scheme.id,
          role: (role === 'Strata Admin' ? 'Strata Manager' : role) as any,
          unitId: 'Unit 1',
          lotNumber: 1,
          status: 'Active',
          joinedAt: new Date().toISOString().split('T')[0],
        },
        ...prev
      ]);
    }
  };

  const handleLogout = () => {
    store.setIsLoggedIn(false);
    setSessionState('landing');
  };

  // Render unauthenticated screens
  if (sessionState === 'landing') {
    return <LandingPageView onSelectPersona={handleSelectPersona} />;
  }

  if (sessionState === 'admin_console') {
    return (
      <AdminView 
        members={store.members}
        schemes={store.schemes}
        onBackToLanding={() => {
          window.location.hash = '';
          setSessionState('landing');
        }}
        onDeleteMember={store.deleteMember}
        onDeleteScheme={store.deleteScheme}
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
    // If the persona has context, filter or display matching scheme requests
    if (store.activePersona.name === 'Emma Wilson') {
      // Emma can see Coronation (SP102) and Cavaller (SP103) requests based on switch
      if (store.activeScheme.id === 'SP102') {
        return r.unit.includes('Coronation') || r.id === 'REQ-102'; // Coronation mocks
      } else if (store.activeScheme.id === 'SP103') {
        return r.unit.includes('Cavaller') || r.id === 'REQ-101'; // Cavaller mocks
      }
    }
    return true; // Default fallthrough
  });

  return (
    <div className="flex h-screen bg-[#F4F6F9] font-sans text-gray-900 overflow-hidden relative">
      
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
          personas={store.activePersona.role === 'Super Admin' || store.activePersona.role === 'Website Administrator' ? PERSONAS : PERSONAS}
          activePersona={store.activePersona}
          setActivePersona={store.setActivePersona}
          onAddSchemeClick={() => setShowOnboarding(true)}
          activeRoles={store.activeRoles}
          setActiveRoles={store.setActiveRoles}
        />
        
        {/* Dynamic View Rendering */}
        <div className="flex-1 overflow-hidden relative">
          
           {/* Dashboard View */}
          {store.activeView === 'dashboard' && (
            <Dashboard store={store} />
          )}

          {/* Team Access View (User Management View with active scheme and permissions matrix) */}
          {store.activeView === 'user_management' && store.hasPermission('Role & Permission Setup') && (
            <UserManagementView 
              members={store.members.filter(m => m.schemeId === store.activeScheme.id)}
              activePersonaName={store.activePersona.name}
              onAddMember={store.addMember}
              onUpdateStatus={store.updateMemberStatus}
              onDeleteMember={store.deleteMember}
              activeSchemeId={store.activeScheme.id}
              rolePermissions={store.rolePermissions[store.activeScheme.id] || {}}
              onTogglePermission={(role, perm) => store.togglePermission(store.activeScheme.id, role, perm)}
            />
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
