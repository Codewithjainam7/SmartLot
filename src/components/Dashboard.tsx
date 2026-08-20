import React from 'react';
import { UnitDetailCard } from './UnitDetailCard';
import { Users, AlertTriangle, Vote, ClipboardList, Zap, ArrowRight, Share2, Phone, Mail, FileText, Settings, ShieldCheck } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full overflow-y-auto">
      
      {/* Column 1: Metrics & Worklist */}
      <div className="lg:col-span-3 space-y-6">
        {/* 2x2 Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <MetricTile icon={<Users size={16} />} label="Residents" value="14" />
          <MetricTile icon={<AlertTriangle size={16} />} label="Issues" value="3" highlight />
          <MetricTile icon={<Vote size={16} />} label="Votes" value="1" />
          <MetricTile icon={<ClipboardList size={16} />} label="Lots" value="8" />
        </div>

        {/* Worklist */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Active Directory</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">All</span>
          </div>
          <div className="space-y-2">
            <WorklistItem unit="Unit 1" owner="Smith Family" />
            <WorklistItem unit="Unit 2" owner="Sarah Jenkins" />
            <WorklistItem unit="Unit 10" owner="Mike Davies" active />
            <WorklistItem unit="Unit 11" owner="Vacant" alert />
          </div>
        </div>
      </div>

      {/* Column 2: Main Content Area */}
      <div className="lg:col-span-6 space-y-6">
        <UnitDetailCard />

        {/* Feed / Timeline */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Activity Log</h3>
            <button className="text-sm font-semibold text-[#8B8CF8] hover:text-[#6366F1]">View All</button>
          </div>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            
            <FeedItem 
              type="verified"
              title="Lease Agreement Verified"
              desc="RayWhite Agent uploaded new lease for Lisa Ray."
              time="2 hours ago"
            />
            <FeedItem 
              type="alert"
              title="Maintenance Request"
              desc="Lisa Ray reported a leaking tap in the kitchen."
              time="Yesterday"
            />
            <FeedItem 
              type="system"
              title="Levy Notice Issued"
              desc="Q3 Levies generated and sent to Mike Davies."
              time="3 days ago"
            />
          </div>
        </div>
      </div>

      {/* Column 3: Right Action Column */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Lavender Card - Scheme Summary */}
        <div className="bg-gradient-to-br from-[#A5B4FC] to-[#8B8CF8] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <ShieldCheck size={64} />
          </div>
          <div className="relative z-10">
            <div className="text-xs font-bold uppercase tracking-wider text-white/80 mb-1">Financial Health</div>
            <h3 className="text-2xl font-bold mb-4">$42,500</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/90">Admin Fund</span>
                <span className="font-semibold">$12,000</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div className="bg-white h-1.5 rounded-full" style={{ width: '40%' }}></div>
              </div>
              
              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-white/90">Capital Works</span>
                <span className="font-semibold">$30,500</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div className="bg-white h-1.5 rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
            
            <button className="w-full mt-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              View Reports
            </button>
          </div>
        </div>

        {/* Electric Lime Card - Quick Action */}
        <div className="bg-[#D8F235] rounded-3xl p-6 shadow-md border border-[#c4db30]">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-[#121316] text-[#D8F235] flex items-center justify-center">
              <Zap size={20} />
            </div>
            <span className="bg-[#121316]/10 text-[#121316] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
              Action Required
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#121316] mb-2 leading-tight">Missing Resident Registrations</h3>
          <p className="text-sm text-[#121316]/70 mb-6 font-medium">3 units have not completed their profile setup.</p>
          
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between border border-[#121316]/10 mb-4">
            <span className="text-xs font-semibold text-[#121316] truncate">smartlot.io/join/SP10482</span>
            <button className="text-[#121316] hover:bg-white/50 p-1.5 rounded-lg transition-colors">
              <Share2 size={16} />
            </button>
          </div>

          <button className="w-full bg-[#121316] hover:bg-black text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all">
            Send Reminders <ArrowRight size={16} />
          </button>
        </div>

      </div>

    </div>
  );
}

function MetricTile({ icon, label, value, highlight }: { icon: React.ReactNode, label: string, value: string, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border transition-colors ${
      highlight ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100 hover:border-gray-200'
    }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${
        highlight ? 'bg-[#FF6B6B] text-white shadow-[0_0_15px_rgba(255,107,107,0.3)]' : 'bg-[#F2F4F8] text-gray-600'
      }`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function WorklistItem({ unit, owner, active, alert }: { unit: string, owner: string, active?: boolean, alert?: boolean }) {
  return (
    <button className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
      active 
        ? 'bg-[#D8F235] text-[#121316] ring-1 ring-[#c4db30]' 
        : 'hover:bg-gray-50 bg-white border border-transparent'
    }`}>
      <div className="text-left">
        <div className={`text-sm font-bold ${active ? 'text-[#121316]' : 'text-gray-900'}`}>{unit}</div>
        <div className={`text-xs mt-0.5 ${active ? 'text-[#121316]/70' : 'text-gray-500'}`}>{owner}</div>
      </div>
      {alert && (
        <div className="w-2 h-2 rounded-full bg-[#FF6B6B] shadow-[0_0_8px_rgba(255,107,107,0.6)]"></div>
      )}
    </button>
  );
}

function FeedItem({ type, title, desc, time }: { type: 'verified' | 'alert' | 'system', title: string, desc: string, time: string }) {
  const getIcon = () => {
    switch (type) {
      case 'verified': return <ShieldCheck size={14} className="text-[#059669]" />;
      case 'alert': return <AlertTriangle size={14} className="text-[#EF4444]" />;
      case 'system': return <Settings size={14} className="text-[#6366F1]" />;
    }
  };

  const getBg = () => {
    switch (type) {
      case 'verified': return 'bg-[#6EE7B7]/20 border-[#6EE7B7]/30';
      case 'alert': return 'bg-[#FF6B6B]/20 border-[#FF6B6B]/30';
      case 'system': return 'bg-[#8B8CF8]/20 border-[#8B8CF8]/30';
    }
  };

  return (
    <div className="relative flex items-start group">
      <div className="absolute left-0 md:left-1/2 -ml-[5px] md:-ml-1.5 mt-1.5 w-3 h-3 rounded-full bg-white border-2 border-gray-300 group-hover:border-gray-400 transition-colors z-10 shadow-sm"></div>
      
      <div className="ml-6 md:ml-0 md:w-1/2 md:pr-8 md:text-right md:group-even:pl-8 md:group-even:text-left md:group-even:ml-auto">
        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1 justify-start md:justify-end md:group-even:justify-start">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${getBg()}`}>
              {getIcon()}
            </div>
            <span className="text-xs font-bold text-gray-400">{time}</span>
          </div>
          <h4 className="text-sm font-bold text-gray-900 mb-1">{title}</h4>
          <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}
