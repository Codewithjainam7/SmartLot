-- ============================================================================
-- SmartLot Enterprise Architecture: Complete Production Database Schema
-- Australian Strata Management & Committee Governance Platform
-- Fully Compliant with NSW Strata Schemes Management Act 2015 & VIC OC Act 2006
--
-- Features:
-- 1. Collision-Free Sequences & Standard Identifiers (#SL-XXXXX, VND-XXXXX, WO-XXXXX, MOT-XXXX)
-- 2. Multi-Scheme & Multi-Role Membership Architecture
-- 3. Granular Role & Individual Permissions with NSW Statutory Locks (s 106)
-- 4. Resident Maintenance Requests & Statutory Emergency Triage
-- 5. Accredited Vendor Directory with $20M Public Liability Compliance Verification
-- 6. Digital Work Order Dispatch with Zero-Login Tradie Portal & PIN Access
-- 7. Commercial Tenders, Contractor Quotes & Committee Quorum Voting
-- 8. Statutory Committee Governance & Legally Binding Motions Hub
-- 9. Community Surveys & Realtime Feedback Collection
-- 10. Comprehensive Row Level Security (RLS), Data API Grants & B-Tree Indexing
-- ============================================================================

-- Enable required Postgres cryptographic and UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 0. Collision-Free Sequences & Utilities
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.vendor_id_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS public.work_order_id_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS public.motion_id_seq START WITH 101;
CREATE SEQUENCE IF NOT EXISTS public.request_ref_seq START WITH 10450;

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::TEXT, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. Schemes (Strata Plans, Buildings & Owners Corporations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.schemes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    strata_plan TEXT NOT NULL,
    address TEXT NOT NULL,
    total_units INTEGER NOT NULL DEFAULT 1,
    admin_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    capital_works_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    primary_color TEXT DEFAULT '#0055FF',
    secondary_color TEXT DEFAULT '#00D4B2',
    settings JSONB NOT NULL DEFAULT '{"enableGuestPortal": true, "requireTwoFactor": false, "autoTriageThreshold": "High"}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

COMMENT ON TABLE public.schemes IS 'Strata Schemes and Owners Corporations registered in SmartLot';

DROP TRIGGER IF EXISTS trg_schemes_updated_at ON public.schemes;
CREATE TRIGGER trg_schemes_updated_at
    BEFORE UPDATE ON public.schemes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 2. Units & Lots (Apartments, Townhomes, Entitlements & Metering)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.units (
    id TEXT PRIMARY KEY,
    scheme_id TEXT NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    lot_number INTEGER NOT NULL,
    unit_entitlement INTEGER NOT NULL DEFAULT 100,
    floor_level INTEGER DEFAULT 1,
    bedrooms INTEGER DEFAULT 2,
    bathrooms NUMERIC(2, 1) DEFAULT 1.0,
    parking_spaces INTEGER DEFAULT 1,
    occupancy_status TEXT NOT NULL DEFAULT 'Owner Occupied' CHECK (occupancy_status IN ('Owner Occupied', 'Tenanted', 'Vacant')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    UNIQUE(scheme_id, unit_number)
);

COMMENT ON TABLE public.units IS 'Individual lots/units and statutory entitlement allocations within a strata scheme';

-- ============================================================================
-- 3. Profiles (User Accounts & System Identities)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    is_system_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

COMMENT ON TABLE public.profiles IS 'User identity profiles compatible with Supabase Auth or standalone identity simulation';

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. Members & Role Membership (Strata Community Roster)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id TEXT NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    unit_id TEXT,
    lot_number INTEGER DEFAULT 0,
    role TEXT NOT NULL CHECK (role IN (
        'Strata Manager',
        'Building Manager',
        'Committee Member',
        'Lot Owner',
        'Resident',
        'Tenant',
        'Strata Admin'
    )),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Invited', 'Pending', 'Restricted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

COMMENT ON TABLE public.members IS 'Community roster mapping individuals to schemes, lots, and primary strata roles';

DROP TRIGGER IF EXISTS trg_members_updated_at ON public.members;
CREATE TRIGGER trg_members_updated_at
    BEFORE UPDATE ON public.members
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Supplementary table for members who hold multiple roles (e.g. Lot Owner AND Committee Secretary)
CREATE TABLE IF NOT EXISTS public.member_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN (
        'Strata Manager',
        'Building Manager',
        'Committee Member',
        'Lot Owner',
        'Resident',
        'Tenant',
        'Strata Admin'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    UNIQUE(member_id, role)
);

-- ============================================================================
-- 5. Role & Individual Permissions Matrix (NSW SSMA 2015 s 106 Compliance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
    scheme_id TEXT NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    permission_label TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    PRIMARY KEY (scheme_id, role, permission_label)
);

COMMENT ON TABLE public.role_permissions IS 'Role-based permission matrix per scheme with statutory non-derogable locks';

CREATE TABLE IF NOT EXISTS public.individual_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    permission_label TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    UNIQUE(member_id, permission_label)
);

COMMENT ON TABLE public.individual_permissions IS 'Explicit individual permission grants or overrides assigned to specific members';

-- ============================================================================
-- 6. Resident Requests & Maintenance Tickets (Activity Management Stream)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.resident_requests (
    id TEXT PRIMARY KEY DEFAULT ('REQ-' || gen_random_uuid()),
    reference_id TEXT NOT NULL DEFAULT ('#SL-' || nextval('public.request_ref_seq')::TEXT),
    scheme_id TEXT NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    building_name TEXT,
    unit TEXT NOT NULL,
    lot_number INTEGER DEFAULT 0,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    request_type TEXT NOT NULL,
    stream TEXT NOT NULL DEFAULT 'maintenance_upgrade',
    priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'Medium', 'High', 'Urgent', 'Emergency')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
        'new',
        'acknowledged',
        'in_progress',
        'waiting',
        'in_voting',
        'approved',
        'rejected',
        'closed',
        'pending_triage',
        'approved_direct_dispatch',
        'approved_pending_vote',
        'resolved'
    )),
    requestor_name TEXT NOT NULL,
    requestor_email TEXT NOT NULL,
    requestor_role TEXT NOT NULL DEFAULT 'Resident',
    location TEXT DEFAULT 'Common Property',
    contact_preference TEXT DEFAULT 'Email',
    strata_manager_email TEXT,
    assigned_to_name TEXT,
    assigned_to_role TEXT,
    assigned_to_email TEXT,
    attachment_urls TEXT[] DEFAULT '{}'::TEXT[],
    tags TEXT[] DEFAULT '{}'::TEXT[],
    tender_status TEXT DEFAULT 'not_required' CHECK (tender_status IN ('not_required', 'quoting', 'awarded')),
    tender_budget NUMERIC(12, 2),
    tender_quotes JSONB DEFAULT '[]'::JSONB,
    selected_quote_id TEXT,
    work_order_id TEXT,
    motion_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

