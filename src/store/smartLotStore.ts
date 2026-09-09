// JSDoc: Returns default permission flags for specified strata role
// JSDoc: Configures individual user permission overrides
// JSDoc: Toggles specific permission flag for a role in target scheme
// JSDoc: Appends discussion comment to request audit trail
// JSDoc: Updates ticket workflow status (pending_triage, in_voting, resolved)
// JSDoc: Submits new maintenance request with priority and image attachments
// JSDoc: Removes member from scheme roster with cascading permission cleanup
// JSDoc: Updates member account status (Active, Invited, Restricted)
// JSDoc: Updates member profile fields (email, phone, role, unit, status)
// JSDoc: Creates new member profile with role and lot allocation
// JSDoc: Updates scheme configuration metadata and unit counts
// JSDoc: Registers a new strata scheme with initial lot configuration
// JSDoc: Updates active persona role and recalculates view permissions
// JSDoc: Switches active strata scheme and synchronizes view state
// JSDoc: Active user persona profile for authentication simulation
// JSDoc: Granular role permission matrices mapped by scheme ID
// JSDoc: Realtime resident request queue and maintenance records
// JSDoc: Global member directory across all authorized schemes
// JSDoc: List of registered schemes in user accessible portfolio
// JSDoc: State container for active strata scheme context
import React, { useState, useEffect } from 'react';
import { 
  SCHEMES, 
  PERSONAS, 
  Scheme, 
  Persona,
  ActivityType,
  ActivityPriority,
  ActivityLocation,
  ContactPreference
} from '../types';
import { supabase } from '../lib/supabase';
import { 
  dispatchActivityConduitEmail, 
  dispatchStatusUpdateEmail, 
  dispatchCommentNotificationEmail 
} from '../services/emailService';

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
  | 'acknowledged'
  | 'in_progress'
  | 'waiting'
  | 'in_voting'
  | 'approved' 
  | 'rejected' 
  | 'closed' 
  | 'pending_triage' 
  | 'approved_direct_dispatch' 
  | 'approved_pending_vote' 
  | 'resolved';

export type RequestCommentAttachment = {
  name: string;
  url: string;
  type?: string;
  size?: string;
};

export type RequestComment = {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
  replyTo?: {
    authorName: string;
    text: string;
  };
  likes?: number;
  isMarkedHelpful?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  attachments?: RequestCommentAttachment[];
};

export type AuditEventType =
  | 'created'
  | 'status_change'
  | 'priority_change'
  | 'comment_added'
  | 'closed'
  | 'triage_approved'
  | 'triage_rejected'
  | 'email_sent'
  | 'email_received'
  | 'internal_note_added';

export type AuditEvent = {
  id: string;
  type: AuditEventType;
  actor: string;
  actorRole: string;
  timestamp: string;
  note?: string;
  fromStatus?: string;
  toStatus?: string;
  fromPriority?: string;
  toPriority?: string;
};

export type InternalNote = {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
};

export type ResidentRequest = {
  id: string;
  referenceId?: string; // Standard #SL-10452 reference
  schemeId: string;
  buildingName?: string;
  unit: string;
  title: string;
  description: string;
  requestType: RequestStream | ActivityType | string;
  stream?: RequestStream;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency' | 'Normal' | 'Urgent';
  location?: string;
  contactPreference?: ContactPreference;
  strataManagerEmail?: string;
  dueDate?: string;
  attachmentUrl?: string;
  attachmentUrls?: string[];
  status: CaseStatus;
  createdAt: string;
  requestorName: string;
  reportedBy?: string;
  requestorEmail: string;
  requestorPhone: string;
  requestorRole: 'Lot Owner' | 'Resident' | 'Tenant' | 'Strata Manager' | 'Committee Member' | 'Building Manager';
  assignedToName?: string;
  assignedToRole?: string;
  assignedToEmail?: string;
  rejectionReason?: string;
  closeReason?: string;
  comments: RequestComment[];
  internalNotes?: InternalNote[];
  auditLog: AuditEvent[];
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

export type CreateVendorPayload = Omit<Vendor, 'id'> & { id?: string };
export type CreateWorkOrderPayload = Omit<WorkOrder, 'id' | 'siteAccessPin' | 'guestMagicToken' | 'status'>;
export type CreateMotionPayload = {
  caseId: string;
  title: string;
  summary: string;
  quotes: Motion['quotes'];
  quorumTarget: number;
  deadline: string;
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
  inviteToken?: string;
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

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'VND-001',
    name: 'Sydney Apex Plumbing & Gas',
    category: 'Plumbing & Drainage',
    abn: '51 824 931 002',
    licenseNo: 'LIC-NSW-39812A',
    phone: '02 9844 2001',
    email: 'dispatch@apexplumbing.com.au',
    insuranceStatus: 'Active',
    insuranceExpiry: '2027-04-30',
    rating: 4.9,
  },
  {
    id: 'VND-002',
    name: 'ElectroPro Strata Services',
    category: 'Electrical & Lighting',
    abn: '32 901 445 119',
    licenseNo: 'LIC-NSW-84729E',
    phone: '02 9512 8820',
    email: 'service@electropro.com.au',
    insuranceStatus: 'Active',
    insuranceExpiry: '2026-11-15',
    rating: 4.8,
  },
  {
    id: 'VND-003',
    name: 'Kone Elevator Maintenance NSW',
    category: 'Lift & Vertical Transport',
    abn: '18 003 728 991',
    licenseNo: 'LIC-NSW-10492L',
    phone: '1300 362 473',
    email: 'maintenance.sydney@kone.com',
    insuranceStatus: 'Active',
    insuranceExpiry: '2028-01-01',
    rating: 4.7,
  }
];


export const INITIAL_MOTIONS: Motion[] = [
  {
    id: 'MOT-001',
    caseId: 'REQ-101',
    title: 'Common Area Main Water Line Replacement',
    summary: 'Resolution to accept contractor tender for replacing damaged 50mm copper hydraulic supply line servicing Lots 1-6.',
    quotes: [
      { vendorId: 'VND-001', vendorName: 'Sydney Apex Plumbing & Gas', amount: 3450, gstIncluded: true, recommended: true },
      { vendorId: 'VND-004', vendorName: 'Citywide Commercial Hydraulics', amount: 4100, gstIncluded: true },
    ],
    quorumTarget: 3,
    deadline: '2026-09-30',
    status: 'active',
    ballots: [
      { voterName: 'Sarah Jones', voterRole: 'Strata Admin', vote: 'YES', votedAt: '2026-09-08' },
      { voterName: 'Michael Chen', voterRole: 'Committee Member', vote: 'YES', votedAt: '2026-09-09' }
    ]
  }
];


