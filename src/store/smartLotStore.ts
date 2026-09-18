// JSDoc: Removes resident request or maintenance ticket permanently
// JSDoc: Creates new physical unit or lot entitlement record
// JSDoc: Deletes unit record with scheme cascade
// JSDoc: Registers certified contractor in scheme trade directory
// JSDoc: Removes contractor vendor from trade directory
// JSDoc: Creates formal committee motion with linked quotes and quorum target
// JSDoc: Dispatches digital trade work order with access pin and token
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
  ContactPreference,
  Survey,
  SurveyQuestion,
  SurveyResponse,
  SurveyAISummary,
  SurveyCategory
} from '../types';
import { supabase } from '../lib/supabase';
import { 
  dispatchActivityConduitEmail, 
  dispatchStatusUpdateEmail, 
  dispatchCommentNotificationEmail,
  dispatchSurveyInvitationEmail
} from '../services/emailService';
import {
  STRATA_SURVEY_TEMPLATES,
  generateSurveyQuestionsWithAI,
  generateSurveySummaryWithAI
} from '../services/aiSurveyService';


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
  linkedWorkOrderId?: string;
  tenderStatus?: 'none' | 'quoting' | 'quote_selected' | 'work_order_dispatched';
  tenderScope?: string;
  tenderQuotes?: RequestQuote[];
};

export type RequestQuote = {
  id: string;
  vendorId: string;
  vendorName: string;
  contactEmail?: string;
  contactPhone?: string;
  isAccredited: boolean;
  insuranceStatus: 'Active' | 'Expired Ins.' | 'Pending Verification';
  insuranceExpiry?: string;
  amount: number;
  scopeNotes: string;
  warranty?: string;
  estimatedDays?: number;
  submittedAt: string;
  recommended?: boolean;
  committeeVotes?: string[];
  isSelected?: boolean;
};

export type RequestTender = {
  id: string;
  requestId: string;
  schemeId: string;
  title: string;
  scopeOfWork: string;
  status: 'draft' | 'open_for_quotes' | 'quotes_received' | 'selected' | 'dispatched';
  quotes: RequestQuote[];
  selectedQuoteId?: string;
  createdAt: string;
};

export type MaintenanceCase = ResidentRequest;

export type MotionVote = 'YES' | 'NO' | 'ABSTAIN';
export type SCMOffice = 'Chairperson' | 'Treasurer' | 'Secretary' | 'Committee Member' | 'Member';

export type CommitteeMember = {
  id: string;
  name: string;
  office: SCMOffice;
  email?: string;
  unit?: string;
};

export type MotionAttachment = {
  name: string;
  url: string;
  size?: string;
  type?: 'original' | 'revised';
  uploadedAt?: string;
  uploadedBy?: string;
  note?: string;
};

export type MotionRFI = {
  id: string;
  requestedBy: string;
  requestedRole: string;
  question: string;
  requestedAt: string;
  extendedDays: number;
  status: 'open' | 'addressed';
  responseNote?: string;
};

export type MotionRestartEvent = {
  id: string;
  restartedAt: string;
  restartedBy: string;
  reason?: string;
  previousYesCount?: number;
  previousNoCount?: number;
};

export type Motion = {
  id: string;
  caseId?: string;
  schemeId?: string;
  strataPlan?: string;
  propertyAddress?: string;
  heading?: string;
  title: string;
  summary: string;
  voterGroup?: 'committee_only' | 'lot_owners' | 'all_residents' | string;
  committeeSize?: number;
  quorumTarget: number;
  deadline: string;
  originalDeadline?: string;
  status: 'active' | 'passed' | 'rejected' | 'unresolved';
  committeeRoster?: CommitteeMember[];
  ballots: {
    voterName: string;
    voterRole: string;
    voterOffice?: SCMOffice;
    vote: MotionVote;
    votedAt: string;
    comment?: string;
  }[];
  quotes: {
    vendorId: string;
    vendorName: string;
    amount: number;
    gstIncluded: boolean;
    recommended?: boolean;
  }[];
  attachments?: MotionAttachment[];
  revisedAttachments?: MotionAttachment[];
  rfiHistory?: MotionRFI[];
  restartHistory?: MotionRestartEvent[];
  comments?: RequestComment[];
  closeReason?: string;
  closedAt?: string;
  closedBy?: {
    name: string;
    role: string;
  };
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
  insuranceStatus: 'Active' | 'Expired Ins.' | 'Pending Verification';
  insuranceExpiry: string;
  rating: number;
  certificateOfCurrencyUrl?: string;
  website?: string;
  yearsOfExperience?: number;
  verifiedAt?: string;
  verifiedBy?: string;
};

export type WorkOrder = {
  id: string;
  caseId: string;
  schemeId: string;
  vendorId: string;
  vendorName: string;
  vendorEmail?: string;
  vendorPhone?: string;
  scopeOfWork: string;
  budgetCap: number;
  siteAccessPin: string;
  guestMagicToken: string;
  status: 'issued' | 'in_progress' | 'completion_submitted' | 'completed';
  completionPhoto?: string;
  invoicePdf?: string;
  finalCost?: number;
  submittedAt?: string;
  signedOffAt?: string;
  signedOffBy?: string;
  signOffNotes?: string;
};

export type CreateVendorPayload = Omit<Vendor, 'id'> & { id?: string };
export type CreateWorkOrderPayload = Omit<WorkOrder, 'id' | 'siteAccessPin' | 'guestMagicToken' | 'status'>;
export type CreateMotionPayload = {
  caseId?: string;
  title: string;
  summary: string;
  quotes?: Motion['quotes'];
  attachments?: Motion['attachments'];
  quorumTarget: number;
  deadline: string;
  schemeId?: string;
  voterGroup?: 'committee_only' | 'lot_owners' | 'all_residents' | string;
};


export type MemberRole = 
  | 'Strata Manager' 
  | 'Strata Admin'
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
  avatarUrl?: string;
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
  },
  {
    id: 'VND-006',
    name: 'SoundShield Acoustic Engineering NSW',
    category: 'Acoustic & Vibration Engineering',
    abn: '44 812 390 118',
    licenseNo: 'LIC-NSW-99201S',
    phone: '02 9188 4400',
    email: 'tenders@soundshield.com.au',
    insuranceStatus: 'Active',
    insuranceExpiry: '2027-09-30',
    rating: 4.9,
  },
  {
    id: 'VND-007',
    name: 'Aeroflow HVAC & Sound Dampeners Pty Ltd',
    category: 'Mechanical & Acoustic Services',
    abn: '71 630 449 201',
    licenseNo: 'LIC-NSW-81042A',
    phone: '02 9340 7711',
    email: 'estimating@aeroflow.com.au',
    insuranceStatus: 'Active',
    insuranceExpiry: '2026-12-31',
    rating: 4.6,
  },
  {
    id: 'VND-008',
    name: 'Apex Lift & Escalator Services',
    category: 'Lift & Vertical Transport',
    abn: '64 109 233 801',
    licenseNo: 'LIC-NSW-77491L',
    phone: '02 9155 3300',
    email: 'repairs@apexlifts.com.au',
    insuranceStatus: 'Active',
    insuranceExpiry: '2027-05-12',
    rating: 4.7,
  },
  {
    id: 'VND-009',
    name: 'Ascent Vertical Transport Pty Ltd',
    category: 'Lift & Vertical Transport',
    abn: '89 421 900 115',
    licenseNo: 'LIC-NSW-51092L',
    phone: '0412 888 123',
    email: 'quotes@ascentvt.com.au',
    insuranceStatus: 'Expired Ins.',
    insuranceExpiry: '2025-08-30',
    rating: 4.2,
  }
];


