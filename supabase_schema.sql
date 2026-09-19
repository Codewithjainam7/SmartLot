-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Tables

-- Schemes (Strata Plans/Buildings)
CREATE TABLE IF NOT EXISTS schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles (User Profiles linked to Auth)
-- We will REMOVE the hard foreign key to auth.users for this prototype so mock data works easily without needing complex auth insertion!
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- In production, this would reference auth.users(id)
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Scheme Members (Linking users to a specific scheme & lot)
CREATE TABLE IF NOT EXISTS scheme_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id UUID REFERENCES schemes(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    unit_id TEXT NOT NULL,
    lot_number INTEGER NOT NULL,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Restricted', 'Pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(scheme_id, profile_id, unit_id)
);

-- Member Roles (A member can have multiple roles in a scheme, e.g., Lot Owner AND Committee Member)
CREATE TABLE IF NOT EXISTS member_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES scheme_members(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('Lot Owner', 'Resident', 'Tenant', 'Committee Member', 'Strata Manager', 'Building Manager', 'Strata Admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(member_id, role)
);

-- Invitations
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id UUID REFERENCES schemes(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    unit_id TEXT,
    lot_number INTEGER,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Expired')),
    invited_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 2. Insert Base Mock Data (This will now work without foreign key errors!)

-- Insert Scheme
INSERT INTO schemes (id, name) 
VALUES ('c1111111-1111-1111-1111-111111111111', 'Strata Plan 84930 (The Horizon)')
ON CONFLICT DO NOTHING;

-- Insert Profiles
INSERT INTO profiles (id, email, full_name, phone) VALUES 
('d8888888-8888-8888-8888-888888888888', 'sarah.admin@smartlot.io', 'Sarah Jenkins', '0400 111 222'),
('a2222222-2222-2222-2222-222222222222', 'michael.owner@example.com', 'Michael Chen', '0412 345 678')
ON CONFLICT (id) DO NOTHING;

-- Insert Scheme Members
INSERT INTO scheme_members (id, scheme_id, profile_id, unit_id, lot_number, status) VALUES 
('m1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'd8888888-8888-8888-8888-888888888888', 'Admin Office', 0, 'Active'),
('m2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'Unit 402', 42, 'Active')
ON CONFLICT DO NOTHING;

-- Insert Roles
INSERT INTO member_roles (member_id, role) VALUES 
('m1111111-1111-1111-1111-111111111111', 'Strata Manager'),
('m2222222-2222-2222-2222-222222222222', 'Lot Owner'),
('m2222222-2222-2222-2222-222222222222', 'Committee Member')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 3. Motions & Strata Governance Schema (NSW SSMA 2015 Compliant)
-- ============================================================================

-- Drop legacy table if previously created
DROP TABLE IF EXISTS motion_rfis CASCADE;

-- Motions Table (Committee and Community Voting Motions)
CREATE TABLE IF NOT EXISTS motions (
    id TEXT PRIMARY KEY,
    case_id TEXT,
    scheme_id TEXT NOT NULL,
    strata_plan TEXT,
    property_address TEXT,
    heading TEXT,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    voter_group TEXT DEFAULT 'committee_only' CHECK (voter_group IN ('committee_only', 'lot_owners', 'all_residents')),
    committee_size INTEGER DEFAULT 6,
    quorum_target INTEGER NOT NULL DEFAULT 4,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    original_deadline TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'passed', 'rejected', 'unresolved')),
    close_reason TEXT,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_work_order_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Motion Ballots Table (Official Committee Member Votes)
CREATE TABLE IF NOT EXISTS motion_ballots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    motion_id TEXT NOT NULL REFERENCES motions(id) ON DELETE CASCADE,
    voter_name TEXT NOT NULL,
    voter_role TEXT NOT NULL DEFAULT 'Committee Member',
    voter_office TEXT,
    vote TEXT NOT NULL CHECK (vote IN ('YES', 'NO', 'ABSTAIN')),
    comment TEXT,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (motion_id, voter_name)
);

-- Motion Quotes (Vendor Tenders & Estimates)
CREATE TABLE IF NOT EXISTS motion_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    motion_id TEXT NOT NULL REFERENCES motions(id) ON DELETE CASCADE,
    vendor_id TEXT,
    vendor_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    gst_included BOOLEAN DEFAULT TRUE,
    recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Motion Attachments (Submissions, Architectural Plans & Specs)
CREATE TABLE IF NOT EXISTS motion_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    motion_id TEXT NOT NULL REFERENCES motions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL DEFAULT '#',
    size TEXT,
    type TEXT DEFAULT 'original' CHECK (type IN ('original', 'revised')),
    uploaded_by TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Motion Comments (Committee Audit Trail & Discussions)
CREATE TABLE IF NOT EXISTS motion_comments (
    id TEXT PRIMARY KEY DEFAULT ('CMT-' || uuid_generate_v4()::text),
    motion_id TEXT NOT NULL REFERENCES motions(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for optimal lookup performance
CREATE INDEX IF NOT EXISTS idx_motions_scheme_id ON motions(scheme_id);
CREATE INDEX IF NOT EXISTS idx_motions_status ON motions(status);
CREATE INDEX IF NOT EXISTS idx_motion_ballots_motion_id ON motion_ballots(motion_id);
CREATE INDEX IF NOT EXISTS idx_motion_quotes_motion_id ON motion_quotes(motion_id);
CREATE INDEX IF NOT EXISTS idx_motion_attachments_motion_id ON motion_attachments(motion_id);
CREATE INDEX IF NOT EXISTS idx_motion_comments_motion_id ON motion_comments(motion_id);

-- Enable Row Level Security (RLS)
ALTER TABLE motions ENABLE ROW LEVEL SECURITY;
ALTER TABLE motion_ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE motion_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE motion_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE motion_comments ENABLE ROW LEVEL SECURITY;

-- Secure Authenticated RLS Policies
CREATE POLICY "Allow authenticated read on motions" ON motions
    FOR SELECT TO authenticated
    USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.members m
                WHERE m.scheme_id = motions.scheme_id
                AND m.user_id = auth.uid()
            ) OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.is_system_admin = TRUE
            )
        )
    );

