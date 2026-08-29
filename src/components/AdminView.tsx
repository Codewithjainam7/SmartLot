import React from 'react';
import { ShieldAlert, Trash2, Home, Mail, Phone, ExternalLink, ArrowLeft } from 'lucide-react';
import { Member } from '../store/smartLotStore';
import { Scheme } from '../types';

interface AdminViewProps {
  members: Member[];
  schemes: Scheme[];
  onBackToLanding: () => void;
  onDeleteMember: (id: string) => void;
  onDeleteScheme: (id: string) => void;
}

export function AdminView({ members, schemes, onBackToLanding, onDeleteMember, onDeleteScheme }: AdminViewProps) {
  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0a0a0f] font-sans p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-[#0d1117] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToLanding} 
            className="p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 dark:bg-[#1a1d27] text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-black transition-all cursor-pointer border border-gray-100 dark:border-white/5"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4757]/10 text-[#FF4757] text-xs font-bold uppercase tracking-wider mb-2 border border-[#FF4757]/20">
              <ShieldAlert size={12} /> System Admin Directory
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Website Administrator Console</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Cross-scheme analytics, user directories, and system-level strata operations.</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#0d1117] p-6 rounded-3xl border border-gray-100 dark:border-white/5 dark:border-white/5 shadow-sm">
          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Active Schemes</div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{schemes.length}</div>
        </div>
        <div className="bg-white dark:bg-[#0d1117] p-6 rounded-3xl border border-gray-100 dark:border-white/5 dark:border-white/5 shadow-sm">
          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Registered Accounts</div>
          <div className="text-3xl font-extrabold text-[#0055FF] mt-2">{members.length}</div>
        </div>
        <div className="bg-white dark:bg-[#0d1117] p-6 rounded-3xl border border-gray-100 dark:border-white/5 dark:border-white/5 shadow-sm">
          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">System Status</div>
          <div className="text-sm font-bold text-[#00A38C] bg-[#00D4B2]/10 border border-[#00D4B2]/20 px-3 py-1 rounded-full inline-block mt-3 uppercase tracking-wider">
            Operational
          </div>
        </div>
      </div>

      {/* Schemes Directory */}
      <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Strata Sites ({schemes.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-separate border-spacing-0">
            <thead>
              <tr className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5">Scheme ID</th>
                <th className="py-3 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5">Scheme Name</th>
                <th className="py-3 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5">Lots Size</th>
                <th className="py-3 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              {schemes.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 dark:bg-[#1a1d27]/50 transition-colors">
                  <td className="py-4 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5 font-bold text-gray-900 dark:text-white">{s.id}</td>
                  <td className="py-4 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5 text-gray-700 dark:text-gray-300">{s.name}</td>
                  <td className="py-4 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5 text-gray-500 dark:text-gray-400 dark:text-gray-500">{s.lots} Lots</td>
                  <td className="py-4 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5 text-right">
                    <button
                      onClick={() => onDeleteScheme(s.id)}
                      className="text-[#FF4757] hover:text-red-700 bg-[#FF4757]/10 hover:bg-[#FF4757]/20 p-2 rounded-xl border border-[#FF4757]/30 transition-colors cursor-pointer"
                      title="De-register Scheme"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Directory */}
      <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Users Registry ({members.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-separate border-spacing-0">
            <thead>
              <tr className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5">User ID</th>
                <th className="py-3 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5">User Details</th>
                <th className="py-3 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5">Associated Scheme</th>
                <th className="py-3 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5">Role & Unit</th>
                <th className="py-3 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5">Contact Details</th>
                <th className="py-3 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              {members.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 dark:bg-[#1a1d27]/50 transition-colors">
                  <td className="py-4 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5 font-bold text-gray-400 dark:text-gray-500">{m.id}</td>
                  <td className="py-4 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5">
                    <div className="font-bold text-gray-900 dark:text-white text-sm">{m.name}</div>
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      m.status === 'Active' ? 'bg-[#00D4B2]/10 text-[#00A38C] border border-[#00D4B2]/20' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5">
                    <div className="font-semibold text-gray-800 dark:text-gray-200">{m.schemeId}</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">Strata Lot Profile</div>
                  </td>
                  <td className="py-4 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5">
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#1a1d27] text-gray-600 dark:text-gray-300">
                      {m.role}
                    </span>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 font-semibold mt-1">{m.unitId} (Lot {m.lotNumber})</div>
                  </td>
                  <td className="py-4 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5 space-y-0.5 text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400 dark:text-gray-500" /> {m.email}</div>
                    <div className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400 dark:text-gray-500" /> {m.phone}</div>
                  </td>
                  <td className="py-4 px-4 border-b border-gray-100 dark:border-white/5 dark:border-white/5 text-right">
                    <button
                      onClick={() => onDeleteMember(m.id)}
                      className="text-[#FF4757] hover:text-red-700 bg-[#FF4757]/10 hover:bg-[#FF4757]/20 p-2 rounded-xl border border-[#FF4757]/30 transition-colors cursor-pointer"
                      title="De-activate User"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