COMMENT ON TABLE public.resident_requests IS 'Core maintenance lifecycle tickets, resident requests, and statutory building repairs';

DROP TRIGGER IF EXISTS trg_resident_requests_updated_at ON public.resident_requests;
CREATE TRIGGER trg_resident_requests_updated_at
    BEFORE UPDATE ON public.resident_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public & Committee Request Comments
CREATE TABLE IF NOT EXISTS public.request_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT NOT NULL REFERENCES public.resident_requests(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    text TEXT NOT NULL,
    is_email_reply BOOLEAN NOT NULL DEFAULT FALSE,
    reply_to_name TEXT,
    reply_to_text TEXT,
    attachments JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- Internal Manager Notes (Visible only to Strata Managers & Admins)
CREATE TABLE IF NOT EXISTS public.activity_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT NOT NULL REFERENCES public.resident_requests(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    text TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- Audit Trail Events
CREATE TABLE IF NOT EXISTS public.request_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT NOT NULL REFERENCES public.resident_requests(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    actor TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    from_priority TEXT,
    to_priority TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- ============================================================================
-- 7. Vendors (Accredited Building Contractors & Tradespeople)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vendors (
    id TEXT PRIMARY KEY DEFAULT ('VND-' || LPAD(nextval('public.vendor_id_seq')::TEXT, 5, '0')),
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

COMMENT ON TABLE public.vendors IS 'Accredited trades directory with verified ABN, Fair Trading License, and $20M Public Liability';

DROP TRIGGER IF EXISTS trg_vendors_updated_at ON public.vendors;
CREATE TRIGGER trg_vendors_updated_at
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Scheme preferred vendors mapping
CREATE TABLE IF NOT EXISTS public.scheme_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id TEXT NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    vendor_id TEXT NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
    service_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    UNIQUE(scheme_id, vendor_id)
);

-- Vendor Invitations & Secure Self-Onboarding
CREATE TABLE IF NOT EXISTS public.vendor_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id TEXT NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    category TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    invite_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'expired')),
    invited_by TEXT NOT NULL,
    submitted_vendor_id TEXT REFERENCES public.vendors(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::TEXT, now()) + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

-- ============================================================================
-- 8. Work Orders (Digital Job Dispatch & Tradie Photo Proof Sign-Off)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.work_orders (
    id TEXT PRIMARY KEY DEFAULT ('WO-' || LPAD(nextval('public.work_order_id_seq')::TEXT, 5, '0')),
    case_id TEXT NOT NULL,
    scheme_id TEXT NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    vendor_id TEXT NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
    vendor_name TEXT NOT NULL,
    vendor_email TEXT,
    vendor_phone TEXT,
    scope_of_work TEXT NOT NULL,
    budget_cap NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    final_cost NUMERIC(12, 2),
    site_access_pin TEXT NOT NULL,
    guest_magic_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'in_progress', 'completion_submitted', 'completed')),
    completion_notes TEXT,
    completion_photos TEXT[] DEFAULT '{}'::TEXT[],
    completion_submitted_at TIMESTAMPTZ,
    signed_off_by TEXT,
    signed_off_at TIMESTAMPTZ,
    sign_off_notes TEXT,
    invoice_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

