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
};

export const SCHEMES: Scheme[] = [
  { id: 'SP10482', name: 'SP 10482 - Grandview Villas', lots: 8, active: true },
  { id: 'SP4421', name: 'SP 4421 - Sunset Duplex', lots: 2, active: true },
  { id: 'SP101', name: 'SP 101 - Duplex', lots: 2, active: true },
  { id: 'SP102', name: 'SP 102 - Coronation', lots: 4, active: true },
  { id: 'SP103', name: 'SP 103 - Cavaller', lots: 32, active: true },
];

export const PERSONAS: Persona[] = [
  { id: 'committee_admin', role: 'Committee Member Admin', name: 'Sarah Jenkins', context: 'Unit 2' },
  { id: 'strata_manager', role: 'Strata Manager Admin', name: 'Alex Vance', context: 'Agency' },
  { id: 'off_site_owner', role: 'Off-Site Lot Owner', name: 'Mike Davies', context: 'Unit 10' },
  { id: 'on_site_resident', role: 'On-Site Resident', name: 'Lisa Ray', context: 'Unit 10' },
  { id: 'property_manager', role: 'Real Estate Property Manager', name: 'RayWhite Agent', context: 'Unit 10' },
  { id: 'super_admin', role: 'Super Admin', name: 'Platform Owner', context: 'System' },
  // Module 1 test personas
  { id: 'sarah_jones', role: 'Strata Admin', name: 'Sarah Jones', context: 'Unit 1 (Duplex)' },
  { id: 'michael_chen', role: 'Committee Member', name: 'Michael Chen', context: 'Unit 3 (Coronation)' },
  { id: 'emma_wilson', role: 'Strata Manager', name: 'Emma Wilson', context: 'Cavaller HQ' },
];
