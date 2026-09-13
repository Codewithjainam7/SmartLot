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

-- Motion RFIs (Request for Information / Clarification)
CREATE TABLE IF NOT EXISTS motion_rfis (
    id TEXT PRIMARY KEY,
    motion_id TEXT NOT NULL REFERENCES motions(id) ON DELETE CASCADE,
    requested_by TEXT NOT NULL,
    requested_role TEXT NOT NULL DEFAULT 'Committee Member',
    question TEXT NOT NULL,
    extended_days INTEGER DEFAULT 7,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'addressed')),
    response_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    addressed_at TIMESTAMP WITH TIME ZONE
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

-- Motion Attachments (Original Submissions and Revised Specs)
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
CREATE INDEX IF NOT EXISTS idx_motion_rfis_motion_id ON motion_rfis(motion_id);
CREATE INDEX IF NOT EXISTS idx_motion_quotes_motion_id ON motion_quotes(motion_id);
CREATE INDEX IF NOT EXISTS idx_motion_attachments_motion_id ON motion_attachments(motion_id);
CREATE INDEX IF NOT EXISTS idx_motion_comments_motion_id ON motion_comments(motion_id);

-- Enable Row Level Security (RLS)
ALTER TABLE motions ENABLE ROW LEVEL SECURITY;
ALTER TABLE motion_ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE motion_rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE motion_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE motion_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE motion_comments ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies (for authenticated and client app access)
CREATE POLICY "Allow public read on motions" ON motions FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write on motions" ON motions FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on motion_ballots" ON motion_ballots FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write on motion_ballots" ON motion_ballots FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on motion_rfis" ON motion_rfis FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write on motion_rfis" ON motion_rfis FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on motion_quotes" ON motion_quotes FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write on motion_quotes" ON motion_quotes FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on motion_attachments" ON motion_attachments FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write on motion_attachments" ON motion_attachments FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read on motion_comments" ON motion_comments FOR SELECT TO public USING (true);
CREATE POLICY "Allow public write on motion_comments" ON motion_comments FOR ALL TO public USING (true) WITH CHECK (true);


-- ============================================================================
-- 4. Seed Data: 4 Realistic Strata Motions (2 Active, 1 Solved, 1 Under RFI)
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
    'Lot Owner Request: Common Property Signage & Facade Modernisation',
    'SP 52042 - 1 Pitt Street, Sydney NSW 2000 - Lot Owner Request: Common Property Signage & Facade Modernisation',
    'Official Strata Committee Motion to approve Lot 4 owner Jack''s request for replacing aged common lobby directory signage and exterior entry cladding with architect-specified architectural aluminum panels, funded under capital works fund.',
    'committee_only',
    6,
    4,
    timezone('utc'::text, now() + interval '13 days'),
    timezone('utc'::text, now() + interval '6 days'),
    'active'
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    status = EXCLUDED.status,
    quorum_target = EXCLUDED.quorum_target;

-- Motion 1: Ballots (Cameron - Chairperson, Joana - Treasurer, Jake - Secretary)
INSERT INTO motion_ballots (motion_id, voter_name, voter_role, voter_office, vote, comment, voted_at) VALUES
('MOT-CAV-501', 'Cameron', 'Committee Member', 'Chairperson', 'YES', 'Complies with building by-laws and architectural guidelines.', timezone('utc'::text, now() - interval '3 days')),
('MOT-CAV-501', 'Joana', 'Committee Member', 'Treasurer', 'YES', 'Cost is fully budgeted under line item 4.2 in capital works fund.', timezone('utc'::text, now() - interval '2 days')),
('MOT-CAV-501', 'Jake', 'Committee Member', 'Secretary', 'YES', 'All notices and contractor insurance verified.', timezone('utc'::text, now() - interval '1 day'))
ON CONFLICT (motion_id, voter_name) DO UPDATE SET vote = EXCLUDED.vote, comment = EXCLUDED.comment;

-- Motion 1: Quotes
INSERT INTO motion_quotes (motion_id, vendor_id, vendor_name, amount, gst_included, recommended) VALUES
('MOT-CAV-501', 'VND-002', 'Apex Architectural Facades NSW', 3850.00, true, true),
('MOT-CAV-501', 'VND-005', 'Sydney Signcraft & Cladding Co.', 4400.00, true, false);

