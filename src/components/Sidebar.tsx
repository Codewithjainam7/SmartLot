// @smartlot/component
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  PanelLeftClose, 
  PanelLeftOpen,
  Wrench,
  UserCheck,
  FileText,
  Settings
} from 'lucide-react';
import { SmartLotLogo } from './core/SmartLotLogo';

interface SidebarProps {
  activeView: 'dashboard' | 'user_management' | 'requests' | 'triage' | 'settings';
  setActiveView: (view: 'dashboard' | 'user_management' | 'requests' | 'triage' | 'settings') => void;
  pendingTriageCount?: number;
  activePersonaName?: string;
  activePersonaRole?: string;
  hasPermission: (perm: string) => boolean;
  onLogout: () => void;
}

export function Sidebar({ 
  activeView, 
  setActiveView, 
  pendingTriageCount = 2,
  activePersonaName = 'Alex Vance',
  activePersonaRole = 'Strata Manager',
  hasPermission,
  onLogout
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      className={`relative flex flex-col h-screen shrink-0 border-r shadow-2xl z-40 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] bg-white dark:bg-[#050505] text-gray-900 dark:text-white border-gray-200 dark:border-gray-900 bg-gradient-to-l from-black/[0.01] dark:from-white/[0.04] to-transparent ${
        isCollapsed ? 'w-[80px]' : 'w-[280px]'
      }`}
    >
      
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between px-6'} py-6 mb-2 transition-all duration-300`}>
        <div 
          className="flex items-center gap-3 overflow-hidden cursor-pointer" 
          onClick={onLogout}
          title="Back to Landing Page"
        >
          <SmartLotLogo className="h-8" iconOnly={isCollapsed} />
        </div>

        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }} 
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      {/* Inner Scrollable Panel */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 space-y-6">
        
        {/* Core Navigation Modules for Current Sprint */}
        <div>
          <div className={`text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 transition-all duration-300 ${isCollapsed ? 'text-center px-0' : 'px-3'}`}>
            {isCollapsed ? '•' : 'Core Modules'}
          </div>
          <div className="flex flex-col gap-2">
            <NavItem 
              icon={<LayoutDashboard size={18} />} 
              label="Dashboard" 
              active={activeView === 'dashboard'} 
              onClick={() => setActiveView('dashboard')}
              isCollapsed={isCollapsed} 
            />
            {/* Team Access: visible to Strata Admin, Strata Manager, Lot Owner, and Committee Member */}
            {(activePersonaRole?.includes('Admin') || activePersonaRole?.includes('Manager') || activePersonaRole?.includes('Owner') || activePersonaRole?.includes('Committee')) && (
              <NavItem 
                icon={<Users size={18} />} 
                label="Team Access" 
                active={activeView === 'user_management'} 
                onClick={() => setActiveView('user_management')}
                isCollapsed={isCollapsed} 
              />
            )}
            <NavItem 
              icon={<Wrench size={18} />} 
              label={(activePersonaRole?.includes('Manager') || activePersonaRole?.includes('Committee')) ? "Triage Requests" : "My Requests"} 
              active={activeView === 'requests' || activeView === 'triage'} 
              onClick={() => setActiveView((activePersonaRole?.includes('Manager') || activePersonaRole?.includes('Committee')) ? 'triage' : 'requests')}
              badge={(activePersonaRole?.includes('Manager') || activePersonaRole?.includes('Committee')) && pendingTriageCount > 0 ? String(pendingTriageCount) : undefined}
              isCollapsed={isCollapsed} 
            />
            <NavItem 
              icon={<FileText size={18} />} 
              label="Bylaws Library" 
              active={false} 
              onClick={() => alert("SmartLot Bylaws Library: Opening standard scheme by-laws...")}
              isCollapsed={isCollapsed} 
            />
            <NavItem 
              icon={<Settings size={18} />} 
              label="Settings" 
              active={activeView === 'settings'} 
              onClick={() => setActiveView('settings')}
              isCollapsed={isCollapsed} 
            />
          </div>
        </div>

      </div>

      {/* Footer User Profile */}
      <div className="p-3 mt-auto border-t border-gray-100 dark:border-white/5 space-y-2">
        <div className={`flex items-center gap-3 py-3 mt-2 overflow-hidden transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}>
          <div className="w-10 h-10 shrink-0 rounded-xl bg-[#00D4B2]/10 dark:bg-white/5 border border-[#00D4B2]/30 dark:border-white/10 text-[#00D4B2] font-black text-sm flex items-center justify-center select-none">
            {activePersonaName ? activePersonaName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
          </div>
          {!isCollapsed && (
            <div className="whitespace-nowrap flex-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{activePersonaName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{activePersonaRole}</div>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all border border-gray-200 dark:border-white/10 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer ${
            isCollapsed ? 'px-0' : 'px-4'
          }`}
        >
          {!isCollapsed ? 'Log Out' : 'Exit'}
        </button>
      </div>

    </div>
  );
}

function NavItem({ 
  icon, 
  label, 
  active, 
  badge, 
  onClick, 
  isCollapsed 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  badge?: string; 
  onClick: () => void; 
  isCollapsed: boolean 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-3' : 'justify-between px-4 py-3'} rounded-2xl transition-all duration-300 ease-out group cursor-pointer ${
        active 
          ? 'bg-gray-100 dark:bg-[#0F172A] text-[#0055FF] dark:text-[#00D4B2] shadow-sm border border-[#0055FF]/10 dark:border-[#00D4B2]/20 font-bold' 
          : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
      }`}
      title={isCollapsed ? label : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
        {!isCollapsed && (
          <span className="text-[14px] whitespace-nowrap">
            {label}
          </span>
        )}
      </div>
      
      {!isCollapsed && badge && (
        <span className={`transition-all duration-300 ${active ? 'bg-white dark:bg-[#0B1121] text-[#0055FF] dark:text-[#00D4B2]' : 'bg-[#FF4757] text-white'} text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 border border-gray-200 dark:border-transparent`}>
          {badge}
        </span>
      )}

      {isCollapsed && badge && (
        <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FF6B6B] border-2 border-white dark:border-[#050505]" />
      )}
    </button>
  );
}


// Navigation: Team Access unlocked for Lot Owners and Committee Members