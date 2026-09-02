import React, { useState, useEffect } from 'react';
import { SCHEMES, PERSONAS, Scheme, Persona } from '../types';
import { supabase } from '../lib/supabase';

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
  schemeId: string;
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
  requestorRole: 'Lot Owner' | 'Resident' | 'Tenant' | 'Strata Manager' | 'Committee Member' | 'Building Manager';
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
  individualPermissions?: { label: string; active: boolean }[];
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

// Initial Seed Members across Duplex, Coronation, Cavalier, and Spear Empire
const INITIAL_MEMBERS: Member[] = [
  // 1. Roman Joe (Strata Manager for Spear Empire SP823)
  {
    id: 'MEM-ROMAN-823',
    name: 'Roman Joe',
    email: 'romanjoe@gmail.com',
    phone: '0411 888 777',
    schemeId: 'SP823', // Spear Empire
    role: 'Strata Manager',
    unitId: 'HQ / Management',
    lotNumber: 0,
    status: 'Active',
    joinedAt: '2024-01-10',
  },

  // 2. Sunset Duplex (SP101) Members
  {
    id: 'MEM-DUP-1',
    name: 'Sarah Jones',
    email: 'sarah.jones@duplex.com',
    phone: '0400 111 222',
    schemeId: 'SP101',
    role: 'Lot Owner',
    unitId: 'Unit 1',
    lotNumber: 1,
    status: 'Active',
    joinedAt: '2024-03-15',
  },
  {
    id: 'MEM-DUP-2',
    name: 'David Miller',
    email: 'david.m@duplex.com',
    phone: '0412 333 444',
    schemeId: 'SP101',
    role: 'Tenant',
    unitId: 'Unit 2',
    lotNumber: 2,
    status: 'Active',
    joinedAt: '2024-06-01',
  },

  // 3. Coronation Residences (SP102) Members
  {
    id: 'MEM-COR-1',
    name: 'Elena Rostov',
    email: 'elena.r@coronation.com',
    phone: '0422 100 200',
    schemeId: 'SP102',
    role: 'Lot Owner',
    unitId: 'Unit 1',
    lotNumber: 1,
    status: 'Active',
    joinedAt: '2024-02-20',
  },
  {
    id: 'MEM-COR-2',
    name: 'Michael Chen',
    email: 'michael.chen@coronation.com',
    phone: '0411 222 333',
    schemeId: 'SP102',
    role: 'Committee Member',
    unitId: 'Unit 2',
    lotNumber: 2,
    status: 'Active',
    joinedAt: '2024-04-10',
  },
  {
    id: 'MEM-COR-3',
    name: 'Marcus Sterling',
    email: 'marcus.s@coronation.com',
    phone: '0433 444 555',
    schemeId: 'SP102',
    role: 'Committee Member',
    unitId: 'Unit 3',
    lotNumber: 3,
    status: 'Active',
    joinedAt: '2024-05-01',
  },
  {
    id: 'MEM-COR-4',
    name: 'Chloe Bennett',
    email: 'chloe.b@coronation.com',
    phone: '0444 555 666',
    schemeId: 'SP102',
    role: 'Tenant',
    unitId: 'Unit 4',
    lotNumber: 4,
    status: 'Active',
    joinedAt: '2024-07-15',
  },
  {
    id: 'MEM-COR-5',
    name: 'Liam Hemsworth',
    email: 'liam.h@coronation.com',
    phone: '0455 666 777',
    schemeId: 'SP102',
    role: 'Resident',
    unitId: 'Unit 5',
    lotNumber: 5,
    status: 'Active',
    joinedAt: '2024-08-01',
  },
  {
    id: 'MEM-COR-6',
    name: 'Rachel Adams',
    email: 'rachel.a@coronation.com',
    phone: '0466 777 888',
    schemeId: 'SP102',
    role: 'Lot Owner',
    unitId: 'Unit 6',
    lotNumber: 6,
    status: 'Active',
    joinedAt: '2024-08-15',
  },

  // 4. Cavalier Grand Residences (SP103) Members
  {
    id: 'MEM-CAV-1',
    name: 'Emma Wilson',
    email: 'emma.wilson@agency.com',
    phone: '0499 888 111',
    schemeId: 'SP103',
    role: 'Strata Manager',
    unitId: 'HQ / Management',
    lotNumber: 0,
    status: 'Active',
    joinedAt: '2024-01-05',
  },
  {
    id: 'MEM-CAV-2',
    name: 'Arthur Pendelton',
    email: 'arthur.p@cavalier.com',
    phone: '0477 111 999',
    schemeId: 'SP103',
    role: 'Committee Member',
    unitId: 'Unit 101',
    lotNumber: 1,
    status: 'Active',
    joinedAt: '2024-02-15',
  },
  {
    id: 'MEM-CAV-3',
    name: 'Sophia Zhang',
    email: 'sophia.z@cavalier.com',
    phone: '0488 222 888',
    schemeId: 'SP103',
    role: 'Lot Owner',
    unitId: 'Unit 204',
    lotNumber: 8,
    status: 'Active',
    joinedAt: '2024-03-22',
  },
  {
    id: 'MEM-CAV-4',
    name: 'Oliver Vance',
    email: 'oliver.v@cavalier.com',
    phone: '0499 333 777',
    schemeId: 'SP103',
    role: 'Resident',
    unitId: 'Unit 305',
    lotNumber: 15,
    status: 'Active',
    joinedAt: '2024-05-11',
  },
  {
    id: 'MEM-CAV-5',
    name: 'Jessica Taylor',
    email: 'jessica.t@cavalier.com',
    phone: '0400 444 666',
    schemeId: 'SP103',
    role: 'Tenant',
    unitId: 'Unit 410',
    lotNumber: 22,
    status: 'Active',
    joinedAt: '2024-06-19',
  },
  {
    id: 'MEM-CAV-6',
    name: 'Brandon Cole',
    email: 'brandon.c@cavalier.com',
    phone: '0411 555 555',
    schemeId: 'SP103',
    role: 'Lot Owner',
    unitId: 'Unit 502',
    lotNumber: 24,
    status: 'Active',
    joinedAt: '2024-07-01',
  }
];