CREATE POLICY "Allow manager write on motions" ON motions
    FOR ALL TO authenticated
    USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.members m
                WHERE m.scheme_id = motions.scheme_id
                AND m.user_id = auth.uid()
                AND m.role IN ('Strata Manager', 'Building Manager', 'Committee Member')
            ) OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.is_system_admin = TRUE
            )
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.members m
                WHERE m.scheme_id = motions.scheme_id
                AND m.user_id = auth.uid()
                AND m.role IN ('Strata Manager', 'Building Manager', 'Committee Member')
            ) OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.is_system_admin = TRUE
            )
        )
    );

CREATE POLICY "Allow authenticated read on motion_ballots" ON motion_ballots
    FOR SELECT TO authenticated
    USING (
        auth.uid() IS NOT NULL AND (
            voter_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.motions mo
                JOIN public.members m ON m.scheme_id = mo.scheme_id
                WHERE mo.id = motion_ballots.motion_id
                AND m.user_id = auth.uid()
                AND m.role IN ('Strata Manager', 'Building Manager', 'Committee Member')
            )
        )
    );

CREATE POLICY "Allow authenticated vote on motion_ballots" ON motion_ballots
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND voter_id = auth.uid()
    );

CREATE POLICY "Allow authenticated read on motion_quotes" ON motion_quotes
    FOR SELECT TO authenticated
    USING (
        auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.motions mo
            JOIN public.members m ON m.scheme_id = mo.scheme_id
            WHERE mo.id = motion_quotes.motion_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow manager write on motion_quotes" ON motion_quotes
    FOR ALL TO authenticated
    USING (
        auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.motions mo
            JOIN public.members m ON m.scheme_id = mo.scheme_id
            WHERE mo.id = motion_quotes.motion_id
            AND m.user_id = auth.uid()
            AND m.role IN ('Strata Manager', 'Building Manager')
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.motions mo
            JOIN public.members m ON m.scheme_id = mo.scheme_id
            WHERE mo.id = motion_quotes.motion_id
            AND m.user_id = auth.uid()
            AND m.role IN ('Strata Manager', 'Building Manager')
        )
    );