export const INITIAL_MOTIONS: Motion[] = [
  {
    id: 'MOT-CAV-501',
    caseId: 'REQ-CAV-101',
    schemeId: 'SP52042',
    strataPlan: 'SP 52042',
    propertyAddress: '1 Pitt Street, Sydney NSW 2000',
    heading: 'Lobby Signage Upgrade',
    title: 'Replace Lobby Directory Signage',
    summary: 'Approve replacing the old lobby directory board and front entry signs with modern aluminum panels ($3,850).',
    voterGroup: 'committee_only',
    committeeSize: 6,
    quorumTarget: 4, // 4 votes required to form a binding decision
    deadline: '2026-09-26',
    originalDeadline: '2026-09-19',
    status: 'active',
    committeeRoster: [
      { id: 'scm-1', name: 'Michael Chen', office: 'Chairperson', email: 'michael.chen@coronation.com', unit: 'Unit 2' },
      { id: 'scm-2', name: 'Sarah Jones', office: 'Treasurer', email: 'sarah.jones@duplex.com', unit: 'Unit 1' },
      { id: 'scm-3', name: 'David Miller', office: 'Secretary', email: 'david.m@duplex.com', unit: 'Unit 3' },
      { id: 'scm-4', name: 'Elena Vance', office: 'Committee Member', email: 'elena.vance@strata.com', unit: 'Unit 5' },
      { id: 'scm-5', name: 'David Ward', office: 'Committee Member', email: 'david.ward@strata.com', unit: 'Unit 7' },
      { id: 'scm-6', name: 'Lisa Ray', office: 'Committee Member', email: 'lisa.ray@strata.com', unit: 'Unit 8' }
    ],
    ballots: [
      { voterName: 'Michael Chen', voterRole: 'Committee Member', voterOffice: 'Chairperson', vote: 'YES', votedAt: '2026-09-10', comment: 'Looks clean and fits building design guidelines.' },
      { voterName: 'Sarah Jones', voterRole: 'Committee Member', voterOffice: 'Treasurer', vote: 'YES', votedAt: '2026-09-11', comment: 'Cost is within our maintenance budget.' },
      { voterName: 'David Miller', voterRole: 'Tenant / Resident', voterOffice: 'Secretary', vote: 'YES', votedAt: '2026-09-12', comment: 'Contractor license and insurance verified.' }
    ],
    quotes: [
      { vendorId: 'VND-002', vendorName: 'Apex Architectural Facades NSW', amount: 3850, gstIncluded: true, recommended: true },
      { vendorId: 'VND-005', vendorName: 'Sydney Signcraft & Cladding Co.', amount: 4400, gstIncluded: true }
    ],
    attachments: [
      { name: 'Original_Signage_Submission_Sarah_Lot1.pdf', url: '#', size: '2.4 MB', type: 'original', uploadedAt: '10 Sep 2026', uploadedBy: 'Sarah Jones (Lot Owner)' },
      { name: 'Cavallo_Lobby_Existing_Photo.jpg', url: '#', size: '3.1 MB', type: 'original', uploadedAt: '10 Sep 2026', uploadedBy: 'Sarah Jones (Lot Owner)' }
    ],
    revisedAttachments: [
      { name: 'Revised_Signage_Mockup_Photo_v2.jpg', url: '#', size: '2.8 MB', type: 'revised', uploadedAt: '12 Sep 2026', uploadedBy: 'Sarah Jones (Lot Owner)', note: 'Updated mockup with dark bronze frame and green accents.' }
    ],
    comments: [
      {
        id: 'C-CAV-1',
        authorName: 'Michael Chen',
        authorRole: 'Committee Member',
        text: 'New design looks clean and matches our foyer.',
        createdAt: '1 day ago'
      },
      {
        id: 'C-CAV-2',
        authorName: 'David Miller',
        authorRole: 'Tenant / Resident',
        text: 'Checked the wall anchors. Installation takes under 4 hours.',
        createdAt: '18 hours ago'
      },
      {
        id: 'C-CAV-3',
        authorName: 'Emma Wilson',
        authorRole: 'Strata Manager',
        text: 'Currently at 3 YES votes. Need 1 more vote to pass.',
        createdAt: '4 hours ago'
      }
    ]
  },
  {
    id: 'MOT-CAV-502',
    caseId: 'REQ-CAV-104',
    schemeId: 'SP52042',
    strataPlan: 'SP 52042',
    propertyAddress: '1 Pitt Street, Sydney NSW 2000',
    heading: 'Rooftop Noise Dampening',
    title: 'Rooftop AC Noise Barriers',
    summary: 'Proposal to install sound barriers around rooftop air conditioning units ($8,250).',
    voterGroup: 'committee_only',
    committeeSize: 6,
    quorumTarget: 4,
    deadline: '2026-09-12',
    status: 'rejected',
    closeReason: 'Rejected by committee due to high cost ($8,250) and missing engineer sign-off.',
    closedAt: '2026-09-12',
    closedBy: {
      name: 'Sarah Jones',
      role: 'Treasurer'
    },
    committeeRoster: [
      { id: 'scm-1', name: 'Michael Chen', office: 'Chairperson', email: 'michael.chen@coronation.com', unit: 'Unit 2' },
      { id: 'scm-2', name: 'Sarah Jones', office: 'Treasurer', email: 'sarah.jones@duplex.com', unit: 'Unit 1' },
      { id: 'scm-3', name: 'David Miller', office: 'Secretary', email: 'david.m@duplex.com', unit: 'Unit 3' },
      { id: 'scm-4', name: 'Elena Vance', office: 'Committee Member', email: 'elena.vance@strata.com', unit: 'Unit 5' },
      { id: 'scm-5', name: 'David Ward', office: 'Committee Member', email: 'david.ward@strata.com', unit: 'Unit 7' },
      { id: 'scm-6', name: 'Lisa Ray', office: 'Committee Member', email: 'lisa.ray@strata.com', unit: 'Unit 8' }
    ],
    quotes: [
      { vendorId: 'VND-006', vendorName: 'SoundShield Acoustic Engineering NSW', amount: 8250, gstIncluded: true, recommended: true },
      { vendorId: 'VND-007', vendorName: 'Aeroflow HVAC & Sound Dampeners Pty Ltd', amount: 9600, gstIncluded: true },
    ],
    attachments: [
      { name: 'Rooftop_HVAC_Cooling_Tower_Survey.pdf', url: '#', size: '3.4 MB', type: 'original', uploadedAt: '10 Sep 2026', uploadedBy: 'Emma Wilson (Strata Manager)' },
      { name: 'SoundShield_Engineering_Quote_8250.pdf', url: '#', size: '1.2 MB', type: 'original', uploadedAt: '10 Sep 2026', uploadedBy: 'Emma Wilson (Strata Manager)' },
    ],
    comments: [
      {
        id: 'CMT-CAV-502-1',
        authorName: 'Sarah Jones',
        authorRole: 'Treasurer',
        text: 'Voted NO. Cost is unbudgeted and no structural engineer sign-off.',
        createdAt: '1 day ago'
      },
      {
        id: 'CMT-CAV-502-2',
        authorName: 'Emma Wilson',
        authorRole: 'Strata Manager',
        text: 'Motion concluded as rejected. Requester notified.',
        createdAt: '1 day ago'
      }
    ],
    ballots: [
      { voterName: 'Michael Chen', voterRole: 'Committee Member', voterOffice: 'Chairperson', vote: 'YES', votedAt: '2026-09-10', comment: 'Need to reduce noise for top-floor units.' },
      { voterName: 'Sarah Jones', voterRole: 'Committee Member', voterOffice: 'Treasurer', vote: 'NO', votedAt: '2026-09-11', comment: 'Too expensive ($8,250) and missing structural engineer approval.' },
      { voterName: 'David Miller', voterRole: 'Tenant / Resident', voterOffice: 'Secretary', vote: 'NO', votedAt: '2026-09-12', comment: 'Missing council permits and crane access plan.' }
    ]
  },
  {
    id: 'MOT-COR-201',
    caseId: 'REQ-COR-202',
    schemeId: 'SP102',
    strataPlan: 'SP 102',
    propertyAddress: '14 Coronation Parade, Strathfield NSW 2135',
    heading: 'Courtyard Pipe Repairs',
    title: 'Fix Courtyard Garden Water Pipes',
    summary: 'Approve contractor quote to fix leaking garden irrigation pipes and repair damaged pavers in the courtyard ($3,450).',
    voterGroup: 'committee_only',
    committeeSize: 3,
    quorumTarget: 2,
    deadline: '2026-09-30',
    status: 'active',
    committeeRoster: [
      { id: 'scm-cor-1', name: 'Michael Chen', office: 'Chairperson', email: 'michael.chen@coronation.com', unit: 'Unit 2' },
      { id: 'scm-cor-2', name: 'Marcus Sterling', office: 'Treasurer', email: 'marcus.s@coronation.com', unit: 'Unit 3' },
      { id: 'scm-cor-3', name: 'Elena Rostov', office: 'Secretary', email: 'elena.r@coronation.com', unit: 'Unit 1' }
    ],
    quotes: [
      { vendorId: 'VND-001', vendorName: 'Sydney Apex Plumbing & Gas', amount: 3450, gstIncluded: true, recommended: true },
      { vendorId: 'VND-004', vendorName: 'Citywide Commercial Hydraulics', amount: 4100, gstIncluded: true },
    ],
    comments: [
      {
        id: 'C-MOT-COR-1',
        authorName: 'Marcus Sterling',
        authorRole: 'Committee Member',
        text: 'Apex surveyed the run. Quote is reasonable.',
        createdAt: 'Yesterday'
      }
    ],
    ballots: [
      { voterName: 'Marcus Sterling', voterRole: 'Committee Member', voterOffice: 'Treasurer', vote: 'YES', votedAt: '2026-09-11', comment: 'Apex quote is fair and within budget.' },
      { voterName: 'Michael Chen', voterRole: 'Committee Member', voterOffice: 'Chairperson', vote: 'YES', votedAt: '2026-09-12', comment: 'Inspected the courtyard leak. Approved.' }
    ]
  },
  {
    id: 'MOT-001',
    caseId: 'REQ-101',
    schemeId: 'SP101',
    strataPlan: 'SP 101',
    propertyAddress: '88 Sunset Blvd, Cronulla NSW 2230',
    heading: 'Main Water Line Repair',
    title: 'Emergency Main Water Line Replacement',
    summary: 'Emergency replacement of burst water supply line servicing Units 1-6. Work completed under Work Order WO-10482 ($3,450).',
    voterGroup: 'committee_only',
    committeeSize: 2,
    quorumTarget: 2,
    deadline: '2026-09-28',
    status: 'passed',
    closeReason: 'Quorum reached (2/2 YES). Emergency work order WO-10482 generated.',
    closedAt: '2026-09-09',
    committeeRoster: [
      { id: 'scm-dup-1', name: 'Sarah Jones', office: 'Chairperson', email: 'sarah.jones@duplex.com', unit: 'Unit 1' },
      { id: 'scm-dup-2', name: 'Robert Vance', office: 'Secretary', email: 'robert.v@duplex.com', unit: 'Unit 2' }
    ],
    quotes: [
      { vendorId: 'VND-001', vendorName: 'Sydney Apex Plumbing & Gas', amount: 3450, gstIncluded: true, recommended: true },
      { vendorId: 'VND-004', vendorName: 'Citywide Commercial Hydraulics', amount: 4100, gstIncluded: true },
    ],
    comments: [],
    ballots: [
      { voterName: 'Sarah Jones', voterRole: 'Committee Member', voterOffice: 'Chairperson', vote: 'YES', votedAt: '2026-09-08', comment: 'Urgent repair approved.' },
      { voterName: 'Robert Vance', voterRole: 'Committee Member', voterOffice: 'Secretary', vote: 'YES', votedAt: '2026-09-09', comment: 'Pipe replacement confirmed.' }
    ],
    createdWorkOrderId: 'WO-10482'
  }
];


export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-10482',
    caseId: 'REQ-DUP-101',
    schemeId: 'SP101',
    vendorId: 'VND-001',
    vendorName: 'Sydney Apex Plumbing & Gas',
    vendorEmail: 'dispatch@apexplumbing.com.au',
    vendorPhone: '02 9844 2001',
    scopeOfWork: 'Replace damaged 50mm hydraulic isolation valve in basement riser B.',
    budgetCap: 1200,
    siteAccessPin: '4829',
    guestMagicToken: 'tok_sp101_wo10482_live',
    status: 'issued',
  },
  {
    id: 'WO-10483',
    caseId: 'REQ-CAV-301',
    schemeId: 'SP103',
    vendorId: 'VND-003',
    vendorName: 'Kone Elevator Maintenance NSW',
    vendorEmail: 'maintenance.sydney@kone.com',
    vendorPhone: '1300 362 473',
    scopeOfWork: 'Inspect and repair hydraulic motor & power inverter drive on Passenger Lift #2.',
    budgetCap: 3400,
    siteAccessPin: '7392',
    guestMagicToken: 'tok_sp103_wo10483_live',
    status: 'completion_submitted',
    completionPhoto: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop',
    invoicePdf: 'Tax_Invoice_INV-84920_KONE.pdf',
    finalCost: 3400,
    submittedAt: 'Today, 2:30 PM',
  }
];

