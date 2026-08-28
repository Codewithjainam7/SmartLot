import React, { useState, useEffect } from 'react';
import { SCHEMES, PERSONAS, Scheme, Persona } from '../types';

export type RequestStream = 
  | 'maintenance_upgrade' 
  | 'emergency' 
  | 'complaint' 
  | 'unit_request' 
  | 'recurring_task'
  | 'general_inquiry'
  | 'emergency_repair'
  | 'private_lot_repair'
  | 'common_area_repair';

export type CaseStatus = 
  | 'new' 
  | 'in_voting'
  | 'approved' 
  | 'rejected' 
  | 'closed'
  | 'pending_triage'
  | 'approved_direct_dispatch'
  | 'approved_pending_vote'
  | 'resolved';

export type RequestComment = {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
};

export type ResidentRequest = {
  id: string;
  unit: string;
  title: string;
  description: string;
  requestType: RequestStream;
  stream?: RequestStream;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  dueDate?: string;
  attachmentUrl?: string;
  status: CaseStatus;
  createdAt: string;
  requestorName: string;
  reportedBy?: string;
  requestorEmail: string;
  requestorPhone: string;
  requestorRole: 'Lot Owner' | 'Resident' | 'Tenant' | 'Strata Manager';
  rejectionReason?: string;
  closeReason?: string;
  comments: RequestComment[];
  linkedMotionId?: string;
};

export type MaintenanceCase = ResidentRequest;

export type MotionVote = 'YES' | 'NO' | 'ABSTAIN';

export type Motion = {
  id: string;
  caseId: string;
  title: string;
  summary: string;
  quotes: {
    vendorId: string;
    vendorName: string;
    amount: number;
    gstIncluded: boolean;
    recommended?: boolean;
  }[];
  quorumTarget: number;
  deadline: string;
  status: 'active' | 'passed' | 'rejected';
  ballots: {
    voterName: string;
    voterRole: string;
    vote: MotionVote;
    votedAt: string;
  }[];
  createdWorkOrderId?: string;
};

export type Vendor = {
  id: string;
  name: string;
  category: string;
  abn: string;
  licenseNo: string;
  phone: string;
  email: string;
  insuranceStatus: 'Active' | 'Expired Ins.';
  insuranceExpiry: string;
  rating: number;
};

export type WorkOrder = {
  id: string;
  caseId: string;
  schemeId: string;
  vendorId: string;
  vendorName: string;
  scopeOfWork: string;
  budgetCap: number;
  siteAccessPin: string;
  guestMagicToken: string;
  status: 'issued' | 'in_progress' | 'completion_submitted' | 'completed';
  completionPhoto?: string;
  invoicePdf?: string;
  finalCost?: number;
  submittedAt?: string;
};

export type MemberRole = 
  | 'Strata Manager' 
  | 'Building Manager' 
  | 'Committee Member' 
  | 'Lot Owner' 
  | 'Resident' 
  | 'Tenant';

export type AdditionalOccupant = {
  id: string;
  name: string;
  email: string;
  role: 'Resident' | 'Tenant' | 'Family Member' | 'Co-Owner';
};

export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  schemeId: string;
  role: MemberRole;
  unitId: string;
  lotNumber: number;
  hasCoOwner?: boolean;
  coOwnerName?: string;
  coOwnerEmail?: string;
  additionalOccupants?: AdditionalOccupant[];
  status: 'Active' | 'Invited' | 'Restricted';
  joinedAt: string;
};

export type UnitActor = {
  id: string;
  role: 'Lot Owner' | 'On-Site Resident' | 'Tenant' | 'Property Agent';
  name: string;
  email: string;
  phone?: string;
  agency?: string;
  verified: boolean;
  permissions: { label: string; active: boolean; locked?: boolean }[];
};

export type UnitData = {
  schemeId: string;
  unitId: string;
  lotNumber: number;
  entitlement: string;
  status: 'Occupied' | 'Vacant';
  actors: UnitActor[];
};