CREATE POLICY "Allow authenticated read on motion_attachments" ON motion_attachments
    FOR SELECT TO authenticated
    USING (
        auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.motions mo
            JOIN public.members m ON m.scheme_id = mo.scheme_id
            WHERE mo.id = motion_attachments.motion_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow manager write on motion_attachments" ON motion_attachments
    FOR ALL TO authenticated
    USING (
        auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.motions mo
            JOIN public.members m ON m.scheme_id = mo.scheme_id
            WHERE mo.id = motion_attachments.motion_id
            AND m.user_id = auth.uid()
            AND m.role IN ('Strata Manager', 'Building Manager')
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.motions mo
            JOIN public.members m ON m.scheme_id = mo.scheme_id
            WHERE mo.id = motion_attachments.motion_id
            AND m.user_id = auth.uid()
            AND m.role IN ('Strata Manager', 'Building Manager')
        )
    );

CREATE POLICY "Allow authenticated read on motion_comments" ON motion_comments
    FOR SELECT TO authenticated
    USING (
        auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.motions mo
            JOIN public.members m ON m.scheme_id = mo.scheme_id
            WHERE mo.id = motion_comments.motion_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow member insert motion_comments" ON motion_comments
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL AND author_id = auth.uid()
    );


-- ============================================================================
-- 4. Seed Data: 4 Realistic Strata Motions (2 Active, 1 Solved, 1 Rejected)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Motion 1: ACTIVE (SP52042 - 3/4 Quorum Votes, 1 More Needed to Pass)
-- ----------------------------------------------------------------------------
INSERT INTO motions (
    id, case_id, scheme_id, strata_plan, property_address, heading, title, summary,
    voter_group, committee_size, quorum_target, deadline, original_deadline, status
) VALUES (
    'MOT-CAV-501',
    'REQ-CAV-101',
    'SP52042',
    'SP 52042',
    '1 Pitt Street, Sydney NSW 2000',
    'Lobby Signage Upgrade',
    'Replace Lobby Directory Signage',
    'Approve replacing the old lobby directory board and front entry signs with modern aluminum panels ($3,850).',
    'committee_only',
    6,
    4,
    timezone('utc'::text, now() + interval '13 days'),
    timezone('utc'::text, now() + interval '6 days'),
    'active'
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    heading = EXCLUDED.heading,
    summary = EXCLUDED.summary,
    status = EXCLUDED.status,
    quorum_target = EXCLUDED.quorum_target;

-- Motion 1: Ballots
INSERT INTO motion_ballots (motion_id, voter_name, voter_role, voter_office, vote, comment, voted_at) VALUES
('MOT-CAV-501', 'Cameron', 'Committee Member', 'Chairperson', 'YES', 'Looks clean and fits building design guidelines.', timezone('utc'::text, now() - interval '3 days')),
('MOT-CAV-501', 'Joana', 'Committee Member', 'Treasurer', 'YES', 'Cost is within our maintenance budget.', timezone('utc'::text, now() - interval '2 days')),
('MOT-CAV-501', 'Jake', 'Committee Member', 'Secretary', 'YES', 'Contractor license and insurance verified.', timezone('utc'::text, now() - interval '1 day'))
ON CONFLICT (motion_id, voter_name) DO UPDATE SET vote = EXCLUDED.vote, comment = EXCLUDED.comment;

-- Motion 1: Quotes
INSERT INTO motion_quotes (motion_id, vendor_id, vendor_name, amount, gst_included, recommended) VALUES
('MOT-CAV-501', 'VND-002', 'Apex Architectural Facades NSW', 3850.00, true, true),
('MOT-CAV-501', 'VND-005', 'Sydney Signcraft & Cladding Co.', 4400.00, true, false);

-- Motion 1: Comments
INSERT INTO motion_comments (id, motion_id, author_name, author_role, text, created_at) VALUES
('C-CAV-1', 'MOT-CAV-501', 'John', 'Committee Member', 'New design looks clean and matches our foyer.', timezone('utc'::text, now() - interval '1 day')),
('C-CAV-2', 'MOT-CAV-501', 'Peter', 'Building Manager', 'Checked the wall anchors. Installation takes under 4 hours.', timezone('utc'::text, now() - interval '18 hours')),
('C-CAV-3', 'MOT-CAV-501', 'Steve', 'Strata Manager', 'Currently at 3 YES votes. Need 1 more vote to pass.', timezone('utc'::text, now() - interval '4 hours'))
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- Motion 2: ACTIVE (SP102 - Courtyard Hydraulics, 2/2 Quorum Met)
-- ----------------------------------------------------------------------------
INSERT INTO motions (
    id, case_id, scheme_id, strata_plan, property_address, heading, title, summary,
    voter_group, committee_size, quorum_target, deadline, status
) VALUES (
    'MOT-COR-201',
    'REQ-COR-202',
    'SP102',
    'SP 102',
    '14 Coronation Parade, Strathfield NSW 2135',
    'Courtyard Pipe Repairs',
    'Fix Courtyard Garden Water Pipes',
    'Approve contractor quote to fix leaking garden irrigation pipes and repair damaged pavers in the courtyard ($3,450).',
    'committee_only',
    3,
    2,
    timezone('utc'::text, now() + interval '17 days'),
    'active'
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    heading = EXCLUDED.heading,
    summary = EXCLUDED.summary,
    status = EXCLUDED.status;

-- Motion 2: Ballots
INSERT INTO motion_ballots (motion_id, voter_name, voter_role, voter_office, vote, comment, voted_at) VALUES
('MOT-COR-201', 'Marcus Sterling', 'Committee Member', 'Treasurer', 'YES', 'Apex quote is fair and within budget.', timezone('utc'::text, now() - interval '2 days')),
('MOT-COR-201', 'Michael Chen', 'Committee Member', 'Chairperson', 'YES', 'Inspected the courtyard leak. Approved.', timezone('utc'::text, now() - interval '1 day'))
ON CONFLICT (motion_id, voter_name) DO UPDATE SET vote = EXCLUDED.vote, comment = EXCLUDED.comment;

-- Motion 2: Quotes
INSERT INTO motion_quotes (motion_id, vendor_id, vendor_name, amount, gst_included, recommended) VALUES
('MOT-COR-201', 'VND-001', 'Sydney Apex Plumbing & Gas', 3450.00, true, true),
('MOT-COR-201', 'VND-004', 'Citywide Commercial Hydraulics', 4100.00, true, false);

-- Motion 2: Comments
INSERT INTO motion_comments (id, motion_id, author_name, author_role, text, created_at) VALUES
('C-MOT-COR-1', 'MOT-COR-201', 'Marcus Sterling', 'Committee Member', 'Apex surveyed the run. Quote is reasonable.', timezone('utc'::text, now() - interval '1 day'))
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- Motion 3: SOLVED (SP101 - Passed & Emergency Work Order WO-10482 Dispatched)
-- ----------------------------------------------------------------------------
INSERT INTO motions (
    id, case_id, scheme_id, strata_plan, property_address, heading, title, summary,
    voter_group, committee_size, quorum_target, deadline, status, created_work_order_id, closed_at, close_reason
) VALUES (
    'MOT-001',
    'REQ-101',
    'SP101',
    'SP 101',
    '88 Sunset Blvd, Cronulla NSW 2230',
    'Main Water Line Repair',
    'Emergency Main Water Line Replacement',
    'Emergency replacement of burst water supply line servicing Units 1-6. Work completed under Work Order WO-10482 ($3,450).',
    'committee_only',
    2,
    2,
    timezone('utc'::text, now() + interval '15 days'),
    'passed',
    'WO-10482',
    timezone('utc'::text, now() - interval '5 days'),
    'Quorum reached (2/2 YES). Emergency work order WO-10482 generated.'
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    heading = EXCLUDED.heading,
    summary = EXCLUDED.summary,
    status = EXCLUDED.status,
    created_work_order_id = EXCLUDED.created_work_order_id,
    close_reason = EXCLUDED.close_reason,
    closed_at = EXCLUDED.closed_at;

-- Motion 3: Ballots
INSERT INTO motion_ballots (motion_id, voter_name, voter_role, voter_office, vote, comment, voted_at) VALUES
('MOT-001', 'Sarah Jones', 'Committee Member', 'Chairperson', 'YES', 'Urgent repair approved.', timezone('utc'::text, now() - interval '6 days')),
('MOT-001', 'Robert Vance', 'Committee Member', 'Secretary', 'YES', 'Pipe replacement confirmed.', timezone('utc'::text, now() - interval '5 days'))
ON CONFLICT (motion_id, voter_name) DO UPDATE SET vote = EXCLUDED.vote, comment = EXCLUDED.comment;

-- Motion 3: Quotes
INSERT INTO motion_quotes (motion_id, vendor_id, vendor_name, amount, gst_included, recommended) VALUES
('MOT-001', 'VND-001', 'Sydney Apex Plumbing & Gas', 3450.00, true, true),
('MOT-001', 'VND-004', 'Citywide Commercial Hydraulics', 4100.00, true, false);


-- ----------------------------------------------------------------------------
-- Motion 4: REJECTED (SP52042 - Rooftop HVAC Acoustic Baffle Installation)
-- ----------------------------------------------------------------------------
INSERT INTO motions (
    id, case_id, scheme_id, strata_plan, property_address, heading, title, summary,
    voter_group, committee_size, quorum_target, deadline, status, closed_at, close_reason
) VALUES (
    'MOT-CAV-502',
    'REQ-CAV-104',
    'SP52042',
    'SP 52042',
    '1 Pitt Street, Sydney NSW 2000',
    'Rooftop Noise Dampening',
    'Rooftop AC Noise Barriers',
    'Proposal to install sound barriers around rooftop air conditioning units ($8,250).',
    'committee_only',
    6,
    4,
    timezone('utc'::text, now() - interval '1 day'),
    'rejected',
    timezone('utc'::text, now() - interval '1 day'),
    'Rejected by committee due to high cost ($8,250) and missing engineer sign-off.'
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    heading = EXCLUDED.heading,
    summary = EXCLUDED.summary,
    status = EXCLUDED.status,
    close_reason = EXCLUDED.close_reason,
    closed_at = EXCLUDED.closed_at;

-- Motion 4: Ballots (Rejected: 1 YES vs 2 NO)
INSERT INTO motion_ballots (motion_id, voter_name, voter_role, voter_office, vote, comment, voted_at) VALUES
('MOT-CAV-502', 'Cameron', 'Committee Member', 'Chairperson', 'YES', 'Need to reduce noise for top-floor units.', timezone('utc'::text, now() - interval '3 days')),
('MOT-CAV-502', 'Joana', 'Committee Member', 'Treasurer', 'NO', 'Too expensive ($8,250) and missing structural engineer approval.', timezone('utc'::text, now() - interval '2 days')),
('MOT-CAV-502', 'Jake', 'Committee Member', 'Secretary', 'NO', 'Missing council permits and crane access plan.', timezone('utc'::text, now() - interval '1 day'))
ON CONFLICT (motion_id, voter_name) DO UPDATE SET vote = EXCLUDED.vote, comment = EXCLUDED.comment;

-- Motion 4: Quotes
INSERT INTO motion_quotes (motion_id, vendor_id, vendor_name, amount, gst_included, recommended) VALUES
('MOT-CAV-502', 'VND-006', 'SoundShield Acoustic Engineering NSW', 8250.00, true, true),
('MOT-CAV-502', 'VND-007', 'Aeroflow HVAC & Sound Dampeners Pty Ltd', 9600.00, true, false);

-- Motion 4: Comments
INSERT INTO motion_comments (id, motion_id, author_name, author_role, text, created_at) VALUES
('CMT-RFI-502-1', 'MOT-CAV-502', 'Joana', 'Treasurer', 'Voted NO. Cost is unbudgeted and no structural engineer sign-off.', timezone('utc'::text, now() - interval '1 day')),
('CMT-RFI-502-2', 'MOT-CAV-502', 'Steve', 'Strata Manager', 'Motion concluded as rejected. Requester notified.', timezone('utc'::text, now() - interval '1 day'))
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 5. Vendor Management, Work Orders & Trades Compliance Schema
-- ============================================================================

-- Vendors (Accredited Building Contractors & Tradespeople)
CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY DEFAULT ('VND-' || UPPER(SUBSTRING(REPLACE(uuid_generate_v4()::TEXT, '-', ''), 1, 8))),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    website TEXT,
    abn TEXT NOT NULL,
    license_no TEXT NOT NULL,
    years_of_experience INTEGER DEFAULT 5,
    insurance_status TEXT NOT NULL DEFAULT 'Active' CHECK (insurance_status IN ('Active', 'Expired Ins.', 'Pending Verification')),
    insurance_expiry DATE NOT NULL,
    certificate_of_currency_url TEXT,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating >= 1.0 AND rating <= 5.0),
    onboarding_method TEXT NOT NULL DEFAULT 'manual' CHECK (onboarding_method IN ('manual', 'invite_portal')),
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- Scheme Vendors (Association with specific Strata Schemes)
CREATE TABLE IF NOT EXISTS scheme_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id TEXT NOT NULL,
    vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
    service_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    UNIQUE(scheme_id, vendor_id)
);

-- Vendor Invitations (Strata Manager Email & Token Invites)
CREATE TABLE IF NOT EXISTS vendor_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    category TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    invite_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'expired')),
    invited_by TEXT NOT NULL,
    submitted_vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::TEXT, now()) + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- Work Orders (Digital Job Dispatch & Completion Sign-Off)
