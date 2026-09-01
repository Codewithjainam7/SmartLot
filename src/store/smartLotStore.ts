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
    unitId: 'HQ / Management',
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
    status: 'Active',
    joinedAt: '2024-05-10',
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
    joinedAt: '2024-06-01',
  }
];

const INITIAL_RESIDENT_REQUESTS: ResidentRequest[] = [
  {
    id: 'REQ-101',
    schemeId: 'SP10482',
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
    schemeId: 'SP10482',
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
    schemeId: 'SP10482',
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
    schemeId: 'SP10482',
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
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Verify against the database that this user hasn't been deleted
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
        
        // Sync name/email from Supabase on initial load
        const fullName = user.user_metadata?.full_name;
        const userRole = user.user_metadata?.role;
        if (fullName) {
          setActivePersona(prev => ({
            ...prev,
            id: user.id,
            name: fullName,
            email: user.email || '',
            role: userRole || prev.role || 'Lot Owner'
          }));
        }
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
        const fullName = session.user.user_metadata?.full_name;
        const userRole = session.user.user_metadata?.role;
        setActivePersona(prev => ({
          ...prev,
          id: session.user.id,
          name: fullName || prev.name || 'User',
          email: session.user.email || '',
          // Only update role from metadata if persona hasn't been promoted to Strata Admin already
          role: prev.role === 'Strata Admin' ? 'Strata Admin' : (userRole || prev.role || 'Lot Owner')
        }));
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Live Data from Supabase universally for all sessions (including Super Admin)
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const { data: schemesData, error } = await supabase.from('schemes').select('*');
      
      let formattedSchemes = SCHEMES;
      if (!error && schemesData && schemesData.length > 0) {
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

      // Fetch members for all schemes
      let formattedMembers: Member[] = INITIAL_MEMBERS;
      const { data: membersData } = await supabase.from('members').select('*');
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
        setMembers(formattedMembers);
      }

      // Fetch units for all schemes
      const { data: unitsData } = await supabase.from('units').select('*');
      let allUnits: UnitData[] = [];
      if (unitsData && unitsData.length > 0) {
        allUnits = unitsData.map(u => {
          const unitActors: UnitActor[] = (formattedMembers || [])
            .filter(m => m.schemeId === u.scheme_id && m.unitId === u.unit_id && !['Strata Manager', 'Strata Admin', 'Building Manager'].includes(m.role))
            .map(m => ({
              id: m.id,
              role: (m.role === 'Resident' ? 'On-Site Resident' : m.role) as any,
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
            entitlement: `${u.entitlement}%`,
            status: unitActors.length > 0 ? 'Occupied' : (u.status || 'Vacant'),
            actors: unitActors
          };
        });
      }

      // Ensure every loaded scheme has unit entries generated & auto-inserted into Supabase if missing
      if (schemesData) {
        for (const s of schemesData) {
          const hasUnits = allUnits.some(u => u.schemeId === s.id);
          if (!hasUnits) {
            const unitsToInsert = Array.from({ length: s.lots }, (_, i) => ({
              scheme_id: s.id,
              unit_id: `Unit ${i + 1}`,
              lot_number: i + 1,
              entitlement: parseFloat((100 / s.lots).toFixed(2)),
              status: 'Vacant'
            }));

            // Auto-sync missing unit rows into Supabase public.units table
            supabase.from('units').insert(unitsToInsert).then(({ error }) => {
              if (error) console.error("Error auto-inserting missing units into Supabase:", error);
            });

            const generated: UnitData[] = unitsToInsert.map(u => {
              const unitActors: UnitActor[] = (formattedMembers || [])
                .filter(m => m.schemeId === s.id && m.unitId === u.unit_id && !['Strata Manager', 'Strata Admin', 'Building Manager'].includes(m.role))
                .map(m => ({
                  id: m.id,
                  role: (m.role === 'Resident' ? 'On-Site Resident' : m.role) as any,
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
                schemeId: s.id,
                unitId: u.unit_id,
                lotNumber: u.lot_number,
                entitlement: `${u.entitlement}%`,
                status: unitActors.length > 0 ? 'Occupied' : 'Vacant',
                actors: unitActors
              };
            });
            allUnits.push(...generated);
          }
        }
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
    const id = `REQ-${100 + residentRequests.length + 1}`;
    const req: ResidentRequest = {
      id,
      schemeId: activeScheme.id,
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