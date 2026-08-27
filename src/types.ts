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
  roles: ('Strata Admin' | 'Strata Manager' | 'Committee Member' | 'Lot Owner' | 'Resident' | 'Tenant')[];
};

export const SCHEMES: Scheme[] = [];

export const PERSONAS: Persona[] = [
  { 
    id: 'committee_admin', 
    role: 'Committee Member Admin', 
    name: 'Sarah Jenkins', 
    context: 'Unit 2',
    email: 'sarah.j@building.com.au',
    memberships: [{ schemeId: 'SP10482', roles: ['Committee Member', 'Lot Owner'] }]
  },
  { 
    id: 'strata_manager', 
    role: 'Strata Manager Admin', 
    name: 'Alex Vance', 
    context: 'Agency',
    email: 'alex.vance@strata.com.au',
    memberships: [{ schemeId: 'SP10482', roles: ['Strata Manager'] }]
  },
  { 
    id: 'off_site_owner', 
    role: 'Off-Site Lot Owner', 
    name: 'Mike Davies', 
    context: 'Unit 10',
    email: 'mike@owner.com',
    memberships: [{ schemeId: 'SP10482', roles: ['Lot Owner'] }]
  },
  { 
    id: 'on_site_resident', 
    role: 'On-Site Resident', 
    name: 'Lisa Ray', 
    context: 'Unit 10',
    email: 'lisa@unit10.com',
    memberships: [{ schemeId: 'SP10482', roles: ['Resident'] }]
  },
  { 
    id: 'property_manager', 
    role: 'Real Estate Property Manager', 
    name: 'RayWhite Agent', 
    context: 'Unit 10',
    email: 'raywhite@agent.com.au',
    memberships: [{ schemeId: 'SP10482', roles: ['Tenant'] }]
  },
  { 
    id: 'super_admin', 
    role: 'Super Admin', 
    name: 'Platform Owner', 
    context: 'System',
    email: 'admin@smartlot.com',
    isSystemAdmin: true
  },
  // Module 1 test personas
  { 
    id: 'sarah_jones', 
    role: 'Strata Admin', 
    name: 'Sarah Jones', 
    context: 'Unit 1',
    email: 'sarah.jones@duplex.com',
    memberships: [{ schemeId: 'SP101', roles: ['Strata Admin', 'Committee Member', 'Resident'] }]
  },
  { 
    id: 'michael_chen', 
    role: 'Strata Admin', 
    name: 'Michael Chen', 
    context: 'Unit 3',
    email: 'michael.chen@coronation.com',
    memberships: [{ schemeId: 'SP102', roles: ['Strata Admin', 'Committee Member'] }]
  },
  { 
    id: 'emma_wilson', 
    role: 'Strata Manager', 
    name: 'Emma Wilson', 
    context: 'Office',
    email: 'emma.wilson@cavaller.com',
    memberships: [
      { schemeId: 'SP103', roles: ['Strata Admin', 'Strata Manager'] },
      { schemeId: 'SP102', roles: ['Strata Manager'] }
    ]
  },
];