CREATE TABLE IF NOT EXISTS work_orders (
    id TEXT PRIMARY KEY DEFAULT ('WO-' || UPPER(SUBSTRING(REPLACE(uuid_generate_v4()::TEXT, '-', ''), 1, 8))),
    case_id TEXT NOT NULL,
    scheme_id TEXT NOT NULL,
    vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    vendor_name TEXT NOT NULL,
    vendor_email TEXT,
    vendor_phone TEXT,
    scope_of_work TEXT NOT NULL,
    budget_cap NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    final_cost NUMERIC(12, 2),
    site_access_pin TEXT NOT NULL,
    guest_magic_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'in_progress', 'completion_submitted', 'completed')),
    completion_photo TEXT,
    invoice_pdf TEXT,
    submitted_at TIMESTAMPTZ,
    signed_off_at TIMESTAMPTZ,
    signed_off_by TEXT,
    sign_off_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- Vendor Quotes (Competitive Tender Submissions)
CREATE TABLE IF NOT EXISTS vendor_quotes (
    id TEXT PRIMARY KEY DEFAULT ('QTE-' || UPPER(SUBSTRING(REPLACE(uuid_generate_v4()::TEXT, '-', ''), 1, 8))),
    request_id TEXT NOT NULL,
    scheme_id TEXT NOT NULL,
    vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    vendor_name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    gst_included BOOLEAN NOT NULL DEFAULT TRUE,
    scope_notes TEXT NOT NULL,
    is_accredited BOOLEAN NOT NULL DEFAULT TRUE,
    is_selected BOOLEAN NOT NULL DEFAULT FALSE,
    insurance_status TEXT NOT NULL DEFAULT 'Active',
    insurance_expiry DATE NOT NULL,
    quote_doc_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- Quote Poll Votes (Strata Committee Trade Ballots)
CREATE TABLE IF NOT EXISTS quote_poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id TEXT NOT NULL,
    quote_id TEXT NOT NULL REFERENCES vendor_quotes(id) ON DELETE CASCADE,
    voter_name TEXT NOT NULL,
    voter_role TEXT NOT NULL DEFAULT 'Committee Member',
    voted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    UNIQUE(request_id, voter_name)
);

