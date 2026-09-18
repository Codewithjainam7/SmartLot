// @smartlot/component
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  PanelLeftClose, 
  PanelLeftOpen,
  Wrench,
  FileText,
  Settings,
  ClipboardList,
  Award,
  Vote,
  X,
  MessageSquareHeart,
  Building2,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { SmartLotLogo } from './core/SmartLotLogo';

interface SidebarProps {
  activeView: 'dashboard' | 'user_management' | 'requests' | 'triage' | 'voting' | 'settings' | 'performance' | 'vendors' | 'surveys';
  setActiveView: (view: 'dashboard' | 'user_management' | 'requests' | 'triage' | 'voting' | 'settings' | 'performance' | 'vendors' | 'surveys') => void;
  pendingTriageCount?: number;
  activeMotionsCount?: number;
  activeWorkOrdersCount?: number;
  activePersonaName?: string;
  activePersonaRole?: string;
  activePersonaContext?: string;
  activeSchemeName?: string;
  activeSchemeId?: string;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;

  hasPermission: (perm: string) => boolean;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ 
  activeView, 
  setActiveView, 
  pendingTriageCount = 2,
  activeMotionsCount = 0,
  activeWorkOrdersCount = 0,
  activePersonaName = 'Alex Vance',
  activePersonaRole = 'Strata Manager',
  activePersonaContext,
  activeSchemeName,
  activeSchemeId,
  theme = 'light',
  onToggleTheme,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  hasPermission,
  onLogout,
  isMobileOpen = false,
  onCloseMobile
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(prev => !prev));

  const authorInitials = activePersonaName 
    ? activePersonaName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'U';

  const handleNavClick = (view: any) => {
    setActiveView(view);
    onCloseMobile?.();
  };

  const handleLogoutClick = () => {
    onLogout();
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside 
        className={`smartlot-sidebar flex flex-col h-full shrink-0 border-r shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] bg-white/95 dark:bg-[#080b11]/95 backdrop-blur-2xl text-gray-900 dark:text-white border-gray-200/80 dark:border-white/10 ${
          isMobileOpen
            ? 'fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] rounded-r-3xl flex shadow-2xl animate-in slide-in-from-left duration-200 pt-safe pb-safe'
            : 'hidden md:flex relative z-40'
        } ${isCollapsed && !isMobileOpen ? 'md:w-[76px]' : 'md:w-[280px]'}`}
      >
      
        {/* Header */}
        <div className={`flex items-center ${isCollapsed && !isMobileOpen ? 'justify-center flex-col gap-3 px-2' : 'justify-between px-5'} py-4 transition-all duration-300 border-b border-gray-100 dark:border-white/5`}>
          <div 
            className="flex items-center gap-3 overflow-hidden cursor-pointer group" 
            onClick={handleLogoutClick}
            title="Back to Landing Page"
          >
            <SmartLotLogo className="h-8" iconOnly={isCollapsed && !isMobileOpen} />
          </div>

          {/* Mobile Close Drawer Button */}
          {isMobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 active:scale-90 transition-all cursor-pointer shrink-0"
              title="Close Navigation Menu"
              aria-label="Close navigation menu"
            >
              <X size={20} />
            </button>
          )}

          {/* Desktop Collapse Button */}
          {!isMobileOpen && (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse();
              }} 
              className="hidden md:flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          )}
        </div>

        {/* Mobile Profile Capsule Banner (Appears inside mobile drawer) */}
        {isMobileOpen && (
          <div className="mx-3.5 mt-3 mb-1 p-3.5 rounded-2xl bg-gradient-to-br from-[#0055FF]/10 via-[#00D4B2]/5 to-transparent border border-[#0055FF]/15 dark:border-[#00D4B2]/20 shadow-sm space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0055FF] to-[#00D4B2] p-[1.5px] shadow-sm">
                  <div className="w-full h-full rounded-[14px] bg-white dark:bg-[#0d1117] flex items-center justify-center font-black text-xs text-[#0055FF] dark:text-[#00D4B2]">
                    {authorInitials}
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0d1117]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                  {activePersonaName}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-[#0055FF]/10 text-[#0055FF] dark:bg-[#00D4B2]/15 dark:text-[#00D4B2] border border-[#0055FF]/20 dark:border-[#00D4B2]/30">
                    {activePersonaRole}
                  </span>
                  {activePersonaContext && (
                    <span className="text-[10px] text-gray-400 font-medium truncate">
                      {activePersonaContext}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {(activeSchemeId || activeSchemeName) && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300 pt-2 border-t border-gray-200/50 dark:border-white/5 truncate">
                <Building2 size={12} className="text-[#0055FF] dark:text-[#00D4B2] shrink-0" />
                <span className="truncate">{activeSchemeId ? `${activeSchemeId} • ` : ''}{activeSchemeName || 'Active Scheme'}</span>
              </div>
            )}
          </div>
        )}

        {/* Inner Scrollable Panel */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-5">
          
          {/* Core Navigation Modules */}
          <div>
            <div className={`text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 transition-all duration-300 ${isCollapsed && !isMobileOpen ? 'text-center px-0' : 'px-3'}`}>
              {isCollapsed && !isMobileOpen ? '•' : 'Main Menu'}
            </div>
            <div className="flex flex-col gap-1.5">
              <NavItem 
                icon={<LayoutDashboard size={18} />} 
                label="Dashboard" 
                active={activeView === 'dashboard'} 
                onClick={() => handleNavClick('dashboard')}
                isCollapsed={isCollapsed && !isMobileOpen} 
              />
              {/* Team Access: visible to Strata Admin, Strata Manager, Lot Owner, and Committee Member */}
              {(activePersonaRole?.includes('Admin') || activePersonaRole?.includes('Manager') || activePersonaRole?.includes('Owner') || activePersonaRole?.includes('Committee')) && (
                <NavItem 
                  icon={<Users size={18} />} 
                  label="Team Access" 
                  active={activeView === 'user_management'} 
                  onClick={() => handleNavClick('user_management')}
                  isCollapsed={isCollapsed && !isMobileOpen} 
                />
              )}
              {/* Requests & Activity Module for Everyone */}
              <NavItem 
                icon={<ClipboardList size={18} />} 
                label={(activePersonaRole?.includes('Manager') || activePersonaRole?.includes('Committee') || activePersonaRole?.includes('Admin')) ? "Requests & Activity" : "My Requests"} 
                active={activeView === 'requests' || activeView === 'triage'} 
                onClick={() => handleNavClick('requests')}
                badge={pendingTriageCount && pendingTriageCount > 0 && (activePersonaRole?.includes('Manager') || activePersonaRole?.includes('Committee') || activePersonaRole?.includes('Admin')) ? String(pendingTriageCount) : undefined}
                isCollapsed={isCollapsed && !isMobileOpen} 
              />
              {/* Trades & Work Orders Engine: Only Strata Managers, Admins, and Committee Members */}
              {(activePersonaRole?.includes('Manager') || activePersonaRole?.includes('Admin') || activePersonaRole?.includes('Committee')) && (
                <NavItem 
                  icon={<Wrench size={18} />} 
                  label={activePersonaRole?.includes('Committee') ? "Quotes & Trades" : "Trades & Work Orders"} 
                  active={activeView === 'vendors'} 
                  onClick={() => handleNavClick('vendors')}
                  badge={activeWorkOrdersCount && activeWorkOrdersCount > 0 && !activePersonaRole?.includes('Committee') ? String(activeWorkOrdersCount) : undefined}
                  isCollapsed={isCollapsed && !isMobileOpen} 
                />
              )}
              {/* Voting Hub for Community & Committee Motions */}
              <NavItem 
                icon={<Vote size={18} />} 
                label="Voting Hub" 
                active={activeView === 'voting'} 
                onClick={() => handleNavClick('voting')}
                badge={activeMotionsCount && activeMotionsCount > 0 ? String(activeMotionsCount) : undefined}
                isCollapsed={isCollapsed && !isMobileOpen} 
              />
              {/* Strata Manager Performance Dashboard (Accessible to everyone) */}
              <NavItem 
                icon={<Award size={18} />} 
                label="Manager Performance" 
                active={activeView === 'performance'} 
                onClick={() => handleNavClick('performance')}
                isCollapsed={isCollapsed && !isMobileOpen} 
              />
              {/* Resident Feedback & Surveys Engine */}
              {(activePersonaRole?.includes('Admin') || activePersonaRole?.includes('Manager') || activePersonaRole?.includes('Committee') || activePersonaRole?.includes('Owner')) && (
                <NavItem 
                  icon={<MessageSquareHeart size={18} />} 
                  label="Surveys & Feedback" 
                  active={activeView === 'surveys'} 
                  onClick={() => handleNavClick('surveys')}
                  isCollapsed={isCollapsed && !isMobileOpen} 
                />
              )}

              <NavItem 
                icon={<FileText size={18} />} 
                label="Bylaws Library" 
                active={false} 
                onClick={() => {
                  alert("SmartLot Bylaws Library: Opening standard scheme by-laws...");
                  onCloseMobile?.();
                }}
                isCollapsed={isCollapsed && !isMobileOpen} 
              />
              <NavItem 
                icon={<Settings size={18} />} 
                label="Settings" 
                active={activeView === 'settings'} 
                onClick={() => handleNavClick('settings')}
                isCollapsed={isCollapsed && !isMobileOpen} 
              />
            </div>
          </div>

        </div>

        {/* Footer User Profile & Controls */}
        <div className="p-3 mt-auto border-t border-gray-100 dark:border-white/5 space-y-2">
          {/* Quick In-Drawer Theme Switcher */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-100/70 hover:bg-gray-200/70 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold transition-all cursor-pointer border border-transparent dark:border-white/5 active:scale-98 ${
                isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''
              }`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              <div className="flex items-center gap-2.5">
                {theme === 'dark' ? (
                  <Sun size={15} className="text-amber-400 shrink-0" />
                ) : (
                  <Moon size={15} className="text-indigo-600 shrink-0" />
                )}
                {(!isCollapsed || isMobileOpen) && (
                  <span className="text-gray-700 dark:text-gray-300">
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </span>
                )}
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 dark:bg-black/40 text-gray-500 dark:text-gray-400 font-mono">
                  {theme === 'dark' ? 'DARK' : 'LIGHT'}
                </span>
              )}
            </button>
          )}

          {/* Desktop User Profile Footer */}
          {!isMobileOpen && (
            <div className={`flex items-center gap-2.5 py-2 overflow-hidden transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}>
              <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-[#0055FF]/20 to-[#00D4B2]/20 border border-[#0055FF]/25 dark:border-[#00D4B2]/30 text-[#0055FF] dark:text-[#00D4B2] font-black text-xs flex items-center justify-center select-none">
                {authorInitials}
              </div>
              {!isCollapsed && (
                <div className="whitespace-nowrap flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{activePersonaName}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{activePersonaRole}</div>
                </div>
              )}
            </div>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogoutClick}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer min-h-[40px] active:scale-95 ${
              isCollapsed && !isMobileOpen ? 'px-0' : 'px-4'
            }`}
            title="Log Out"
          >
            <LogOut size={14} className="shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Log Out</span>}
          </button>
        </div>

      </aside>
    </>
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
    <div className="relative group">
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        aria-current={active ? 'page' : undefined}
        aria-label={label}
        className={`relative w-full flex items-center min-h-[44px] ${isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3.5 py-2.5'} rounded-2xl transition-colors duration-200 cursor-pointer select-none ${
          active 
            ? 'text-[#0055FF] dark:text-[#00D4B2] font-bold' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/5'
        }`}
      >
        {/* Animated Active Pill Indicator gliding between nav items */}
        {active && (
          <motion.div
            layoutId="sidebarActivePill"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#0055FF]/10 to-[#00D4B2]/10 dark:from-[#0055FF]/20 dark:to-[#00D4B2]/15 border border-[#0055FF]/20 dark:border-[#00D4B2]/30 shadow-xs pointer-events-none"
          />
        )}

        <div className="relative z-10 flex items-center gap-3 min-w-0">
          {/* Active Accent Bar on Left */}
          {active && !isCollapsed && (
            <motion.div 
              layoutId="sidebarActiveBar"
              className="w-1 h-5 rounded-full bg-gradient-to-b from-[#0055FF] to-[#00D4B2] -ml-1 shrink-0" 
            />
          )}

          <div className={`shrink-0 transition-transform duration-200 ${active ? 'scale-105 text-[#0055FF] dark:text-[#00D4B2]' : 'group-hover:scale-110'}`}>
            {icon}
          </div>

          {!isCollapsed && (
            <span className="text-[13.5px] truncate">
              {label}
            </span>
          )}
        </div>
        
        {!isCollapsed && badge && (
          <span className={`relative z-10 transition-all duration-200 ${
            active 
              ? 'bg-[#0055FF] text-white dark:bg-[#00D4B2] dark:text-black font-extrabold shadow-sm' 
              : 'bg-[#FF4757] text-white font-bold'
          } text-[10px] px-2 py-0.5 rounded-full shrink-0 border border-transparent`}>
            {badge}
          </span>
        )}

        {isCollapsed && badge && (
          <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#FF4757] border-2 border-white dark:border-[#080b11] z-10" />
        )}
      </motion.button>

      {/* Floating Tooltip in Collapsed Desktop Mode */}
      {isCollapsed && (
        <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-gray-950 text-white dark:bg-[#12161f] dark:text-white text-xs font-bold whitespace-nowrap shadow-2xl border border-gray-800 dark:border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 flex items-center gap-2">
          <span>{label}</span>
          {badge && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FF4757] text-white font-black">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}