import React, { useState } from 'react';
import { useSmartLotStore } from './store/smartLotStore';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './components/Dashboard';
import { TriageView } from './components/TriageView';
import { OnboardingModal } from './components/OnboardingModal';

// User Management & Requests Module Views
import { UserManagementView } from './components/UserManagementView';
import { ResidentLoginView } from './components/ResidentLoginView';
import { ResidentDashboardView } from './components/ResidentDashboardView';
import { CreateRequestModal } from './components/CreateRequestModal';
import { ResidentRequestsView } from './components/ResidentRequestsView';

export default function App() {
  const store = useSmartLotStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);

  const pendingTriageCount = store.residentRequests.filter(r => r.status === 'pending_triage' || r.status === 'new').length;

  const handleLoginSuccess = (role: 'Lot Owner' | 'Resident' | 'Tenant', name: string) => {
    store.setIsLoggedIn(true);
    store.setActivePersona({
      id: role.toLowerCase().replace(/\s+/g, '_'),
      role: role === 'Lot Owner' ? 'Off-Site Lot Owner' : role === 'Tenant' ? 'Tenant Occupant' : 'On-Site Resident',
      name,
      context: 'Unit 10',
    });
    store.setActiveView('dashboard');
  };

  if (!store.isLoggedIn) {
    return <ResidentLoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-[#F4F6F9] font-sans text-gray-900 overflow-hidden relative">
      
      {/* Main Sidebar */}
      <Sidebar 
        activeView={store.activeView}
        setActiveView={store.setActiveView}
        pendingTriageCount={pendingTriageCount}
        activePersonaName={store.activePersona.name}
        activePersonaRole={store.activePersona.role}
      />
      
      {/* Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <Topbar 
          activeScheme={store.activeScheme} 
          setActiveScheme={store.setActiveScheme}
          activePersona={store.activePersona}
          setActivePersona={store.setActivePersona}
        />
        
        {/* Dynamic View Rendering focusing on User Management & Requests Module */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* Dashboard View */}
          {store.activeView === 'dashboard' && (
            (store.activePersona.role.includes('Admin') || store.activePersona.role.includes('Manager')) ? (
              <Dashboard />
            ) : (
              <ResidentDashboardView 
                requests={store.residentRequests}
                onNavigateToRequests={() => store.setActiveView('requests')}
                onSubmitRequest={store.submitResidentRequest}
                activePersonaName={store.activePersona.name}
                activePersonaRole={store.activePersona.role}
              />
            )
          )}

          {/* User Management Module */}
          {store.activeView === 'user_management' && (
            <UserManagementView 
              members={store.members}
              onAddMember={store.addMember}
              onUpdateStatus={store.updateMemberStatus}
              onDeleteMember={store.deleteMember}
            />
          )}

          {/* Requests Module */}
          {store.activeView === 'requests' && (
            <ResidentRequestsView 
              requests={store.residentRequests}
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
              cases={store.residentRequests as any}
              onSubmitCase={store.submitResidentRequest as any}
              onTriageCase={store.triageRequest}
              activePersonaRole={store.activePersona.role}
            />
          )}

        </div>
        
        {/* Floating CTA Pill Button */}
        <button
          onClick={() => setShowOnboarding(true)}
          className="fixed bottom-8 right-8 bg-[#121316] hover:bg-black text-white px-6 py-3.5 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2.5 transition-all hover:scale-105 z-30 border border-white/10 cursor-pointer"
        >
          <span className="w-6 h-6 rounded-full bg-[#D8F235] text-[#121316] flex items-center justify-center font-bold text-base leading-none pb-0.5">+</span>
          <span>New Scheme Setup</span>
        </button>
      </div>

      {/* Onboarding Provisioning Modal */}
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />

      {/* Backup Create Request Modal */}
      <CreateRequestModal 
        isOpen={showCreateRequestModal}
        onClose={() => setShowCreateRequestModal(false)}
        onSubmit={store.submitResidentRequest}
        requestorName={store.activePersona.name}
        requestorEmail="lisa@unit10.com"
        requestorPhone="0412 888 999"
      />

    </div>
  );
}