-- High-performance Vendor & Work Order Indexes
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_insurance_status ON vendors(insurance_status);
CREATE INDEX IF NOT EXISTS idx_scheme_vendors_scheme_id ON scheme_vendors(scheme_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_scheme_id ON work_orders(scheme_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_case_id ON work_orders(case_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_vendor_id ON work_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_guest_token ON work_orders(guest_magic_token);
CREATE INDEX IF NOT EXISTS idx_vendor_quotes_request_id ON vendor_quotes(request_id);
CREATE INDEX IF NOT EXISTS idx_quote_poll_votes_quote_id ON quote_poll_votes(quote_id);

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_poll_votes ENABLE ROW LEVEL SECURITY;

-- PostgREST API Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE vendors TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE scheme_vendors TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE vendor_invitations TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE work_orders TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE vendor_quotes TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE quote_poll_votes TO anon, authenticated, service_role;

-- Seed Data: Accredited Building Contractors
INSERT INTO vendors (
    id, name, category, abn, license_no, phone, email, insurance_status, insurance_expiry, rating
) VALUES 
('VND-001', 'Sydney Apex Plumbing & Gas', 'Plumbing & Drainage', '51 824 931 002', 'LIC-NSW-39812A', '02 9844 2001', 'dispatch@apexplumbing.com.au', 'Active', '2027-04-30', 4.90),
('VND-002', 'ElectroPro Strata Services', 'Electrical & Lighting', '32 901 445 119', 'LIC-NSW-84729E', '02 9512 8820', 'service@electropro.com.au', 'Active', '2026-11-15', 4.80),
('VND-003', 'Kone Elevator Maintenance NSW', 'Lift & Vertical Transport', '18 003 728 991', 'LIC-NSW-10492L', '1300 362 473', 'maintenance.sydney@kone.com', 'Active', '2028-01-01', 4.70),
('VND-004', 'Citywide Commercial Hydraulics', 'Plumbing & Drainage', '94 122 837 401', 'LIC-NSW-55421B', '02 9200 1188', 'estimating@citywidehydraulics.com.au', 'Active', '2027-08-31', 4.75),
('VND-006', 'SoundShield Acoustic Engineering NSW', 'Acoustic & Vibration Engineering', '44 812 390 118', 'LIC-NSW-99201S', '02 9188 4400', 'tenders@soundshield.com.au', 'Active', '2027-09-30', 4.90),
('VND-007', 'Aeroflow HVAC & Sound Dampeners Pty Ltd', 'Mechanical & Acoustic Services', '71 630 449 201', 'LIC-NSW-81042A', '02 9340 7711', 'estimating@aeroflow.com.au', 'Active', '2026-12-31', 4.60),
('VND-008', 'Apex Lift & Escalator Services', 'Lift & Vertical Transport', '64 109 233 801', 'LIC-NSW-77491L', '02 9155 3300', 'repairs@apexlifts.com.au', 'Active', '2027-06-30', 4.85)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    insurance_status = EXCLUDED.insurance_status,
    insurance_expiry = EXCLUDED.insurance_expiry;

-- Seed Scheme Vendor Preferred Mappings
INSERT INTO scheme_vendors (scheme_id, vendor_id, is_preferred) VALUES
('SP101', 'VND-001', TRUE),
('SP101', 'VND-002', TRUE),
('SP102', 'VND-001', TRUE),
('SP102', 'VND-004', FALSE),
('SP103', 'VND-001', TRUE),
('SP103', 'VND-003', TRUE),
('SP103', 'VND-008', TRUE),
('SP52042', 'VND-006', TRUE),
('SP52042', 'VND-007', FALSE)
ON CONFLICT (scheme_id, vendor_id) DO NOTHING;

-- Seed Synced Work Orders
INSERT INTO work_orders (
    id, case_id, scheme_id, vendor_id, vendor_name, vendor_email, vendor_phone,
    scope_of_work, budget_cap, final_cost, site_access_pin, guest_magic_token,
    status, completion_photo, invoice_pdf, submitted_at, signed_off_at, signed_off_by
) VALUES
(
    'WO-10483', 'REQ-CAV-301', 'SP103', 'VND-003', 'Kone Elevator Maintenance NSW', 'maintenance.sydney@kone.com', '1300 362 473',
    'Inspect and repair hydraulic motor & power inverter drive on Passenger Lift #2.',
    3400.00, 3400.00, '7392', 'tok_sp103_wo10483_live',
    'completion_submitted', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop', 'Tax_Invoice_INV-84920_KONE.pdf',
    timezone('utc'::TEXT, now()), NULL, NULL
),
(
    'WO-10484', 'REQ-CAV-302', 'SP103', 'VND-001', 'Sydney Apex Plumbing & Gas', 'dispatch@apexplumbing.com.au', '02 9844 2001',
    'Urgent hydro-jetting and main sewer line inspection in Basement B2.',
    1850.00, NULL, '5821', 'tok_sp103_wo10484_live',
    'issued', NULL, NULL, NULL, NULL, NULL
),
(
    'WO-10485', 'REQ-CAV-303', 'SP103', 'VND-008', 'Apex Lift & Escalator Services', 'repairs@apexlifts.com.au', '02 9155 3300',
    'Replacement of roller guides and landing door interlock contacts on Lift #1.',
    2200.00, 2150.00, '9144', 'tok_sp103_wo10485_live',
    'completed', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop', NULL,
    timezone('utc'::TEXT, now() - INTERVAL '1 day'), timezone('utc'::TEXT, now() - INTERVAL '1 day'), 'Emma Wilson (Strata Manager)'
)
ON CONFLICT (id) DO UPDATE SET 
    status = EXCLUDED.status,
    final_cost = EXCLUDED.final_cost,
    completion_photo = EXCLUDED.completion_photo,
    signed_off_at = EXCLUDED.signed_off_at,
    signed_off_by = EXCLUDED.signed_off_by;