-- Motion 1: RFI History (Addressed clarification)
INSERT INTO motion_rfis (id, motion_id, requested_by, requested_role, question, extended_days, status, response_note, created_at, addressed_at) VALUES
('RFI-001', 'MOT-CAV-501', 'John', 'Committee Member', 'Could the requester please provide an updated design mockup in forest green accent to match our foyer redesign palette?', 7, 'addressed', 'Jack provided revised design photos and specs on 12 Sep 2026. Deadline extended by 7 days.', timezone('utc'::text, now() - interval '2 days'), timezone('utc'::text, now() - interval '1 day'))
ON CONFLICT (id) DO NOTHING;

-- Motion 1: Comments
INSERT INTO motion_comments (id, motion_id, author_name, author_role, text, created_at) VALUES
('C-CAV-1', 'MOT-CAV-501', 'John', 'Committee Member', 'I requested updated signage design in green to match foyer aesthetics. Requester resubmitted revised attachments, looks much better now!', timezone('utc'::text, now() - interval '1 day')),
('C-CAV-2', 'MOT-CAV-501', 'Peter', 'Building Manager', 'As Building Manager, I checked the structural anchors on the ground floor foyer wall. Conduit paths are clear and installation will take less than 4 hours.', timezone('utc'::text, now() - interval '18 hours')),
('C-CAV-3', 'MOT-CAV-501', 'Steve', 'Strata Manager', 'Thank you Peter and John. The motion is currently at 3 YES votes. We require 1 more vote (4 votes out of 6) to reach statutory threshold and pass.', timezone('utc'::text, now() - interval '4 hours'))
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
    'Urgent Maintenance: Podium Courtyard Hydraulics',
    'SP 102 - 14 Coronation Parade - Central Garden Courtyard Hydraulic Line Overhaul & Resurfacing',
    'Resolution to accept contractor tender for excavating cracked terracotta irrigation pipes causing water seepage, replacing with 32mm PN16 high-density polyethylene, and restoring sandstone courtyard pavers.',
    'committee_only',
    3,
    2,
    timezone('utc'::text, now() + interval '17 days'),
    'active'
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    status = EXCLUDED.status;

-- Motion 2: Ballots
INSERT INTO motion_ballots (motion_id, voter_name, voter_role, voter_office, vote, comment, voted_at) VALUES
('MOT-COR-201', 'Marcus Sterling', 'Committee Member', 'Treasurer', 'YES', 'Apex quote is within budget and administrative fund cap.', timezone('utc'::text, now() - interval '2 days')),
('MOT-COR-201', 'Michael Chen', 'Committee Member', 'Chairperson', 'YES', 'Basement line inspection verified. Fully approved.', timezone('utc'::text, now() - interval '1 day'))
ON CONFLICT (motion_id, voter_name) DO UPDATE SET vote = EXCLUDED.vote, comment = EXCLUDED.comment;

-- Motion 2: Quotes
INSERT INTO motion_quotes (motion_id, vendor_id, vendor_name, amount, gst_included, recommended) VALUES
('MOT-COR-201', 'VND-001', 'Sydney Apex Plumbing & Gas', 3450.00, true, true),
('MOT-COR-201', 'VND-004', 'Citywide Commercial Hydraulics', 4100.00, true, false);

-- Motion 2: Comments
INSERT INTO motion_comments (id, motion_id, author_name, author_role, text, created_at) VALUES
('C-MOT-COR-1', 'MOT-COR-201', 'Marcus Sterling', 'Committee Member', 'Apex Plumbing already surveyed the basement run. Quote is reasonable and within administrative fund cap.', timezone('utc'::text, now() - interval '1 day'))
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
    'Emergency Repair: Common Water Main Supply Line',
    'SP 101 - 88 Sunset Blvd - Common Area Main Water Line Replacement',
    'Resolution to accept contractor tender for replacing damaged 50mm copper hydraulic supply line servicing Lots 1-6 following water hammer failure.',
    'committee_only',
    2,
    2,
    timezone('utc'::text, now() + interval '15 days'),
    'passed',
    'WO-10482',
    timezone('utc'::text, now() - interval '5 days'),
    'Statutory quorum achieved (2/2 YES votes). Emergency work order WO-10482 generated.'
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    status = EXCLUDED.status,
    created_work_order_id = EXCLUDED.created_work_order_id;

-- Motion 3: Ballots
INSERT INTO motion_ballots (motion_id, voter_name, voter_role, voter_office, vote, comment, voted_at) VALUES
('MOT-001', 'Sarah Jones', 'Committee Member', 'Chairperson', 'YES', 'Urgent hydraulic repair approved.', timezone('utc'::text, now() - interval '6 days')),
('MOT-001', 'Robert Vance', 'Committee Member', 'Secretary', 'YES', 'Basement riser replacement confirmed.', timezone('utc'::text, now() - interval '5 days'))
ON CONFLICT (motion_id, voter_name) DO UPDATE SET vote = EXCLUDED.vote, comment = EXCLUDED.comment;

