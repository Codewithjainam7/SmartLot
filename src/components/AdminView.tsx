import React, { useState } from 'react';
import { ShieldAlert, Trash2, Home, Mail, Phone, ExternalLink, ArrowLeft, Shield, Lock } from 'lucide-react';
import { Member, getDefaultPermissionsForRole } from '../store/smartLotStore';
import { Scheme } from '../types';
import { CustomCheckbox } from './core/CustomCheckbox';

interface AdminViewProps {
  members: Member[];
  schemes: Scheme[];
  onBackToLanding: () => void;
  onDeleteMember: (id: string) => void;
  onDeleteScheme: (id: string) => void;
  globalRolePermissions?: Record<string, { label: string; active: boolean; locked?: boolean; comingSoon?: boolean }[]>;
  onToggleGlobalPermission?: (role: string, permissionLabel: string) => void;
}

export function AdminView({ members, schemes, onBackToLanding, onDeleteMember, onDeleteScheme, globalRolePermissions = {}, onToggleGlobalPermission }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'directories' | 'permissions'>('directories');
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

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('directories')}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'directories' ? 'bg-[#00D4B2] text-white shadow-lg shadow-[#00D4B2]/30' : 'bg-white dark:bg-[#0d1117] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
          Directories & Analytics
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'permissions' ? 'bg-[#00D4B2] text-white shadow-lg shadow-[#00D4B2]/30' : 'bg-white dark:bg-[#0d1117] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5'}`}
        >
          <Shield size={16} /> Global Default Permissions
        </button>
      </div>

      {activeTab === 'directories' ? (
        <>
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
        </>
      ) : (
        <div className="bg-white dark:bg-[#0d1117] rounded-3xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Global Role Permissions</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure the default permissions for all user roles across the platform. These defaults will be applied to newly created strata schemes. 
              Strata Managers can still override these defaults for their specific scheme.
            </p>
          </div>
          
          <div className="overflow-x-auto rounded-3xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#0d1117] shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
            {(() => {
              const ROLES_ORDER = ['Strata Manager', 'Strata Admin', 'Building Manager', 'Committee Member', 'Lot Owner', 'Resident', 'Tenant', 'Service Provider'];
              const CATEGORY_MAP = [
                { name: '1. Request Submission', perms: ['Submit Request', 'Add Comment on request'] },
                { name: '2. Request Review & Approval', perms: ['View Requests', 'Filter & Sort Requests', 'Review & Edit Request Fields', 'Approve / Reject Requests'] },
                { name: '3. Voting Management', perms: ['Create Voting/Motion', 'Publish Motion', 'Cast Vote', 'View Voting Dashboard', 'View Voting Comment/Discussion', 'Add Voting Comment', 'View Final Vote Result'] },
                { name: '4. Vendor Management & Selection', perms: ['Request Quotes from Vendors', 'Submit Quote', 'View & Compare Quotes', 'Raise Quote Poll', 'Vote in Quote Poll', 'Assign Selected Vendor'] },
                { name: '5. Work order Execution', perms: ['Upload PO Document', 'Begin / Progress Task', 'Upload Completion Evidence', 'Mark Task as Completed', 'Task Archive / Review'] },
                { name: '6. Emergency Requests', perms: ['Create and Submit Emergency Request', 'Fast-track to Task Execution'] },
                { name: '7. System / Admin Functions', perms: ['Role & Permission Setup', 'Module Level Access Management'] }
              ];
              
              const activePerms = (globalRolePermissions && Object.keys(globalRolePermissions).length > 0)
                ? globalRolePermissions
                : (() => {
                    const m: Record<string, any> = {};
                    ROLES_ORDER.forEach(r => {
                      m[r] = getDefaultPermissionsForRole(r);
                    });
                    return m;
                  })();

              return (
                <table className="w-full text-left border-collapse text-sm min-w-max">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-[#1a1d27]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5">
                      <th className="p-5 font-black text-[11px] uppercase tracking-widest text-gray-900 dark:text-white sticky left-0 bg-gray-100 dark:bg-[#1a1d27] z-20 w-72 border-r border-gray-200 dark:border-white/5">Feature / Role Access</th>
                      {ROLES_ORDER.map(role => (
                        <th key={role} className="p-5 font-bold text-gray-900 dark:text-white text-center min-w-[140px] whitespace-nowrap">
                          {role}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CATEGORY_MAP.map(cat => (
                      <React.Fragment key={cat.name}>
                        <tr className="bg-gray-50 dark:bg-[#00D4B2]/5 border-b border-gray-200 dark:border-white/5">
                          <td colSpan={ROLES_ORDER.length + 1} className="p-3 px-5 font-black text-gray-800 dark:text-[#00D4B2] text-[10px] uppercase tracking-widest sticky left-0 z-10 bg-gray-100 dark:bg-[#0B1121] border-r border-gray-200 dark:border-white/5">
                            {cat.name}
                          </td>
                        </tr>
                        {cat.perms.map(permName => (
                          <tr key={permName} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                            <td className="p-3.5 px-5 text-gray-700 dark:text-gray-300 text-xs font-semibold sticky left-0 bg-white dark:bg-[#0d1117] group-hover:bg-gray-50 dark:group-hover:bg-[#141820] z-10 border-r border-gray-100 dark:border-white/5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_10px_-2px_rgba(0,0,0,0.2)] transition-colors">
                              {permName}
                            </td>
                            {ROLES_ORDER.map(role => {
                              const rolePerms = activePerms[role] || [];
                              const permObj = rolePerms.find(p => p.label === permName);
                              if (!permObj) return <td key={role} className="p-3.5 text-center text-gray-300 dark:text-gray-600 border-r border-gray-50 dark:border-white/[0.02] last:border-0">-</td>;
                              return (
                                <td key={role} className="p-3.5 text-center border-r border-gray-50 dark:border-white/[0.02] last:border-0">
                                  <div className="flex justify-center">
                                    {permObj.locked ? (
                                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">Locked</span>
                                    ) : (
                                      <CustomCheckbox
                                        checked={permObj.active}
                                        onChange={() => onToggleGlobalPermission?.(role, permName)}
                                      />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