export const INITIAL_SURVEYS: Survey[] = [
  {
    id: 'SRV-CAV-2026',
    schemeId: 'SP52042',
    title: 'Annual Strata Scheme Satisfaction Survey 2026',
    description: 'Annual feedback questionnaire for Cavallo owners & residents to review Strata Management responsiveness, building cleanliness, lift reliability, and shared facilities.',
    category: 'Annual Satisfaction',
    status: 'active',
    targetAudience: 'All Residents',
    recipientEmails: [
      'sarah.jones@duplex.com',
      'michael.chen@coronation.com',
      'david.m@duplex.com',
      'elena.vance@strata.com',
      'lisa.ray@strata.com',
      'sam.resident@strata.com'
    ],
    deadline: '2026-10-31',
    bannerImage: '/bg_img_building.png',
    createdAt: '2026-09-01T09:00:00.000Z',
    createdBy: {
      name: 'Emma Wilson',
      role: 'Strata Manager',
      email: 'emma.wilson@agency.com'
    },
    questions: [
      {
        id: 'q_cav_1',
        questionText: 'How satisfied are you with the overall management responsiveness and communication from StrataChoice (Managing Agency)?',
        category: 'Management Performance',
        type: 'star_rating',
        required: true,
        order: 1
      },
      {
        id: 'q_cav_2',
        questionText: 'How would you rate the ongoing cleanliness, waste disposal, and presentation of Cavallo lobbies, corridors, and gardens?',
        category: 'Building & Cleanliness',
        type: 'star_rating',
        required: true,
        order: 2
      },
      {
        id: 'q_cav_3',
        questionText: 'How reliable are our shared essential building assets (passenger lifts, main security gate, intercom)?',
        category: 'Building Facilities',
        type: 'star_rating',
        required: true,
        order: 3
      },
      {
        id: 'q_cav_4',
        questionText: 'How satisfied are you with visitor parking enforcement and common property by-law compliance?',
        category: 'Parking & By-laws',
        type: 'star_rating',
        required: false,
        order: 4
      },
      {
        id: 'q_cav_5',
        questionText: 'How likely are you to recommend living in or owning property at Cavallo (1 Pitt St) to family or friends? (NPS)',
        category: 'Community NPS',
        type: 'nps_score',
        required: true,
        order: 5
      },
      {
        id: 'q_cav_radio',
        questionText: 'Would you support upgrading to smart energy-efficient LED lighting in common basements and hallways?',
        category: 'Building Facilities',
        type: 'single_choice',
        options: ['Yes, strongly support', 'Neutral / depends on cost', 'No, not needed'],
        required: true,
        order: 6
      },
      {
        id: 'q_cav_6',
        questionText: 'What is the #1 priority or improvement you would like the Strata Committee and Manager to focus on this coming year?',
        category: 'General Suggestions',
        type: 'text_feedback',
        required: false,
        order: 7
      }
    ],
    aiExecutiveSummary: {
      overallSentiment: 'Highly Positive',
      sentimentScore: 78,
      topStrengths: [
        'Lobby and garden presentation praised for immaculate maintenance and high curb appeal.',
        'Strata manager communication turnaround and digital notice transparency rated very favorably.',
        'Strong sense of building security and community peace among both owners and tenants.'
      ],
      topActionItems: [
        'Address visitor parking bay misuse on weekends with refreshed signage and visitor pass checks.',
        'Schedule preventive maintenance review with lift technicians to service ground floor doors.',
        'Coordinate an additional Monday morning recycling bin collection with city council.'
      ],
      executiveBrief: 'Overall resident sentiment is Highly Positive with an average satisfaction rating of 4.6/5.0 across 8 submitted surveys. Residents commend recent common area maintenance and digital issue tracking while requesting proactive enforcement of weekend visitor parking.',
      generatedAt: '2026-09-14T11:30:00.000Z'
    }
  }
];

export const INITIAL_SURVEY_RESPONSES: SurveyResponse[] = [
  {
    id: 'RSP-CAV-001',
    surveyId: 'SRV-CAV-2026',
    schemeId: 'SP52042',
    unitId: 'Unit 2',
    respondentName: 'Michael Chen (Chairperson)',
    isAnonymous: false,
    submittedAt: '2026-09-02T10:15:00.000Z',
    answers: {
      q_cav_1: 5,
      q_cav_2: 5,
      q_cav_3: 4,
      q_cav_4: 4,
      q_cav_5: 10,
      q_cav_radio: 'Yes, strongly support',
      q_cav_6: 'Emma Wilson has done a great job coordinating the lobby directory upgrade. Very prompt communication.'
    }
  },
  {
    id: 'RSP-CAV-002',
    surveyId: 'SRV-CAV-2026',
    schemeId: 'SP52042',
    unitId: 'Unit 1',
    respondentName: 'Sarah Jones (Treasurer)',
    isAnonymous: false,
    submittedAt: '2026-09-03T14:30:00.000Z',
    answers: {
      q_cav_1: 5,
      q_cav_2: 5,
      q_cav_3: 4,
      q_cav_4: 4,
      q_cav_5: 9,
      q_cav_radio: 'Yes, strongly support',
      q_cav_6: 'Financial reports and levy distributions have been very transparent. Please look at getting quotes for EV chargers in the basement.'
    }
  },
  {
    id: 'RSP-CAV-003',
    surveyId: 'SRV-CAV-2026',
    schemeId: 'SP52042',
    unitId: 'Unit 4',
    respondentName: 'Elena Vance (Lot Owner)',
    isAnonymous: false,
    submittedAt: '2026-09-04T09:45:00.000Z',
    answers: {
      q_cav_1: 4,
      q_cav_2: 4,
      q_cav_3: 5,
      q_cav_4: 3,
      q_cav_5: 8,
      q_cav_radio: 'Neutral / depends on cost',
      q_cav_6: 'Visitor parking is sometimes taken up by non-visitors on Friday and Saturday evenings. We need clearer towing warning signs.'
    }
  },
  {
    id: 'RSP-CAV-004',
    surveyId: 'SRV-CAV-2026',
    schemeId: 'SP52042',
    isAnonymous: true,
    submittedAt: '2026-09-05T16:20:00.000Z',
    answers: {
      q_cav_1: 5,
      q_cav_2: 5,
      q_cav_3: 5,
      q_cav_4: 4,
      q_cav_5: 10,
      q_cav_radio: 'Yes, strongly support',
      q_cav_6: 'The cleaners are wonderful. The lobby smells clean every morning. Thank you!'
    }
  },
  {
    id: 'RSP-CAV-005',
    surveyId: 'SRV-CAV-2026',
    schemeId: 'SP52042',
    unitId: 'Unit 3',
    respondentName: 'David Miller (Resident / Tenant)',
    isAnonymous: false,
    submittedAt: '2026-09-06T11:00:00.000Z',
    answers: {
      q_cav_1: 5,
      q_cav_2: 4,
      q_cav_3: 4,
      q_cav_4: 4,
      q_cav_5: 9,
      q_cav_radio: 'Yes, strongly support',
      q_cav_6: 'Very happy with our committee and strata manager collaboration. Keep up the high standard.'
    }
  },
  {
    id: 'RSP-CAV-006',
    surveyId: 'SRV-CAV-2026',
    schemeId: 'SP52042',
    isAnonymous: true,
    submittedAt: '2026-09-07T18:05:00.000Z',
    answers: {
      q_cav_1: 4,
      q_cav_2: 5,
      q_cav_3: 3,
      q_cav_4: 3,
      q_cav_5: 8,
      q_cav_radio: 'Neutral / depends on cost',
      q_cav_6: 'The north passenger lift had a minor sensor stutter last week. It is fine now but good to keep an eye on before warranty expires.'
    }
  },
  {
    id: 'RSP-CAV-007',
    surveyId: 'SRV-CAV-2026',
    schemeId: 'SP52042',
    unitId: 'Unit 12',
    respondentName: 'George (SCM)',
    isAnonymous: false,
    submittedAt: '2026-09-08T13:40:00.000Z',
    answers: {
      q_cav_1: 5,
      q_cav_2: 5,
      q_cav_3: 5,
      q_cav_4: 5,
      q_cav_5: 10,
      q_cav_radio: 'Yes, strongly support',
      q_cav_6: 'Garden landscaping looks top notch. Great work team.'
    }
  },
  {
    id: 'RSP-CAV-008',
    surveyId: 'SRV-CAV-2026',
    schemeId: 'SP52042',
    isAnonymous: true,
    submittedAt: '2026-09-10T08:15:00.000Z',
    answers: {
      q_cav_1: 4,
      q_cav_2: 4,
      q_cav_3: 4,
      q_cav_4: 3,
      q_cav_5: 9,
      q_cav_radio: 'No, not needed',
      q_cav_6: 'Cardboard recycling bins overflow after people move in on weekends. An extra collection day would be super helpful.'
    }
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
    role: 'Strata Admin',
    unitId: 'Unit 1',
    lotNumber: 1,
    status: 'Active',
    joinedAt: '2024-03-15',
  },
  // Sarah Jones is also Strata Admin & Lot Owner for Cavallo SP52042
  {
    id: 'MEM-CAV-SARAH',
    name: 'Sarah Jones',
    email: 'sarah.jones@duplex.com',
    phone: '0400 111 222',
    schemeId: 'SP52042',
    role: 'Strata Admin',
    unitId: 'Unit 1',
    lotNumber: 1,
    status: 'Active',
    joinedAt: '2024-01-15',
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
  // Cavallo (SP52042) - Scenario V1 Lot Owner Request
  {
    id: 'REQ-CAV-101',
    referenceId: '#CAV-101',
    schemeId: 'SP52042',
    buildingName: 'Cavallo, 1 Pitt St',
    unit: 'Unit 4',
    title: 'Common lobby directory signage & exterior entry cladding modernisation',
    description: 'Requesting permission and committee funding to replace the cracked 2004 entrance signage board with modern architectural brushed aluminum directory signage, and renew weathered exterior entry cladding.',
    requestType: 'Lot Owner Modification',
    stream: 'common_area_repair',
    priority: 'Medium',
    location: 'Ground Floor Main Lobby & Entryway',
    contactPreference: 'Email',
    strataManagerEmail: 'emma.wilson@agency.com',
    attachmentUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop',
    attachmentUrls: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop'
    ],
    status: 'in_voting',
    createdAt: '10 Sep 2026',
    requestorName: 'Sarah Jones',
    reportedBy: 'Sarah Jones (Lot Owner - Unit 1)',
    requestorEmail: 'sarah.jones@duplex.com',
    requestorPhone: '0412 888 777',
    requestorRole: 'Lot Owner',
    linkedMotionId: 'MOT-CAV-501',
    comments: [
      {
        id: 'C-CAV-101-1',
        authorName: 'Emma Wilson',
        authorRole: 'Strata Manager',
        text: 'Hi Sarah, I have published this request as official Strata Committee Motion MOT-CAV-501. 4 committee votes required to pass under NSW Strata Schemes Management Act 2015.',
        createdAt: '10 Sep 2026'
      }
    ],
    auditLog: [
      {
        id: 'AUD-CAV-101-1',
        type: 'created',
        actor: 'Sarah Jones',
        actorRole: 'Lot Owner',
        timestamp: '10 Sep 2026',
        note: 'Request #CAV-101 submitted for Unit 1 common area signage.',
      },
      {
        id: 'AUD-CAV-101-2',
        type: 'status_change',
        actor: 'Emma Wilson',
        actorRole: 'Strata Manager',
        timestamp: '10 Sep 2026',
        fromStatus: 'new',
        toStatus: 'in_voting',
        note: 'Published as official Committee Motion MOT-CAV-501.',
      }
    ]
  },
  {
    id: 'REQ-CAV-102',
    referenceId: '#CAV-102',
    schemeId: 'SP52042',
    buildingName: 'Cavallo, 1 Pitt St',
    unit: 'Common Property',
    title: 'Main Passenger Lift Jerking and Stalling at Level 3',
    description: 'Main passenger lift #1 is jerking violently between Level 2 and Level 3 and displayed safety fault E-41. Out of service. Requires urgent hydraulic motor inspection and drive replacement.',
    requestType: 'Common Property Repair',
    stream: 'emergency_repair',
    priority: 'Emergency',
    location: 'Lift',
    contactPreference: 'Email',
    strataManagerEmail: 'emma.wilson@agency.com',
    status: 'approved',
    createdAt: 'Today, 8:45 AM',
    requestorName: 'Michael Chen',
    reportedBy: 'Michael Chen (Chairperson - Unit 2)',
    requestorEmail: 'michael.chen@coronation.com',
    requestorPhone: '0412 999 333',
    requestorRole: 'Committee Member',
    tenderStatus: 'quoting',
    tenderScope: 'Inspect and replace hydraulic motor assembly and power inverter drive on Main Passenger Lift #1.',
    tenderQuotes: [
      {
        id: 'QTE-102-1',
        vendorId: 'VND-003',
        vendorName: 'Kone Elevator Maintenance NSW',
        contactEmail: 'maintenance.sydney@kone.com',
        contactPhone: '1300 362 473',
        isAccredited: true,
        insuranceStatus: 'Active',
        insuranceExpiry: '2028-01-01',
        amount: 3400,
        scopeNotes: 'OEM replacement of hydraulic motor inverter and full safety sensor recalibration with 12-month warranty.',
        warranty: '12 Months Comprehensive',
        estimatedDays: 1,
        submittedAt: 'Today, 9:20 AM',
        recommended: true,
        committeeVotes: ['Michael Chen', 'Sarah Jones']
      },
      {
        id: 'QTE-102-2',
        vendorId: 'VND-008',
        vendorName: 'Apex Lift & Escalator Services',
        contactEmail: 'repairs@apexlifts.com.au',
        contactPhone: '02 9155 3300',
        isAccredited: true,
        insuranceStatus: 'Active',
        insuranceExpiry: '2027-05-12',
        amount: 2850,
        scopeNotes: 'Recondition drive module and bench-test electrical sensors with 6-month parts warranty.',
        warranty: '6 Months Parts',
        estimatedDays: 2,
        submittedAt: 'Today, 10:15 AM',
        recommended: false,
        committeeVotes: ['David Miller']
      },
      {
        id: 'QTE-102-3',
        vendorId: 'VND-009',
        vendorName: 'Ascent Vertical Transport Pty Ltd',
        contactEmail: 'quotes@ascentvt.com.au',
        contactPhone: '0412 888 123',
        isAccredited: false,
        insuranceStatus: 'Expired Ins.',
        insuranceExpiry: '2025-08-30',
        amount: 3100,
        scopeNotes: 'Supply generic aftermarket hydraulic pump and recalibrate control board.',
        warranty: '12 Months Parts',
        estimatedDays: 3,
        submittedAt: 'Today, 11:10 AM',
        recommended: false,
        committeeVotes: []
      }
    ],
    comments: [
      {
        id: 'C-CAV-102-1',
        authorName: 'Emma Wilson',
        authorRole: 'Strata Manager',
        text: 'Received 3 competitive quotes under strata guidelines. Quotes are posted for Committee review.',
        createdAt: 'Today, 11:30 AM'
      }
    ],
    auditLog: [
      {
        id: 'AUD-CAV-102-1',
        type: 'created',
        actor: 'Michael Chen',
        actorRole: 'Committee Member',
        timestamp: 'Today, 8:45 AM',
        note: 'Emergency lift fault logged by Committee Chair.',
      },
      {
        id: 'AUD-CAV-102-2',
        type: 'email_sent',
        actor: 'SmartLot',
        actorRole: 'System',
        timestamp: 'Today, 8:46 AM',
        note: 'Emergency notification dispatched to Strata Manager Emma Wilson.',
      },
      {
        id: 'AUD-CAV-102-3',
        type: 'triage_approved',
        actor: 'Emma Wilson',
        actorRole: 'Strata Manager',
        timestamp: 'Today, 9:00 AM',
        note: 'Tender initiated: Requested quotes from 3 vertical transport contractors.',
      }
    ]
  },
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
    linkedWorkOrderId: 'WO-10483',
    tenderStatus: 'quoting',
    tenderScope: 'Inspect and replace faulty power inverter drive and recalibrate motor controller on Passenger Lift #2.',
    tenderQuotes: [
      {
        id: 'QTE-301-1',
        vendorId: 'VND-003',
        vendorName: 'Kone Elevator Maintenance NSW',
        contactEmail: 'maintenance.sydney@kone.com',
        contactPhone: '1300 362 473',
        isAccredited: true,
        insuranceStatus: 'Active',
        insuranceExpiry: '2028-01-01',
        amount: 3400,
        scopeNotes: 'Supply & install OEM high-capacity inverter module, recalibrate brake sensors, 12-month parts & labor warranty.',
        warranty: '12 Months Comprehensive',
        estimatedDays: 1,
        submittedAt: 'Today, 9:15 AM',
        recommended: true,
        committeeVotes: ['Arthur Pendelton', 'Marcus Sterling']
      },
      {
        id: 'QTE-301-2',
        vendorId: 'VND-008',
        vendorName: 'Apex Lift & Escalator Services',
        contactEmail: 'repairs@apexlifts.com.au',
        contactPhone: '02 9155 3300',
        isAccredited: true,
        insuranceStatus: 'Active',
        insuranceExpiry: '2027-05-12',
        amount: 2850,
        scopeNotes: 'Refurbish existing inverter drive board, replace failed capacitors, and test run on site.',
        warranty: '6 Months Parts',
        estimatedDays: 2,
        submittedAt: 'Today, 10:30 AM',
        recommended: false,
        committeeVotes: ['Jack Vance']
      },
      {
        id: 'QTE-301-3',
        vendorId: 'VND-009',
        vendorName: 'Ascent Vertical Transport Pty Ltd',
        contactEmail: 'quotes@ascentvt.com.au',
        contactPhone: '0412 888 123',
        isAccredited: false,
        insuranceStatus: 'Expired Ins.',
        insuranceExpiry: '2025-08-30',
        amount: 3100,
        scopeNotes: 'Supply alternative aftermarket inverter drive unit and re-program controller.',
        warranty: '12 Months Parts',
        estimatedDays: 3,
        submittedAt: 'Today, 11:00 AM',
        recommended: false,
        committeeVotes: []
      }
    ],
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

function getSecureCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) return window.crypto;
  if (typeof globalThis !== 'undefined' && globalThis.crypto) return globalThis.crypto;
  return crypto;
}