-- Motion 3: Quotes
INSERT INTO motion_quotes (motion_id, vendor_id, vendor_name, amount, gst_included, recommended) VALUES
('MOT-001', 'VND-001', 'Sydney Apex Plumbing & Gas', 3450.00, true, true),
('MOT-001', 'VND-004', 'Citywide Commercial Hydraulics', 4100.00, true, false);


-- ----------------------------------------------------------------------------
-- Motion 4: UNDER RFI (SP52042 - Rooftop HVAC Acoustic Baffle Installation)
-- ----------------------------------------------------------------------------
INSERT INTO motions (
    id, case_id, scheme_id, strata_plan, property_address, heading, title, summary,
    voter_group, committee_size, quorum_target, deadline, original_deadline, status
) VALUES (
    'MOT-CAV-502',
    'REQ-CAV-104',
    'SP52042',
    'SP 52042',
    '1 Pitt Street, Sydney NSW 2000',
    'Capital Works: Rooftop HVAC Acoustic Attenuation Baffle',
    'SP 52042 - 1 Pitt Street, Sydney NSW 2000 - Rooftop HVAC Plant Acoustic Baffle Installation & Vibration Dampening',
    'Motion to approve $8,250 capital works expenditure to fabricate and install high-density acoustic attenuation louvers and spring-isolated inertia bases around rooftop cooling towers following resident acoustic complaints.',
    'committee_only',
    6,
    4,
    timezone('utc'::text, now() + interval '25 days'),
    timezone('utc'::text, now() + interval '11 days'),
    'unresolved'
) ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    status = EXCLUDED.status,
    deadline = EXCLUDED.deadline;

-- Motion 4: Open RFI (Request for Information from Treasurer Joana)
INSERT INTO motion_rfis (id, motion_id, requested_by, requested_role, question, extended_days, status, created_at) VALUES
(
    'RFI-CAV-002',
    'MOT-CAV-502',
    'Joana',
    'Treasurer',
    'Before the committee approves $8,250 from capital works, we require an independent acoustic engineer dB test certifying compliance with Council Night-Time Noise Policy (AS 1055), plus structural engineer sign-off on rooftop load limits.',
    14,
    'open',
    timezone('utc'::text, now() - interval '1 day')
) ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, status = EXCLUDED.status;

-- Motion 4: Ballots (1 YES vote so far, voting paused pending RFI documentation)
INSERT INTO motion_ballots (motion_id, voter_name, voter_role, voter_office, vote, comment, voted_at) VALUES
('MOT-CAV-502', 'Cameron', 'Committee Member', 'Chairperson', 'YES', 'Acoustic remediation is necessary to mitigate resident complaints and prevent council fines.', timezone('utc'::text, now() - interval '2 days'))
ON CONFLICT (motion_id, voter_name) DO UPDATE SET vote = EXCLUDED.vote, comment = EXCLUDED.comment;

-- Motion 4: Quotes
INSERT INTO motion_quotes (motion_id, vendor_id, vendor_name, amount, gst_included, recommended) VALUES
('MOT-CAV-502', 'VND-006', 'SoundShield Acoustic Engineering NSW', 8250.00, true, true),
('MOT-CAV-502', 'VND-007', 'Aeroflow HVAC & Sound Dampeners Pty Ltd', 9600.00, true, false);

-- Motion 4: Comments
INSERT INTO motion_comments (id, motion_id, author_name, author_role, text, created_at) VALUES
('CMT-RFI-502-1', 'MOT-CAV-502', 'Joana', 'Treasurer', '⚠️ Request for Information (RFI) Raised: "Before the committee approves $8,250 from capital works, we require an independent acoustic engineer dB test certifying compliance with Council Night-Time Noise Policy (AS 1055), plus structural engineer sign-off on rooftop load limits.". Voting deadline extended by 14 days.', timezone('utc'::text, now() - interval '1 day')),
('CMT-RFI-502-2', 'MOT-CAV-502', 'Peter', 'Building Manager', 'I have contacted SoundShield Acoustic Engineering to schedule the calibrated sound meter testing on Friday evening. Structural plans have also been dispatched to the consulting engineer.', timezone('utc'::text, now() - interval '6 hours'))
ON CONFLICT (id) DO NOTHING;