const INITIAL_RESIDENT_REQUESTS: ResidentRequest[] = [
  // Duplex (SP101) Requests
  {
    id: 'REQ-DUP-101',
    schemeId: 'SP101',
    unit: 'Unit 1',
    title: 'Shared Driveway Motorized Gate Sensor Glitch',
    description: 'Vehicle entrance swing gate safety beam is tripping intermittently during sunset, causing gate to stall halfway.',
    requestType: 'maintenance_upgrade',
    stream: 'common_area_repair',
    priority: 'High',
    dueDate: '2026-09-05',
    status: 'pending_triage',
    createdAt: '3 hours ago',
    requestorName: 'Sarah Jones',
    reportedBy: 'Sarah Jones (Lot Owner)',
    requestorEmail: 'sarah.jones@duplex.com',
    requestorPhone: '0400 111 222',
    requestorRole: 'Lot Owner',
    comments: [
      { id: 'C1', authorName: 'Roman Joe', authorRole: 'Strata Manager', text: 'Contacted Automatic Gates NSW for emergency technician dispatch.', createdAt: '1 hour ago' }
    ],
  },
  {
    id: 'REQ-DUP-102',
    schemeId: 'SP101',
    unit: 'Unit 2',
    title: 'Roof Guttering & Downpipe Overflow Cleaning',
    description: 'Heavy rain caused stormwater gutter overflowing along the common boundary fence wall.',
    requestType: 'maintenance_upgrade',
    stream: 'common_area_repair',
    priority: 'Medium',
    status: 'approved',
    createdAt: '1 day ago',
    requestorName: 'David Miller',
    reportedBy: 'David Miller (Tenant)',
    requestorEmail: 'david.m@duplex.com',
    requestorPhone: '0412 333 444',
    requestorRole: 'Tenant',
    comments: [],
  },

  // Coronation (SP102) Requests
  {
    id: 'REQ-COR-201',
    schemeId: 'SP102',
    unit: 'Unit 2',
    title: 'Emergency Main Foyer Intercom Power Failure',
    description: 'Central door release intercom board is unresponsive; delivery couriers and guests unable to ring apartments.',
    requestType: 'emergency',
    stream: 'emergency_repair',
    priority: 'Emergency',
    dueDate: '2026-09-02',
    status: 'approved',
    createdAt: '45 mins ago',
    requestorName: 'Michael Chen',
    reportedBy: 'Michael Chen (Committee Member)',
    requestorEmail: 'michael.chen@coronation.com',
    requestorPhone: '0411 222 333',
    requestorRole: 'Committee Member',
    comments: [
      { id: 'C2', authorName: 'Roman Joe', authorRole: 'Strata Manager', text: 'Electrician on route with replacement 24V power supply unit.', createdAt: '20 mins ago' }
    ],
  },
  {
    id: 'REQ-COR-202',
    schemeId: 'SP102',
    unit: 'Unit 1',
    title: 'Central Garden Irrigation Valve Burst',
    description: 'Irrigation pipe in courtyard garden sprung a pressurized leak flooding the walkway lawn.',
    requestType: 'maintenance_upgrade',
    stream: 'common_area_repair',
    priority: 'High',
    status: 'pending_triage',
    createdAt: '2 hours ago',
    requestorName: 'Elena Rostov',
    reportedBy: 'Elena Rostov (Lot Owner)',
    requestorEmail: 'elena.r@coronation.com',
    requestorPhone: '0422 100 200',
    requestorRole: 'Lot Owner',
    comments: [],
  },
  {
    id: 'REQ-COR-203',
    schemeId: 'SP102',
    unit: 'Unit 3',
    title: 'Visitor Car Parking Bay Line Marking Refresh',
    description: 'Yellow visitor bay line markings have faded in the underground parking bays.',
    requestType: 'maintenance_upgrade',
    stream: 'common_area_repair',
    priority: 'Low',
    status: 'resolved',
    createdAt: '3 days ago',
    requestorName: 'Marcus Sterling',
    reportedBy: 'Marcus Sterling (Committee Member)',
    requestorEmail: 'marcus.s@coronation.com',
    requestorPhone: '0433 444 555',
    requestorRole: 'Committee Member',
    comments: [
      { id: 'C3', authorName: 'Roman Joe', authorRole: 'Strata Manager', text: 'Contractor repainted bays on Aug 30.', createdAt: 'Yesterday' }
    ],
  },

  // Cavalier Grand (SP103) Requests
  {
    id: 'REQ-CAV-301',
    schemeId: 'SP103',
    unit: 'Unit 101',
    title: 'Elevator 2 Power Inverter Fault - Tower B',
    description: 'Passenger Lift #2 showing Error Code E-41 on display panel and running at half speed.',
    requestType: 'emergency',
    stream: 'emergency_repair',
    priority: 'Emergency',
    dueDate: '2026-09-02',
    status: 'approved',
    createdAt: '1 hour ago',
    requestorName: 'Arthur Pendelton',
    reportedBy: 'Arthur Pendelton (Committee Chairman)',
    requestorEmail: 'arthur.p@cavalier.com',
    requestorPhone: '0477 111 999',
    requestorRole: 'Committee Member',
    comments: [
      { id: 'C4', authorName: 'Roman Joe', authorRole: 'Strata Manager', text: 'KONE Elevator technicians scheduled for 10:00 AM on-site service.', createdAt: '30 mins ago' }
    ],
  },
  {
    id: 'REQ-CAV-302',
    schemeId: 'SP103',
    unit: 'Unit 204',
    title: 'Basement Level B2 Sump Pump Sensor Alert',
    description: 'Telemetry monitoring system flagged high water table in lower drainage pit.',
    requestType: 'emergency',
    stream: 'emergency_repair',
    priority: 'Emergency',
    status: 'pending_triage',
    createdAt: '2 hours ago',
    requestorName: 'Sophia Zhang',
    reportedBy: 'Sophia Zhang (Lot Owner)',
    requestorEmail: 'sophia.z@cavalier.com',
    requestorPhone: '0488 222 888',
    requestorRole: 'Lot Owner',
    comments: [],
  },
  {
    id: 'REQ-CAV-303',
    schemeId: 'SP103',
    unit: 'Unit 305',
    title: 'Rooftop Solar Array Inverter 3 Communication Dropout',
    description: 'Smart meter portal is unable to read telemetry data from the commercial inverter bank.',
    requestType: 'maintenance_upgrade',
    stream: 'common_area_repair',
    priority: 'Medium',
    status: 'approved',
    createdAt: '1 day ago',
    requestorName: 'Oliver Vance',
    reportedBy: 'Oliver Vance (Resident)',
    requestorEmail: 'oliver.v@cavalier.com',
    requestorPhone: '0499 333 777',
    requestorRole: 'Resident',
    comments: [],
  },
  {
    id: 'REQ-CAV-304',
    schemeId: 'SP103',
    unit: 'Unit 410',
    title: 'Heated Lap Pool Filtration & Chlorination Servicing',
    description: 'Pool chlorine readout is low; salt cell chlorinator requires scheduled acid wash.',
    requestType: 'maintenance_upgrade',
    stream: 'common_area_repair',
    priority: 'Medium',
    status: 'new',
    createdAt: '4 hours ago',
    requestorName: 'Jessica Taylor',
    reportedBy: 'Jessica Taylor (Tenant)',
    requestorEmail: 'jessica.t@cavalier.com',
    requestorPhone: '0400 444 666',
    requestorRole: 'Tenant',
    comments: [],
  }
];

