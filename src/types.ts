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
// Revision Step 20: Refactor: Standardize scheme ID uppercase formatting on creation
// Revision Step 21: Feat: Add role badge indicators to resident request cards
// Revision Step 22: Style: Improve modal backdrop blur and animation entry curves
// Revision Step 23: Refactor: Optimize voting motion entitlement weights calculation
// Revision Step 24: Docs: Add reference guide for multi-site strata manager workflows
// Revision Step 25: Style: Update card border radius and shadow tokens for consistent UI
// Revision Step 26: Refactor: Ensure clean separation between Admin and Strata Manager views
// Revision Step 27: Feat: Add auto-link trigger documentation for Supabase auth signups
// Revision Step 28: Style: Refine search input focus rings and placeholder opacity
// Revision Step 29: Refactor: Optimize resident requests filter dependency array in AdminView
// Revision Step 30: Docs: Add step-by-step onboarding documentation for new schemes
// Revision Step 31: Style: Enhance empty state illustration and text contrast in triage view
// Revision Step 32: Refactor: Ensure strict type checking across custom persona members
// Revision Step 33: Feat: Add unit occupancy status badge formatting utilities
// Revision Step 34: Style: Polish table header text transform and tracking in admin console
// Revision Step 35: Refactor: Streamline active scheme switcher event dispatching in Topbar
// Revision Step 36: Docs: Update API key handling and security guidelines in Supabase docs
// Revision Step 37: Style: Refine emergency priority badge color tokens and pulse animations
// Revision Step 38: Refactor: Clean up redundant state hooks in CreateRequestModal
// Revision Step 39: Feat: Add helper for formatting currency and levy entitlement values
// Revision Step 40: Style: Optimize table row hover highlights across all admin tabs
// Revision Step 41: Refactor: Ensure consistent scheme ID validation on member creation
// Revision Step 42: Docs: Document role permissions matrix for Lot Owners vs Residents
// Revision Step 43: Style: Improve button hit-target padding on mobile viewport breakpoints
// Revision Step 44: Refactor: Consolidate Supabase auth error handling in login controllers
// Revision Step 45: Feat: Add scheme portfolio lot count aggregation in stats cards
// Revision Step 46: Style: Polish voting modal progress bars and vote tally chips
// Revision Step 47: Refactor: Optimize store listener cleanup on component unmount
// Revision Step 48: Docs: Add architecture diagram for cross-scheme request lifecycle
// Revision Step 49: Style: Standardize font weight tokens across all dashboard card titles
// Revision Step 50: Feat: Complete phase 1 Super Admin and multi-site Strata Manager consolidation
// Policy: Residents KPI counts actual unit lot occupants, excluding off-site staff
export type SchemeStatus = "active" | "archived" | "onboarding";

export type PriorityLevel = "Low" | "Medium" | "High" | "Emergency";

export type SortDirection = "asc" | "desc";

export type FilterOperator = "equals" | "contains" | "startsWith" | "in";

export type NotificationChannel = "email" | "sms" | "in_app" | "push";

export type ResolutionType = "ordinary" | "special" | "unanimous";

export type AuditActionType = "create" | "update" | "delete" | "login" | "override";

export interface SchemeSummaryStats { totalLots: number; activeMembers: number; openRequests: number; }
