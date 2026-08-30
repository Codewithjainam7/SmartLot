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
const INITIAL_MEMBERS: Member[] = [];

// Initial Seed Requests
const INITIAL_RESIDENT_REQUESTS: ResidentRequest[] = [];

const INITIAL_UNITS: UnitData[] = [];

export const getDefaultPermissionsForRole = (role: string): { label: string; active: boolean; locked?: boolean }[] => {
  const isManagerOrAdmin = role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' || role === 'Building Manager';
  
  return [
    // 1. Service Requests
    { label: 'Submit Request', active: role !== 'Service Provider', locked: isManagerOrAdmin },
    { label: 'Add Comment on Request', active: true, locked: isManagerOrAdmin },
    { label: 'View Requests', active: true, locked: isManagerOrAdmin },
    { label: 'Review & Edit Request Fields', active: isManagerOrAdmin, locked: isManagerOrAdmin },
    { label: 'Approve / Reject Requests', active: isManagerOrAdmin, locked: isManagerOrAdmin },
    
    // 2. Voting & Governance
    { label: 'Create & Publish Motion', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin', locked: isManagerOrAdmin && role !== 'Building Manager' },
    { label: 'Cast Vote', active: role === 'Committee Member' || role === 'Lot Owner' || role === 'Strata Admin', locked: role === 'Tenant' || role === 'Service Provider' },
    { label: 'View Final Vote Results', active: role !== 'Service Provider' && role !== 'Tenant', locked: isManagerOrAdmin },
    
    // 3. Vendors & Quotes
    { label: 'Request Quotes from Vendors', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' || role === 'Building Manager', locked: isManagerOrAdmin },
    { label: 'Submit Quote', active: role === 'Service Provider', locked: role === 'Service Provider' },
    { label: 'View & Compare Quotes', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' || role === 'Building Manager' || role === 'Committee Member', locked: isManagerOrAdmin },
    { label: 'Assign Selected Vendor', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' || role === 'Building Manager', locked: isManagerOrAdmin },
    
    // 4. Work Orders
    { label: 'Upload PO / Begin Task', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' || role === 'Building Manager', locked: isManagerOrAdmin },
    { label: 'Upload Completion Evidence', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' || role === 'Building Manager' || role === 'Service Provider', locked: isManagerOrAdmin },
    { label: 'Mark Task Completed', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' || role === 'Building Manager' || role === 'Service Provider', locked: isManagerOrAdmin },
    
    // 5. System Settings
    { label: 'Role & Permission Setup', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin', locked: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' },
    { label: 'Module Access Control', active: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin', locked: role === 'Strata Manager' || role === 'Strata Admin' || role === 'Strata Plan Admin' }
  ];
};

function usePersistedState<T>(key: string, defaultValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) return JSON.parse(item);
    } catch (error) {
      console.error(error);
    }
    return defaultValue instanceof Function ? defaultValue() : defaultValue;
  });

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setState(JSON.parse(item));
      } else {
        setState(defaultValue instanceof Function ? defaultValue() : defaultValue);
      }
    } catch (error) {
      console.error(error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

export function useSmartLotStore() {
  const [activePersona, setActivePersona] = usePersistedState<Persona>('smartlot_activePersona_v7', PERSONAS[1]); // We'll keep this temporarily for backward compatibility while refactoring
  const pId = activePersona?.id || 'default';

  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // Local state initialized to empty for live Supabase fetch
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [activeScheme, setActiveScheme] = usePersistedState<Scheme>(`smartlot_${pId}_activeScheme_v7`, 
    { id: 'NO_SCHEME', name: 'No Registered Schemes', lots: 0, active: false }
  );

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsLoggedIn(true);
        // Sync name/email from Supabase on initial load (fixes "Authenticated User" bug on page refresh)
        const fullName = session.user.user_metadata?.full_name;
        const userRole = session.user.user_metadata?.role;
        if (fullName) {
          setActivePersona(prev => ({
            ...prev,
            id: session.user.id,
            name: fullName,
            email: session.user.email || '',
            role: userRole || prev.role || 'Lot Owner'
          }));
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  // Fetch Live Data from Supabase when logged in
  useEffect(() => {
    if (!session?.user) return;
    
    let isMounted = true;
    const fetchSupabaseData = async () => {
      setIsLoading(true);
      try {
        const { data: schemesData, error } = await supabase.from('schemes').select('*');
        if (error) throw error;
        
        if (schemesData && isMounted) {
          const formattedSchemes = schemesData.map(s => ({
            id: s.id,
            name: s.name,
            lots: s.lots,
            active: s.active
          }));
          setSchemes(formattedSchemes);
          
          // Auto-select first scheme if none selected or invalid
          if (formattedSchemes.length > 0) {
            setActiveScheme(prev => {
              if (prev.id === 'NO_SCHEME' || !formattedSchemes.find(f => f.id === prev.id)) {
                return formattedSchemes[0];
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error("Error fetching from Supabase:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchSupabaseData();
    
    return () => { isMounted = false; };
  }, [session?.user]);

  const [activeRoles, setActiveRoles] = usePersistedState<string[]>(`smartlot_${pId}_activeRoles_v7`, ['Strata Manager']);
  const [activeView, setActiveView] = usePersistedState<'dashboard' | 'user_management' | 'requests' | 'triage' | 'settings'>(`smartlot_${pId}_activeView_v7`, 'dashboard');
  const [isLoggedIn, setIsLoggedIn] = usePersistedState(`smartlot_${pId}_isLoggedIn_v7`, false);
  const [theme, setTheme] = usePersistedState<'light' | 'dark'>('smartlot_theme_v7', 'light');
  const [members, setMembers] = usePersistedState<Member[]>(`smartlot_${pId}_members_v7`, INITIAL_MEMBERS);
  const [residentRequests, setResidentRequests] = usePersistedState<ResidentRequest[]>(`smartlot_${pId}_residentRequests_v7`, INITIAL_RESIDENT_REQUESTS);
  const [units, setUnits] = usePersistedState<UnitData[]>(`smartlot_${pId}_units_v7`, INITIAL_UNITS);
  const [customPersonas, setCustomPersonas] = usePersistedState<Persona[]>('smartlot_custom_personas_v7', []);

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

    // Align activeScheme with the activePersona's memberships if they switch
    const hasMembershipInActiveScheme = activePersona.memberships?.some(m => m.schemeId === activeScheme.id);
    if (!hasMembershipInActiveScheme && activePersona.memberships && activePersona.memberships.length > 0) {
      const firstMembershipSchemeId = activePersona.memberships[0].schemeId;
      setSchemes(prevSchemes => {
        const targetScheme = prevSchemes.find(s => s.id === firstMembershipSchemeId);
        if (targetScheme) setActiveScheme(targetScheme);
        return prevSchemes;
      });
      return;
    }

    const membership = activePersona.memberships?.find(m => m.schemeId === activeScheme.id);
    const newRoles = membership ? membership.roles : [];
    const newRolesStr = newRoles.join(', ');
    setActiveRoles(prev => prev.join(', ') === newRolesStr ? prev : newRoles);

  // Only depends on persona id/role and active scheme - NOT on members/schemes arrays
  }, [activePersona.id, activeScheme.id, activePersona.role]);


  // Initialize permissions list for all roles in all schemes
  const [rolePermissions, setRolePermissions] = usePersistedState<Record<string, Record<string, { label: string; active: boolean; locked?: boolean }[]>>>(`smartlot_${pId}_rolePermissions`, () => {
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
    if (session?.user) {
      // 1. Insert Scheme
      const { error: schemeError } = await supabase.from('schemes').insert([
        { id, name, lots, active: true }
      ]);
      if (schemeError) {
        console.error("Error inserting scheme into Supabase:", schemeError);
      }

      // 2. Insert creator as Strata Manager in members so they can see the scheme (RLS)
      const { error: memberError } = await supabase.from('members').insert([
        { 
          scheme_id: id,
          user_id: session.user.id,
          name: session.user.user_metadata?.full_name || 'Admin',
          email: session.user.email,
          role: 'Strata Manager',
          unit_id: 'Admin',
          status: 'Active'
        }
      ]);
      if (memberError) {
        console.error("Error inserting member into Supabase:", memberError);
      }
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

  const togglePermission = (schemeId: string, role: string, permissionLabel: string) => {
    setRolePermissions(prev => {
      const schemeRoles = prev[schemeId] || {};
      const rolePerms = schemeRoles[role] || [];
      const updatedPerms = rolePerms.map(p => 
        p.label === permissionLabel && !p.locked ? { ...p, active: !p.active } : p
      );
      return {
        ...prev,
        [schemeId]: {
          ...schemeRoles,
          [role]: updatedPerms
        }
      };
    });
  };

  const toggleIndividualPermission = (memberId: string, permissionLabel: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      
      const currentOverrides = m.individualPermissions || [];
      const existingOverrideIndex = currentOverrides.findIndex(p => p.label === permissionLabel);
      
      let newOverrides;
      if (existingOverrideIndex >= 0) {
        // Toggle existing override
        newOverrides = [...currentOverrides];
        newOverrides[existingOverrideIndex] = {
          ...newOverrides[existingOverrideIndex],
          active: !newOverrides[existingOverrideIndex].active
        };
      } else {
        // Look up default to know what we are overriding from
        let isCurrentlyActive = false;
        const schemeRoles = rolePermissions[m.schemeId];
        if (schemeRoles) {
          const rolePerms = schemeRoles[m.role] || [];
          const permObj = rolePerms.find(p => p.label === permissionLabel);
          if (permObj) isCurrentlyActive = permObj.active;
        }

        newOverrides = [
          ...currentOverrides,
          { label: permissionLabel, active: !isCurrentlyActive }
        ];
      }
      return { ...m, individualPermissions: newOverrides };
    }));
  };

  const hasPermission = (permissionLabel: string) => {
    // Platform super admins always bypass
    if (activePersona.isSystemAdmin || activePersona.role === 'Super Admin' || activePersona.role === 'Website Administrator') {
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

  const addMember = (memberData: {
    name: string;
    email: string;
    phone: string;
    role: MemberRole;
    unitId: string;
    lotNumber: number;
    hasCoOwner?: boolean;
    coOwnerName?: string;
    coOwnerEmail?: string;
    additionalOccupants?: AdditionalOccupant[];
  }) => {
    const id = `MEM-${100 + members.length + 1}`;
    const newMember: Member = {
      ...memberData,
      id,
      schemeId: activeScheme.id,
      status: 'Invited',
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setMembers(prev => [newMember, ...prev]);
    return id;
  };

  const updateMemberStatus = (memberId: string, status: 'Active' | 'Invited' | 'Restricted') => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status } : m));
  };

  const deleteMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
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

  const updateUnitMetadata = (schemeId: string, unitId: string, entitlement: string, status: 'Occupied' | 'Vacant') => {
    setUnits(prev => prev.map(u => {
      if (u.schemeId !== schemeId || u.unitId !== unitId) return u;
      return { ...u, entitlement, status };
    }));
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

    // 2. Add to members state to sync roster
    const memberRole = (role === 'On-Site Resident' ? 'Resident' : role) as MemberRole;
    const lotNo = parseInt(unitId.replace(/\D/g, '')) || 1;
    setMembers(prev => {
      if (prev.some(m => m.email === email && m.schemeId === schemeId)) return prev;
      return [
        {
          id: `MEM-${100 + prev.length + 1}`,
          name,
          email,
          phone: phone || '0400 000 000',
          schemeId,
          role: memberRole,
          unitId,
          lotNumber: lotNo,
          status: 'Active',
          joinedAt: new Date().toISOString().split('T')[0],
        },
        ...prev
      ];
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
      return {
        ...u,
        status: newStatus,
        actors: newActors,
      };
    }));

    if (emailToOffboard) {
      setMembers(prev => prev.filter(m => !(m.email === emailToOffboard && m.schemeId === schemeId)));
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
    triageRequest,
    closeResidentRequest,
    addCommentToRequest,
    addResidentToUnit,
    offboardActor,
    updateUnitMetadata,
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
  };
}