const INITIAL_UNITS: UnitData[] = [
  // Duplex (SP101) Units
  {
    schemeId: 'SP101',
    unitId: 'Unit 1',
    lotNumber: 1,
    entitlement: '50.0%',
    status: 'Occupied',
    actors: [
      {
        id: 'ACT-D1',
        role: 'Lot Owner',
        name: 'Sarah Jones',
        email: 'sarah.jones@duplex.com',
        phone: '0400 111 222',
        verified: true,
        permissions: [
          { label: 'Levies & Financials', active: true },
          { label: 'Voting Rights (Ballots)', active: true },
          { label: 'Maintenance Logging', active: true },
        ],
      }
    ],
  },
  {
    schemeId: 'SP101',
    unitId: 'Unit 2',
    lotNumber: 2,
    entitlement: '50.0%',
    status: 'Occupied',
    actors: [
      {
        id: 'ACT-D2',
        role: 'Tenant',
        name: 'David Miller',
        email: 'david.m@duplex.com',
        phone: '0412 333 444',
        verified: true,
        permissions: [
          { label: 'Noticeboard Access', active: true },
          { label: 'Maintenance Logging', active: true },
        ],
      }
    ],
  },

  // Coronation Residences (SP102) Units
  {
    schemeId: 'SP102',
    unitId: 'Unit 1',
    lotNumber: 1,
    entitlement: '8.33%',
    status: 'Occupied',
    actors: [
      {
        id: 'ACT-C1',
        role: 'Lot Owner',
        name: 'Elena Rostov',
        email: 'elena.r@coronation.com',
        phone: '0422 100 200',
        verified: true,
        permissions: [
          { label: 'Levies & Financials', active: true },
          { label: 'Voting Rights (Ballots)', active: true },
        ],
      }
    ],
  },
  {
    schemeId: 'SP102',
    unitId: 'Unit 2',
    lotNumber: 2,
    entitlement: '8.33%',
    status: 'Occupied',
    actors: [
      {
        id: 'ACT-C2',
        role: 'Lot Owner',
        name: 'Michael Chen',
        email: 'michael.chen@coronation.com',
        phone: '0411 222 333',
        verified: true,
        permissions: [
          { label: 'Levies & Financials', active: true },
          { label: 'Voting Rights (Ballots)', active: true },
        ],
      }
    ],
  },
  {
    schemeId: 'SP102',
    unitId: 'Unit 3',
    lotNumber: 3,
    entitlement: '8.33%',
    status: 'Occupied',
    actors: [
      {
        id: 'ACT-C3',
        role: 'Lot Owner',
        name: 'Marcus Sterling',
        email: 'marcus.s@coronation.com',
        phone: '0433 444 555',
        verified: true,
        permissions: [
          { label: 'Levies & Financials', active: true },
          { label: 'Voting Rights (Ballots)', active: true },
        ],
      }
    ],
  },
  {
    schemeId: 'SP102',
    unitId: 'Unit 4',
    lotNumber: 4,
    entitlement: '8.33%',
    status: 'Occupied',
    actors: [
      {
        id: 'ACT-C4',
        role: 'Tenant',
        name: 'Chloe Bennett',
        email: 'chloe.b@coronation.com',
        phone: '0444 555 666',
        verified: true,
        permissions: [
          { label: 'Noticeboard Access', active: true },
          { label: 'Maintenance Logging', active: true },
        ],
      }
    ],
  },
  {
    schemeId: 'SP102',
    unitId: 'Unit 5',
    lotNumber: 5,
    entitlement: '8.33%',
    status: 'Occupied',
    actors: [
      {
        id: 'ACT-C5',
        role: 'On-Site Resident',
        name: 'Liam Hemsworth',
        email: 'liam.h@coronation.com',
        phone: '0455 666 777',
        verified: true,
        permissions: [
          { label: 'Noticeboard Access', active: true },
          { label: 'Maintenance Logging', active: true },
        ],
      }
    ],
  },
  {
    schemeId: 'SP102',
    unitId: 'Unit 6',
    lotNumber: 6,
    entitlement: '8.33%',
    status: 'Occupied',
    actors: [
      {
        id: 'ACT-C6',
        role: 'Lot Owner',
        name: 'Rachel Adams',
        email: 'rachel.a@coronation.com',
        phone: '0466 777 888',
        verified: true,
        permissions: [
          { label: 'Levies & Financials', active: true },
          { label: 'Voting Rights (Ballots)', active: true },
        ],
      }
    ],
  },
  {
    schemeId: 'SP102',
    unitId: 'Unit 7',
    lotNumber: 7,
    entitlement: '8.33%',
    status: 'Vacant',
    actors: [],
  },
  {
    schemeId: 'SP102',
    unitId: 'Unit 8',
    lotNumber: 8,
    entitlement: '8.33%',
    status: 'Vacant',
    actors: [],
  },

  // Cavalier Grand Residences (SP103) Units
  {
    schemeId: 'SP103',
    unitId: 'Unit 101',
    lotNumber: 1,
    entitlement: '4.16%',
    status: 'Occupied',
    actors: [
      {
        id: 'ACT-CAV1',
        role: 'Lot Owner',
        name: 'Arthur Pendelton',
        email: 'arthur.p@cavalier.com',
        phone: '0477 111 999',
        verified: true,
        permissions: [
          { label: 'Levies & Financials', active: true },
          { label: 'Voting Rights (Ballots)', active: true },
        ],
      }
    ],
  },
  {
    schemeId: 'SP103',
    unitId: 'Unit 204',
    lotNumber: 8,
    entitlement: '4.16%',
    status: 'Occupied',
    actors: [
      {
        id: 'ACT-CAV2',
        role: 'Lot Owner',
        name: 'Sophia Zhang',
        email: 'sophia.z@cavalier.com',
        phone: '0488 222 888',
        verified: true,
        permissions: [
          { label: 'Levies & Financials', active: true },
          { label: 'Voting Rights (Ballots)', active: true },
        ],
      }
    ],
  },
  {
    schemeId: 'SP103',
    unitId: 'Unit 305',
    lotNumber: 15,
    entitlement: '4.16%',
    status: 'Occupied',
    actors: [
      {
        id: 'ACT-CAV3',
        role: 'On-Site Resident',
        name: 'Oliver Vance',
        email: 'oliver.v@cavalier.com',
        phone: '0499 333 777',
        verified: true,
        permissions: [
          { label: 'Noticeboard Access', active: true },
          { label: 'Maintenance Logging', active: true },
        ],
      }
    ],
  },
  {
    schemeId: 'SP103',
    unitId: 'Unit 410',
    lotNumber: 22,
    entitlement: '4.16%',
    status: 'Occupied',
    actors: [
      {
        id: 'ACT-CAV4',
        role: 'Tenant',
        name: 'Jessica Taylor',
        email: 'jessica.t@cavalier.com',
        phone: '0400 444 666',
        verified: true,
        permissions: [
          { label: 'Noticeboard Access', active: true },
          { label: 'Maintenance Logging', active: true },
        ],
      }
    ],
  },
  {
    schemeId: 'SP103',
    unitId: 'Unit 502',
    lotNumber: 24,
    entitlement: '4.16%',
    status: 'Occupied',
    actors: [
      {
        id: 'ACT-CAV5',
        role: 'Lot Owner',
        name: 'Brandon Cole',
        email: 'brandon.c@cavalier.com',
        phone: '0411 555 555',
        verified: true,
        permissions: [
          { label: 'Levies & Financials', active: true },
          { label: 'Voting Rights (Ballots)', active: true },
        ],
      }
    ],
  }
];

