export type Scheme = {
  id: string;
  name: string;
  lots: number;
  active: boolean;
};

export type Persona = {
  id: string;
  role: string;
  name: string;
  context: string;
  email?: string;
  memberships?: UserSiteMembership[];
  isSystemAdmin?: boolean;
};

export type UserSiteMembership = {
  schemeId: string;
  roles: ('Strata Admin' | 'Strata Manager' | 'Committee Member' | 'Lot Owner' | 'Resident' | 'Tenant' | 'Building Manager' | 'Service Provider')[];
};

export const SCHEMES: Scheme[] = [
  { id: 'SP101', name: 'Sunset Duplex', lots: 2, active: true },
  { id: 'SP102', name: 'Coronation Residences', lots: 12, active: true },
  { id: 'SP103', name: 'Cavalier Grand Residences', lots: 24, active: true }
];

export const PERSONAS: Persona[] = [
  // 1. System Admins
  { id: 'web_admin', role: 'Website Administrator', name: 'Web Admin', context: 'System', email: 'admin@smartlot.com', isSystemAdmin: true },
  
  // 2. Roman Joe (Master Strata Manager across Duplex, Coronation & Cavalier)
  { 
    id: 'roman_joe', 
    role: 'Strata Manager', 
    name: 'Roman Joe', 
    context: 'HQ / Management', 
    email: 'romanjoe@gmail.com', 
    memberships: [
      { schemeId: 'SP101', roles: ['Strata Admin', 'Strata Manager'] },
      { schemeId: 'SP102', roles: ['Strata Admin', 'Strata Manager'] },
      { schemeId: 'SP103', roles: ['Strata Admin', 'Strata Manager'] }
    ] 
  },

  // 3. Sarah Jones (Duplex)
  { 
    id: 'sarah_jones', 
    role: 'Strata Admin', 
    name: 'Sarah Jones', 
    context: 'Unit 1', 
    email: 'sarah.jones@duplex.com', 
    memberships: [{ schemeId: 'SP101', roles: ['Strata Admin', 'Lot Owner', 'Committee Member'] }] 
  },
  
  // 4. Michael Chen (Coronation Townhouses)
  { 
    id: 'michael_chen', 
    role: 'Committee Member', 
    name: 'Michael Chen', 
    context: 'Unit 2', 
    email: 'michael.chen@coronation.com', 
    memberships: [{ schemeId: 'SP102', roles: ['Strata Admin', 'Committee Member'] }] 
  },
  
  // 5. Emma Wilson (Cavalier & Coronation)
  { 
    id: 'emma_wilson', 
    role: 'Strata Manager', 
    name: 'Emma Wilson', 
    context: 'Agency', 
    email: 'emma.wilson@agency.com', 
    memberships: [
      { schemeId: 'SP103', roles: ['Strata Admin', 'Strata Manager'] },
      { schemeId: 'SP102', roles: ['Strata Manager'] }
    ] 
  }
];

// Export types

// Type definition marker: Schemes and Units
// Type definition marker: Personas and Memberships
// Type definition marker: Role Definitions
// Type definition marker: Navigation Views
// End of Type Registry
// Interface: Strata Management Models
// Interface: Building Roster and Lot Entitlements
// Interface: Triage and Approval Status Types
// Interface: Super Admin Operational Payloads
// Interface: Permission Matrix Rules
// UI: Tab Animation Key Definitions
// UI: Theme Transition Palette Definitions
// UI: Card Elevation and Shadow Specifications
// UI: Modal Overlay and Backdrop Blur Config
// UI: End of UI Interface Tokens
// Revision Step 1: Refactor: Enhance role validation and persona typing definitions in types.ts
// Revision Step 2: Docs: Add architectural notes on strata multi-scheme governance
// Revision Step 3: Style: Refine topbar navigation theme transitions and badge alignments
// Revision Step 4: Feat: Add safe date parser helper for relative timestamps across dashboard
// Revision Step 5: Refactor: Streamline Super Admin global platform user roster sorting
// Revision Step 6: Style: Standardize action button hover transitions in AdminView
// Revision Step 7: Fix: Prevent modal close button overlapping in master audit dialogs
// Revision Step 8: Refactor: Enhance null-safe filter logic in resident requests store
// Revision Step 9: Style: Apply glowing status indicators to pending triage badges
// Revision Step 10: Feat: Add granular role permission checks for Committee Members
// Revision Step 11: Refactor: Align Strata Manager unit roster pagination and filtering
// Revision Step 12: Docs: Document Supabase RLS policies and invite trigger workflows
// Revision Step 13: Style: Polish dark mode surface contrasts in UserManagementView
// Revision Step 14: Refactor: Optimize memoized request metrics calculation in smartLotStore
// Revision Step 15: Feat: Add direct quick-triage status actions to master inspection modal
// Revision Step 16: Style: Improve comment audit trail bubble spacing and author tags
// Revision Step 17: Refactor: Unify member email lookup in Supabase sync handler
// Revision Step 18: Docs: Add schema definitions for public.members and public.profiles
// Revision Step 19: Style: Refine sidebar navigation icons and active indicator bar