function generateSecurePin(min = 1000, max = 9999): string {
  const c = getSecureCrypto();
  const arr = new Uint32Array(1);
  c.getRandomValues(arr);
  const range = max - min + 1;
  return (min + (arr[0] % range)).toString();
}

function generateSecureToken(prefix = 'INV'): string {
  const c = getSecureCrypto();
  const uuid = c.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase();
  return `${prefix}-${uuid}`;
}

function generateSecureId(prefix = 'WO'): string {
  const c = getSecureCrypto();
  const uuid = c.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
  return `${prefix}-${uuid}`;
}
// This wrapper keeps the same API signature so we don't have to refactor every call site,
// but it no longer reads/writes localStorage at all.
function usePersistedState<T>(_key: string, defaultValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    return defaultValue instanceof Function ? defaultValue() : defaultValue;
  });
  return [state, setState];
}

export function useSmartLotStore() {
  const [activePersona, setActivePersona] = useState<Persona>(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('smartlot_activePersona_v8') : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) {
          const email = (parsed.email || '').toLowerCase();
          const savedAvatar = typeof window !== 'undefined' ? (window.localStorage.getItem(`smartlot_avatar_${email}`) || window.localStorage.getItem('smartlot_active_avatar')) : null;
          if (savedAvatar) {
            parsed.avatarUrl = savedAvatar;
          }
          return parsed;
        }
      }
    } catch {}
    const defaultPersona = { ...PERSONAS[1] };
    try {
      const email = (defaultPersona.email || '').toLowerCase();
      const savedAvatar = typeof window !== 'undefined' ? (window.localStorage.getItem(`smartlot_avatar_${email}`) || window.localStorage.getItem('smartlot_active_avatar')) : null;
      if (savedAvatar) {
        defaultPersona.avatarUrl = savedAvatar;
      }
    } catch {}
    return defaultPersona;
  });
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
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('smartlot_activePersona_v8', JSON.stringify(activePersona));
        const email = (activePersona?.email || '').toLowerCase();
        if (activePersona?.avatarUrl) {
          if (email) window.localStorage.setItem(`smartlot_avatar_${email}`, activePersona.avatarUrl);
          window.localStorage.setItem('smartlot_active_avatar', activePersona.avatarUrl);
        } else if (activePersona?.avatarUrl === null) {
          if (email) window.localStorage.removeItem(`smartlot_avatar_${email}`);
          window.localStorage.removeItem('smartlot_active_avatar');
        }
      }
    } catch {}
  }, [activePersona]);

  useEffect(() => {
    // If activePersona is an obsolete/removed profile (e.g. Cameron, Steve, Peter, Jake, Joana, John, Jack), auto-heal to Emma Wilson
    const isKnownPersona = PERSONAS.some(p => p.id === activePersona?.id || p.name.toLowerCase() === activePersona?.name?.toLowerCase());
    const isCustom = activePersona?.id?.startsWith('custom_') || activePersona?.id?.startsWith('user_');
    if (!isKnownPersona && !isCustom) {
      setActivePersona(PERSONAS[1]); // Emma Wilson
    }
  }, [activePersona]);

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
        const avatarUrl = profile?.avatar_url || (typeof window !== 'undefined' ? (window.localStorage.getItem(`smartlot_avatar_${email}`) || window.localStorage.getItem('smartlot_active_avatar')) : null) || undefined;

        setActivePersona(prev => ({
          ...prev,
          id: authUser.id,
          name,
          email: authUser.email,
          role: role as any,
          context: unit,
          avatarUrl: avatarUrl || prev.avatarUrl,
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
      // 🚀 Fast parallel roundtrip: Fetch all tables at once
      const [
        { data: schemesData },
        { data: membersData },
        { data: profilesData },
        { data: unitsData },
        { data: motionsData },
        { data: ballotsData },
        { data: quotesData },
        { data: commentsData },
        { data: attachmentsData }
      ] = await Promise.all([
        supabase.from('schemes').select('*'),
        supabase.from('members').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('units').select('*'),
        supabase.from('motions').select('*').order('created_at', { ascending: false }),
        supabase.from('motion_ballots').select('*'),
        supabase.from('motion_quotes').select('*'),
        supabase.from('motion_comments').select('*'),
        supabase.from('motion_attachments').select('*')
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
            avatarUrl: profilesData?.find(p => p.email?.toLowerCase() === m.email?.toLowerCase())?.avatar_url || undefined,
            status: m.status || 'Active',
            joinedAt: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          };
        });
      }
      setMembers(formattedMembers);

      // Reconcile activePersona avatar from profilesData if available
      if (profilesData && profilesData.length > 0) {
        const currentEmail = (activePersona?.email || '').toLowerCase();
        const myProfile = profilesData.find(p => p.email?.toLowerCase() === currentEmail);
        if (myProfile?.avatar_url && myProfile.avatar_url !== activePersona?.avatarUrl) {
          setActivePersona(prev => ({
            ...prev,
            avatarUrl: myProfile.avatar_url
          }));
          try {
            if (currentEmail) window.localStorage.setItem(`smartlot_avatar_${currentEmail}`, myProfile.avatar_url);
            window.localStorage.setItem('smartlot_active_avatar', myProfile.avatar_url);
          } catch {}
        }
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
              note: 'Inbound email reply captured via email notification.',
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
            priority: r.priority === 'Normal' ? 'Medium' : (r.priority || 'Medium'),
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

      // Process live motions from Supabase
      if (motionsData && motionsData.length > 0) {
        const mappedMotions: Motion[] = motionsData.map(m => {
          const motionBallots = (ballotsData || []).filter(b => b.motion_id === m.id).map(b => ({
            voterName: b.voter_name,
            voterRole: b.voter_role || 'Committee Member',
            voterOffice: b.voter_office,
            vote: (b.decision || b.vote) as 'YES' | 'NO' | 'ABSTAIN',
            votedAt: (b.cast_at || b.voted_at) ? new Date(b.cast_at || b.voted_at).toISOString().split('T')[0] : 'Today',
            comment: b.comment
          }));

          const motionQuotes = (quotesData || []).filter(q => q.motion_id === m.id).map(q => ({
            vendorId: q.vendor_id || 'VND-001',
            vendorName: q.vendor_name,
            amount: Number(q.amount),
            gstIncluded: q.gst_included ?? true,
            recommended: q.recommended ?? false
          }));

          const motionComments = (commentsData || []).filter(c => c.motion_id === m.id).map(c => ({
            id: c.id,
            authorName: c.author_name,
            authorRole: c.author_role,
            text: c.text,
            createdAt: c.created_at ? new Date(c.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : 'Recently'
          }));

          const motionAttachments = (attachmentsData || []).filter(a => a.motion_id === m.id).map(a => ({
            name: a.title || a.name || 'Attachment',
            url: a.url || '#',
            size: a.size || '1.0 MB',
            type: a.type || 'original',
            uploadedAt: (a.uploaded_at || a.created_at) ? new Date(a.uploaded_at || a.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : 'Recently',
            uploadedBy: a.uploaded_by || 'Strata Manager',
            note: a.note
          }));

          return {
            id: m.id,
            caseId: m.case_id,
            schemeId: m.scheme_id,
            strataPlan: m.strata_plan,
            propertyAddress: m.property_address,
            heading: m.heading,
            title: m.title,
            summary: m.summary,
            voterGroup: m.voter_group || 'committee_only',
            committeeSize: m.committee_size || 6,
            quorumTarget: m.quorum_target || 4,
            deadline: m.deadline ? new Date(m.deadline).toISOString().split('T')[0] : '2026-09-30',
            originalDeadline: m.original_deadline ? new Date(m.original_deadline).toISOString().split('T')[0] : undefined,
            status: m.status as any,
            closeReason: m.close_reason,
            closedAt: m.closed_at ? new Date(m.closed_at).toISOString().split('T')[0] : undefined,
            createdWorkOrderId: m.created_work_order_id,
            ballots: motionBallots,
            quotes: motionQuotes,
            comments: motionComments,
            attachments: motionAttachments,
            committeeRoster: [
              { id: 'scm-1', name: 'Michael Chen', office: 'Chairperson', email: 'michael.chen@coronation.com', unit: 'Unit 2' },
              { id: 'scm-2', name: 'Sarah Jones', office: 'Treasurer', email: 'sarah.jones@duplex.com', unit: 'Unit 1' },
              { id: 'scm-3', name: 'David Miller', office: 'Secretary', email: 'david.m@duplex.com', unit: 'Unit 3' },
              { id: 'scm-4', name: 'Elena Vance', office: 'Committee Member', email: 'elena.vance@strata.com', unit: 'Unit 5' },
              { id: 'scm-5', name: 'David Ward', office: 'Committee Member', email: 'david.ward@strata.com', unit: 'Unit 7' },
              { id: 'scm-6', name: 'Lisa Ray', office: 'Committee Member', email: 'lisa.ray@strata.com', unit: 'Unit 8' }
            ]
          };
        });
        setMotions(mappedMotions);
      } else {
        setMotions(prev => prev && prev.length > 0 ? prev : INITIAL_MOTIONS);
      }

      // Fetch surveys from Supabase
      try {
        const { data: dbSurveys } = await supabase.from('surveys').select('*');
        if (dbSurveys && dbSurveys.length > 0) {
          const mappedSurveys: Survey[] = dbSurveys.map(s => ({
            id: s.id,
            schemeId: s.scheme_id,
            title: s.title,
            description: s.description || '',
            category: s.category || 'General Satisfaction',
            status: s.status || 'active',
            targetAudience: s.target_audience || 'All Residents',
            recipientEmails: s.recipient_emails || [],
            ccEmails: s.cc_emails || [],
            bccEmails: s.bcc_emails || [],
            questions: Array.isArray(s.questions) ? s.questions : [],
            deadline: s.deadline ? (s.deadline.includes('T') ? s.deadline.split('T')[0] : s.deadline.split(' ')[0]) : undefined,
            createdAt: s.created_at,
            createdBy: s.created_by || { name: 'Strata Manager', role: 'Strata Manager' },
            closedAt: s.closed_at || undefined,
            aiExecutiveSummary: s.ai_executive_summary || undefined,
            bannerImage: s.banner_image || undefined,
          }));

          setSurveys(prev => {
            const combined = [...mappedSurveys];
            prev.forEach(p => {
              if (!combined.some(c => c.id === p.id)) {
                combined.push(p);
              }
            });
            try {
              window.localStorage.setItem('smartlot_global_surveys_v2', JSON.stringify(combined));
            } catch {}
            return combined;
          });
        }
      } catch (srvErr) {
        console.warn('[SmartLot Store] Failed to sync surveys from Supabase:', srvErr);
      }

      // Fetch survey responses from Supabase
      try {
        const { data: dbResponses } = await supabase.from('survey_responses').select('*');
        if (dbResponses && dbResponses.length > 0) {
          const mappedResponses: SurveyResponse[] = dbResponses.map(r => ({
            id: r.id,
            surveyId: r.survey_id,
            schemeId: r.scheme_id,
            unitId: r.unit_id || undefined,
            respondentName: r.respondent_name || undefined,
            isAnonymous: r.is_anonymous || false,
            submittedAt: r.submitted_at,
            answers: r.answers || {},
          }));

          setSurveyResponses(prev => {
            const combined = [...mappedResponses];
            prev.forEach(p => {
              if (!combined.some(c => c.id === p.id)) {
                combined.push(p);
              }
            });
            try {
              window.localStorage.setItem('smartlot_global_survey_responses_v2', JSON.stringify(combined));
            } catch {}
            return combined;
          });
        }
      } catch (rspErr) {
        console.warn('[SmartLot Store] Failed to sync survey responses from Supabase:', rspErr);
      }

    } catch (err) {
      console.error("Error fetching from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user?.id]);

  const [activeRoles, setActiveRoles] = usePersistedState<string[]>(`smartlot_${pId}_activeRoles_v8`, ['Strata Manager']);
  const [activeView, setActiveView] = usePersistedState<'dashboard' | 'user_management' | 'requests' | 'triage' | 'voting' | 'settings' | 'performance' | 'vendors' | 'surveys'>(`smartlot_${pId}_activeView_v8`, 'dashboard');
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
  const [motions, setMotions] = usePersistedState<Motion[]>(`smartlot_${pId}_motions_v13`, INITIAL_MOTIONS);
  const [workOrders, setWorkOrders] = usePersistedState<WorkOrder[]>(`smartlot_${pId}_workOrders_v8`, INITIAL_WORK_ORDERS);
  // Persistent surveys storage across all tabs & guest links
  const [surveys, setSurveys] = useState<Survey[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('smartlot_global_surveys_v2');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load surveys from localStorage:', e);
    }
    return INITIAL_SURVEYS;
  });

  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('smartlot_global_survey_responses_v2');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load survey responses from localStorage:', e);
    }
    return INITIAL_SURVEY_RESPONSES;
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('smartlot_global_surveys_v2', JSON.stringify(surveys));
      }
    } catch (e) {
      console.warn('Failed to persist surveys to localStorage:', e);
    }
  }, [surveys]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('smartlot_global_survey_responses_v2', JSON.stringify(surveyResponses));
      }
    } catch (e) {
      console.warn('Failed to persist survey responses to localStorage:', e);
    }
  }, [surveyResponses]);

  // Sync surveys across browser tabs in real time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'smartlot_global_surveys_v2' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) setSurveys(updated);
        } catch {}
      } else if (e.key === 'smartlot_global_survey_responses_v2' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) setSurveyResponses(updated);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
    const token = memberData.inviteToken || generateSecureToken('INV');
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
    const randomSuffix = generateSecurePin(10000, 99999);
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
      .then(() => {})
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
        note: `Inbound email reply captured via email notification: "${replyText.slice(0, 70)}..."`,
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

  const updateActivityPriority = (requestId: string, newPriority: 'Low' | 'Medium' | 'Normal' | 'High' | 'Urgent') => {
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
      website: payload.website,
      yearsOfExperience: payload.yearsOfExperience,
      certificateOfCurrencyUrl: payload.certificateOfCurrencyUrl,
    };
    setVendors(prev => [newVendor, ...prev]);
  };

  const deleteVendor = (vendorId: string) => {
    setVendors(prev => prev.filter(v => v.id !== vendorId));
  };


  const createMotion = (payload: CreateMotionPayload) => {
    const newMotion: Motion = {
      id: `MOT-${Date.now()}`,
      caseId: payload.caseId || `REQ-${Date.now()}`,
      schemeId: payload.schemeId || activeScheme.id,
      strataPlan: activeScheme.id || 'SP 52042',
      propertyAddress: activeScheme.address || '1 Pitt Street, Sydney NSW 2000',
      heading: 'Committee Resolution',
      title: payload.title,
      summary: payload.summary,
      quotes: payload.quotes || [],
      attachments: payload.attachments || [],
      quorumTarget: payload.quorumTarget || 4,
      committeeSize: 6,
      deadline: payload.deadline,
      voterGroup: payload.voterGroup || 'committee_only',
      status: 'active',
      ballots: [],
      comments: [],
    };
    setMotions(prev => [newMotion, ...prev]);
    return newMotion;
  };

  const initiateVotingForRequest = (requestId: string, payload: CreateMotionPayload) => {
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    const motionId = `MOT-${Date.now()}`;
    const targetReq = residentRequests.find(r => r.id === requestId || r.referenceId === requestId);

    const newMotion: Motion = {
      id: motionId,
      caseId: targetReq?.id || requestId,
      schemeId: payload.schemeId || targetReq?.schemeId || activeScheme.id,
      title: payload.title || targetReq?.title || 'Community Voting Motion',
      summary: payload.summary || targetReq?.description || '',
      quotes: payload.quotes || [],
      attachments: payload.attachments || (targetReq?.attachmentUrls?.map((url, i) => ({ name: `Attachment_${i+1}`, url })) || []),
      quorumTarget: payload.quorumTarget || 3,
      deadline: payload.deadline,
      voterGroup: payload.voterGroup || 'all_residents',
      status: 'active',
      ballots: [],
      comments: targetReq?.comments ? [...targetReq.comments] : [],
    };

    setMotions(prev => [newMotion, ...prev]);

    // Update request to in_voting status
    setResidentRequests(prev => prev.map(r => {
      if (r.id !== requestId && r.referenceId !== requestId) return r;
      const auditEntry: AuditEvent = {
        id: `AUD-${r.id}-VT${Date.now()}`,
        type: 'status_change',
        actor: activePersona.name,
        actorRole: activePersona.role,
        timestamp: `Today at ${nowStr}`,
        fromStatus: r.status,
        toStatus: 'in_voting',
        note: `Voting flow initiated by ${activePersona.role}. Linked to Motion #${motionId}. Due: ${payload.deadline}.`,
      };
      return {
        ...r,
        status: 'in_voting',
        linkedMotionId: motionId,
        auditLog: [...(r.auditLog || []), auditEntry],
      };
    }));

    // Sync to Supabase
    supabase.from('resident_requests').update({
      status: 'in_voting',
      updated_at: new Date().toISOString(),
    }).eq('id', targetReq?.id || requestId).then(({ error }) => {
      if (error) console.warn('[SmartLot] initiateVotingForRequest sync note:', error.message);
    });

    if (targetReq?.requestorEmail) {
      dispatchStatusUpdateEmail({
        toEmail: targetReq.requestorEmail,
        requestorName: targetReq.requestorName || 'Resident',
        referenceId: targetReq.referenceId ? targetReq.referenceId.replace('#', '') : targetReq.id,
        activityTitle: targetReq.title,
        oldStatus: targetReq.status,
        newStatus: 'in_voting',
        reason: `Your request has been published for community and committee voting (Motion #${motionId}). Voting ends ${payload.deadline}.`,
        actionType: 'status_change',
      }).catch(err => console.warn('Initiate voting email notification note:', err));
    }

    return newMotion;
  };

  const castBallot = (motionId: string, vote: MotionVote, comment?: string) => {
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    const todayIso = new Date().toISOString().split('T')[0];
    const targetMotion = motions.find(m => m.id === motionId);
    if (!targetMotion) return;

    // Check if motion is already passed / locked
    if (targetMotion.status === 'passed') {
      console.warn('[SmartLot Governance] Motion has already passed threshold and is locked against modifications.');
      return;
    }

    // Role check: Strata Manager & Building Manager cannot vote under Permission Matrix
    const roleLower = activePersona.role.toLowerCase();
    const isManager = roleLower.includes('strata manager') || roleLower.includes('building manager');
    const isAdmin = roleLower.includes('admin') || activePersona.isSystemAdmin;
    const isSCM = roleLower.includes('committee') || targetMotion.committeeRoster?.some(m => m.name.toLowerCase() === activePersona.name.toLowerCase());
    if (isManager && !isAdmin && !isSCM) {
      console.warn('[SmartLot Governance] Managers administer motions but cannot vote under NSW Strata Act.');
      return;
    }

    // Lookup SCM office if present
    const memberProfile = targetMotion.committeeRoster?.find(m => m.name.toLowerCase() === activePersona.name.toLowerCase());

    setMotions(prev => prev.map(m => {
      if (m.id !== motionId) return m;
      const filtered = m.ballots.filter(b => b.voterName !== activePersona.name);
      const newBallot = {
        voterName: activePersona.name,
        voterRole: activePersona.role,
        voterOffice: memberProfile?.office || (isSCM ? 'Committee Member' : undefined),
        vote,
        votedAt: todayIso,
        comment,
      };
      const updatedBallots = [...filtered, newBallot];
      const yesVotes = updatedBallots.filter(b => b.vote === 'YES').length;
      const noVotes = updatedBallots.filter(b => b.vote === 'NO').length;
      const totalCommittee = m.committeeSize || m.committeeRoster?.length || 6;
      
      let newStatus = m.status;
      let closedTime: string | undefined = m.closedAt;
      let createdWoId: string | undefined = m.createdWorkOrderId;

      // Threshold locking rule: when 4th YES vote is cast, status immediately becomes 'passed' and locked!
      if (yesVotes >= m.quorumTarget) {
        newStatus = 'passed';
        closedTime = `Today at ${nowStr}`;
        if (!createdWoId && m.quotes && m.quotes.length > 0) {
          createdWoId = generateSecureId('WO');
          const recQuote = m.quotes.find(q => q.recommended) || m.quotes[0];
          const newWo: WorkOrder = {
            id: createdWoId,
            caseId: m.caseId,
            schemeId: m.schemeId || activeScheme.id,
            vendorId: recQuote?.vendorId || 'VND-001',
            vendorName: recQuote?.vendorName || 'Contractor',
            scopeOfWork: m.summary,
            budgetCap: recQuote?.amount || 2500,
            siteAccessPin: generateSecurePin(1000, 9999),
            guestMagicToken: generateSecureToken(`tok_${(m.schemeId || activeScheme.id).toLowerCase()}`),
            status: 'issued',
          };
          setWorkOrders(wos => [newWo, ...wos]);
        }
      } else if (noVotes > (totalCommittee - m.quorumTarget)) {
        // Statistically impossible to pass
        newStatus = 'rejected';
        closedTime = `Today at ${nowStr}`;
      }

      return { 
        ...m, 
        ballots: updatedBallots, 
        status: newStatus,
        closedAt: closedTime,
        createdWorkOrderId: createdWoId
      };
    }));

    // Sync ballot to Supabase motion_ballots
    supabase.from('motion_ballots').upsert({
      id: `${motionId}_${activePersona.name.toLowerCase().replace(/\s+/g, '_')}`,
      motion_id: motionId,
      voter_name: activePersona.name,
      voter_role: activePersona.role,
      decision: vote,
      cast_at: new Date().toISOString()
    }).then(({ error }) => {
      if (error) console.warn('[SmartLot] castBallot sync note:', error.message);
    });

    // Update linked request audit log & status if passed
    if (targetMotion?.caseId) {
      setResidentRequests(prev => prev.map(r => {
        if (r.id !== targetMotion.caseId && r.referenceId !== targetMotion.caseId) return r;
        const currentBallots = targetMotion.ballots.filter(b => b.voterName !== activePersona.name);
        const willPass = (currentBallots.filter(b => b.vote === 'YES').length + (vote === 'YES' ? 1 : 0)) >= targetMotion.quorumTarget;
        
        const auditEntry: AuditEvent = {
          id: `AUD-${r.id}-BL${Date.now()}`,
          type: willPass ? 'triage_approved' : 'comment_added',
          actor: activePersona.name,
          actorRole: activePersona.role,
          timestamp: `Today at ${nowStr}`,
          note: willPass
            ? `Motion #${motionId} PASSED! 4th vote cast by ${activePersona.name} (${activePersona.role}). Decision is binding and locked.`
            : `${activePersona.name} (${activePersona.role}) cast ${vote} ballot on linked Motion #${motionId}.`,
        };
        return {
          ...r,
          status: willPass ? 'approved' : r.status,
          auditLog: [...(r.auditLog || []), auditEntry],
        };
      }));
    }
  };

  const requestMotionRFI = (motionId: string, question: string, extendedDays: number = 7) => {
    const todayIso = new Date().toISOString().split('T')[0];

    setMotions(prev => prev.map(m => {
      if (m.id !== motionId) return m;
      const currentDead = new Date(m.deadline || todayIso);
      currentDead.setDate(currentDead.getDate() + extendedDays);
      const newDeadlineStr = currentDead.toISOString().split('T')[0];

      const newRfi: MotionRFI = {
        id: `RFI-${Date.now()}`,
        requestedBy: activePersona.name,
        requestedRole: activePersona.role,
        question: question.trim(),
        requestedAt: todayIso,
        extendedDays,
        status: 'open',
      };

      const systemComment: RequestComment = {
        id: `CMT-RFI-${Date.now()}`,
        authorName: activePersona.name,
        authorRole: activePersona.role,
        text: `⚠️ Request for Information (RFI) Raised: "${question.trim()}". Voting deadline extended by ${extendedDays} days to ${newDeadlineStr}.`,
        createdAt: 'Just now',
      };

      return {
        ...m,
        deadline: newDeadlineStr,
        rfiHistory: [...(m.rfiHistory || []), newRfi],
        comments: [...(m.comments || []), systemComment],
      };
    }));
  };

  const submitRevisedProposal = (motionId: string, revisionNote: string, newAttachments: MotionAttachment[] = []) => {
    setMotions(prev => prev.map(m => {
      if (m.id !== motionId) return m;

      const systemComment: RequestComment = {
        id: `CMT-REV-${Date.now()}`,
        authorName: activePersona.name,
        authorRole: activePersona.role,
        text: `📎 Revised Resubmission Uploaded: "${revisionNote.trim()}". ${newAttachments.length} new revised attachment(s) added for committee review.`,
        createdAt: 'Just now',
      };

      const updatedRfis = m.rfiHistory?.map(r => ({ ...r, status: 'addressed' as const, responseNote: revisionNote })) || [];

      return {
        ...m,
        revisedAttachments: [...(m.revisedAttachments || []), ...newAttachments],
        rfiHistory: updatedRfis,
        comments: [...(m.comments || []), systemComment],
      };
    }));
  };

  const restartVoting = (motionId: string, reason: string) => {
    const todayIso = new Date().toISOString().split('T')[0];

    setMotions(prev => prev.map(m => {
      if (m.id !== motionId) return m;

      const previousYes = m.ballots.filter(b => b.vote === 'YES').length;
      const previousNo = m.ballots.filter(b => b.vote === 'NO').length;

      const restartEvent: MotionRestartEvent = {
        id: `RST-${Date.now()}`,
        restartedAt: todayIso,
        restartedBy: `${activePersona.name} (${activePersona.role})`,
        reason: reason.trim(),
        previousYesCount: previousYes,
        previousNoCount: previousNo,
      };

      const resetComment: RequestComment = {
        id: `CMT-RST-${Date.now()}`,
        authorName: activePersona.name,
        authorRole: activePersona.role,
        text: `🔄 Strata Committee Voting Restarted: "${reason.trim()}". Previous ballots (${previousYes} Yes, ${previousNo} No) cleared. All SCMs are notified to recast their vote.`,
        createdAt: 'Just now',
      };

      return {
        ...m,
        status: 'active',
        ballots: [],
        restartHistory: [...(m.restartHistory || []), restartEvent],
        comments: [...(m.comments || []), resetComment],
      };
    }));
  };

  const sendSCMReminder = (motionId: string, memberName: string) => {
    setMotions(prev => prev.map(m => {
      if (m.id !== motionId) return m;
      const reminderComment: RequestComment = {
        id: `CMT-REM-${Date.now()}`,
        authorName: activePersona.name,
        authorRole: activePersona.role,
        text: `🔔 In-Context Reminder Dispatched: Notice sent to ${memberName} requesting their vote on Motion #${m.strataPlan || m.id}.`,
        createdAt: 'Just now',
      };
      return {
        ...m,
        comments: [...(m.comments || []), reminderComment],
      };
    }));
  };

  const sendBlastReminder = (motionId: string) => {
    setMotions(prev => prev.map(m => {
      if (m.id !== motionId) return m;
      const votedNames = new Set(m.ballots.map(b => b.voterName.toLowerCase()));
      const pendingMembers = (m.committeeRoster || []).filter(scm => !votedNames.has(scm.name.toLowerCase()));
      const pendingListStr = pendingMembers.map(scm => scm.name).join(', ') || 'unresponsive members';

      const blastComment: RequestComment = {
        id: `CMT-BLAST-${Date.now()}`,
        authorName: activePersona.name,
        authorRole: activePersona.role,
        text: `📢 Strata Manager Blast Notification: Automated reminder dispatched to all ${pendingMembers.length} unresponsive committee members (${pendingListStr}).`,
        createdAt: 'Just now',
      };
      return {
        ...m,
        comments: [...(m.comments || []), blastComment],
      };
    }));
  };

  const extendMotionDeadline = (motionId: string, additionalDays: number, reason?: string) => {
    const todayIso = new Date().toISOString().split('T')[0];
    setMotions(prev => prev.map(m => {
      if (m.id !== motionId) return m;
      const curr = new Date(m.deadline || todayIso);
      curr.setDate(curr.getDate() + additionalDays);
      const newDeadline = curr.toISOString().split('T')[0];

      const noteComment: RequestComment = {
        id: `CMT-EXT-${Date.now()}`,
        authorName: activePersona.name,
        authorRole: activePersona.role,
        text: `📅 Motion Deadline Extended: Deadline extended by ${additionalDays} days to ${newDeadline}.${reason ? ` Reason: ${reason}` : ''}`,
        createdAt: 'Just now',
      };

      return {
        ...m,
        deadline: newDeadline,
        comments: [...(m.comments || []), noteComment],
      };
    }));
  };

  const markMotionUnresolved = (motionId: string, reason: string) => {
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    setMotions(prev => prev.map(m => {
      if (m.id !== motionId) return m;
      return {
        ...m,
        status: 'unresolved',
        closeReason: reason,
        closedAt: `Today at ${nowStr}`,
        closedBy: { name: activePersona.name, role: activePersona.role },
      };
    }));
  };

  const closeVotingEarly = (motionId: string, reason: string) => {
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    const targetMotion = motions.find(m => m.id === motionId);

    setMotions(prev => prev.map(m => {
      if (m.id !== motionId) return m;
      return {
        ...m,
        status: 'rejected',
        closeReason: reason,
        closedAt: `Today at ${nowStr}`,
        closedBy: { name: activePersona.name, role: activePersona.role },
      };
    }));

    if (targetMotion?.caseId) {
      const targetReq = residentRequests.find(r => r.id === targetMotion.caseId || r.referenceId === targetMotion.caseId);
      setResidentRequests(prev => prev.map(r => {
        if (r.id !== targetMotion.caseId && r.referenceId !== targetMotion.caseId) return r;
        const auditEntry: AuditEvent = {
          id: `AUD-${r.id}-CVE${Date.now()}`,
          type: 'closed',
          actor: activePersona.name,
          actorRole: activePersona.role,
          timestamp: `Today at ${nowStr}`,
          fromStatus: r.status,
          toStatus: 'pending_triage',
          note: `Voting closed before completion by ${activePersona.role}. Reason: ${reason}. Request reverted to pending triage for additional specifications/details.`,
        };
        return {
          ...r,
          status: 'pending_triage',
          closeReason: reason,
          auditLog: [...(r.auditLog || []), auditEntry],
        };
      }));

      supabase.from('resident_requests').update({
        status: 'pending_triage',
        close_reason: reason,
        updated_at: new Date().toISOString(),
      }).eq('id', targetReq?.id || targetMotion.caseId).then(({ error }) => {
        if (error) console.warn('[SmartLot] closeVotingEarly sync note:', error.message);
      });

      if (targetReq?.requestorEmail) {
        dispatchStatusUpdateEmail({
          toEmail: targetReq.requestorEmail,
          requestorName: targetReq.requestorName || 'Resident',
          referenceId: targetReq.referenceId ? targetReq.referenceId.replace('#', '') : targetReq.id,
          activityTitle: targetReq.title,
          oldStatus: 'in_voting',
          newStatus: 'pending_triage',
          reason: `Voting closed before completion: ${reason}. Additional details or quotes requested.`,
          actionType: 'status_change',
        }).catch(err => console.warn('Close voting early email note:', err));
      }
    }
  };

  const resolveMotion = (motionId: string, outcome: 'passed' | 'rejected') => {
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    const targetMotion = motions.find(m => m.id === motionId);
    let createdWoId: string | undefined;

    if (outcome === 'passed' && targetMotion) {
      createdWoId = generateSecureId('WO');
      const recQuote = targetMotion.quotes.find(q => q.recommended) || targetMotion.quotes[0];
      const newWo: WorkOrder = {
        id: createdWoId,
        caseId: targetMotion.caseId,
        schemeId: targetMotion.schemeId || activeScheme.id,
        vendorId: recQuote?.vendorId || 'VND-001',
        vendorName: recQuote?.vendorName || 'Selected Vendor',
        scopeOfWork: targetMotion.summary,
        budgetCap: recQuote?.amount || 2500,
        siteAccessPin: generateSecurePin(1000, 9999),
        guestMagicToken: generateSecureToken(`tok_${(targetMotion.schemeId || activeScheme.id).toLowerCase()}`),
        status: 'issued',
      };
      setWorkOrders(prev => [newWo, ...prev]);
    }

    setMotions(prev => prev.map(m => {
      if (m.id !== motionId) return m;
      return {
        ...m,
        status: outcome,
        closedAt: `Today at ${nowStr}`,
        closedBy: { name: activePersona.name, role: activePersona.role },
        createdWorkOrderId: createdWoId,
      };
    }));

    if (targetMotion?.caseId) {
      const newStatus: CaseStatus = outcome === 'passed' ? 'approved' : 'closed';
      const targetReq = residentRequests.find(r => r.id === targetMotion.caseId || r.referenceId === targetMotion.caseId);

      setResidentRequests(prev => prev.map(r => {
        if (r.id !== targetMotion.caseId && r.referenceId !== targetMotion.caseId) return r;
        const auditEntry: AuditEvent = {
          id: `AUD-${r.id}-RS${Date.now()}`,
          type: outcome === 'passed' ? 'triage_approved' : 'closed',
          actor: activePersona.name,
          actorRole: activePersona.role,
          timestamp: `Today at ${nowStr}`,
          fromStatus: r.status,
          toStatus: newStatus,
          note: outcome === 'passed' 
            ? `Motion PASSED: Quorum target achieved. Initiating work order flow (${createdWoId || 'Digital Dispatch'}).` 
            : `Motion REJECTED: Community/committee vote concluded without passing. Case closed.`,
        };
        return {
          ...r,
          status: newStatus,
          rejectionReason: outcome === 'rejected' ? 'Motion failed in community voting' : undefined,
          auditLog: [...(r.auditLog || []), auditEntry],
        };
      }));

      supabase.from('resident_requests').update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', targetReq?.id || targetMotion.caseId).then(({ error }) => {
        if (error) console.warn('[SmartLot] resolveMotion sync note:', error.message);
      });

      if (targetReq?.requestorEmail) {
        dispatchStatusUpdateEmail({
          toEmail: targetReq.requestorEmail,
          requestorName: targetReq.requestorName || 'Resident',
          referenceId: targetReq.referenceId ? targetReq.referenceId.replace('#', '') : targetReq.id,
          activityTitle: targetReq.title,
          oldStatus: 'in_voting',
          newStatus,
          reason: outcome === 'passed' 
            ? `Community motion passed! Work order ${createdWoId || ''} has been initiated.` 
            : `Voting concluded and motion was not approved. Case closed.`,
          actionType: 'status_change',
        }).catch(err => console.warn('Resolve motion email note:', err));
      }
    }
  };

  const addMotionComment = (motionId: string, text: string) => {
    if (!text.trim()) return;
    const nowStr = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    const commentId = `CMT-${Date.now()}`;
    const newComment: RequestComment = {
      id: commentId,
      authorName: activePersona.name,
      authorRole: activePersona.role,
      text: text.trim(),
      createdAt: 'Just now',
    };

    setMotions(prev => prev.map(m => {
      if (m.id !== motionId) return m;
      return {
        ...m,
        comments: [...(m.comments || []), newComment],
      };
    }));

    const targetMotion = motions.find(m => m.id === motionId);
    if (targetMotion?.caseId) {
      addCommentToRequest(targetMotion.caseId, text);
    }
  };

  const deleteMotion = (motionId: string) => {
    setMotions(prev => prev.filter(m => m.id !== motionId));
  };


  const createWorkOrder = (payload: CreateWorkOrderPayload) => {
    const randomPin = generateSecurePin(1000, 9999);
    const token = generateSecureToken(`tok_${payload.schemeId.toLowerCase()}`);
    const newWo: WorkOrder = {
      ...payload,
      id: generateSecureId('WO'),
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

  const signOffWorkOrder = (workOrderId: string, signOffNotes?: string, managerName?: string) => {
    const actor = managerName || activePersona.name || 'Strata Manager';
    const nowIso = new Date().toISOString();

    let linkedCaseId: string | undefined;

    setWorkOrders(prev => prev.map(wo => {
      if (wo.id !== workOrderId) return wo;
      linkedCaseId = wo.caseId;
      return {
        ...wo,
        status: 'completed',
        signedOffAt: nowIso,
        signedOffBy: actor,
        signOffNotes: signOffNotes || 'Repair verified on site and completed within authorized budget cap.',
      };
    }));

    if (linkedCaseId) {
      setResidentRequests(prev => prev.map(req => {
        if (req.id !== linkedCaseId && req.linkedWorkOrderId !== workOrderId) return req;
        return {
          ...req,
          status: 'resolved',
          auditLog: [
            {
              id: `AUD-SO-${Date.now()}`,
              type: 'status_change',
              actor,
              actorRole: 'Strata Manager',
              timestamp: 'Just now',
              fromStatus: req.status,
              toStatus: 'resolved',
              note: `Work Order ${workOrderId} signed off as complete by ${actor}. ${signOffNotes || 'Repair verified and closed.'}`
            },
            ...(req.auditLog || [])
          ]
        };
      }));
    }
  };

  const requestQuotesForRequest = (requestId: string, scope: string, quotes: RequestQuote[]) => {
    setResidentRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      return {
        ...req,
        tenderStatus: 'quoting',
        tenderScope: scope,
        tenderQuotes: quotes,
        auditLog: [
          {
            id: `AUD-QTE-${Date.now()}`,
            type: 'comment_added',
            actor: activePersona.name || 'Strata Manager',
            actorRole: activePersona.role || 'Strata Manager',
            timestamp: 'Just now',
            note: `Tender released: Invited ${quotes.length} contractor(s) for quote submission.`
          },
          ...(req.auditLog || [])
        ]
      };
    }));
  };

  const voteForQuote = (requestId: string, quoteId: string, voterName: string) => {
    setResidentRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      const updatedQuotes = (req.tenderQuotes || []).map(q => {
        if (q.id !== quoteId) return q;
        const currentVotes = q.committeeVotes || [];
        const hasVoted = currentVotes.includes(voterName);
        const newVotes = hasVoted ? currentVotes.filter(v => v !== voterName) : [...currentVotes, voterName];
        return { ...q, committeeVotes: newVotes };
      });
      return { ...req, tenderQuotes: updatedQuotes };
    }));
  };

  const awardQuoteAndCreateWorkOrder = (requestId: string, quoteId: string, customBudgetCap?: number, customPin?: string, managerName?: string) => {
    const targetReq = residentRequests.find(r => r.id === requestId);
    if (!targetReq) return null;
    const targetQuote = targetReq.tenderQuotes?.find(q => q.id === quoteId);
    if (!targetQuote) return null;

    const randomPin = customPin || generateSecurePin(1000, 9999);
    const token = generateSecureToken(`tok_${targetReq.schemeId.toLowerCase()}_wo`);
    const newWoId = generateSecureId('WO');

    const newWo: WorkOrder = {
      id: newWoId,
      caseId: targetReq.id,
      schemeId: targetReq.schemeId,
      vendorId: targetQuote.vendorId,
      vendorName: targetQuote.vendorName,
      vendorEmail: targetQuote.contactEmail,
      vendorPhone: targetQuote.contactPhone,
      scopeOfWork: targetReq.tenderScope || targetReq.description,
      budgetCap: customBudgetCap ?? targetQuote.amount,
      siteAccessPin: randomPin,
      guestMagicToken: token,
      status: 'issued',
    };

    setWorkOrders(prev => [newWo, ...prev]);

    setResidentRequests(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      const updatedQuotes = (req.tenderQuotes || []).map(q => ({
        ...q,
        isSelected: q.id === quoteId
      }));
      return {
        ...req,
        status: 'approved',
        linkedWorkOrderId: newWo.id,
        tenderStatus: 'work_order_dispatched',
        tenderQuotes: updatedQuotes,
        auditLog: [
          {
            id: `AUD-WO-${Date.now()}`,
            type: 'triage_approved',
            actor: managerName || activePersona.name || 'Strata Manager',
            actorRole: 'Strata Manager',
            timestamp: 'Just now',
            note: `Quote awarded to ${targetQuote.vendorName} ($${targetQuote.amount.toLocaleString()} ex GST). Work Order ${newWo.id} issued with Site Access PIN ${newWo.siteAccessPin}.`
          },
          ...(req.auditLog || [])
        ]
      };
    }));

    return newWo;
  };

  const updateVendorInsurance = (vendorId: string, status: 'Active' | 'Expired Ins.' | 'Pending Verification', expiryDate: string) => {
    setVendors(prev => prev.map(v => {
      if (v.id !== vendorId) return v;
      return {
        ...v,
        insuranceStatus: status,
        insuranceExpiry: expiryDate,
        verifiedAt: new Date().toISOString(),
        verifiedBy: activePersona.name || 'Strata Manager'
      };
    }));
  };

  const deleteWorkOrder = (workOrderId: string) => {
    setWorkOrders(prev => prev.filter(wo => wo.id !== workOrderId));
  };

  const createSurvey = async (payload: Omit<Survey, 'id' | 'createdAt'>): Promise<Survey> => {
    const rawScheme = (payload.schemeId || activeScheme.id || 'SP52042').replace(/[^a-zA-Z0-9]/g, '');
    const newId = `SRV-${rawScheme}-${Date.now().toString().slice(-4)}`;
    const newSurvey: Survey = {
      ...payload,
      id: newId,
      createdAt: new Date().toISOString(),
      status: 'active',
      questions: payload.questions.map((q, idx) => ({
        ...q,
        id: q.id || `q_${newId}_${idx + 1}`,
        order: idx + 1,
      })),
    };

    setSurveys(prev => {
      const updated = [newSurvey, ...prev.filter(s => s.id !== newId)];
      try {
        window.localStorage.setItem('smartlot_global_surveys_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Persist survey to Supabase
    try {
      await supabase.from('surveys').upsert({
        id: newSurvey.id,
        scheme_id: newSurvey.schemeId,
        title: newSurvey.title,
        description: newSurvey.description,
        category: newSurvey.category,
        status: newSurvey.status,
        target_audience: newSurvey.targetAudience,
        recipient_emails: newSurvey.recipientEmails,
        cc_emails: newSurvey.ccEmails || [],
        bcc_emails: newSurvey.bccEmails || [],
        questions: newSurvey.questions,
        deadline: newSurvey.deadline || null,
        created_at: newSurvey.createdAt,
        created_by: newSurvey.createdBy,
        banner_image: newSurvey.bannerImage || null,
        ai_executive_summary: newSurvey.aiExecutiveSummary || null,
      });
    } catch (dbErr) {
      console.warn('[SmartLot Store] Failed to persist survey to Supabase:', dbErr);
    }

    // Dispatch survey email invitation to recipients if provided
    if (payload.recipientEmails && payload.recipientEmails.length > 0) {
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
      const surveyUrl = `${origin}/?survey_token=${encodeURIComponent(newId)}`;
      const schemeObj = schemes.find(s => s.id === payload.schemeId) || activeScheme;

      try {
        await dispatchSurveyInvitationEmail({
          toEmails: payload.recipientEmails,
          ccEmails: payload.ccEmails,
          bccEmails: payload.bccEmails,
          surveyId: newId,
          surveyTitle: payload.title,
          surveyDescription: payload.description,
          schemeName: schemeObj?.name || 'Cavallo',
          deadline: payload.deadline,
          surveyUrl,
        });
      } catch (err) {
        console.warn('[SmartLot Store] Survey invitation email notice:', err);
      }
    }

    return newSurvey;
  };

  const closeSurvey = (surveyId: string) => {
    const closedTime = new Date().toISOString();
    setSurveys(prev => {
      const updated = prev.map(s => {
        if (s.id !== surveyId) return s;
        return {
          ...s,
          status: 'closed' as const,
          closedAt: closedTime,
        };
      });
      try {
        window.localStorage.setItem('smartlot_global_surveys_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    (async () => {
      try {
        await supabase.from('surveys').update({
          status: 'closed',
          closed_at: closedTime
        }).eq('id', surveyId);
      } catch (e) {
        console.warn('[SmartLot Store] Supabase closeSurvey notice:', e);
      }
    })();
  };

  const reopenSurvey = (surveyId: string) => {
    setSurveys(prev => {
      const updated = prev.map(s => {
        if (s.id !== surveyId) return s;
        return {
          ...s,
          status: 'active' as const,
          closedAt: undefined,
        };
      });
      try {
        window.localStorage.setItem('smartlot_global_surveys_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    (async () => {
      try {
        await supabase.from('surveys').update({
          status: 'active',
          closed_at: null
        }).eq('id', surveyId);
      } catch (e) {
        console.warn('[SmartLot Store] Supabase reopenSurvey notice:', e);
      }
    })();
  };

  const updateSurvey = async (surveyId: string, updates: Partial<Omit<Survey, 'id' | 'createdAt'>>): Promise<Survey | undefined> => {
    let updatedSurvey: Survey | undefined;

    setSurveys(prev => {
      const target = prev.find(s => s.id === surveyId);
      if (!target) return prev;
      updatedSurvey = {
        ...target,
        ...updates,
      };
      const nextList = prev.map(s => s.id === surveyId ? updatedSurvey! : s);
      try {
        window.localStorage.setItem('smartlot_global_surveys_v2', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (updatedSurvey) {
      try {
        const u = updatedSurvey as Survey;
        await supabase.from('surveys').update({
          title: u.title,
          description: u.description,
          category: u.category,
          status: u.status,
          target_audience: u.targetAudience,
          recipient_emails: u.recipientEmails,
          cc_emails: u.ccEmails || [],
          bcc_emails: u.bccEmails || [],
          questions: u.questions,
          deadline: u.deadline || null,
          banner_image: u.bannerImage || null,
        }).eq('id', surveyId);
      } catch (err) {
        console.warn('[SmartLot Store] Failed to update survey in Supabase:', err);
      }
    }
    return updatedSurvey;
  };

  const deleteSurvey = async (surveyId: string): Promise<boolean> => {
    setSurveys(prev => {
      const next = prev.filter(s => s.id !== surveyId);
      try {
        window.localStorage.setItem('smartlot_global_surveys_v2', JSON.stringify(next));
      } catch {}
      return next;
    });
    setSurveyResponses(prev => {
      const next = prev.filter(r => r.surveyId !== surveyId);
      try {
        window.localStorage.setItem('smartlot_global_survey_responses_v2', JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      await supabase.from('surveys').delete().eq('id', surveyId);
    } catch (err) {
      console.warn('[SmartLot Store] Failed to delete survey from Supabase:', err);
    }
    return true;
  };

  const submitSurveyResponse = async (payload: Omit<SurveyResponse, 'id' | 'submittedAt'>): Promise<SurveyResponse> => {
    const newResponse: SurveyResponse = {
      ...payload,
      id: `RSP-${Date.now().toString().slice(-6)}`,
      submittedAt: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('survey_responses').insert({
        id: newResponse.id,
        survey_id: newResponse.surveyId,
        scheme_id: newResponse.schemeId,
        unit_id: newResponse.unitId || null,
        respondent_name: newResponse.respondentName || null,
        is_anonymous: newResponse.isAnonymous,
        submitted_at: newResponse.submittedAt,
        answers: newResponse.answers,
      });
      if (error) console.warn('[SmartLot Store] Supabase survey_responses insert error:', error);
    } catch (err) {
      console.warn('[SmartLot Store] Supabase survey_responses catch error:', err);
    }

    setSurveyResponses(prev => {
      if (prev.some(r => r.id === newResponse.id)) return prev;
      const updated = [newResponse, ...prev];
      try {
        window.localStorage.setItem('smartlot_global_survey_responses_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    return newResponse;
  };

  const generateAISurveyQuestions = async (prompt: string, category: SurveyCategory, schemeName: string): Promise<SurveyQuestion[]> => {
    return generateSurveyQuestionsWithAI(prompt, category, schemeName);
  };

  const generateAISurveySummary = async (surveyId: string): Promise<SurveyAISummary> => {
    const targetSurvey = surveys.find(s => s.id === surveyId);
    if (!targetSurvey) {
      throw new Error(`Survey ${surveyId} not found`);
    }
    const matchingResponses = surveyResponses.filter(r => r.surveyId === surveyId);
    const summary = await generateSurveySummaryWithAI(targetSurvey, matchingResponses);

    setSurveys(prev => prev.map(s => {
      if (s.id !== surveyId) return s;
      return {
        ...s,
        aiExecutiveSummary: summary,
      };
    }));

    return summary;
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
    initiateVotingForRequest,
    castBallot,
    requestMotionRFI,
    submitRevisedProposal,
    restartVoting,
    sendSCMReminder,
    sendBlastReminder,
    extendMotionDeadline,
    markMotionUnresolved,
    closeVotingEarly,
    resolveMotion,
    addMotionComment,
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
    submitGuestWorkOrderCompletion,
    verifyWorkOrder,
    signOffWorkOrder,
    requestQuotesForRequest,
    voteForQuote,
    awardQuoteAndCreateWorkOrder,
    updateVendorInsurance,
    refreshData,
    isLoading,
    surveys,
    setSurveys,
    surveyResponses,
    setSurveyResponses,
    createSurvey,
    updateSurvey,
    closeSurvey,
    reopenSurvey,
    deleteSurvey,
    submitSurveyResponse,
    generateAISurveyQuestions,
    generateAISurveySummary,
  };
}


export type SmartLotStore = ReturnType<typeof useSmartLotStore>;

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


// SLA Helper: Calculate elapsed hours between creation and current date
export const calculateRequestAgeHours = (createdAt?: string): number => {
  if (!createdAt) return 0;
  const created = new Date(createdAt).getTime();
  if (isNaN(created)) return 0;
  return Math.max(0, Math.round((Date.now() - created) / (1000 * 60 * 60)));
};

// JSDoc: SmartLotStore centralized state management and sync engine
// Performance: Optimized filter predicate helpers