// Initial Seed Members with Multiple Occupants in Unit 10
const INITIAL_MEMBERS: Member[] = [];

// Initial Seed Requests
const INITIAL_RESIDENT_REQUESTS: ResidentRequest[] = [];

const INITIAL_UNITS: UnitData[] = [];

export const getDefaultPermissionsForRole = (role: string): { label: string; active: boolean; locked?: boolean }[] => {
  const isManagerOrAdmin = role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' || role === 'Building Manager';
  
  return [
    // 1. Service Requests
    { label: 'Submit Request', active: role !== 'Service Provider', locked: isManagerOrAdmin },
    { label: 'Add Comment on Request', active: true, locked: isManagerOrAdmin },
    { label: 'View Requests', active: true, locked: isManagerOrAdmin },
    { label: 'Review & Edit Request Fields', active: isManagerOrAdmin, locked: isManagerOrAdmin },
    { label: 'Approve / Reject Requests', active: isManagerOrAdmin, locked: isManagerOrAdmin },
    
    // 2. Voting & Governance
    { label: 'Create & Publish Motion', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin', locked: isManagerOrAdmin && role !== 'Building Manager' },
    { label: 'Cast Vote', active: role === 'Committee Member' || role === 'Lot Owner' || role === 'Strata Admin', locked: role === 'Tenant' || role === 'Service Provider' },
    { label: 'View Final Vote Results', active: role !== 'Service Provider' && role !== 'Tenant', locked: isManagerOrAdmin },
    
    // 3. Vendors & Quotes
    { label: 'Request Quotes from Vendors', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' || role === 'Building Manager', locked: isManagerOrAdmin },
    { label: 'Submit Quote', active: role === 'Service Provider', locked: role === 'Service Provider' },
    { label: 'View & Compare Quotes', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' || role === 'Building Manager' || role === 'Committee Member', locked: isManagerOrAdmin },
    { label: 'Assign Selected Vendor', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' || role === 'Building Manager', locked: isManagerOrAdmin },
    
    // 4. Work Orders
    { label: 'Upload PO / Begin Task', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' || role === 'Building Manager', locked: isManagerOrAdmin },
    { label: 'Upload Completion Evidence', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' || role === 'Building Manager' || role === 'Service Provider', locked: isManagerOrAdmin },
    { label: 'Mark Task Completed', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' || role === 'Building Manager' || role === 'Service Provider', locked: isManagerOrAdmin },
    
    // 5. System Settings
    { label: 'Role & Permission Setup', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin', locked: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' },
    { label: 'Module Access Control', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin', locked: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' }
  ];
};

function usePersistedState<T>(key: string, defaultValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) return JSON.parse(item);
    } catch (error) {
      console.error(error);
    }
    return defaultValue instanceof Function ? defaultValue() : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

export function useSmartLotStore() {
  const [schemes, setSchemes] = usePersistedState<Scheme[]>('smartlot_schemes', SCHEMES);
  const [activeScheme, setActiveScheme] = usePersistedState<Scheme>('smartlot_activeScheme',
    SCHEMES.length > 0 
      ? SCHEMES[0] 
      : { id: 'NO_SCHEME', name: 'No Registered Schemes', lots: 0, active: false }
  );
  const [activePersona, setActivePersona] = usePersistedState<Persona>('smartlot_activePersona', PERSONAS[1]); // Default to Strata Manager Alex Vance
  const [activeRoles, setActiveRoles] = usePersistedState<string[]>('smartlot_activeRoles', ['Strata Manager']);
  const [activeView, setActiveView] = usePersistedState<'dashboard' | 'user_management' | 'requests' | 'triage' | 'settings'>('smartlot_activeView', 'dashboard');
  const [isLoggedIn, setIsLoggedIn] = usePersistedState('smartlot_isLoggedIn', true);
  const [theme, setTheme] = usePersistedState<'light' | 'dark'>('smartlot_theme', 'light');
  const [members, setMembers] = usePersistedState<Member[]>('smartlot_members', INITIAL_MEMBERS);
  const [residentRequests, setResidentRequests] = usePersistedState<ResidentRequest[]>('smartlot_residentRequests', INITIAL_RESIDENT_REQUESTS);
  const [units, setUnits] = usePersistedState<UnitData[]>('smartlot_units', INITIAL_UNITS);

  useEffect(() => {
    if (!activePersona) return;

    if (activePersona.isSystemAdmin) {
      if (!activeRoles.includes('Super Admin')) {
        setActiveRoles(['Super Admin']);
      }
      return;
    }

    // Auto-populate schemes, units, and member roster for the persona's memberships
    if (activePersona.memberships && activePersona.memberships.length > 0) {
      activePersona.memberships.forEach(m => {
        // 1. Ensure scheme is registered
        const hasScheme = schemes.some(s => s.id === m.schemeId);
        if (!hasScheme) {
          let lots = 2;
          let sName = 'Strata Scheme';
          if (m.schemeId === 'SP101') {
            lots = 2;
            sName = 'Sunset Duplex';
          } else if (m.schemeId === 'SP102') {
            lots = 4;
            sName = 'Coronation Townhouses';
          } else if (m.schemeId === 'SP103') {
            lots = 32;
            sName = 'Cavaller Apartments';
          } else if (m.schemeId === 'SP10482') {
            lots = 10;
            sName = 'SmartLot Complex';
          }
          
          const newScheme = { id: m.schemeId, name: `${m.schemeId} - ${sName}`, lots, active: true };
          setSchemes(prev => {
            if (prev.some(s => s.id === m.schemeId)) return prev;
            return [...prev, newScheme];
          });

          // Generate units
          const newUnits: UnitData[] = Array.from({ length: lots }, (_, i) => ({
            schemeId: m.schemeId,
            unitId: `Unit ${i + 1}`,
            lotNumber: i + 1,
            entitlement: `${(100 / lots).toFixed(1)}%`,
            status: 'Vacant',
            actors: []
          }));
          setUnits(prev => {
            const filteredPrev = prev.filter(u => u.schemeId !== m.schemeId);
            return [...filteredPrev, ...newUnits];
          });
        }

        // 2. Ensure member record for activePersona exists in store.members for this scheme
        const hasMemberRecord = members.some(mb => mb.name === activePersona.name && mb.schemeId === m.schemeId);
        if (!hasMemberRecord) {
          const role = m.roles[0] || 'Resident';
          let unitId = 'Unit 1';
          let lotNumber = 1;
          if (activePersona.name === 'Sarah Jones') {
            unitId = 'Unit 1';
            lotNumber = 1;
          } else if (activePersona.name === 'Michael Chen') {
            unitId = 'Unit 3';
            lotNumber = 3;
          } else if (activePersona.name === 'Emma Wilson') {
            unitId = 'Office';
            lotNumber = 0;
          } else if (activePersona.context && activePersona.context.includes('Unit')) {
            unitId = activePersona.context.split(' ')[0] + ' ' + activePersona.context.split(' ')[1]?.replace(/\D/g, '');
            lotNumber = parseInt(unitId.replace(/\D/g, '')) || 1;
          }

          const newMember = {
            id: `MEM-${100 + members.length + Math.floor(Math.random() * 100)}`,
            name: activePersona.name,
            email: activePersona.email || `${activePersona.name.toLowerCase().replace(/\s+/g, '.')}@strata.com.au`,
            phone: '0400 000 000',
            schemeId: m.schemeId,
            role: role as any,
            unitId,
            lotNumber,
            status: 'Active' as const,
            joinedAt: new Date().toISOString().split('T')[0],
          };
          setMembers(prev => {
            if (prev.some(mb => mb.name === activePersona.name && mb.schemeId === m.schemeId)) return prev;
            return [...prev, newMember];
          });
        }
      });
    }

    // Align activeScheme with the activePersona's memberships if they switch
    const hasMembershipInActiveScheme = activePersona.memberships?.some(m => m.schemeId === activeScheme.id);
    if (!hasMembershipInActiveScheme && activePersona.memberships && activePersona.memberships.length > 0) {
      const firstMembershipSchemeId = activePersona.memberships[0].schemeId;
      const targetScheme = schemes.find(s => s.id === firstMembershipSchemeId);
      if (targetScheme) {
        setActiveScheme(targetScheme);
        return;
      }
    }

    const membership = activePersona.memberships?.find(m => m.schemeId === activeScheme.id);
    const newRoles = membership ? membership.roles : [];
    const newRolesStr = newRoles.join(', ');

    const currentRolesStr = activeRoles.join(', ');
    if (currentRolesStr !== newRolesStr) {
      setActiveRoles(newRoles);
    }

    if (activePersona.role !== newRolesStr && newRolesStr) {
      setActivePersona(prev => ({
        ...prev,
        role: newRolesStr
      }));
    }
  }, [activePersona.id, activeScheme.id, activePersona.role, activeRoles, schemes, members]);


  // Initialize permissions list for all roles in all schemes
  const [rolePermissions, setRolePermissions] = usePersistedState<Record<string, Record<string, { label: string; active: boolean; locked?: boolean }[]>>>('smartlot_rolePermissions', () => {
    const initialPerms: Record<string, { label: string; active: boolean; locked?: boolean }[]> = {};
    ['Strata Manager', 'Strata Admin', 'Building Manager', 'Committee Member', 'Lot Owner', 'Resident', 'Tenant', 'Service Provider'].forEach(role => {
      initialPerms[role] = getDefaultPermissionsForRole(role);
    });
    
    const result: Record<string, Record<string, { label: string; active: boolean; locked?: boolean }[]>> = {};
    SCHEMES.forEach(s => {
      result[s.id] = initialPerms;
    });
    // Fallback if somehow empty
    result['SP10482'] = initialPerms;
    result['SP101'] = initialPerms;
    return result;
  });

  const addScheme = (id: string, name: string, lots: number) => {
    const newScheme = { id, name, lots, active: true };
    setSchemes(prev => [...prev, newScheme]);
    
    // Auto-initialize permissions for the new scheme
    const schemePerms: Record<string, { label: string; active: boolean; locked?: boolean }[]> = {};
    ['Strata Manager', 'Strata Admin', 'Building Manager', 'Committee Member', 'Lot Owner', 'Resident', 'Tenant', 'Service Provider'].forEach(role => {
      schemePerms[role] = getDefaultPermissionsForRole(role);
    });

    setRolePermissions(prev => ({
      ...prev,
      [id]: schemePerms
    }));

    // Auto-initialize units roster for the new scheme
    const newUnits: UnitData[] = Array.from({ length: lots }, (_, i) => ({
      schemeId: id,
      unitId: `Unit ${i + 1}`,
      lotNumber: i + 1,
      entitlement: `${(100 / lots).toFixed(1)}%`,
      status: 'Vacant',
      actors: []
    }));
    setUnits(prev => [...prev, ...newUnits]);

    return newScheme;
  };

  const deleteScheme = (id: string) => {
    setSchemes(prev => prev.filter(s => s.id !== id));
  };

  const togglePermission = (schemeId: string, role: string, permissionLabel: string) => {
    setRolePermissions(prev => {
      const schemeRoles = prev[schemeId] || {};
      const rolePerms = schemeRoles[role] || [];
      const updatedPerms = rolePerms.map(p => 
        p.label === permissionLabel && !p.locked ? { ...p, active: !p.active } : p
      );
      return {
        ...prev,
        [schemeId]: {
          ...schemeRoles,
          [role]: updatedPerms
        }
      };
    });
  };

  const hasPermission = (permissionLabel: string) => {
    // Platform super admins always bypass
    if (activePersona.isSystemAdmin || activePersona.role === 'Super Admin' || activePersona.role === 'Website Administrator') {
      return true;
    }

    // Fetch the permissions configuration for the active scheme
    const schemeRoles = rolePermissions[activeScheme.id];
    if (!schemeRoles) {
      // Fallback if scheme isn't registered/setup yet: check default matrix
      return activeRoles.some(r => {
        const defaultPerms = getDefaultPermissionsForRole(r);
        return defaultPerms.some(p => p.label === permissionLabel && p.active);
      });
    }

    // Check if any of the user's active roles has the permission set to active
    return activeRoles.some(r => {
      // Map checkable display roles back to rolePermissions key
      let roleKey = r;
      if (r === 'Committee Member Admin') roleKey = 'Committee Member';
      else if (r === 'Strata Manager Admin') roleKey = 'Strata Manager';
      else if (r === 'Off-Site Lot Owner') roleKey = 'Lot Owner';
      else if (r === 'On-Site Resident') roleKey = 'Resident';
      else if (r === 'Real Estate Property Manager') roleKey = 'Service Provider';

      const rolePerms = schemeRoles[roleKey] || [];
      const permObj = rolePerms.find(p => p.label === permissionLabel);
      return permObj ? permObj.active : false;
    });
  };

  const addMember = (memberData: {
    name: string;
    email: string;
    phone: string;
    role: MemberRole;
    unitId: string;
    lotNumber: number;
    hasCoOwner?: boolean;
    coOwnerName?: string;
    coOwnerEmail?: string;
    additionalOccupants?: AdditionalOccupant[];
  }) => {
    const id = `MEM-${100 + members.length + 1}`;
    const newMember: Member = {
      ...memberData,
      id,
      schemeId: activeScheme.id,
      status: 'Invited',
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setMembers(prev => [newMember, ...prev]);
    return id;
  };

  const updateMemberStatus = (memberId: string, status: 'Active' | 'Invited' | 'Restricted') => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status } : m));
  };

  const deleteMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const submitResidentRequest = (newReq: {
    requestType: RequestStream;
    title: string;
    description: string;
    attachmentUrl?: string;
    priority: 'Low' | 'Medium' | 'High' | 'Emergency';
    dueDate?: string;
  }) => {
    const id = `REQ-${100 + residentRequests.length + 1}`;
    const req: ResidentRequest = {
      id,
      unit: activePersona.context || 'Unit 10',
      title: newReq.title,
      description: newReq.description,
      requestType: newReq.requestType,
      stream: newReq.requestType === 'emergency' ? 'emergency_repair' : newReq.requestType === 'unit_request' ? 'private_lot_repair' : 'common_area_repair',
      priority: newReq.priority,
      dueDate: newReq.dueDate,
      attachmentUrl: newReq.attachmentUrl,
      status: 'pending_triage',
      createdAt: 'Just now',
      requestorName: activePersona.name,
      reportedBy: `${activePersona.name} (${activePersona.role})`,
      requestorEmail: `${activePersona.name.toLowerCase().replace(/\s+/g, '.')}@unit10.com`,
      requestorPhone: '0412 888 999',
      requestorRole: activePersona.role.includes('Owner') ? 'Lot Owner' : activePersona.role.includes('Tenant') ? 'Tenant' : 'Resident',
      comments: [],
    };

    setResidentRequests(prev => [req, ...prev]);
    return id;
  };

  const triageRequest = (requestId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    setResidentRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      if (action === 'reject') {
        return {
          ...r,
          status: 'rejected',
          rejectionReason: rejectionReason || 'Request rejected per strata guidelines.',
        };
      }
      return {
        ...r,
        status: 'approved',
      };
    }));
  };

  const closeResidentRequest = (requestId: string, closeReason: string) => {
    setResidentRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        status: 'closed',
        closeReason,
      };
    }));
  };

  const addCommentToRequest = (requestId: string, commentText: string) => {
    setResidentRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      const newComment: RequestComment = {
        id: `C-${Date.now()}`,
        authorName: activePersona.name,
        authorRole: activePersona.role,
        text: commentText,
        createdAt: 'Just now',
      };
      return {
        ...r,
        comments: [...r.comments, newComment],
      };
    }));
  };

  const updateUnitMetadata = (schemeId: string, unitId: string, entitlement: string, status: 'Occupied' | 'Vacant') => {
    setUnits(prev => prev.map(u => {
      if (u.schemeId !== schemeId || u.unitId !== unitId) return u;
      return { ...u, entitlement, status };
    }));
  };

  const addResidentToUnit = (
    schemeId: string, 
    unitId: string, 
    name: string, 
    email: string, 
    role: 'Lot Owner' | 'On-Site Resident' | 'Tenant' | 'Property Agent', 
    phone?: string, 
    agency?: string
  ) => {
    // 1. Add to units state
    setUnits(prev => prev.map(u => {
      if (u.schemeId !== schemeId || u.unitId !== unitId) return u;
      const newActor: UnitActor = {
        id: `ACT-${Date.now()}`,
        role,
        name,
        email,
        phone,
        agency,
        verified: true,
        permissions: [
          { label: 'Noticeboard Access', active: true },
          { label: 'Maintenance Logging', active: role !== 'Tenant' },
        ],
      };
      return { ...u, status: 'Occupied', actors: [...u.actors, newActor] };
    }));

    // 2. Add to members state to sync roster
    const memberRole = (role === 'On-Site Resident' ? 'Resident' : role) as MemberRole;
    const lotNo = parseInt(unitId.replace(/\D/g, '')) || 1;
    setMembers(prev => {
      if (prev.some(m => m.email === email && m.schemeId === schemeId)) return prev;
      return [
        {
          id: `MEM-${100 + prev.length + 1}`,
          name,
          email,
          phone: phone || '0400 000 000',
          schemeId,
          role: memberRole,
          unitId,
          lotNumber: lotNo,
          status: 'Active',
          joinedAt: new Date().toISOString().split('T')[0],
        },
        ...prev
      ];
    });
  };

  const offboardActor = (schemeId: string, unitId: string, actorId: string) => {
    let emailToOffboard = '';
    
    setUnits(prev => prev.map(u => {
      if (u.schemeId !== schemeId || u.unitId !== unitId) return u;
      const targetActor = u.actors.find(a => a.id === actorId);
      if (targetActor) emailToOffboard = targetActor.email;
      
      const newActors = u.actors.filter(a => a.id !== actorId);
      const newStatus = newActors.length === 0 ? 'Vacant' : u.status;
      return {
        ...u,
        status: newStatus,
        actors: newActors,
      };
    }));

    if (emailToOffboard) {
      setMembers(prev => prev.filter(m => !(m.email === emailToOffboard && m.schemeId === schemeId)));
    }
  };

  return {
    schemes,
    activeScheme,
    setActiveScheme,
    activePersona,
    setActivePersona,
    activeView,
    setActiveView,
    isLoggedIn,
    setIsLoggedIn,
    theme,
    setTheme,
    members,
    setMembers,
    residentRequests,
    cases: residentRequests,
    motions: [],
    vendors: [],
    workOrders: [],
    units,
    addMember,
    updateMemberStatus,
    deleteMember,
    submitResidentRequest,
    triageRequest,
    closeResidentRequest,
    addCommentToRequest,
    addResidentToUnit,
    offboardActor,
    updateUnitMetadata,
    addScheme,
    deleteScheme,
    togglePermission,
    hasPermission,
    rolePermissions,
    activeRoles,
    setActiveRoles,
    submitCase: submitResidentRequest,
    triageCase: triageRequest,
    castBallot: () => {},
    submitGuestWorkOrderCompletion: () => {},
    verifyWorkOrder: () => {},
  };
}
