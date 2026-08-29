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
  { id: 'SP10482', name: 'SmartLot Complex', lots: 10, active: true }
];

export const PERSONAS: Persona[] = [
  // 1. Admin
  { id: 'admin1', role: 'Super Admin', name: 'Admin One', context: 'System', email: 'admin1@smartlot.com', isSystemAdmin: true },
  { id: 'admin2', role: 'Super Admin', name: 'Admin Two', context: 'System', email: 'admin2@smartlot.com', isSystemAdmin: true },
  
  // 2. Strata Manager
  { id: 'sm1', role: 'Strata Manager', name: 'Strata Manager One', context: 'Agency', email: 'sm1@strata.com', memberships: [{ schemeId: 'SP10482', roles: ['Strata Manager'] }] },
  { id: 'sm2', role: 'Strata Manager', name: 'Strata Manager Two', context: 'Agency', email: 'sm2@strata.com', memberships: [{ schemeId: 'SP10482', roles: ['Strata Manager'] }] },
  
  // 3. Building Manager
  { id: 'bm1', role: 'Building Manager', name: 'Building Manager One', context: 'On-site', email: 'bm1@building.com', memberships: [{ schemeId: 'SP10482', roles: ['Building Manager'] }] },
  { id: 'bm2', role: 'Building Manager', name: 'Building Manager Two', context: 'On-site', email: 'bm2@building.com', memberships: [{ schemeId: 'SP10482', roles: ['Building Manager'] }] },
  
  // 4. Committee Member
  { id: 'cm1', role: 'Committee Member', name: 'Committee Member One', context: 'Unit 1', email: 'cm1@smartlot.com', memberships: [{ schemeId: 'SP10482', roles: ['Committee Member', 'Lot Owner'] }] },
  { id: 'cm2', role: 'Committee Member', name: 'Committee Member Two', context: 'Unit 2', email: 'cm2@smartlot.com', memberships: [{ schemeId: 'SP10482', roles: ['Committee Member', 'Lot Owner'] }] },
  
  // 5. Lot Owner
  { id: 'lo1', role: 'Lot Owner', name: 'Lot Owner One', context: 'Unit 3', email: 'lo1@smartlot.com', memberships: [{ schemeId: 'SP10482', roles: ['Lot Owner'] }] },
  { id: 'lo2', role: 'Lot Owner', name: 'Lot Owner Two', context: 'Unit 4', email: 'lo2@smartlot.com', memberships: [{ schemeId: 'SP10482', roles: ['Lot Owner'] }] },
  
  // 6. Resident (Owner-Occupier or just Resident)
  { id: 'res1', role: 'Resident', name: 'Resident One', context: 'Unit 5', email: 'res1@smartlot.com', memberships: [{ schemeId: 'SP10482', roles: ['Resident'] }] },
  { id: 'res2', role: 'Resident', name: 'Resident Two', context: 'Unit 6', email: 'res2@smartlot.com', memberships: [{ schemeId: 'SP10482', roles: ['Resident'] }] },
  
  // 7. Tenant
  { id: 'ten1', role: 'Tenant', name: 'Tenant One', context: 'Unit 7', email: 'ten1@smartlot.com', memberships: [{ schemeId: 'SP10482', roles: ['Tenant'] }] },
  { id: 'ten2', role: 'Tenant', name: 'Tenant Two', context: 'Unit 8', email: 'ten2@smartlot.com', memberships: [{ schemeId: 'SP10482', roles: ['Tenant'] }] },
  
  // 8. Service Provider (Vendor)
  { id: 'sp1', role: 'Service Provider', name: 'Vendor One', context: 'External', email: 'sp1@vendor.com', memberships: [{ schemeId: 'SP10482', roles: ['Service Provider'] }] },
  { id: 'sp2', role: 'Service Provider', name: 'Vendor Two', context: 'External', email: 'sp2@vendor.com', memberships: [{ schemeId: 'SP10482', roles: ['Service Provider'] }] },
];