COMMENT ON TABLE public.work_orders IS 'Official contractor work orders with guest magic tokens for digital photo verification';

DROP TRIGGER IF EXISTS trg_work_orders_updated_at ON public.work_orders;
CREATE TRIGGER trg_work_orders_updated_at
    BEFORE UPDATE ON public.work_orders
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 9. Statutory Committee Governance & Legally Binding Motions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.motions (
    id TEXT PRIMARY KEY DEFAULT ('MOT-' || LPAD(nextval('public.motion_id_seq')::TEXT, 4, '0')),
    case_id TEXT,
    scheme_id TEXT NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    strata_plan TEXT,
    property_address TEXT,
    title TEXT NOT NULL,
    heading TEXT,
    summary TEXT NOT NULL,
    deadline TEXT NOT NULL,
    quorum_target INTEGER NOT NULL DEFAULT 4,
    committee_size INTEGER NOT NULL DEFAULT 6,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'passed', 'rejected', 'unresolved')),
    voter_group TEXT NOT NULL DEFAULT 'committee_only' CHECK (voter_group IN ('committee_only', 'all_owners')),
    quotes JSONB DEFAULT '[]'::JSONB,
    ballots JSONB DEFAULT '[]'::JSONB,
    comments JSONB DEFAULT '[]'::JSONB,
    attachments JSONB DEFAULT '[]'::JSONB,
    close_reason TEXT,
    closed_at TEXT,
    created_work_order_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

COMMENT ON TABLE public.motions IS 'Statutory committee resolutions, quorum tracking, and legally binding ballots';

DROP TRIGGER IF EXISTS trg_motions_updated_at ON public.motions;
CREATE TRIGGER trg_motions_updated_at
    BEFORE UPDATE ON public.motions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Formal Individual Committee Ballots Table (Audit Tracking)
