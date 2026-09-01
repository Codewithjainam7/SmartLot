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
  { id: 'SP102', name: 'Coronation Townhouses', lots: 4, active: true },
  { id: 'SP103', name: 'Cavaller Apartments', lots: 32, active: true },
  { id: 'SP10482', name: 'SmartLot Complex', lots: 10, active: true }
];

export const PERSONAS: Persona[] = [
  // 1. System Admins
  { id: 'web_admin', role: 'Website Administrator', name: 'Web Admin', context: 'System', email: 'admin@smartlot.com', isSystemAdmin: true },
  
  // 2. Sarah Jones (Duplex)
  { 
    id: 'sarah_jones', 
    role: 'Strata Admin', 
    name: 'Sarah Jones', 
    context: 'Unit 1', 
    email: 'sarah.jones@duplex.com', 
    memberships: [{ schemeId: 'SP101', roles: ['Strata Admin', 'Lot Owner', 'Committee Member'] }] 
  },
  
  // 3. Michael Chen (Coronation Townhouses)
  { 
    id: 'michael_chen', 
    role: 'Committee Member', 
    name: 'Michael Chen', 
    context: 'Unit 2', 
    email: 'michael.chen@coronation.com', 
    memberships: [{ schemeId: 'SP102', roles: ['Strata Admin', 'Committee Member'] }] 
  },
  
  // 4. Emma Wilson (Cavaller & Coronation)
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