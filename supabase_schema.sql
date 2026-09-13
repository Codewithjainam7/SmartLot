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

-- Permissive RLS Policies (for authenticated and client app access)
CREATE POLICY "Allow public read on motions" ON motions FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write on motions" ON motions FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on motion_ballots" ON motion_ballots FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write on motion_ballots" ON motion_ballots FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on motion_quotes" ON motion_quotes FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write on motion_quotes" ON motion_quotes FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on motion_attachments" ON motion_attachments FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write on motion_attachments" ON motion_attachments FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on motion_comments" ON motion_comments FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write on motion_comments" ON motion_comments FOR ALL TO public USING (true) WITH CHECK (true);


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



