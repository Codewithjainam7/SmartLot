import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './components/Dashboard';
import { OnboardingModal } from './components/OnboardingModal';
import { SCHEMES, PERSONAS } from './types';

export default function App() {
  const [activeScheme, setActiveScheme] = useState(SCHEMES[0]);
  const [activePersona, setActivePersona] = useState(PERSONAS[0]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <div className="flex h-screen bg-[#F2F4F8] font-sans text-gray-900 overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full relative">
        <Topbar 
          activeScheme={activeScheme} 
          setActiveScheme={setActiveScheme}
          activePersona={activePersona}
          setActivePersona={setActivePersona}
        />
        
        <Dashboard />
        
        {/* Floating Action Button to trigger Onboarding Modal */}
        <button
          onClick={() => setShowOnboarding(true)}
          className="absolute bottom-8 right-8 bg-[#121316] hover:bg-black text-white px-6 py-3 rounded-full shadow-lg font-semibold text-sm flex items-center gap-2 transition-transform hover:scale-105"
        >
          <span className="w-5 h-5 rounded-full bg-[#D8F235] text-[#121316] flex items-center justify-center font-bold text-lg leading-none pb-0.5">+</span>
          New Scheme
        </button>
      </div>

      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </div>
  );
}