export const getDefaultPermissionsForRole = (role: string): { label: string; active: boolean; locked?: boolean }[] => {
  const isSM = role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin';
  const isBM = role === 'Building Manager';
  const isCM = role === 'Committee Member';
  const isRES = role === 'Lot Owner' || role === 'Resident' || role === 'Tenant';
  const isVEN = role === 'Service Provider';

  return [
    // 1. Request Submission
    { label: 'Submit Request', active: isSM || isBM || isCM || isRES },
    { label: 'Add Comment on request', active: isSM || isBM || isCM || isRES },

    // 2. Request Review & Approval
    { label: 'View Requests', active: isSM || isBM || isCM || isRES || isVEN },
    { label: 'Filter & Sort Requests', active: isSM || isBM || isCM || isRES },
    { label: 'Review & Edit Request Fields', active: isSM },
    { label: 'Approve / Reject Requests', active: isSM },

    // 3. Voting Management
    { label: 'Create Voting/Motion', active: isSM },
    { label: 'Publish Motion', active: isSM },
    { label: 'Cast Vote', active: isCM },
    { label: 'View Voting Dashboard', active: isSM || isBM || isCM || isRES },
    { label: 'View Voting Comment/Discussion', active: isSM || isBM || isCM || isRES },
    { label: 'Add Voting Comment', active: isSM || isBM || isCM || isRES },
    { label: 'View Final Vote Result', active: isSM || isBM || isCM || isRES },

    // 4. Vendor Management & Selection
    { label: 'Request Quotes from Vendors', active: isSM },
    { label: 'Submit Quote', active: isVEN },
    { label: 'View & Compare Quotes', active: isSM },
    { label: 'Raise Quote Poll', active: isSM },
    { label: 'Vote in Quote Poll', active: isCM },
    { label: 'Assign Selected Vendor', active: isSM },

    // 5. Work order Execution
    { label: 'Upload PO Document', active: isSM },
    { label: 'Begin / Progress Task', active: isSM },
    { label: 'Upload Completion Evidence', active: isSM },
    { label: 'Mark Task as Completed', active: isSM },
    { label: 'Task Archive / Review', active: isSM },

    // 6. Emergency Requests
    { label: 'Create and Submit Emergency Request', active: isSM || isBM || isCM || isRES },
    { label: 'Fast-track to Task Execution', active: isSM },

    // 7. System / Admin Functions
    { label: 'Role & Permission Setup', active: isSM },
    { label: 'Module Level Access Management', active: isSM }
  ];
};

// usePersistedState REMOVED - all state now comes from Supabase, not localStorage.
// This wrapper keeps the same API signature so we don't have to refactor every call site,
// but it no longer reads/writes localStorage at all.
function usePersistedState<T>(_key: string, defaultValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    return defaultValue instanceof Function ? defaultValue() : defaultValue;
  });
  return [state, setState];
}