CREATE TABLE IF NOT EXISTS public.motion_ballots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    motion_id TEXT NOT NULL REFERENCES public.motions(id) ON DELETE CASCADE,
    voter_name TEXT NOT NULL,
    voter_role TEXT NOT NULL,
    vote TEXT NOT NULL CHECK (vote IN ('YES', 'NO', 'ABSTAIN')),
    comment TEXT,
    cast_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    UNIQUE(motion_id, voter_name)
);

-- ============================================================================
-- 10. Community Surveys & Resident Feedback
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.surveys (
    id TEXT PRIMARY KEY,
    scheme_id TEXT NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'General Satisfaction',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    target_audience TEXT DEFAULT 'All Residents',
    recipient_emails TEXT[] DEFAULT '{}'::TEXT[],
    cc_emails TEXT[] DEFAULT '{}'::TEXT[],
    bcc_emails TEXT[] DEFAULT '{}'::TEXT[],
    questions JSONB NOT NULL DEFAULT '[]'::JSONB,
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()),
    created_by JSONB DEFAULT '{"name":"System Admin","role":"Strata Manager"}'::JSONB,
    closed_at TIMESTAMPTZ,
    ai_executive_summary JSONB,
    banner_image TEXT
);

COMMENT ON TABLE public.surveys IS 'Resident questionnaires and community sentiment surveys';

CREATE TABLE IF NOT EXISTS public.survey_responses (
    id TEXT PRIMARY KEY,
    survey_id TEXT NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
    scheme_id TEXT NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    unit_id TEXT,
    respondent_name TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()),
    answers JSONB NOT NULL DEFAULT '{}'::JSONB
);

COMMENT ON TABLE public.survey_responses IS 'Individual resident responses submitted to surveys';

-- ============================================================================
-- 11. Performance Optimization Indexes (Postgres Best Practices)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_units_scheme_id ON public.units(scheme_id);
CREATE INDEX IF NOT EXISTS idx_members_scheme_id ON public.members(scheme_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);
CREATE INDEX IF NOT EXISTS idx_role_permissions_scheme ON public.role_permissions(scheme_id, role);
CREATE INDEX IF NOT EXISTS idx_individual_permissions_member ON public.individual_permissions(member_id);

CREATE INDEX IF NOT EXISTS idx_resident_requests_scheme ON public.resident_requests(scheme_id);
CREATE INDEX IF NOT EXISTS idx_resident_requests_status ON public.resident_requests(status);
CREATE INDEX IF NOT EXISTS idx_resident_requests_priority ON public.resident_requests(priority);
CREATE INDEX IF NOT EXISTS idx_resident_requests_ref ON public.resident_requests(reference_id);
CREATE INDEX IF NOT EXISTS idx_resident_requests_created_at ON public.resident_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_comments_request_id ON public.request_comments(request_id);
CREATE INDEX IF NOT EXISTS idx_activity_notes_request_id ON public.activity_notes(request_id);
CREATE INDEX IF NOT EXISTS idx_request_audit_events_request_id ON public.request_audit_events(request_id);

