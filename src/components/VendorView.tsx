import React from 'react';
import { Vendor, WorkOrder } from '../store/smartLotStore';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Phone, 
  Star, 
  Key, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

interface VendorViewProps {
  vendors: Vendor[];
  workOrders: WorkOrder[];
  onOpenGuestPortal: (workOrderId: string) => void;
  onVerifyWorkOrder: (workOrderId: string) => void;
}

export function VendorView({ vendors, workOrders, onOpenGuestPortal, onVerifyWorkOrder }: VendorViewProps) {
  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-full bg-[#F4F6F9]">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1121]/5 text-[#0B1121] text-xs font-bold uppercase tracking-wider mb-2">
            Vendor Mini-CRM & Work Orders
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verified Contractor Directory</h1>
          <p className="text-sm text-gray-500">Track ABN, trade licenses, insurance compliance badges, and dispatch digital work orders.</p>
        </div>
      </div>

      {/* Verified Trades Directory Grid */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900">Verified Local Trades</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vendors.map(v => (
            <div key={v.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">{v.name}</h4>
                  <span className="text-xs text-gray-500 font-medium">{v.category}</span>
                </div>
                {v.insuranceStatus === 'Active' ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#10B981] text-[10px] font-bold uppercase flex items-center gap-1">
                    <ShieldCheck size={12} /> Active Ins.
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-red-100 text-[#FF6B6B] text-[10px] font-bold uppercase flex items-center gap-1">
                    <AlertTriangle size={12} /> Expired Ins.
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-gray-100">
                <div><span className="font-bold text-gray-800">ABN:</span> {v.abn}</div>
                <div><span className="font-bold text-gray-800">License:</span> {v.licenseNo}</div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                <span className="flex items-center gap-1"><Phone size={12} /> {v.phone}</span>
                <span className="flex items-center gap-1 text-[#FFB020] font-bold"><Star size={12} fill="currentColor" /> {v.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Work Orders */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900">Active Scheme Work Orders</h3>

        <div className="space-y-4">
          {workOrders.map(wo => (
            <div key={wo.id} className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#0055FF] uppercase tracking-wider">{wo.id} • Linked Case {wo.caseId}</span>
                    <WorkOrderStatusBadge status={wo.status} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">{wo.scopeOfWork}</h4>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onOpenGuestPortal(wo.id)}
                    className="bg-[#0B1121] hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <ExternalLink size={14} className="text-[#00D4B2]" /> Open Zero-Login Mobile Portal
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 font-bold uppercase">Contractor</span>
                  <div className="font-bold text-gray-900 mt-0.5">{wo.vendorName}</div>
                </div>

                <div>
                  <span className="text-gray-400 font-bold uppercase">Approved Budget Cap</span>
                  <div className="font-black text-gray-900 text-sm mt-0.5">${wo.budgetCap.toLocaleString()} ex GST</div>
                </div>

                <div>
                  <span className="text-gray-400 font-bold uppercase">Site Access Code</span>
                  <div className="font-extrabold text-[#0055FF] text-sm mt-0.5 flex items-center gap-1">
                    <Key size={14} /> PIN {wo.siteAccessPin}
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 font-bold uppercase">Frictionless Link</span>
                  <div className="font-semibold text-gray-600 truncate mt-0.5">smartlot.io/work-order/{wo.id}</div>
                </div>
              </div>

              {/* Completion Submission Review */}
              {wo.status === 'completion_submitted' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Clock size={16} /> Tradesperson Submitted Completion Proof
                    </div>
                    <span className="text-sm font-black text-gray-900">Final Submitted Cost: ${wo.finalCost?.toLocaleString()}</span>
                  </div>

                  {wo.completionPhoto && (
                    <div className="flex items-center gap-3">
                      <img src={wo.completionPhoto} alt="Site completion" className="w-16 h-16 rounded-xl object-cover border border-amber-300 shadow-sm" />
                      <div className="text-xs text-amber-800">
                        <div className="font-bold">On-Site Completion Photo Attached</div>
                        <div className="text-[11px] text-amber-700">{wo.invoicePdf} attached</div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => onVerifyWorkOrder(wo.id)}
                    className="w-full bg-[#10B981] hover:bg-emerald-600 text-white rounded-xl py-2.5 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 size={16} /> Verify & Log Expense to Scheme Financial Tracker
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function WorkOrderStatusBadge({ status }: { status: WorkOrder['status'] }) {
  switch (status) {
    case 'issued':
      return <span className="px-3 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">Issued</span>;
    case 'in_progress':
      return <span className="px-3 py-0.5 rounded-full bg-[#FFB020]/10 text-[#FFB020] border border-[#FFB020]/20 text-[10px] font-bold uppercase">In Progress</span>;
    case 'completion_submitted':
      return <span className="px-3 py-0.5 rounded-full bg-purple-100 text-[#0055FF] text-[10px] font-bold uppercase">Completion Submitted</span>;
    case 'completed':
      return <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-[#10B981] text-[10px] font-bold uppercase">Completed & Paid</span>;
  }
}