export function useSmartLotStore() {
  const [activePersona, setActivePersona] = usePersistedState<Persona>('smartlot_activePersona_v8', PERSONAS[1]); // We'll keep this temporarily for backward compatibility while refactoring
  const pId = activePersona?.id || 'default';

  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // Local state initialized to empty for live Supabase fetch
  const [schemes, setSchemes] = useState<Scheme[]>(SCHEMES);
  const [activeScheme, setActiveScheme] = usePersistedState<Scheme>(`smartlot_${pId}_activeScheme_v8`, 
    { id: 'NO_SCHEME', name: 'No Registered Schemes', lots: 0, active: false }
  );

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const syncUserProfile = async (authUser: any) => {
      if (!authUser?.email) return;
      const email = authUser.email.toLowerCase();
      
      try {
        const [{ data: profile }, { data: memberRows }] = await Promise.all([
          supabase.from('profiles').select('*').ilike('email', email).maybeSingle(),
          supabase.from('members').select('*').ilike('email', email)
        ]);

        const firstMember = memberRows && memberRows.length > 0 ? memberRows[0] : null;
        const name = profile?.full_name || authUser.user_metadata?.full_name || firstMember?.name || 'User';
        const role = firstMember?.role || (profile?.is_system_admin ? 'Strata Manager' : 'Lot Owner');
        const unit = firstMember?.unit_id || 'Unit 1';
        const schemeId = firstMember?.scheme_id;

        setActivePersona(prev => ({
          ...prev,
          id: authUser.id,
          name,
          email: authUser.email,
          role: role as any,
          context: unit
        }));

        if (schemeId) {
          const { data: sData } = await supabase.from('schemes').select('*').eq('id', schemeId).maybeSingle();
          if (sData) {
            setActiveScheme({
              id: sData.id,
              name: sData.name,
              lots: sData.lots,
              active: sData.active
            });
          }
        }
      } catch (err) {
        console.error("Error syncing profile:", err);
      }
    };

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.warn("User deleted from DB, clearing stale browser session.");
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setIsLoggedIn(false);
          return;
        }

        setSession(session);
        setUser(user);
        setIsLoggedIn(true);
        await syncUserProfile(user);
      } else {
        setIsLoggedIn(false);
      }
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsLoggedIn(true);
        await syncUserProfile(session.user);
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Live Data from Supabase universally for all sessions (including Super Admin) - HIGH SPEED PARALLEL FETCH
  const refreshData = async () => {
    setIsLoading(true);
    try {
      // 🚀 Fast parallel roundtrip: Fetch all 5 tables at once
      const [
        { data: schemesData },
        { data: membersData },
        { data: profilesData },
        { data: reqsData },
        { data: unitsData }
      ] = await Promise.all([
        supabase.from('schemes').select('*'),
        supabase.from('members').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('resident_requests').select('*'),
        supabase.from('units').select('*')
      ]);
      
      let formattedSchemes = SCHEMES;
      if (schemesData && schemesData.length > 0) {
        formattedSchemes = schemesData.map(s => ({
          id: s.id,
          name: s.name,
          lots: s.lots,
          active: s.active
        }));
      }
      setSchemes(formattedSchemes);
      
      if (formattedSchemes.length > 0) {
        setActiveScheme(prev => {
          if (prev.id === 'NO_SCHEME' || !formattedSchemes.find(f => f.id === prev.id)) {
            return formattedSchemes[0];
          }
          return prev;
        });
      }

      // Process members & profiles
      let formattedMembers: Member[] = INITIAL_MEMBERS;
      if (membersData && membersData.length > 0) {
        formattedMembers = membersData.map(m => {
          const isMgmt = m.role && (m.role.includes('Manager') || m.role.includes('Admin'));
          return {
            id: m.id,
            name: m.name,
            email: m.email,
            phone: m.phone || '0400 000 000',
            schemeId: m.scheme_id,
            role: m.role as any,
            unitId: isMgmt || m.unit_id === 'Admin' ? 'HQ / Management' : (m.unit_id || 'Unit 1'),
            lotNumber: isMgmt ? 0 : (m.lot_number || 1),
            status: m.status || 'Active',
            joinedAt: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          };
        });
      }
      setMembers(formattedMembers);

      // Process requests
      if (reqsData && reqsData.length > 0) {
        const formattedReqs = reqsData.map(r => {
          const matchingMember = formattedMembers.find(m => m.schemeId === r.scheme_id && m.unitId === r.unit_id);
          const initialMatchingReq = INITIAL_RESIDENT_REQUESTS.find(ir => ir.title === r.title || ir.id === r.id);
          
          const requestorName = r.requestor_name || initialMatchingReq?.requestorName || matchingMember?.name || (r.scheme_id === 'SP101' ? 'Sarah Jones' : r.scheme_id === 'SP102' ? 'Michael Chen' : 'Arthur Pendelton');
          const requestorEmail = r.requestor_email || initialMatchingReq?.requestorEmail || matchingMember?.email || 'resident@smartlot.com.au';
          const requestorRole = (r.requestor_role || initialMatchingReq?.requestorRole || matchingMember?.role || 'Lot Owner') as any;

          return {
            id: r.id,
            schemeId: r.scheme_id,
            unit: r.unit_id || 'Unit 1',
            title: r.title,
            description: r.description || initialMatchingReq?.description || '',
            requestType: r.request_type || 'maintenance_upgrade',
            stream: (r.request_type || 'common_area_repair') as any,
            priority: r.priority || 'Medium',
            status: r.status || 'new',
            createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent',
            requestorName,
            reportedBy: `${requestorName} (${requestorRole})`,
            requestorEmail,
            requestorPhone: initialMatchingReq?.requestorPhone || matchingMember?.phone || '0400 000 000',
            requestorRole,
            comments: initialMatchingReq?.comments || []
          };
        });
        setResidentRequests(formattedReqs);
      } else {
        setResidentRequests(INITIAL_RESIDENT_REQUESTS);
      }

      // Process units
      let allUnits: UnitData[] = [];
      if (unitsData && unitsData.length > 0) {
        allUnits = unitsData.map(u => {
          const unitActors: UnitActor[] = (formattedMembers || [])
            .filter(m => m.schemeId === u.scheme_id && m.unitId === u.unit_id && !['Strata Manager', 'Strata Admin', 'Building Manager'].includes(m.role))
            .map(m => ({
              id: m.id,
              role: (m.role === 'Resident' ? 'On-Site Resident' : (m.role === 'Tenant' ? 'Tenant' : 'Lot Owner')),
              name: m.name,
              email: m.email,
              phone: m.phone,
              verified: true,
              permissions: [
                { label: 'Noticeboard Access', active: true },
                { label: 'Maintenance Logging', active: m.role !== 'Tenant' }
              ]
            }));

          return {
            schemeId: u.scheme_id,
            unitId: u.unit_id,
            lotNumber: u.lot_number,
            entitlement: `${u.entitlement || 25}%`,
            status: (unitActors.length > 0 ? 'Occupied' : (u.status || 'Vacant')) as any,
            actors: unitActors
          };
        });
      }
      setUnits(allUnits.length > 0 ? allUnits : INITIAL_UNITS);

      // Fetch role permissions from Supabase
      const { data: rolePermsData } = await supabase.from('role_permissions').select('*');
      if (rolePermsData) {
        const formattedRolePerms: Record<string, any> = {};
        rolePermsData.forEach(rp => {
          if (!formattedRolePerms[rp.scheme_id]) formattedRolePerms[rp.scheme_id] = {};
          if (!formattedRolePerms[rp.scheme_id][rp.role]) {
            formattedRolePerms[rp.scheme_id][rp.role] = getDefaultPermissionsForRole(rp.role);
          }
          const permIndex = formattedRolePerms[rp.scheme_id][rp.role].findIndex((p: any) => p.label === rp.permission_label);
          if (permIndex >= 0) {
            formattedRolePerms[rp.scheme_id][rp.role][permIndex].active = rp.active;
          }
        });
        setRolePermissions(prev => ({ ...prev, ...formattedRolePerms }));
      }

      // Fetch individual permissions from Supabase
      const { data: individualPermsData } = await supabase.from('individual_permissions').select('*');
      if (individualPermsData) {
        setMembers(prev => prev.map(m => {
          const memberOverrides = individualPermsData.filter(ip => ip.member_id === m.id).map(ip => ({
            label: ip.permission_label,
            active: ip.active
          }));
          if (memberOverrides.length > 0) {
            return { ...m, individualPermissions: memberOverrides };
          }
          return m;
        }));
      }

    } catch (err) {
      console.error("Error fetching from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user?.id, session]);

  const [activeRoles, setActiveRoles] = usePersistedState<string[]>(`smartlot_${pId}_activeRoles_v8`, ['Strata Manager']);
  const [activeView, setActiveView] = usePersistedState<'dashboard' | 'user_management' | 'requests' | 'triage' | 'settings'>(`smartlot_${pId}_activeView_v8`, 'dashboard');
  const [isLoggedIn, setIsLoggedIn] = usePersistedState(`smartlot_${pId}_isLoggedIn_v8`, false);
  const [theme, setThemeRaw] = useState<'light' | 'dark'>(() => {
    try {
      const saved = window.localStorage.getItem('smartlot_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  });
  const setTheme = (t: React.SetStateAction<'light' | 'dark'>) => {
    setThemeRaw(prev => {
      const next = typeof t === 'function' ? t(prev) : t;
      try { window.localStorage.setItem('smartlot_theme', next); } catch {}
      return next;
    });
  };
  const [members, setMembers] = usePersistedState<Member[]>(`smartlot_${pId}_members_v8`, INITIAL_MEMBERS);
  const [residentRequests, setResidentRequests] = usePersistedState<ResidentRequest[]>(`smartlot_${pId}_residentRequests_v8`, INITIAL_RESIDENT_REQUESTS);
  const [units, setUnits] = usePersistedState<UnitData[]>(`smartlot_${pId}_units_v8`, INITIAL_UNITS);
  const [customPersonas, setCustomPersonas] = usePersistedState<Persona[]>('smartlot_custom_personas_v8', []);

  const addCustomPersona = (p: Persona) => {
    setCustomPersonas(prev => {
      // Never add duplicates by email
      if (prev.some(c => c.email?.toLowerCase() === p.email?.toLowerCase())) return prev;
      return [...prev, p];
    });
  };

  const setActivePersonaWithSync = (newPersona: Persona | ((prev: Persona) => Persona)) => {
    setActivePersona(prev => {
      const resolved = typeof newPersona === 'function' ? newPersona(prev) : newPersona;
      setCustomPersonas(customs => customs.map(c => c.id === resolved.id ? { ...c, ...resolved } : c));
      return resolved;
    });
  };

  // One-time deduplication on mount: remove duplicate members and units
  useEffect(() => {
    setMembers(prev => {
      const seen = new Set<string>();
      return prev.filter(m => {
        const key = `${m.email}-${m.schemeId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
    setUnits(prev => {
      const seen = new Set<string>();
      return prev.filter(u => {
        const key = `${u.schemeId}-${u.unitId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activePersona) return;

    if (activePersona.isSystemAdmin) {
      setActiveRoles(prev => prev.includes('Super Admin') ? prev : ['Super Admin']);
      return;
    }

    const membership = activePersona.memberships?.find(m => m.schemeId === activeScheme.id);
    const newRoles = membership ? membership.roles : [];
    const newRolesStr = newRoles.join(', ');
    setActiveRoles(prev => prev.join(', ') === newRolesStr ? prev : newRoles);

  // Only depends on persona id/role and active scheme - NOT on members/schemes arrays
  }, [activePersona.id, activeScheme.id, activePersona.role]);


  // Initialize permissions list for all roles in all schemes
  const [rolePermissions, setRolePermissions] = usePersistedState<Record<string, Record<string, { label: string; active: boolean; locked?: boolean }[]>>>(`smartlot_${pId}_rolePermissions_v8`, () => {
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

  const addScheme = async (id: string, name: string, lots: number) => {
    const newScheme = { id, name, lots, active: true };
    setSchemes(prev => [...prev, newScheme]);
    
    // Save to Supabase
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const activeUser = currentSession?.user || user || session?.user;

    if (activeUser) {
      // 1. Insert Scheme
      const { error: schemeError } = await supabase.from('schemes').insert([
        { id, name, lots, active: true, created_by: activeUser.id }
      ]);
      if (schemeError) {
        console.error("Error inserting scheme into Supabase:", schemeError);
      }

      // 2. Insert creator as Strata Manager in members so they can see the scheme (RLS)
      const { error: memberError } = await supabase.from('members').insert([
        { 
          scheme_id: id,
          user_id: activeUser.id,
          name: activeUser.user_metadata?.full_name || 'Admin',
          email: activeUser.email,
          role: 'Strata Manager',
          unit_id: 'HQ / Management',
          lot_number: 0,
          status: 'Active'
        }
      ]);
      // 3. Insert units into public.units table so the database matrix is populated
      const unitsToInsert = Array.from({ length: lots }, (_, i) => ({
        scheme_id: id,
        unit_id: `Unit ${i + 1}`,
        lot_number: i + 1,
        entitlement: parseFloat((100 / lots).toFixed(2)),
        status: 'Vacant'
      }));

      const { error: unitsError } = await supabase.from('units').insert(unitsToInsert);
      if (unitsError) {
        console.error("Error inserting units into Supabase:", unitsError);
      }
    } else {
      console.error("Cannot insert scheme: No authenticated Supabase user found!");
    }
    
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
    setUnits(prev => {
      const filtered = prev.filter(u => u.schemeId !== id);
      return [...filtered, ...newUnits];
    });

    return newScheme;
  };

  const deleteScheme = async (id: string) => {
    setSchemes(prev => prev.filter(s => s.id !== id));
  };

  const togglePermission = async (schemeId: string, role: string, permissionLabel: string) => {
    let newActiveValue = false;
    let wasLocked = false;

    setRolePermissions(prev => {
      const schemeRoles = prev[schemeId] || {};
      const globalRoles = prev['GLOBAL'] || {};
      const globalPerms = globalRoles[role] || getDefaultPermissionsForRole(role);
      const rolePerms = schemeRoles[role] || globalPerms.map(p => ({ ...p }));
      
      const updatedPerms = rolePerms.map(p => {
        if (p.label === permissionLabel && !p.locked) {
          newActiveValue = !p.active;
          return { ...p, active: newActiveValue };
        }
        if (p.label === permissionLabel && p.locked) {
          wasLocked = true;
        }
        return p;
      });
      return {
        ...prev,
        [schemeId]: {
          ...schemeRoles,
          [role]: updatedPerms
        }
      };
    });

    if (!wasLocked) {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setTimeout(async () => {
        const { error } = await supabase.from('role_permissions').upsert([
          {
            scheme_id: schemeId,
            role,
            permission_label: permissionLabel,
            active: newActiveValue
          }
        ], { onConflict: 'scheme_id,role,permission_label' });
        if (error) console.error("Error saving role permission to Supabase:", error);
      }, 0);
    }
  };

  const toggleIndividualPermission = async (memberId: string, permissionLabel: string) => {
    let targetActive = false;
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      
      const currentOverrides = m.individualPermissions || [];
      const existingOverrideIndex = currentOverrides.findIndex(p => p.label === permissionLabel);
      
      let newOverrides;
      if (existingOverrideIndex >= 0) {
        newOverrides = [...currentOverrides];
        targetActive = !newOverrides[existingOverrideIndex].active;
        newOverrides[existingOverrideIndex] = {
          ...newOverrides[existingOverrideIndex],
          active: targetActive
        };
      } else {
        let isCurrentlyActive = false;
        const schemeRoles = rolePermissions[m.schemeId];
        const globalRoles = rolePermissions['GLOBAL'] || {};
        const globalPerms = globalRoles[m.role] || getDefaultPermissionsForRole(m.role);
        
        if (schemeRoles && schemeRoles[m.role]) {
          const permObj = schemeRoles[m.role].find(p => p.label === permissionLabel);
          if (permObj) isCurrentlyActive = permObj.active;
        } else {
          const globalPermObj = globalPerms.find(p => p.label === permissionLabel);
          if (globalPermObj) isCurrentlyActive = globalPermObj.active;
        }
        
        targetActive = !isCurrentlyActive;
        newOverrides = [
          ...currentOverrides,
          { label: permissionLabel, active: targetActive }
        ];
      }

      return {
        ...m,
        individualPermissions: newOverrides
      };
    }));

    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      setTimeout(async () => {
        const { error } = await supabase.from('individual_permissions').upsert([
          {
            member_id: memberId,
            permission_label: permissionLabel,
            active: targetActive
          }
        ], { onConflict: 'member_id,permission_label' });
        if (error) console.error("Error updating individual permission in Supabase:", error);
      }, 0);
    }
  };

  const hasPermission = (permissionLabel: string) => {
    // Management & Admin roles always bypass permission checks
    if (activePersona.isSystemAdmin || activePersona.role === 'Super Admin' || activePersona.role === 'Website Administrator' || activePersona.role === 'Strata Admin' || activePersona.role === 'Strata Manager' || activeRoles.includes('Strata Admin') || activeRoles.includes('Strata Manager')) {
      return true;
    }

    // Check individual overrides first
    const memberEmail = activePersona.email || `${activePersona.name.toLowerCase().replace(/\s+/g, '.')}@strata.com.au`;
    const currentUserMember = members.find(m => m.email === memberEmail && m.schemeId === activeScheme.id);
    
    if (currentUserMember && currentUserMember.individualPermissions) {
      const override = currentUserMember.individualPermissions.find(p => p.label === permissionLabel);
      if (override) {
        return override.active;
      }
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

  const addMember = async (memberData: {
    name: string;
    email: string;
    phone: string;
    role: MemberRole;
    unitId: string;
    lotNumber: number;
    schemeId?: string;
    hasCoOwner?: boolean;
    coOwnerName?: string;
    coOwnerEmail?: string;
    additionalOccupants?: AdditionalOccupant[];
  }) => {
    const targetSchemeId = memberData.schemeId || activeScheme.id;
    const id = `MEM-${Date.now()}`;
    const newMember: Member = {
      ...memberData,
      id,
      schemeId: targetSchemeId,
      status: 'Active',
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setMembers(prev => [newMember, ...prev]);

    // Save member to Supabase database
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const roleStr = memberData.role as string;
      const validRole = roleStr === 'Strata Admin' ? 'Strata Manager' 
        : roleStr === 'On-Site Resident' ? 'Resident' 
        : roleStr;

      const payload: any = {
        scheme_id: targetSchemeId,
        user_id: currentSession.user.id,
        name: memberData.name,
        email: memberData.email,
        phone: memberData.phone || '0400 000 000',
        role: validRole,
        unit_id: memberData.unitId,
        status: 'Active'
      };

      const { error } = await supabase.from('members').insert([payload]);
      if (error) {
        console.error("Error inserting member into Supabase:", error);
      }
    }

    return id;
  };

  const updateMemberStatus = async (memberId: string, status: 'Active' | 'Invited' | 'Restricted') => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status } : m));

    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const { error } = await supabase.from('members').update({ status }).eq('id', memberId);
      if (error) {
        console.error("Error updating member status in Supabase:", error);
      }
    }
  };

  const updateScheme = async (schemeId: string, updates: { name?: string; lots?: number }) => {
    setSchemes(prev => prev.map(s => s.id === schemeId ? { ...s, ...updates } : s));
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const { error } = await supabase.from('schemes').update(updates).eq('id', schemeId);
      if (error) console.error("Error updating scheme in Supabase:", error);
    }
  };

  const updateMember = async (memberId: string, updates: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...updates } : m));
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const payload: any = {};
      if (updates.name) payload.name = updates.name;
      if (updates.email) payload.email = updates.email;
      if (updates.phone) payload.phone = updates.phone;
      if (updates.role) payload.role = updates.role;
      if (updates.unitId) payload.unit_id = updates.unitId;
      if (updates.status) payload.status = updates.status;
      
      const { error } = await supabase.from('members').update(payload).eq('id', memberId);
      if (error) console.error("Error updating member in Supabase:", error);
    }
  };

  const updateResidentRequest = async (requestId: string, updates: Partial<ResidentRequest>) => {
    setResidentRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...updates } : r));
  };

  const deleteMember = async (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));

    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const { error } = await supabase.from('members').delete().eq('id', memberId);
      if (error) {
        console.error("Error deleting member from Supabase:", error);
      }
    }
  };

  const createMasterRequest = (reqData: {
    schemeId: string;
    unit: string;
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Emergency';
    requestorName?: string;
    requestorEmail?: string;
    requestorRole?: 'Lot Owner' | 'Resident' | 'Tenant' | 'Strata Manager';
    requestType?: RequestStream;
  }) => {
    const id = `REQ-${100 + residentRequests.length + 1}`;
    const req: ResidentRequest = {
      id,
      schemeId: reqData.schemeId,
      unit: reqData.unit,
      title: reqData.title,
      description: reqData.description,
      requestType: reqData.requestType || 'maintenance_upgrade',
      stream: reqData.priority === 'Emergency' ? 'emergency_repair' : 'common_area_repair',
      priority: reqData.priority,
      status: 'pending_triage',
      createdAt: new Date().toISOString(),
      requestorName: reqData.requestorName || 'Super Admin',
      reportedBy: reqData.requestorName || 'Super Admin',
      requestorEmail: reqData.requestorEmail || 'admin@smartlot.com',
      requestorPhone: '0400 000 000',
      requestorRole: reqData.requestorRole || 'Strata Manager',
      comments: []
    };
    setResidentRequests(prev => [req, ...prev]);
    return id;
  };

  const submitResidentRequest = (newReq: {
    requestType: RequestStream;
    title: string;
    description: string;
    attachmentUrl?: string;
    priority: 'Low' | 'Medium' | 'High' | 'Emergency';
    dueDate?: string;
  }) => {
    const id = `REQ-${Date.now()}`;
    const unit = activePersona.context || 'Unit 1';
    const requestorEmail = activePersona.email || `${activePersona.name.toLowerCase().replace(/\s+/g, '.')}@unit.com`;
    const requestorRole = activePersona.role.includes('Owner') ? 'Lot Owner' : (activePersona.role.includes('Tenant') ? 'Tenant' : (activePersona.role.includes('Committee') ? 'Committee Member' : 'Resident'));

    const req: ResidentRequest = {
      id,
      schemeId: activeScheme.id,
      unit,
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
      requestorEmail,
      requestorPhone: '0412 888 999',
      requestorRole: requestorRole as any,
      comments: [],
    };

    setResidentRequests(prev => [req, ...prev]);

    // Persist to Supabase asynchronously
    supabase.from('resident_requests').insert({
      scheme_id: activeScheme.id,
      unit_id: unit,
      title: newReq.title,
      description: newReq.description,
      request_type: req.stream,
      priority: newReq.priority,
      status: 'pending_triage',
      requestor_name: activePersona.name,
      requestor_email: requestorEmail,
      requestor_role: requestorRole
    }).then(({ error }) => {
      if (error) {
        console.error("Error creating request in Supabase:", error);
      }
    });

    return id;
  };

  const triageRequest = (requestId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    const nextStatus = action === 'reject' ? 'rejected' : 'approved';
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

    supabase.from('resident_requests').update({
      status: nextStatus,
      rejection_reason: action === 'reject' ? (rejectionReason || 'Request rejected per strata guidelines.') : null
    }).eq('id', requestId).then(({ error }) => {
      if (error) {
        console.warn("Updated status in Supabase for request:", requestId);
      }
    });
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

  const updateUnitMetadata = async (schemeId: string, unitId: string, entitlement: string, status: 'Occupied' | 'Vacant') => {
    setUnits(prev => prev.map(u => {
      if (u.schemeId !== schemeId || u.unitId !== unitId) return u;
      return { ...u, entitlement, status };
    }));

    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const entitlementNum = parseFloat(entitlement.replace('%', '')) || 0;
      const { error } = await supabase.from('units').update({ entitlement: entitlementNum, status }).eq('scheme_id', schemeId).eq('unit_id', unitId);
      if (error) {
        console.error("Error updating unit metadata in Supabase:", error);
      }
    }
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

    // 2. Add to members state & Supabase database
    const memberRole = (role === 'On-Site Resident' ? 'Resident' : role) as MemberRole;
    const lotNo = parseInt(unitId.replace(/\D/g, '')) || 1;
    addMember({
      name,
      email,
      phone: phone || '0400 000 000',
      role: memberRole,
      unitId,
      lotNumber: lotNo
    });

    // 3. Update unit status in Supabase database
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user) {
        supabase.from('units').update({ status: 'Occupied' }).eq('scheme_id', schemeId).eq('unit_id', unitId);
      }
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

      if (newStatus === 'Vacant') {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (s?.user) {
            supabase.from('units').update({ status: 'Vacant' }).eq('scheme_id', schemeId).eq('unit_id', unitId);
          }
        });
      }

      return {
        ...u,
        status: newStatus,
        actors: newActors,
      };
    }));

    if (emailToOffboard) {
      deleteMember(emailToOffboard);
    }
  };

  return {
    schemes,
    activeScheme,
    setActiveScheme,
    user,
    session,
    activePersona,
    setActivePersona: setActivePersonaWithSync,
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
    customPersonas,
    addCustomPersona,
    addMember,
    updateMemberStatus,
    deleteMember,
    submitResidentRequest,
    createMasterRequest,
    triageRequest,
    closeResidentRequest,
    addCommentToRequest,
    addResidentToUnit,
    offboardActor,
    updateUnitMetadata,
    updateScheme,
    updateMember,
    updateResidentRequest,
    addScheme,
    deleteScheme,
    togglePermission,
    toggleIndividualPermission,
    hasPermission,
    rolePermissions,
    activeRoles,
    setActiveRoles,
    submitCase: submitResidentRequest,
    triageCase: triageRequest,
    castBallot: () => {},
    submitGuestWorkOrderCompletion: () => {},
    verifyWorkOrder: () => {},
    refreshData,
    isLoading,
  };
}

// End of SmartLot store hook

// Module: Store State Hooks
// Module: Database Fetch Operations
// Module: Scheme Level Operations
// Module: Member & Occupancy Operations
// Module: Request & Triage Operations
// Module: Permissions Matrix Handlers
// Helper: Permissions evaluation engine
// Helper: Active scheme context switcher
// Helper: Real-time DB subscription handlers
// Helper: Master triage action handlers
// Helper: Cross-scheme request dispatch
// UI: Active Tab Persistence Logic
// UI: Theme Switcher Synchronizer
// UI: Ticket Priority Glow Badges
// UI: Real-time Member Audit Trail
// UI: End of Store UI Bindings
// Core Pipeline: Strict membership synchronization from database public.members