import React, { useState } from 'react';
import { LayoutDashboard, Users, FileText, Settings, Shield, Bell, HelpCircle, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div 
      className={`relative flex flex-col h-screen text-white shrink-0 border-r border-gray-900 shadow-2xl z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] bg-[#050505] bg-gradient-to-l from-white/[0.04] to-transparent ${
        isCollapsed ? 'w-[80px]' : 'w-[280px]'
      }`}
    >
      
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'} py-6 mb-2 transition-all duration-300`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 shrink-0 rounded-full bg-[#D8F235] flex items-center justify-center text-[#121316] font-bold">
            SL
          </div>
          <span className={`text-xl font-bold tracking-tight whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            SmartLot
          </span>
        </div>
        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(true)} 
            className="text-gray-500 hover:text-white transition-colors"
          >
            <PanelLeftClose size={20} />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-center w-full mb-4">
          <button 
            onClick={() => setIsCollapsed(false)} 
            className="text-gray-500 hover:text-white transition-colors"
          >
            <PanelLeftOpen size={20} />
          </button>
        </div>
      )}

      {/* Inner Scrollable Panel */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 space-y-6">
        
        {/* Section: Main */}
        <div>
          <div className={`text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 transition-all duration-300 ${isCollapsed ? 'text-center px-0' : 'px-3'}`}>
            {isCollapsed ? '•' : 'Main'}
          </div>
          <div className="flex flex-col gap-2">
            <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active isCollapsed={isCollapsed} />
            <NavItem icon={<Users size={18} />} label="Residents" isCollapsed={isCollapsed} />
            <NavItem icon={<FileText size={18} />} label="Documents" isCollapsed={isCollapsed} />
          </div>
        </div>

        {/* Section: Management */}
        <div>
          <div className={`text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 transition-all duration-300 ${isCollapsed ? 'text-center px-0' : 'px-3'}`}>
            {isCollapsed ? '•' : 'Management'}
          </div>
          <div className="flex flex-col gap-2">
            <NavItem icon={<Shield size={18} />} label="Compliance" isCollapsed={isCollapsed} />
            <NavItem icon={<Bell size={18} />} label="Notices" badge="3" isCollapsed={isCollapsed} />
            <NavItem icon={<Settings size={18} />} label="Settings" isCollapsed={isCollapsed} />
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-3 mt-auto border-t border-white/5 space-y-2">
        <NavItem icon={<HelpCircle size={18} />} label="Support" isCollapsed={isCollapsed} />
        <NavItem icon={<LogOut size={18} />} label="Sign Out" isCollapsed={isCollapsed} />
        
        <div className={`flex items-center gap-3 py-3 mt-2 overflow-hidden transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}>
          <img src="https://i.pravatar.cc/150?img=47" className="w-10 h-10 shrink-0 rounded-full object-cover border-2 border-white/10" alt="User" />
          <div className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <div className="text-sm font-semibold text-white">Alex Vance</div>
            <div className="text-xs text-gray-500">Strata Manager</div>
          </div>
        </div>
      </div>

    </div>
  );
}

function NavItem({ icon, label, active, badge, isCollapsed }: { icon: React.ReactNode; label: string; active?: boolean; badge?: string; isCollapsed: boolean }) {
  return (
    <button
      className={`relative w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-3' : 'justify-between px-4 py-3'} rounded-2xl transition-all duration-300 ease-out group ${
        active 
          ? 'bg-[#D8F235] text-[#121316] shadow-lg font-semibold' 
          : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
      }`}
      title={isCollapsed ? label : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
        <span className={`text-[14px] whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
          {label}
        </span>
      </div>
      
      {/* Badge rendering for expanded mode */}
      {!isCollapsed && badge && (
        <span className={`transition-all duration-300 ${active ? 'bg-[#121316] text-[#D8F235]' : 'bg-[#FF6B6B] text-white'} text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0`}>
          {badge}
        </span>
      )}

      {/* Dot indicator for collapsed mode */}
      {isCollapsed && badge && (
        <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FF6B6B] border-2 border-[#050505]" />
      )}
    </button>
  );
}
