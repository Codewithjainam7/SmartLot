import { useState } from 'react';
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
  unitId: string;
  lotNumber: number;
  entitlement: string;
  status: 'Occupied' | 'Vacant';
  actors: UnitActor[];
};

// Initial Seed Members with Multiple Occupants in Unit 10
const INITIAL_MEMBERS: Member[] = [
  {
    id: 'MEM-101',
    name: 'Sarah Jenkins',
    email: 'sarah.j@building.com.au',
    phone: '0400 111 222',
    schemeId: 'SP10482',
    role: 'Committee Member',
    unitId: 'Unit 2',
    lotNumber: 2,
    status: 'Active',
    joinedAt: '2025-01-15',
  },
  {
    id: 'MEM-102',
    name: 'Alex Vance',
    email: 'alex.vance@strata.com.au',
    phone: '0411 999 888',
    schemeId: 'SP10482',
    role: 'Strata Manager',
    unitId: 'Office',
    lotNumber: 0,
    status: 'Active',
    joinedAt: '2024-11-01',
  },
  {
    id: 'MEM-103',
    name: 'Mike Davies',
    email: 'mike@owner.com',
    phone: '0411 222 333',
    schemeId: 'SP10482',
    role: 'Lot Owner',
    unitId: 'Unit 10',
    lotNumber: 10,
    hasCoOwner: true,
    coOwnerName: 'Emma Davies',
    coOwnerEmail: 'emma@owner.com',
    additionalOccupants: [
      { id: 'OCC-1', name: 'Lisa Ray', email: 'lisa@unit10.com', role: 'Resident' },
      { id: 'OCC-2', name: 'John Smith', email: 'john@unit10.com', role: 'Tenant' },
      { id: 'OCC-3', name: 'Chloe Davies', email: 'chloe@unit10.com', role: 'Family Member' },
    ],
    status: 'Active',
    joinedAt: '2025-02-10',
  },
  {
    id: 'MEM-104',
    name: 'Lisa Ray',
    email: 'lisa@unit10.com',
    phone: '0412 888 999',
    schemeId: 'SP10482',
    role: 'Resident',
    unitId: 'Unit 10',
    lotNumber: 10,
    status: 'Active',
    joinedAt: '2025-03-01',
  },
  {
    id: 'MEM-105',
    name: 'John Smith',
    email: 'john@unit10.com',
    phone: '0413 777 666',
    schemeId: 'SP10482',
    role: 'Tenant',
    unitId: 'Unit 10',
    lotNumber: 10,
    status: 'Active',
    joinedAt: '2025-04-12',
  },
];

// Initial Seed Requests
const INITIAL_RESIDENT_REQUESTS: ResidentRequest[] = [
  {
    id: 'REQ-101',
    unit: 'Unit 10',
    title: 'Shared Vehicle Entrance Gate Repairs',
    description: 'Automatic vehicle entrance gate motor is grinding and stopping halfway.',
    requestType: 'maintenance_upgrade',
    stream: 'common_area_repair',
    priority: 'High',
    dueDate: '2026-08-25',
    attachmentUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=500&auto=format&fit=crop',
    status: 'pending_triage',
    createdAt: '2 hours ago',
    requestorName: 'Lisa Ray',
    reportedBy: 'Lisa Ray (Resident)',
    requestorEmail: 'lisa@unit10.com',
    requestorPhone: '0412 888 999',
    requestorRole: 'Resident',
    comments: [
      { id: 'C1', authorName: 'Mike Davies', authorRole: 'Lot Owner', text: 'Agreed, this gate has been failing for two weeks.', createdAt: '1 hour ago' },
      { id: 'C2', authorName: 'Sarah Jenkins', authorRole: 'Committee Admin', text: 'Inspected on site, needs motor replacement.', createdAt: '30 mins ago' },
    ],
  },
  {
    id: 'REQ-102',
    unit: 'Unit 2',
    title: 'Basement Garage Water Pipe Leak',
    description: 'High pressure water leak spraying near main electric board in basement B1.',
    requestType: 'emergency',
    stream: 'emergency_repair',
    priority: 'Emergency',
    dueDate: '2026-08-21',
    status: 'approved',
    createdAt: '30 mins ago',
    requestorName: 'Sarah Jenkins',
    reportedBy: 'Sarah Jenkins (Committee Admin)',
    requestorEmail: 'sarah@unit2.com',
    requestorPhone: '0400 111 222',
    requestorRole: 'Lot Owner',
    comments: [],
  },
  {
    id: 'REQ-103',
    unit: 'Unit 1',
    title: 'Noise Complaint - Late Night Music',
    description: 'Loud music from common balcony area past 11 PM on weekends.',
    requestType: 'complaint',
    stream: 'general_inquiry',
    priority: 'Medium',
    status: 'approved',
    createdAt: '1 day ago',
    requestorName: 'Smith Family',
    reportedBy: 'Smith Family (Lot Owner)',
    requestorEmail: 'smith@unit1.com',
    requestorPhone: '0433 222 111',
    requestorRole: 'Lot Owner',
    comments: [
      { id: 'C3', authorName: 'Alex Vance', authorRole: 'Strata Manager', text: 'Formal bylaw notice issued to relevant lot.', createdAt: 'Yesterday' }
    ],
  },
];

const INITIAL_UNITS: UnitData[] = [
  {
    unitId: 'Unit 10',
    lotNumber: 10,
    entitlement: '12.5%',
    status: 'Occupied',
    actors: [
      {
        id: 'ACT-1',
        role: 'Lot Owner',
        name: 'Mike Davies',
        email: 'mike@owner.com',
        phone: '0411 222 333',
        verified: true,
        permissions: [
          { label: 'Levies & Financials', active: true },
          { label: 'Voting Rights (Ballots)', active: true },
        ],
      },
      {
        id: 'ACT-2',
        role: 'On-Site Resident',
        name: 'Lisa Ray',
        email: 'lisa@unit10.com',
        phone: '0412 888 999',
        verified: true,
        permissions: [
          { label: 'Noticeboard Access', active: true },
          { label: 'Maintenance Logging', active: true },
        ],
      },
    ],
  },
];

export function useSmartLotStore() {
  const [activeScheme, setActiveScheme] = useState<Scheme>(SCHEMES[0]);
  const [activePersona, setActivePersona] = useState<Persona>(PERSONAS[1]); // Default to Strata Manager Alex Vance
  const [activeView, setActiveView] = useState<'dashboard' | 'user_management' | 'requests' | 'triage'>('dashboard');
  
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [residentRequests, setResidentRequests] = useState<ResidentRequest[]>(INITIAL_RESIDENT_REQUESTS);
  const [units, setUnits] = useState<UnitData[]>(INITIAL_UNITS);

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
    activeScheme,
    setActiveScheme,
    activePersona,
    setActivePersona,
    activeView,
    setActiveView,
    isLoggedIn,
    setIsLoggedIn,
    members,
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
    submitCase: submitResidentRequest,
    triageCase: triageRequest,
    castBallot: () => {},
    submitGuestWorkOrderCompletion: () => {},
    verifyWorkOrder: () => {},
  };
}
