import { useState, useEffect } from 'react';
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

export function useSmartLotStore() {
  const [schemes, setSchemes] = useState<Scheme[]>(SCHEMES);
  const [activeScheme, setActiveScheme] = useState<Scheme>(
    SCHEMES.length > 0 
      ? SCHEMES[0] 
      : { id: 'NO_SCHEME', name: 'No Registered Schemes', lots: 0, active: false }
  );
  const [activePersona, setActivePersona] = useState<Persona>(PERSONAS[1]); // Default to Strata Manager Alex Vance
  const [activeRoles, setActiveRoles] = useState<string[]>(['Strata Manager']);
  const [activeView, setActiveView] = useState<'dashboard' | 'user_management' | 'requests' | 'triage'>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [residentRequests, setResidentRequests] = useState<ResidentRequest[]>(INITIAL_RESIDENT_REQUESTS);
  const [units, setUnits] = useState<UnitData[]>(INITIAL_UNITS);

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
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, { label: string; active: boolean; locked?: boolean }[]>>>({
    'SP10482': {
      'Strata Manager': [
        { label: 'Noticeboard Access', active: true, locked: true },
        { label: 'Maintenance Logging', active: true, locked: true },
        { label: 'Voting Rights (Ballots)', active: true, locked: true },
        { label: 'Team Access & Invites', active: true, locked: true },
      ],
      'Committee Member': [
        { label: 'Noticeboard Access', active: true },
        { label: 'Maintenance Logging', active: true },
        { label: 'Voting Rights (Ballots)', active: true },
        { label: 'Team Access & Invites', active: false },
      ],
      'Lot Owner': [
        { label: 'Noticeboard Access', active: true },
        { label: 'Maintenance Logging', active: true },
        { label: 'Voting Rights (Ballots)', active: true },
        { label: 'Team Access & Invites', active: false },
      ],
      'Resident': [
        { label: 'Noticeboard Access', active: true },
        { label: 'Maintenance Logging', active: true },
        { label: 'Voting Rights (Ballots)', active: false },
        { label: 'Team Access & Invites', active: false, locked: true },
      ],
      'Tenant': [
        { label: 'Noticeboard Access', active: true },
        { label: 'Maintenance Logging', active: true },
        { label: 'Voting Rights (Ballots)', active: false },
        { label: 'Team Access & Invites', active: false, locked: true },
      ],
    }
  });

  const addScheme = (id: string, name: string, lots: number) => {
    const newScheme = { id, name, lots, active: true };
    setSchemes(prev => [...prev, newScheme]);
    
    // Auto-initialize permissions for the new scheme
    setRolePermissions(prev => ({
      ...prev,
      [id]: {
        'Strata Manager': [
          { label: 'Noticeboard Access', active: true, locked: true },
          { label: 'Maintenance Logging', active: true, locked: true },
          { label: 'Voting Rights (Ballots)', active: true, locked: true },
          { label: 'Team Access & Invites', active: true, locked: true },
        ],
        'Committee Member': [
          { label: 'Noticeboard Access', active: true },
          { label: 'Maintenance Logging', active: true },
          { label: 'Voting Rights (Ballots)', active: true },
          { label: 'Team Access & Invites', active: false },
        ],
        'Lot Owner': [
          { label: 'Noticeboard Access', active: true },
          { label: 'Maintenance Logging', active: true },
          { label: 'Voting Rights (Ballots)', active: true },
          { label: 'Team Access & Invites', active: false },
        ],
        'Resident': [
          { label: 'Noticeboard Access', active: true },
          { label: 'Maintenance Logging', active: true },
          { label: 'Voting Rights (Ballots)', active: false },
          { label: 'Team Access & Invites', active: false, locked: true },
        ],
        'Tenant': [
          { label: 'Noticeboard Access', active: true },
          { label: 'Maintenance Logging', active: true },
          { label: 'Voting Rights (Ballots)', active: false },
          { label: 'Team Access & Invites', active: false, locked: true },
        ],
      }
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
    if (activePersona.role === 'Super Admin' || activePersona.role === 'Website Administrator' || activePersona.isSystemAdmin) {
      return true;
    }

    // Strata Admin / Strata Manager (by design, always has full permissions)
    if (activeRoles.some(r => r.includes('Admin') || r.includes('Manager') || r.includes('Strata Admin'))) {
      return true;
    }

    // Standard lookup
    const schemeRoles = rolePermissions[activeScheme.id] || {};
    
    // Map active roles to Member Roles and check if any active role has permission
    return activeRoles.some(r => {
      let roleKey = 'Resident';
      if (r.includes('Committee')) roleKey = 'Committee Member';
      else if (r.includes('Owner')) roleKey = 'Lot Owner';
      else if (r.includes('Tenant')) roleKey = 'Tenant';
      else if (r.includes('Resident')) roleKey = 'Resident';

      const rolePerms = schemeRoles[roleKey] || [];
      const perm = rolePerms.find(p => p.label === permissionLabel);
      return perm ? perm.active : false;
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

  const addResidentToUnit = (unitId: string, name: string, email: string) => {
    setUnits(prev => prev.map(u => {
      if (u.unitId !== unitId) return u;
      const newActor: UnitActor = {
        id: `ACT-${Date.now()}`,
        role: 'On-Site Resident',
        name,
        email,
        verified: true,
        permissions: [
          { label: 'Noticeboard Access', active: true },
          { label: 'Maintenance Logging', active: true },
        ],
      };
      return { ...u, actors: [...u.actors, newActor] };
    }));
  };

  const offboardActor = (unitId: string, actorId: string) => {
    setUnits(prev => prev.map(u => {
      if (u.unitId !== unitId) return u;
      return {
        ...u,
        actors: u.actors.filter(a => a.id !== actorId),
      };
    }));
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