export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-10482',
    caseId: 'REQ-101',
    schemeId: 'SP101',
    vendorId: 'VND-001',
    vendorName: 'Sydney Apex Plumbing & Gas',
    scopeOfWork: 'Replace damaged 50mm hydraulic isolation valve in basement riser B.',
    budgetCap: 1200,
    siteAccessPin: '4829',
    guestMagicToken: 'tok_sp101_wo10482_live',
    status: 'issued',
  }
];

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
  // Cavalier Grand Residences (SP103) Initial Requests
  {
    id: 'REQ-SL-10452',
    referenceId: '#SL-10452',
    schemeId: 'SP103',
    buildingName: 'Cavalier Apartments',
    unit: 'Unit 12',
    title: 'Front security gate not closing',
    description: 'Front vehicle access security gate sensor is stalling halfway during closing cycle. Entry and safety hazard for common driveway.',
    requestType: 'Common Property Repair',
    stream: 'common_area_repair',
    priority: 'High',
    location: 'Front entrance',
    contactPreference: 'Email',
    strataManagerEmail: 'emma.wilson@agency.com',
    attachmentUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&auto=format&fit=crop',
    attachmentUrls: [
      'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584463623578-3019808d4b38?w=800&auto=format&fit=crop'
    ],
    status: 'acknowledged',
    createdAt: '1 hour ago',
    requestorName: 'Sarah Jones',
    reportedBy: 'Sarah Jones (Lot Owner)',
    requestorEmail: 'sarah.jones@cavalier.com',
    requestorPhone: '0400 111 222',
    requestorRole: 'Lot Owner',
    comments: [
      {
        id: 'C-SL-10452-1',
        authorName: 'Emma Wilson',
        authorRole: 'Strata Manager (via Email)',
        text: "Thanks Sarah. I've contacted the security gate contractor. They will attend tomorrow.",
        createdAt: '45 mins ago',
      }
    ],
    auditLog: [
      {
        id: 'AUD-SL-10452-1',
        type: 'created',
        actor: 'Sarah Jones',
        actorRole: 'Lot Owner',
        timestamp: '1 hour ago',
        note: 'Activity #SL-10452 created for Cavalier Apartments Unit 12.',
      },
      {
        id: 'AUD-SL-10452-2',
        type: 'email_sent',
        actor: 'SmartLot Email',
        actorRole: 'System',
        timestamp: '1 hour ago',
        note: 'Notification email sent to Strata Manager (emma.wilson@agency.com) with CC to Sarah Jones. Reply-To: requests+SL-10452@smartlot.com',
      },
      {
        id: 'AUD-SL-10452-3',
        type: 'email_received',
        actor: 'Emma Wilson',
        actorRole: 'Strata Manager',
        timestamp: '45 mins ago',
        fromStatus: 'new',
        toStatus: 'acknowledged',
        note: 'Strata manager replied via email: "Thanks Sarah. I\'ve contacted the security gate contractor. They will attend tomorrow."',
      }
    ],
  },

  // Duplex (SP101) Requests
  {
    id: 'REQ-DUP-101',
    referenceId: '#SL-10451',
    schemeId: 'SP101',
    buildingName: 'Sunset Duplex',
    unit: 'Unit 1',
    title: 'Shared Driveway Motorized Gate Sensor Glitch',
    description: 'Vehicle entrance swing gate safety beam is tripping intermittently during sunset, causing gate to stall halfway.',
    requestType: 'Common Property Repair',
    stream: 'common_area_repair',
    priority: 'High',
    location: 'Front entrance',
    contactPreference: 'Email',
    strataManagerEmail: 'emma.wilson@agency.com',
    dueDate: '2026-09-05',
    status: 'pending_triage',
    createdAt: '3 hours ago',
    requestorName: 'Sarah Jones',
    reportedBy: 'Sarah Jones (Lot Owner)',
    requestorEmail: 'sarah.jones@duplex.com',
    requestorPhone: '0400 111 222',
    requestorRole: 'Lot Owner',
    comments: [],
    auditLog: [
      { id: 'AUD-D101-1', type: 'created', actor: 'Sarah Jones', actorRole: 'Lot Owner', timestamp: '3 hours ago', note: 'Activity submitted by resident.' },
      { id: 'AUD-D101-2', type: 'email_sent', actor: 'SmartLot Email', actorRole: 'System', timestamp: '3 hours ago', note: 'Notification email sent to Strata Manager (emma.wilson@agency.com) with CC to Sarah Jones. Reply-To: requests+SL-10451@smartlot.com' },
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
    auditLog: [
      { id: 'AUD-D102-1', type: 'created', actor: 'David Miller', actorRole: 'Tenant', timestamp: '1 day ago', note: 'Activity submitted by resident.' },
      { id: 'AUD-D102-2', type: 'email_sent', actor: 'SmartLot', actorRole: 'System', timestamp: '1 day ago', note: 'Email dispatched to strata manager.' },
      { id: 'AUD-D102-3', type: 'triage_approved', actor: 'Emma Wilson', actorRole: 'Strata Manager', timestamp: '22 hours ago', fromStatus: 'pending_triage', toStatus: 'approved' },
    ],
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
      { id: 'C2', authorName: 'Emma Wilson', authorRole: 'Strata Manager', text: 'Electrician on route with replacement 24V power supply unit.', createdAt: '20 mins ago' }
    ],
    auditLog: [
      { id: 'AUD-C201-1', type: 'created', actor: 'Michael Chen', actorRole: 'Committee Member', timestamp: '45 mins ago', note: 'Emergency activity raised by committee.' },
      { id: 'AUD-C201-2', type: 'email_sent', actor: 'SmartLot', actorRole: 'System', timestamp: '45 mins ago', note: 'Urgent email dispatched to strata manager.' },
      { id: 'AUD-C201-3', type: 'triage_approved', actor: 'Emma Wilson', actorRole: 'Strata Manager', timestamp: '30 mins ago', fromStatus: 'pending_triage', toStatus: 'approved', note: 'Emergency dispatch authorised.' },
      { id: 'AUD-C201-4', type: 'comment_added', actor: 'Emma Wilson', actorRole: 'Strata Manager', timestamp: '20 mins ago', note: 'Manager posted update on technician ETA.' },
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
    auditLog: [
      { id: 'AUD-C202-1', type: 'created', actor: 'Elena Rostov', actorRole: 'Lot Owner', timestamp: '2 hours ago', note: 'Activity submitted by resident.' },
      { id: 'AUD-C202-2', type: 'email_sent', actor: 'SmartLot', actorRole: 'System', timestamp: '2 hours ago', note: 'Email dispatched to strata manager.' },
    ],
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
      { id: 'C3', authorName: 'Emma Wilson', authorRole: 'Strata Manager', text: 'Contractor repainted bays on Aug 30.', createdAt: 'Yesterday' }
    ],
    auditLog: [
      { id: 'AUD-C203-1', type: 'created', actor: 'Marcus Sterling', actorRole: 'Committee Member', timestamp: '3 days ago', note: 'Activity submitted.' },
      { id: 'AUD-C203-2', type: 'email_sent', actor: 'SmartLot', actorRole: 'System', timestamp: '3 days ago', note: 'Email dispatched to strata manager.' },
      { id: 'AUD-C203-3', type: 'triage_approved', actor: 'Emma Wilson', actorRole: 'Strata Manager', timestamp: '2 days ago', fromStatus: 'pending_triage', toStatus: 'approved' },
      { id: 'AUD-C203-4', type: 'status_change', actor: 'Emma Wilson', actorRole: 'Strata Manager', timestamp: 'Yesterday', fromStatus: 'approved', toStatus: 'resolved', note: 'Work confirmed complete by contractor.' },
      { id: 'AUD-C203-5', type: 'comment_added', actor: 'Emma Wilson', actorRole: 'Strata Manager', timestamp: 'Yesterday', note: 'Closing update posted.' },
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
      { id: 'C4', authorName: 'Emma Wilson', authorRole: 'Strata Manager', text: 'KONE Elevator technicians scheduled for 10:00 AM on-site service.', createdAt: '30 mins ago' }
    ],
    auditLog: [
      { id: 'AUD-V301-1', type: 'created', actor: 'Arthur Pendelton', actorRole: 'Committee Member', timestamp: '1 hour ago', note: 'Emergency escalation raised by committee chair.' },
      { id: 'AUD-V301-2', type: 'email_sent', actor: 'SmartLot', actorRole: 'System', timestamp: '1 hour ago', note: 'High-priority email dispatched to strata manager.' },
      { id: 'AUD-V301-3', type: 'triage_approved', actor: 'Emma Wilson', actorRole: 'Strata Manager', timestamp: '45 mins ago', fromStatus: 'pending_triage', toStatus: 'approved', note: 'Approved — KONE service call booked.' },
      { id: 'AUD-V301-4', type: 'comment_added', actor: 'Emma Wilson', actorRole: 'Strata Manager', timestamp: '30 mins ago', note: 'Technician arrival window posted.' },
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
    auditLog: [
      { id: 'AUD-V302-1', type: 'created', actor: 'Sophia Zhang', actorRole: 'Lot Owner', timestamp: '2 hours ago', note: 'Activity submitted from telemetry alert.' },
      { id: 'AUD-V302-2', type: 'email_sent', actor: 'SmartLot', actorRole: 'System', timestamp: '2 hours ago', note: 'Urgent email dispatched to strata manager.' },
    ],
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
    auditLog: [
      { id: 'AUD-V303-1', type: 'created', actor: 'Oliver Vance', actorRole: 'Resident', timestamp: '1 day ago', note: 'Activity submitted by resident.' },
      { id: 'AUD-V303-2', type: 'email_sent', actor: 'SmartLot', actorRole: 'System', timestamp: '1 day ago', note: 'Email dispatched to strata manager.' },
      { id: 'AUD-V303-3', type: 'triage_approved', actor: 'Emma Wilson', actorRole: 'Strata Manager', timestamp: '20 hours ago', fromStatus: 'pending_triage', toStatus: 'approved' },
    ],
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
    auditLog: [
      { id: 'AUD-V304-1', type: 'created', actor: 'Jessica Taylor', actorRole: 'Tenant', timestamp: '4 hours ago', note: 'Activity submitted by resident.' },
      { id: 'AUD-V304-2', type: 'email_sent', actor: 'SmartLot', actorRole: 'System', timestamp: '4 hours ago', note: 'Email dispatched to strata manager.' },
    ],
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
        { data: unitsData }
      ] = await Promise.all([
        supabase.from('schemes').select('*'),
        supabase.from('members').select('*'),
        supabase.from('profiles').select('*'),
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

      // Fetch live resident requests, comments, and internal notes from Supabase
      const { data: requestsData, error: reqErr } = await supabase
        .from('resident_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsData && requestsData.length > 0) {
        const { data: commentsData } = await supabase
          .from('request_comments')
          .select('*')
          .order('created_at', { ascending: true });

        const { data: notesData } = await supabase
          .from('activity_notes')
          .select('*')
          .order('created_at', { ascending: true });

        const mappedRequests: ResidentRequest[] = requestsData.map(r => {
          const comments: RequestComment[] = (commentsData || [])
            .filter(c => c.request_id === r.id)
            .map(c => ({
              id: c.id,
              authorName: c.author_name || 'Member',
              authorRole: c.author_role || (c.is_email_reply ? 'Strata Manager (via Email)' : 'Resident'),
              text: c.text,
              createdAt: new Date(c.created_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
              replyTo: c.reply_to_name ? { authorName: c.reply_to_name, text: c.reply_to_text || '' } : undefined,
              isEdited: c.is_edited || false,
              editedAt: c.edited_at ? new Date(c.edited_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : undefined,
              attachments: Array.isArray(c.attachments) ? c.attachments : undefined,
            }));

          const internalNotes: InternalNote[] = (notesData || [])
            .filter(n => n.request_id === r.id)
            .map(n => ({
              id: n.id,
              authorName: n.author_name,
              authorRole: n.author_role,
              text: n.text,
              createdAt: new Date(n.created_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
            }));

          const ref = r.reference_id || `SL-${r.id.slice(0, 5).toUpperCase()}`;
          const dateStr = new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
          const initialAuditLog: AuditEvent[] = [
            {
              id: `AUD-${r.id}-1`,
              type: 'created',
              actor: r.requestor_name || 'Resident',
              actorRole: r.requestor_role || 'Resident',
              timestamp: dateStr,
              note: `Activity #${ref.replace('#', '')} initiated.`,
            },
          ];

          if (r.strata_manager_email) {
            initialAuditLog.push({
              id: `AUD-${r.id}-2`,
              type: 'email_sent',
              actor: 'SmartLot Email',
              actorRole: 'System',
              timestamp: dateStr,
              note: `Notification email dispatched to ${r.strata_manager_email}. Resident CC'd. Reply-To: requests+${ref.replace('#', '')}@mail.smartlot.app`,
            });
          }

          if (r.status === 'acknowledged' && comments.some(c => c.authorRole.includes('Email') || c.authorRole.includes('Manager'))) {
            initialAuditLog.push({
              id: `AUD-${r.id}-3`,
              type: 'email_received',
              actor: r.strata_manager_email ? 'Emma Wilson' : 'Strata Manager',
              actorRole: 'Strata Manager',
              timestamp: dateStr,
              fromStatus: 'new',
              toStatus: 'acknowledged',
              note: 'Inbound email reply captured via Reply-To conduit.',
            });
          }

          const stream: RequestStream = 
            (r.stream as RequestStream) ||
            (r.request_type === 'emergency_repair' || r.request_type === 'Urgent Issue' ? 'emergency_repair' :
             r.request_type === 'by_law_breach' || r.request_type === 'Complaint' ? 'complaint' :
             r.request_type === 'lot_owner_modification' || r.request_type === 'Administrative Request' ? 'general_inquiry' :
             r.request_type === 'Maintenance / Vendor' ? 'maintenance_upgrade' :
             'common_area_repair');

          const reqName = r.requestor_name || 'Resident';
          const reqRole = (r.requestor_role || 'Lot Owner') as any;

          return {
            id: r.id,
            referenceId: r.reference_id,
            schemeId: r.scheme_id,
            buildingName: r.building_name,
            unit: r.unit_id || 'Unit 1',
            title: r.title,
            description: r.description,
            requestType: r.request_type || stream,
            stream: stream,
            priority: r.priority || 'Normal',
            location: r.location || 'Common area',
            contactPreference: r.contact_preference || 'Email',
            strataManagerEmail: r.strata_manager_email,
            attachmentUrls: r.attachment_urls || [],
            attachmentUrl: r.attachment_urls?.[0],
            status: r.status || 'new',
            createdAt: dateStr,
            requestorName: reqName,
            reportedBy: `${reqName} (${reqRole})`,
            requestorEmail: r.requestor_email || 'resident@smartlot.com',
            requestorPhone: '0412 888 999',
            requestorRole: reqRole,
            assignedToName: r.assigned_to_name,
            assignedToRole: r.assigned_to_role,
            assignedToEmail: r.assigned_to_email,
            closeReason: r.close_reason,
            comments,
            internalNotes,
            auditLog: initialAuditLog,
          };
        });

        setResidentRequests(mappedRequests);
      } else {
        setResidentRequests(INITIAL_RESIDENT_REQUESTS);
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
  const [activeView, setActiveView] = usePersistedState<'dashboard' | 'user_management' | 'requests' | 'triage' | 'settings' | 'performance'>(`smartlot_${pId}_activeView_v8`, 'dashboard');
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
  const [vendors, setVendors] = usePersistedState<Vendor[]>(`smartlot_${pId}_vendors_v8`, INITIAL_VENDORS);
  const [motions, setMotions] = usePersistedState<Motion[]>(`smartlot_${pId}_motions_v8`, INITIAL_MOTIONS);
  const [workOrders, setWorkOrders] = usePersistedState<WorkOrder[]>(`smartlot_${pId}_workOrders_v8`, INITIAL_WORK_ORDERS);
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
    initialStatus?: 'Active' | 'Invited' | 'Restricted';
    inviteToken?: string;
  }) => {
    const targetSchemeId = memberData.schemeId || activeScheme.id;
    const id = `MEM-${Date.now()}`;
    const token = memberData.inviteToken || `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const status = memberData.initialStatus || 'Invited';

    const newMember: Member = {
      ...memberData,
      id,
      schemeId: targetSchemeId,
      status,
      inviteToken: token,
      joinedAt: status === 'Active' ? new Date().toISOString().split('T')[0] : '',
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
        status
      };

      const { error } = await supabase.from('members').insert([payload]);
      if (error) {
        console.error("Error inserting member into Supabase:", error);
      }
    }

    return { id, inviteToken: token };
  };

  const acceptMemberInvite = async (tokenOrId: string, userAuthId?: string, updates?: Partial<Member>) => {
    let acceptedMemberId = '';
    const now = new Date().toISOString().split('T')[0];

    setMembers(prev => prev.map(m => {
      const isMatch = m.inviteToken === tokenOrId || m.id === tokenOrId || m.email.toLowerCase() === tokenOrId.toLowerCase();
      if (!isMatch) return m;

      acceptedMemberId = m.id;
      return {
        ...m,
        status: 'Active',
        joinedAt: now,
        ...(updates || {}),
      };
    }));

    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const effectiveUserId = userAuthId || currentSession?.user?.id;

    if (acceptedMemberId) {
      const dbPayload: any = {
        status: 'Active',
      };
      if (effectiveUserId) {
        dbPayload.user_id = effectiveUserId;
      }
      if (updates?.name) dbPayload.name = updates.name;
      if (updates?.phone) dbPayload.phone = updates.phone;

      const { error } = await supabase
        .from('members')
        .update(dbPayload)
        .eq('id', acceptedMemberId);
      if (error) {
        console.error("Error updating accepted member status in Supabase:", error);
      }
    }
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

  const deleteResidentRequest = async (requestId: string) => {
    setResidentRequests(prev => prev.filter(r => r.id !== requestId));
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const { error } = await supabase
        .from('resident_requests')
        .delete()
        .eq('id', requestId);
      if (error) {
        console.error("Error deleting resident request from Supabase:", error);
      }
    }
  };


  const deleteMember = async (idOrEmail: string) => {
    setMembers(prev => prev.filter(m => m.id !== idOrEmail && m.email.toLowerCase() !== idOrEmail.toLowerCase()));

    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const { error } = await supabase
        .from('members')
        .delete()
        .or(`id.eq.${idOrEmail},email.eq.${idOrEmail}`);
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
    const now = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
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
      comments: [],
      auditLog: [
        {
          id: `AUD-${id}-1`,
          type: 'created',
          actor: reqData.requestorName || 'Super Admin',
          actorRole: reqData.requestorRole || 'Strata Manager',
          timestamp: `Today at ${now}`,
          note: 'Activity created by administrator.',
        },
        {
          id: `AUD-${id}-2`,
          type: 'email_sent',
          actor: 'SmartLot',
          actorRole: 'System',
          timestamp: `Today at ${now}`,
          note: 'Notification email dispatched to strata manager.',
        },
      ],
    };
    setResidentRequests(prev => [req, ...prev]);
    return id;
  };

  const submitResidentRequest = (newReq: {
    requestType: RequestStream | ActivityType | string;
    title: string;
    description: string;
    attachmentUrl?: string;
    attachmentUrls?: string[];
    priority: 'Low' | 'Medium' | 'High' | 'Emergency' | 'Normal' | 'Urgent';
    dueDate?: string;
    buildingName?: string;
    unit?: string;
    location?: string;
    contactPreference?: ContactPreference;
    strataManagerEmail?: string;
  }) => {
    // ── 1. Derive stable values ──────────────────────────────────────────────
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const slRef = `SL-${randomSuffix}`;
    const id = `REQ-${slRef}`;

    const unit = (newReq.unit || activePersona.context || 'Unit 1').trim();
    const buildingName = (
      newReq.buildingName ||
      (activeScheme.name !== 'No Registered Schemes' ? activeScheme.name : 'My Building')
    ).trim();
    const requestorEmail = (
      activePersona.email ||
      `${activePersona.name.toLowerCase().replace(/\s+/g, '.')}@strata.com.au`
    ).toLowerCase();
    const requestorRole: ResidentRequest['requestorRole'] = activePersona.role.includes('Owner')
      ? 'Lot Owner'
      : activePersona.role.includes('Tenant')
      ? 'Tenant'
      : activePersona.role.includes('Committee')
      ? 'Committee Member'
      : 'Resident';
    // Prefer explicitly provided manager email, then fall back to scheme default
    const managerEmail = (
      newReq.strataManagerEmail ||
      (activeScheme.id === 'SP103' ? 'emma.wilson@agency.com' : 'romanjoe@gmail.com')
    ).trim();
    const location = newReq.location || 'Common area';
    const contactPreference: ContactPreference = newReq.contactPreference || 'Email';
    const attachmentUrls = newReq.attachmentUrls || (newReq.attachmentUrl ? [newReq.attachmentUrl] : []);
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });

    // ── 2. Optimistic local state update ─────────────────────────────────────
    const req: ResidentRequest = {
      id,
      referenceId: `#${slRef}`,
      schemeId: activeScheme.id,
      buildingName,
      unit,
      title: newReq.title,
      description: newReq.description,
      requestType: newReq.requestType,
      stream:
        newReq.requestType === 'emergency' ||
        newReq.priority === 'Emergency' ||
        newReq.priority === 'Urgent'
          ? 'emergency_repair'
          : 'common_area_repair',
      priority: newReq.priority,
      location,
      contactPreference,
      strataManagerEmail: managerEmail,
      dueDate: newReq.dueDate,
      attachmentUrl: attachmentUrls[0],
      attachmentUrls,
      status: 'new',
      createdAt: new Date().toISOString(),
      requestorName: activePersona.name,
      reportedBy: `${activePersona.name} (${activePersona.role})`,
      requestorEmail,
      requestorPhone: activePersona.context?.includes('0') ? activePersona.context : '0412 888 999',
      requestorRole,
      comments: [],
      auditLog: [
        {
          id: `AUD-${id}-1`,
          type: 'created',
          actor: activePersona.name,
          actorRole: activePersona.role,
          timestamp: `Today at ${nowStr}`,
          note: `Activity #${slRef} initiated by ${requestorRole}.`,
        },
        {
          id: `AUD-${id}-2`,
          type: 'email_sent',
          actor: 'SmartLot Email',
          actorRole: 'System',
          timestamp: `Today at ${nowStr}`,
          note: `Notification email dispatched to ${managerEmail}. Resident CC'd at ${requestorEmail}. Reply-To: requests+${slRef}@mail.smartlot.app`,
        },
      ],
    };

    setResidentRequests(prev => [req, ...prev]);

    // ── 3. Persist to Supabase (fire-and-forget, non-blocking) ────────────────
    const schemeId = activeScheme.id !== 'NO_SCHEME' ? activeScheme.id : 'SP101';

    supabase
      .from('resident_requests')
      .insert({
        reference_id:          slRef,
        scheme_id:             schemeId,
        unit_id:               unit,
        building_name:         buildingName,
        title:                 newReq.title,
        description:           newReq.description,
        request_type:          newReq.requestType,
        priority:              newReq.priority,
        location,
        contact_preference:    contactPreference,
        strata_manager_email:  managerEmail,
        status:                'new',
        requestor_name:        activePersona.name,
        requestor_email:       requestorEmail,
        requestor_role:        requestorRole,
        attachment_urls:       attachmentUrls.length > 0 ? attachmentUrls : null,
      })
      .then(({ error }) => {
        if (error) {
          console.error('[SmartLot] Failed to persist activity to Supabase:', error.message);
        }
      });

    // ── 4. Dispatch conduit email via emailService (supports local Mailtrap relay & edge functions) ─────────
    dispatchActivityConduitEmail({
      referenceId:   slRef,
      activityTitle: newReq.title,
      activityType:  String(newReq.requestType),
      priority:      newReq.priority,
      location,
      buildingName,
      unit,
      description:   newReq.description,
      requestorName: activePersona.name,
      requestorEmail,
      managerEmail,
      attachmentUrls,
    })
      .then(res => {
        console.log(`[SmartLot] ✅ Conduit email dispatched for #${slRef}:`, res);
      })
      .catch(err => {
        // Never block the user flow — email failure is non-fatal
        console.warn('[SmartLot] Conduit email network error:', err?.message ?? err);
      });

    return id;
  };

  const simulateManagerEmailReply = (
    requestId: string,
    replyText: string = "Thank you for the update. I have contacted our service contractor who will attend to inspect and resolve this.",
    managerName: string = "Strata Manager"
  ) => {
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    const commentId = `C-EMAIL-${Date.now()}`;

    setResidentRequests(prev => prev.map(req => {
      if (req.id !== requestId && req.referenceId !== requestId) return req;

      const newComment: RequestComment = {
        id: commentId,
        authorName: managerName,
        authorRole: 'Strata Manager (via Email)',
        text: replyText,
        createdAt: 'Just now (via Email)',
      };

      const newAuditEvent: AuditEvent = {
        id: `AUD-${req.id}-${Date.now()}`,
        type: 'email_received',
        actor: managerName,
        actorRole: 'Strata Manager',
        timestamp: `Today at ${nowStr}`,
        fromStatus: req.status,
        toStatus: 'acknowledged',
        note: `Inbound email reply captured via Reply-To conduit: "${replyText.slice(0, 70)}..."`,
      };

      return {
        ...req,
        status: 'acknowledged',
        comments: [...req.comments, newComment],
        auditLog: [...(req.auditLog || []), newAuditEvent],
      };
    }));

    const targetReq = residentRequests.find(r => r.id === requestId || r.referenceId === requestId);
    const realId = targetReq?.id || requestId;

    // Persist inbound comment to Supabase
    supabase.from('request_comments').insert({
      request_id: realId,
      author_name: managerName,
      author_role: 'Strata Manager (via Email)',
      text: replyText,
      is_email_reply: true,
    }).then(({ error }) => {
      if (error) console.warn('[SmartLot] Inbound comment sync note:', error.message);
    });

    // Update activity status to acknowledged in Supabase
    supabase.from('resident_requests').update({
      status: 'acknowledged',
      updated_at: new Date().toISOString()
    }).eq('id', realId).then(({ error }) => {
      if (error) console.warn('[SmartLot] Activity status sync note:', error.message);
    });
  };

  const triageRequest = (requestId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    const nextStatus = action === 'reject' ? 'rejected' : 'approved';
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    setResidentRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      const auditEntry: AuditEvent = {
        id: `AUD-${requestId}-T${Date.now()}`,
        type: action === 'approve' ? 'triage_approved' : 'triage_rejected',
        actor: activePersona.name,
        actorRole: activePersona.role,
        timestamp: `Today at ${nowStr}`,
        fromStatus: 'pending_triage',
        toStatus: nextStatus,
        note: action === 'reject'
          ? `Rejected: ${rejectionReason || 'Request rejected per strata guidelines.'}`
          : 'Approved for action.',
      };
      if (action === 'reject') {
        return {
          ...r,
          status: 'rejected',
          rejectionReason: rejectionReason || 'Request rejected per strata guidelines.',
          auditLog: [...(r.auditLog || []), auditEntry],
        };
      }
      return {
        ...r,
        status: 'approved',
        auditLog: [...(r.auditLog || []), auditEntry],
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

    // Dispatch status update email to resident
    const targetTriageReq = residentRequests.find(r => r.id === requestId || r.referenceId === requestId);
    if (targetTriageReq?.requestorEmail) {
      dispatchStatusUpdateEmail({
        toEmail: targetTriageReq.requestorEmail,
        requestorName: targetTriageReq.requestorName || 'Resident',
        referenceId: targetTriageReq.referenceId ? targetTriageReq.referenceId.replace('#', '') : targetTriageReq.id,
        activityTitle: targetTriageReq.title,
        oldStatus: 'pending_triage',
        newStatus: nextStatus,
        reason: rejectionReason,
        actionType: action === 'reject' ? 'rejected' : 'approved',
      }).catch(err => console.warn('Triage email notification note:', err));
    }
  };

  const closeResidentRequest = (requestId: string, closeReason: string) => {
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    setResidentRequests(prev => prev.map(r => {
      if (r.id !== requestId && r.referenceId !== requestId) return r;
      const auditEntry: AuditEvent = {
        id: `AUD-${r.id}-CL${Date.now()}`,
        type: 'closed',
        actor: activePersona.name,
        actorRole: activePersona.role,
        timestamp: `Today at ${nowStr}`,
        fromStatus: r.status,
        toStatus: 'closed',
        note: closeReason,
      };
      return {
        ...r,
        status: 'closed',
        closeReason,
        auditLog: [...(r.auditLog || []), auditEntry],
      };
    }));

    supabase.from('resident_requests').update({
      status: 'closed',
      close_reason: closeReason,
      updated_at: new Date().toISOString(),
    }).eq('id', requestId).then(({ error }) => {
      if (error) console.warn('[SmartLot] closeResidentRequest sync note:', error.message);
    });

    // Dispatch closure email to resident
    const targetCloseReq = residentRequests.find(r => r.id === requestId || r.referenceId === requestId);
    if (targetCloseReq?.requestorEmail) {
      dispatchStatusUpdateEmail({
        toEmail: targetCloseReq.requestorEmail,
        requestorName: targetCloseReq.requestorName || 'Resident',
        referenceId: targetCloseReq.referenceId ? targetCloseReq.referenceId.replace('#', '') : targetCloseReq.id,
        activityTitle: targetCloseReq.title,
        oldStatus: targetCloseReq.status,
        newStatus: 'closed',
        reason: closeReason,
        actionType: 'closed',
      }).catch(err => console.warn('Closure email notification note:', err));
    }
  };

  const updateActivityStatus = (requestId: string, newStatus: CaseStatus, reason?: string) => {
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    const targetStatusReq = residentRequests.find(r => r.id === requestId || r.referenceId === requestId);
    const oldStatus = targetStatusReq?.status || 'new';

    setResidentRequests(prev => prev.map(r => {
      if (r.id !== requestId && r.referenceId !== requestId) return r;
      const auditEntry: AuditEvent = {
        id: `AUD-${r.id}-ST${Date.now()}`,
        type: 'status_change',
        actor: activePersona.name,
        actorRole: activePersona.role,
        timestamp: `Today at ${nowStr}`,
        fromStatus: r.status,
        toStatus: newStatus,
        note: reason || `Status manually changed to ${newStatus.replace(/_/g, ' ')} by ${activePersona.role}.`,
      };
      return {
        ...r,
        status: newStatus,
        closeReason: newStatus === 'closed' ? (reason || r.closeReason) : undefined,
        auditLog: [...(r.auditLog || []), auditEntry],
      };
    }));

    supabase.from('resident_requests').update({
      status: newStatus,
      close_reason: newStatus === 'closed' ? (reason || null) : null,
      updated_at: new Date().toISOString(),
    }).eq('id', requestId).then(({ error }) => {
      if (error) console.warn('[SmartLot] updateActivityStatus sync note:', error.message);
    });

    // Dispatch status change email if recipient email exists
    if (targetStatusReq?.requestorEmail && oldStatus !== newStatus) {
      dispatchStatusUpdateEmail({
        toEmail: targetStatusReq.requestorEmail,
        requestorName: targetStatusReq.requestorName || 'Resident',
        referenceId: targetStatusReq.referenceId ? targetStatusReq.referenceId.replace('#', '') : targetStatusReq.id,
        activityTitle: targetStatusReq.title,
        oldStatus,
        newStatus,
        reason,
        actionType: 'status_change',
      }).catch(err => console.warn('Status change email notification note:', err));
    }
  };

  const updateActivityPriority = (requestId: string, newPriority: 'Low' | 'Normal' | 'High' | 'Urgent') => {
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    setResidentRequests(prev => prev.map(r => {
      if (r.id !== requestId && r.referenceId !== requestId) return r;
      const auditEntry: AuditEvent = {
        id: `AUD-${r.id}-PR${Date.now()}`,
        type: 'priority_change',
        actor: activePersona.name,
        actorRole: activePersona.role,
        timestamp: `Today at ${nowStr}`,
        fromPriority: r.priority,
        toPriority: newPriority,
        note: `Priority updated from ${r.priority} to ${newPriority}.`,
      };
      return {
        ...r,
        priority: newPriority,
        auditLog: [...(r.auditLog || []), auditEntry],
      };
    }));

    supabase.from('resident_requests').update({
      priority: newPriority,
      updated_at: new Date().toISOString(),
    }).eq('id', requestId).then(({ error }) => {
      if (error) console.warn('[SmartLot] updateActivityPriority sync note:', error.message);
    });
  };

  const assignActivity = (requestId: string, assigneeName: string, assigneeRole: string, assigneeEmail?: string) => {
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    setResidentRequests(prev => prev.map(r => {
      if (r.id !== requestId && r.referenceId !== requestId) return r;
      const auditEntry: AuditEvent = {
        id: `AUD-${r.id}-AS${Date.now()}`,
        type: 'status_change',
        actor: activePersona.name,
        actorRole: activePersona.role,
        timestamp: `Today at ${nowStr}`,
        note: `Activity assigned to ${assigneeName} (${assigneeRole}).`,
      };
      return {
        ...r,
        assignedToName: assigneeName,
        assignedToRole: assigneeRole,
        assignedToEmail: assigneeEmail,
        status: r.status === 'new' ? 'acknowledged' : r.status,
        auditLog: [...(r.auditLog || []), auditEntry],
      };
    }));

    supabase.from('resident_requests').update({
      assigned_to_name: assigneeName,
      assigned_to_role: assigneeRole,
      assigned_to_email: assigneeEmail || null,
      status: 'acknowledged',
      updated_at: new Date().toISOString(),
    }).eq('id', requestId).then(({ error }) => {
      if (error) console.warn('[SmartLot] assignActivity sync note:', error.message);
    });
  };

  const reopenActivity = (requestId: string, reason: string) => {
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    setResidentRequests(prev => prev.map(r => {
      if (r.id !== requestId && r.referenceId !== requestId) return r;
      const auditEntry: AuditEvent = {
        id: `AUD-${r.id}-RO${Date.now()}`,
        type: 'status_change',
        actor: activePersona.name,
        actorRole: activePersona.role,
        timestamp: `Today at ${nowStr}`,
        fromStatus: 'closed',
        toStatus: 'in_progress',
        note: `Activity reopened: ${reason}`,
      };
      return {
        ...r,
        status: 'in_progress',
        closeReason: undefined,
        auditLog: [...(r.auditLog || []), auditEntry],
      };
    }));

    supabase.from('resident_requests').update({
      status: 'in_progress',
      close_reason: null,
      updated_at: new Date().toISOString(),
    }).eq('id', requestId).then(({ error }) => {
      if (error) console.warn('[SmartLot] reopenActivity sync note:', error.message);
    });
  };

  const addCommentToRequest = (
    requestId: string,
    commentText: string,
    replyTo?: { authorName: string; text: string },
    attachments?: RequestCommentAttachment[]
  ) => {
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    const commentId = `C-${Date.now()}`;
    setResidentRequests(prev => prev.map(r => {
      if (r.id !== requestId && r.referenceId !== requestId) return r;
      const newComment: RequestComment = {
        id: commentId,
        authorName: activePersona.name,
        authorRole: activePersona.role,
        text: commentText,
        createdAt: 'Just now',
        ...(replyTo ? { replyTo } : {}),
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
      };
      const auditEntry: AuditEvent = {
        id: `AUD-${r.id}-CM${Date.now()}`,
        type: 'comment_added',
        actor: activePersona.name,
        actorRole: activePersona.role,
        timestamp: `Today at ${nowStr}`,
        note: replyTo
          ? `Replied to ${replyTo.authorName}'s comment.`
          : (attachments && attachments.length > 0
              ? `Comment posted with ${attachments.length} attachment(s).`
              : 'Comment posted to activity thread.'),
      };
      return {
        ...r,
        comments: [...r.comments, newComment],
        auditLog: [...(r.auditLog || []), auditEntry],
      };
    }));

    // Persist comment to Supabase request_comments table
    supabase.from('request_comments').insert({
      request_id: requestId,
      author_name: activePersona.name,
      author_role: activePersona.role,
      text: commentText.trim(),
      reply_to_name: replyTo?.authorName || null,
      reply_to_text: replyTo?.text || null,
      is_email_reply: false,
      attachments: attachments && attachments.length > 0 ? attachments : null,
    }).then(({ error }) => {
      if (error) console.warn('[SmartLot] request_comments sync note:', error.message);
    });

    // Dispatch email alert to other participant
    const targetCommentReq = residentRequests.find(r => r.id === requestId || r.referenceId === requestId);
    if (targetCommentReq) {
      const isResidentRole = activePersona.role.includes('Resident') || activePersona.role.includes('Owner') || activePersona.role.includes('Tenant');
      const notifyEmail = isResidentRole ? targetCommentReq.strataManagerEmail : targetCommentReq.requestorEmail;
      const notifyName = isResidentRole ? 'Strata Manager' : targetCommentReq.requestorName;

      if (notifyEmail) {
        dispatchCommentNotificationEmail({
          toEmail: notifyEmail,
          recipientName: notifyName || 'Member',
          referenceId: targetCommentReq.referenceId ? targetCommentReq.referenceId.replace('#', '') : targetCommentReq.id,
          activityTitle: targetCommentReq.title,
          commenterName: activePersona.name,
          commenterRole: activePersona.role,
          commentText: commentText.trim(),
        }).catch(err => console.warn('Comment email notification note:', err));
      }
    }
  };

  const editCommentOnRequest = (requestId: string, commentId: string, newText: string) => {
    if (!newText.trim()) return;
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    setResidentRequests(prev => prev.map(r => {
      if (r.id !== requestId && r.referenceId !== requestId) return r;
      return {
        ...r,
        comments: r.comments.map(c => {
          if (c.id !== commentId) return c;
          return {
            ...c,
            text: newText.trim(),
            isEdited: true,
            editedAt: nowStr,
          };
        }),
      };
    }));

    // Persist to Supabase
    supabase
      .from('request_comments')
      .update({
        text: newText.trim(),
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .then(({ error }) => {
        if (error) {
          supabase
            .from('request_comments')
            .update({
              text: newText.trim(),
              is_edited: true,
              edited_at: new Date().toISOString(),
            })
            .eq('request_id', requestId)
            .eq('author_name', activePersona.name)
            .then(({ error: err2 }) => {
              if (err2) console.warn('[SmartLot] request_comments edit note:', err2.message);
            });
        }
      });
  };

  const deleteCommentFromRequest = (requestId: string, commentId: string) => {
    setResidentRequests(prev => prev.map(r => {
      if (r.id !== requestId && r.referenceId !== requestId) return r;
      return {
        ...r,
        comments: r.comments.filter(c => c.id !== commentId),
      };
    }));

    // Persist deletion to Supabase
    supabase
      .from('request_comments')
      .delete()
      .eq('id', commentId)
      .then(({ error }) => {
        if (error) {
          supabase
            .from('request_comments')
            .delete()
            .eq('request_id', requestId)
            .eq('author_name', activePersona.name)
            .then(({ error: err2 }) => {
              if (err2) console.warn('[SmartLot] request_comments delete note:', err2.message);
            });
        }
      });
  };

  const addInternalNoteToRequest = (requestId: string, text: string) => {
    if (!text.trim()) return;
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    const noteId = `NOTE-${Date.now()}`;
    const newNote: InternalNote = {
      id: noteId,
      authorName: activePersona.name,
      authorRole: activePersona.role,
      text: text.trim(),
      createdAt: 'Just now',
    };

    setResidentRequests(prev => prev.map(r => {
      if (r.id !== requestId && r.referenceId !== requestId) return r;
      const auditEntry: AuditEvent = {
        id: `AUD-${r.id}-N${Date.now()}`,
        type: 'internal_note_added',
        actor: activePersona.name,
        actorRole: activePersona.role,
        timestamp: `Today at ${nowStr}`,
        note: `Private internal manager note added.`,
      };
      return {
        ...r,
        internalNotes: [...(r.internalNotes || []), newNote],
        auditLog: [...(r.auditLog || []), auditEntry],
      };
    }));

    // Persist to Supabase activity_notes (non-blocking)
    supabase
      .from('activity_notes')
      .insert({
        request_id: requestId,
        author_name: activePersona.name,
        author_role: activePersona.role,
        text: text.trim(),
        is_internal: true,
      })
      .then(({ error }) => {
        if (error) {
          console.warn('[SmartLot] activity_notes sync note:', error.message);
        }
      });
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

  const addUnit = async (unitData: { schemeId: string; unitId: string; lotNumber?: number; entitlement?: string; status?: 'Occupied' | 'Vacant' }) => {
    const lotNo = unitData.lotNumber ?? (parseInt(unitData.unitId.replace(/\D/g, '')) || 1);
    const newUnit: UnitData = {
      schemeId: unitData.schemeId,
      unitId: unitData.unitId,
      lotNumber: lotNo,
      entitlement: unitData.entitlement || '10% (100/1000)',
      status: unitData.status || 'Vacant',
      actors: [],
    };
    setUnits(prev => [...prev, newUnit]);
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const { error } = await supabase.from('units').insert({
        scheme_id: unitData.schemeId,
        unit_id: unitData.unitId,
        entitlement: newUnit.entitlement,
        status: newUnit.status,
      });
      if (error) console.error("Error inserting unit in Supabase:", error);
    }
  };

  const deleteUnit = async (schemeId: string, unitId: string) => {
    setUnits(prev => prev.filter(u => !(u.schemeId === schemeId && u.unitId === unitId)));
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const { error } = await supabase.from('units').delete().match({ scheme_id: schemeId, unit_id: unitId });
      if (error) console.error("Error deleting unit in Supabase:", error);
    }
  };


  const addVendor = (payload: CreateVendorPayload) => {
    const newVendor: Vendor = {
      id: payload.id || `VND-${Date.now()}`,
      name: payload.name,
      category: payload.category,
      abn: payload.abn,
      licenseNo: payload.licenseNo,
      phone: payload.phone,
      email: payload.email,
      insuranceStatus: payload.insuranceStatus,
      insuranceExpiry: payload.insuranceExpiry,
      rating: payload.rating || 5.0,
    };
    setVendors(prev => [newVendor, ...prev]);
  };

  const deleteVendor = (vendorId: string) => {
    setVendors(prev => prev.filter(v => v.id !== vendorId));
  };


  const createMotion = (payload: CreateMotionPayload) => {
    const newMotion: Motion = {
      id: `MOT-${Date.now()}`,
      caseId: payload.caseId,
      title: payload.title,
      summary: payload.summary,
      quotes: payload.quotes,
      quorumTarget: payload.quorumTarget,
      deadline: payload.deadline,
      status: 'active',
      ballots: [],
    };
    setMotions(prev => [newMotion, ...prev]);
  };

  const castBallot = (motionId: string, vote: MotionVote) => {
    setMotions(prev => prev.map(m => {
      if (m.id !== motionId) return m;
      const alreadyVoted = m.ballots.some(b => b.voterName === activePersona.name);
      const filtered = m.ballots.filter(b => b.voterName !== activePersona.name);
      const newBallot = {
        voterName: activePersona.name,
        voterRole: activePersona.role,
        vote,
        votedAt: new Date().toISOString().split('T')[0],
      };
      const updatedBallots = [...filtered, newBallot];
      const yesVotes = updatedBallots.filter(b => b.vote === 'YES').length;
      const newStatus = yesVotes >= m.quorumTarget ? 'passed' : m.status;
      return { ...m, ballots: updatedBallots, status: newStatus };
    }));
  };

  const deleteMotion = (motionId: string) => {
    setMotions(prev => prev.filter(m => m.id !== motionId));
  };


  const createWorkOrder = (payload: CreateWorkOrderPayload) => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    const token = `tok_${payload.schemeId.toLowerCase()}_${Date.now()}`;
    const newWo: WorkOrder = {
      ...payload,
      id: `WO-${Date.now()}`,
      siteAccessPin: randomPin,
      guestMagicToken: token,
      status: 'issued',
    };
    setWorkOrders(prev => [newWo, ...prev]);
    return newWo;
  };

  const submitGuestWorkOrderCompletion = (workOrderId: string, photoUrl: string, finalCost: number, invoicePdf?: string) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id !== workOrderId) return wo;
      return {
        ...wo,
        status: 'completion_submitted',
        completionPhoto: photoUrl,
        finalCost,
        invoicePdf,
        submittedAt: new Date().toISOString(),
      };
    }));
  };

  const verifyWorkOrder = (workOrderId: string) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id !== workOrderId) return wo;
      return { ...wo, status: 'completed' };
    }));
  };

  const deleteWorkOrder = (workOrderId: string) => {
    setWorkOrders(prev => prev.filter(wo => wo.id !== workOrderId));
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
    let actorNameToOffboard = '';
    
    setUnits(prev => prev.map(u => {
      if (u.schemeId !== schemeId || u.unitId !== unitId) return u;
      const targetActor = u.actors.find(a => a.id === actorId);
      if (targetActor) {
        emailToOffboard = targetActor.email;
        actorNameToOffboard = targetActor.name;
      }
      
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

    // Find and delete matching member in store and database atomically
    const memberToDelete = members.find(m => 
      (m.email?.toLowerCase() === emailToOffboard.toLowerCase() || m.name === actorNameToOffboard) &&
      m.schemeId === schemeId
    );
    if (memberToDelete) {
      deleteMember(memberToDelete.id);
    } else if (emailToOffboard) {
      deleteMember(emailToOffboard);
    }
  };

  const getRequestById = (idOrRef: string): ResidentRequest | undefined => {
    return residentRequests.find(r => r.id === idOrRef || r.referenceId === idOrRef);
  };

  const getRequestsByScheme = (schemeId: string): ResidentRequest[] => {
    return residentRequests.filter(r => r.schemeId === schemeId);
  };

  return {
    schemes,
    getRequestById,
    getRequestsByScheme,
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
    motions,
    setMotions,
    createMotion,
    deleteMotion,
    vendors,
    setVendors,
    addVendor,
    deleteVendor,
    workOrders,
    setWorkOrders,
    createWorkOrder,
    deleteWorkOrder,
    units,
    customPersonas,
    addCustomPersona,
    addMember,
    acceptMemberInvite,
    updateMemberStatus,
    deleteMember,
    submitResidentRequest,
    simulateManagerEmailReply,
    createMasterRequest,
    triageRequest,
    closeResidentRequest,
    updateActivityStatus,
    updateActivityPriority,
    assignActivity,
    reopenActivity,
    addCommentToRequest,
    editCommentOnRequest,
    deleteCommentFromRequest,
    addInternalNoteToRequest,
    addResidentToUnit,
    offboardActor,
    updateUnitMetadata,
    addUnit,
    deleteUnit,
    updateScheme,
    updateMember,
    updateResidentRequest,
    deleteResidentRequest,
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
    castBallot,
    submitGuestWorkOrderCompletion,
    verifyWorkOrder,
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
// Perf: Memoized active scheme filtering evaluation

// Types: Streamline comment attachment schema definitions

// Perf: Enhance audit log timestamp parsing accuracy

// Perf: Optimize resident request lookup indexing

// Docs: Add quorum target calculation reference notes

// Docs: Document edge function send-activity-email payload

// Docs: Annotate profile syncing triggers in supabase

// Perf: Streamline internal notes state mutations

// Docs: Document immutable audit trail event taxonomy

// Refactor: Standardize audit log generator helper methods

// Perf: Streamline role permissions lookup cache

// Docs: Document vendor quote evaluation criteria

// Helpers: Improve formatRelativeTime helper precision