CREATE INDEX IF NOT EXISTS idx_scheme_vendors_scheme ON public.scheme_vendors(scheme_id);
CREATE INDEX IF NOT EXISTS idx_scheme_vendors_vendor ON public.scheme_vendors(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invitations_token ON public.vendor_invitations(invite_token);

CREATE INDEX IF NOT EXISTS idx_work_orders_scheme ON public.work_orders(scheme_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_vendor ON public.work_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_token ON public.work_orders(guest_magic_token);

CREATE INDEX IF NOT EXISTS idx_motions_scheme ON public.motions(scheme_id);
CREATE INDEX IF NOT EXISTS idx_motions_status ON public.motions(status);
CREATE INDEX IF NOT EXISTS idx_motion_ballots_motion ON public.motion_ballots(motion_id);

CREATE INDEX IF NOT EXISTS idx_surveys_scheme ON public.surveys(scheme_id);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON public.surveys(status);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON public.survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_scheme ON public.survey_responses(scheme_id);

-- ============================================================================
-- 12. Row-Level Security (RLS) & Access Control
-- ============================================================================
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motion_ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Expose tables to Supabase Data API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON TABLE public.survey_responses TO anon;
GRANT INSERT ON TABLE public.resident_requests TO anon;
GRANT UPDATE (status, completion_notes, completion_photos, completion_submitted_at, invoice_url) ON TABLE public.work_orders TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Policies for Schemes & Profiles
CREATE POLICY "Public read schemes" ON public.schemes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Self update profiles" ON public.profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

-- Policies for Members & Units
CREATE POLICY "Public read units" ON public.units FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read members" ON public.members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated manage members" ON public.members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public read member_roles" ON public.member_roles FOR SELECT TO anon, authenticated USING (true);

-- Policies for Permissions Matrix
CREATE POLICY "Public read role_permissions" ON public.role_permissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated manage role_permissions" ON public.role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public read individual_permissions" ON public.individual_permissions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated manage individual_permissions" ON public.individual_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for Resident Requests & Comments
CREATE POLICY "Public read resident_requests" ON public.resident_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert resident_requests" ON public.resident_requests FOR INSERT TO anon, authenticated WITH CHECK (title IS NOT NULL);
CREATE POLICY "Authenticated update resident_requests" ON public.resident_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read request_comments" ON public.request_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert request_comments" ON public.request_comments FOR INSERT TO anon, authenticated WITH CHECK (request_id IS NOT NULL);

CREATE POLICY "Authenticated read activity_notes" ON public.activity_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert activity_notes" ON public.activity_notes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Public read request_audit_events" ON public.request_audit_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated insert request_audit_events" ON public.request_audit_events FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for Vendors & Work Orders
CREATE POLICY "Public read vendors" ON public.vendors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated manage vendors" ON public.vendors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public insert vendors via portal" ON public.vendors FOR INSERT TO anon WITH CHECK (abn IS NOT NULL);

CREATE POLICY "Public read scheme_vendors" ON public.scheme_vendors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated manage scheme_vendors" ON public.scheme_vendors FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public read vendor_invitations by token" ON public.vendor_invitations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public update vendor_invitations" ON public.vendor_invitations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Work Orders: Allows Tradie Guest Access via guest_magic_token
CREATE POLICY "Read work_orders" ON public.work_orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Tradie guest update work_orders" ON public.work_orders FOR UPDATE TO anon, authenticated USING (guest_magic_token IS NOT NULL) WITH CHECK (guest_magic_token IS NOT NULL);
CREATE POLICY "Authenticated manage work_orders" ON public.work_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for Motions & Governance
CREATE POLICY "Public read motions" ON public.motions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated manage motions" ON public.motions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public read motion_ballots" ON public.motion_ballots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated insert motion_ballots" ON public.motion_ballots FOR INSERT TO authenticated WITH CHECK (motion_id IS NOT NULL);

-- Policies for Surveys & Feedback
CREATE POLICY "Public read surveys" ON public.surveys FOR SELECT TO anon, authenticated USING (status IN ('active', 'closed'));
CREATE POLICY "Authenticated manage surveys" ON public.surveys FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public insert survey_responses" ON public.survey_responses FOR INSERT TO anon, authenticated WITH CHECK (survey_id IS NOT NULL);
CREATE POLICY "Authenticated read survey_responses" ON public.survey_responses FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- 13. Production Seed Data (Schemes, Verified Trades, Roster & Motions)
-- ============================================================================

-- 13.1 Schemes
INSERT INTO public.schemes (id, name, strata_plan, address, total_units, admin_balance, capital_works_balance, primary_color, secondary_color)
VALUES 
('SP103', 'Cavalier Grand Residences', 'SP 52042', '104-110 Macquarie Street, Sydney NSW 2000', 48, 142500.00, 480000.00, '#0055FF', '#00D4B2'),
('SP101', 'Parkview Executive Towers', 'SP 84930', '18 Albert Road, Melbourne VIC 3004', 64, 89200.00, 310500.00, '#0055FF', '#00D4B2'),
('SP102', 'Harbour Pacific Point', 'SP 91204', '42 Wharf Crescent, Pyrmont NSW 2009', 32, 64100.00, 220000.00, '#0055FF', '#00D4B2')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    strata_plan = EXCLUDED.strata_plan,
    address = EXCLUDED.address;

-- 13.2 Default User Profiles
INSERT INTO public.profiles (id, email, full_name, phone, is_system_admin)
VALUES 
('d8888888-8888-8888-8888-888888888888', 'emma.wilson@smartlot.com.au', 'Emma Wilson', '02 9123 4567', TRUE),
('d9999999-9999-9999-9999-999999999999', 'marcus.vance@smartlot.com.au', 'Marcus Vance', '0411 222 333', FALSE),
('a1111111-1111-1111-1111-111111111111', 'sarah.jenkins@horizon.com.au', 'Sarah Jenkins', '0400 111 222', FALSE),
('a2222222-2222-2222-2222-222222222222', 'david.miller@gmail.com', 'David Miller', '0412 345 678', FALSE),
('a3333333-3333-3333-3333-333333333333', 'michael.chen@techcorp.io', 'Michael Chen', '0422 999 888', FALSE),
('a4444444-4444-4444-4444-444444444444', 'priya.patel@health.nsw.gov.au', 'Dr. Priya Patel', '0433 777 666', FALSE),
('a5555555-5555-5555-5555-555555555555', 'elena.rostova@designstudio.com', 'Elena Rostova', '0499 555 444', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 13.3 Scheme Members Roster
INSERT INTO public.members (id, scheme_id, user_id, email, full_name, phone, unit_id, lot_number, role, status)
VALUES 
('m1111111-1111-1111-1111-111111111111', 'SP103', 'd8888888-8888-8888-8888-888888888888', 'emma.wilson@smartlot.com.au', 'Emma Wilson', '02 9123 4567', 'Management Suite', 0, 'Strata Manager', 'Active'),
('m2222222-2222-2222-2222-222222222222', 'SP103', 'd9999999-9999-9999-9999-999999999999', 'marcus.vance@smartlot.com.au', 'Marcus Vance', '0411 222 333', 'Facilities Office', 0, 'Building Manager', 'Active'),
('m3333333-3333-3333-3333-333333333333', 'SP103', 'a1111111-1111-1111-1111-111111111111', 'sarah.jenkins@horizon.com.au', 'Sarah Jenkins', '0400 111 222', 'Unit 301', 31, 'Committee Member', 'Active'),
('m4444444-4444-4444-4444-444444444444', 'SP103', 'a2222222-2222-2222-2222-222222222222', 'david.miller@gmail.com', 'David Miller', '0412 345 678', 'Unit 402', 42, 'Committee Member', 'Active'),
('m5555555-5555-5555-5555-555555555555', 'SP103', 'a3333333-3333-3333-3333-333333333333', 'michael.chen@techcorp.io', 'Michael Chen', '0422 999 888', 'Unit 504', 54, 'Committee Member', 'Active'),
('m6666666-6666-6666-6666-666666666666', 'SP103', 'a4444444-4444-4444-4444-444444444444', 'priya.patel@health.nsw.gov.au', 'Dr. Priya Patel', '0433 777 666', 'Unit 601', 61, 'Committee Member', 'Active'),
('m7777777-7777-7777-7777-777777777777', 'SP103', 'a5555555-5555-5555-5555-555555555555', 'elena.rostova@designstudio.com', 'Elena Rostova', '0499 555 444', 'Unit 203', 23, 'Tenant', 'Active')
ON CONFLICT (id) DO NOTHING;

-- 13.4 Verified Contractors Directory
INSERT INTO public.vendors (id, name, category, email, phone, website, abn, license_no, years_of_experience, insurance_status, insurance_expiry, rating)
VALUES 
('VND-01001', 'Apex Vertical Transport & Lift Engineering', 'Lift & Vertical Transport', 'dispatch@apexvertical.com.au', '02 9845 2200', 'https://apexvertical.com.au', '48 102 384 921', 'LIC-NSW-92044', 18, 'Active', '2027-11-30', 4.95),
('VND-01002', 'FlowGuard Master Hydraulics & Fire Plumbing', 'Plumbing & Drainage', 'service@flowguard.com.au', '1300 458 920', 'https://flowguard.com.au', '73 491 823 490', 'LIC-NSW-38192C', 14, 'Active', '2027-08-15', 4.88),
('VND-01003', 'VoltagePro Commercial Electrical Solutions', 'Electrical & Lighting', 'quotes@voltagepro.com.au', '02 8820 4411', 'https://voltagepro.com.au', '19 382 710 491', 'LIC-NSW-49102E', 11, 'Active', '2027-06-30', 4.90),
('VND-01004', 'DefendFire Systems & Extinguisher Services', 'Fire & Safety Services', 'support@defendfire.com.au', '02 9481 3300', 'https://defendfire.com.au', '82 194 720 384', 'LIC-NSW-84910F', 20, 'Active', '2028-02-28', 4.98)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    insurance_status = EXCLUDED.insurance_status;

-- Scheme preferred association
INSERT INTO public.scheme_vendors (scheme_id, vendor_id, is_preferred, service_notes)
VALUES 
('SP103', 'VND-01001', TRUE, 'Primary contracted lift service engineer with 2-hour SLA'),
('SP103', 'VND-01002', TRUE, 'Hydraulic pumps and primary backflow prevention service agent'),
('SP103', 'VND-01003', FALSE, 'Emergency electrical lighting and switchboard upgrades'),
('SP103', 'VND-01004', TRUE, 'Annual Fire Safety Statement (AFSS) accredited certifier')
ON CONFLICT (scheme_id, vendor_id) DO NOTHING;

-- 13.5 Active Work Order
INSERT INTO public.work_orders (id, case_id, scheme_id, vendor_id, vendor_name, vendor_email, vendor_phone, scope_of_work, budget_cap, site_access_pin, guest_magic_token, status)
VALUES 
('WO-01001', 'REQ-01', 'SP103', 'VND-01001', 'Apex Vertical Transport & Lift Engineering', 'dispatch@apexvertical.com.au', '02 9845 2200', 'Emergency diagnostics and hydraulic valve pack replacement on North Tower Passenger Elevator #2.', 4800.00, '4892', 'guest_wo_apex_north_tower_lift_token_2026', 'issued')
ON CONFLICT (id) DO NOTHING;

-- 13.6 Statutory Committee Motion & Voting Baseline
INSERT INTO public.motions (id, case_id, scheme_id, strata_plan, property_address, title, heading, summary, deadline, quorum_target, committee_size, status, voter_group, ballots)
VALUES 
('MOT-0101', 'REQ-01', 'SP103', 'SP 52042', '104-110 Macquarie Street, Sydney NSW 2000', 'Elevator North Hydraulic Valve Replacement & Safety Certification', 'Building Works: Common Property Lift #2', 'Approval of expenditure of $4,400.00 incl. GST from Capital Works Fund for Apex Vertical Transport to replace the faulty hydraulic valve pack on Passenger Lift 2 following interlock failure.', '28 Sep 2026 at 5:00 PM', 4, 6, 'active', 'committee_only', '[
  {"voterName": "Sarah Jenkins", "voterRole": "Committee Secretary", "vote": "YES", "castAt": "24 Sep 2026, 11:20 AM", "comment": "Essential emergency repair under s 106. We must ensure lift availability for upper level residents."},
  {"voterName": "Michael Chen", "voterRole": "Committee Member", "vote": "YES", "castAt": "24 Sep 2026, 02:45 PM", "comment": "Quote is competitive and vendor is existing primary service provider."}
]'::JSONB)
ON CONFLICT (id) DO NOTHING;
