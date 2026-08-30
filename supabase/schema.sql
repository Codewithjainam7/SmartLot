-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. PROFILES TABLE (linked to auth.users)
-- =========================================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50),
    avatar_url TEXT,
    is_system_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 2. SCHEMES TABLE (buildings)
-- =========================================================================
CREATE TABLE public.schemes (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'SP101'
    name VARCHAR(255) NOT NULL,
    lots INTEGER DEFAULT 0 NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 3. UNITS TABLE (lots inside schemes)
-- =========================================================================
CREATE TABLE public.units (
    scheme_id VARCHAR(50) REFERENCES public.schemes(id) ON DELETE CASCADE,
    unit_id VARCHAR(50) NOT NULL, -- e.g., 'Unit 1'
    lot_number INTEGER NOT NULL,
    entitlement NUMERIC(5, 2) NOT NULL DEFAULT 0.00, -- e.g., 25.00 for entitlement percentage
    status VARCHAR(50) DEFAULT 'Vacant' CHECK (status IN ('Occupied', 'Vacant')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (scheme_id, unit_id)
);

-- =========================================================================
-- 4. MEMBERS TABLE (links profiles to schemes & units with a role)
-- =========================================================================
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id VARCHAR(50) REFERENCES public.schemes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for invited users who haven't signed up yet
    name VARCHAR(255) NOT NULL, -- Cache name for reference
    email VARCHAR(255) NOT NULL, -- Used to auto-link profile on sign up
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('Strata Manager', 'Building Manager', 'Committee Member', 'Lot Owner', 'Resident', 'Tenant')),
    unit_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Invited' CHECK (status IN ('Active', 'Invited', 'Restricted')),
    joined_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    FOREIGN KEY (scheme_id, unit_id) REFERENCES public.units(scheme_id, unit_id) ON DELETE CASCADE
);

-- =========================================================================
-- 5. ROLE PERMISSIONS TABLE (role defaults per scheme)
-- =========================================================================
CREATE TABLE public.role_permissions (
    scheme_id VARCHAR(50) REFERENCES public.schemes(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    permission_label VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT FALSE NOT NULL,
    locked BOOLEAN DEFAULT FALSE NOT NULL,
    PRIMARY KEY (scheme_id, role, permission_label)
);

-- =========================================================================
-- 6. INDIVIDUAL PERMISSIONS TABLE (member-specific overrides)
-- =========================================================================
CREATE TABLE public.individual_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    permission_label VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (member_id, permission_label)
);

-- =========================================================================
-- 7. RESIDENT REQUESTS TABLE (maintenance tickets)
-- =========================================================================
CREATE TABLE public.resident_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id VARCHAR(50) NOT NULL,
    unit_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    request_type VARCHAR(100) NOT NULL,
    priority VARCHAR(50) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Emergency')),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'pending_triage', 'approved', 'rejected', 'closed', 'resolved')),
    requestor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    close_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    FOREIGN KEY (scheme_id, unit_id) REFERENCES public.units(scheme_id, unit_id) ON DELETE CASCADE
);

-- =========================================================================
-- 8. REQUEST COMMENTS TABLE (ticket messages)
-- =========================================================================
CREATE TABLE public.request_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES public.resident_requests(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- PERFORMANCE INDEXES
-- =========================================================================
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_members_user ON public.members(user_id);
CREATE INDEX idx_members_scheme ON public.members(scheme_id);
CREATE INDEX idx_units_scheme ON public.units(scheme_id);
CREATE INDEX idx_role_permissions_scheme ON public.role_permissions(scheme_id);
CREATE INDEX idx_individual_permissions_member ON public.individual_permissions(member_id);
CREATE INDEX idx_requests_scheme_unit ON public.resident_requests(scheme_id, unit_id);
CREATE INDEX idx_comments_request ON public.request_comments(request_id);


-- =========================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;

-- 1. Helper function to check if the user is a member of the scheme or system admin
CREATE OR REPLACE FUNCTION public.is_member_of_scheme(scheme_id text)
RETURNS boolean AS $$
BEGIN
    -- Bypass check for System Administrators
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_system_admin = true
    ) THEN
        RETURN true;
    END IF;

    -- Check active memberships
    RETURN EXISTS (
        SELECT 1 FROM public.members 
        WHERE user_id = auth.uid() AND members.scheme_id = $1 AND status = 'Active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Profiles Policies
CREATE POLICY "Allow users to read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Schemes Policies
CREATE POLICY "Isolate schemes read" ON public.schemes FOR SELECT USING (is_member_of_scheme(id));
CREATE POLICY "System admins can write schemes" ON public.schemes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_system_admin = true)
);

-- 4. Units Policies
CREATE POLICY "Isolate units read" ON public.units FOR SELECT USING (is_member_of_scheme(scheme_id));
CREATE POLICY "Managers can manage units" ON public.units FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.members 
        WHERE user_id = auth.uid() 
          AND members.scheme_id = units.scheme_id 
          AND role IN ('Strata Manager', 'Building Manager')
          AND status = 'Active'
    )
);

-- 5. Members Policies
CREATE POLICY "Isolate members read" ON public.members FOR SELECT USING (is_member_of_scheme(scheme_id));
CREATE POLICY "Managers can manage members" ON public.members FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.members m 
        WHERE m.user_id = auth.uid() 
          AND m.scheme_id = members.scheme_id 
          AND m.role IN ('Strata Manager')
          AND m.status = 'Active'
    )
);

-- 6. Role Permissions Policies
CREATE POLICY "Isolate role permissions read" ON public.role_permissions FOR SELECT USING (is_member_of_scheme(scheme_id));
CREATE POLICY "Managers can update permissions" ON public.role_permissions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.members 
        WHERE user_id = auth.uid() 
          AND members.scheme_id = role_permissions.scheme_id 
          AND role IN ('Strata Manager')
          AND status = 'Active'
    )
);

-- 7. Individual Permissions Policies
CREATE POLICY "Isolate individual permissions read" ON public.individual_permissions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = member_id AND is_member_of_scheme(m.scheme_id)
    )
);
CREATE POLICY "Managers can manage overrides" ON public.individual_permissions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.members target_m
        JOIN public.members current_m ON current_m.scheme_id = target_m.scheme_id
        WHERE target_m.id = member_id 
          AND current_m.user_id = auth.uid()
          AND current_m.role IN ('Strata Manager')
          AND current_m.status = 'Active'
    )
);

-- 8. Requests Policies
CREATE POLICY "Isolate requests access" ON public.resident_requests FOR SELECT USING (is_member_of_scheme(scheme_id));
CREATE POLICY "Members can insert requests" ON public.resident_requests FOR INSERT WITH CHECK (is_member_of_scheme(scheme_id));
CREATE POLICY "Managers and requestors can update requests" ON public.resident_requests FOR UPDATE USING (
    auth.uid() = requestor_id OR
    EXISTS (
        SELECT 1 FROM public.members 
        WHERE user_id = auth.uid() 
          AND members.scheme_id = resident_requests.scheme_id 
          AND role IN ('Strata Manager', 'Building Manager')
          AND status = 'Active'
    )
);

-- 9. Comments Policies
CREATE POLICY "Isolate comments access" ON public.request_comments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.resident_requests r
        WHERE r.id = request_id AND is_member_of_scheme(r.scheme_id)
    )
);
CREATE POLICY "Allowed members can insert comments" ON public.request_comments FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.resident_requests r
        WHERE r.id = request_id AND is_member_of_scheme(r.scheme_id)
    )
);
