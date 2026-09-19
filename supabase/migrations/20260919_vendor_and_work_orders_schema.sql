-- ============================================================================
-- Migration: Vendor, Trade Compliance, Quote Tenders & Work Order Execution
-- Schema for Australian Strata Operations (NSW SSMA 2015 & VIC Owners Corp Act)
-- Production Hardened: Secure RLS, Sequence Identifiers, Foreign Key Indexing,
-- Automatic Timestamps, and Zero-Login Tradie RPC Methods
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 0. Collision-Free Production Sequences
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.vendor_id_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS public.work_order_id_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS public.vendor_quote_id_seq START WITH 1001;

-- ============================================================================
-- 1. Vendors (Accredited Building Contractors & Tradespeople)
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

COMMENT ON TABLE public.vendors IS 'Accredited building trades and contractors accredited for strata maintenance';
COMMENT ON COLUMN public.vendors.abn IS 'Australian Business Number (11 digits formatted)';
COMMENT ON COLUMN public.vendors.license_no IS 'State contractor license or fair trading trade license number';
COMMENT ON COLUMN public.vendors.insurance_status IS 'Compliance status of Public Liability Insurance ($20M minimum for strata)';
COMMENT ON COLUMN public.vendors.certificate_of_currency_url IS 'Document storage URL for verified insurance policy PDF';

-- ============================================================================
-- 2. Scheme Vendors (Building/Strata Scheme Association & Preferred Status)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scheme_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id TEXT NOT NULL,
    vendor_id TEXT NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    is_preferred BOOLEAN NOT NULL DEFAULT FALSE,
    service_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    UNIQUE(scheme_id, vendor_id)
);

COMMENT ON TABLE public.scheme_vendors IS 'Maps vendors to specific strata schemes (e.g. SP101, SP103) with preferred trade designation';

-- ============================================================================
-- 3. Vendor Invitations (Strata Manager Secure Onboarding Portal Tokens)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vendor_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id TEXT NOT NULL,
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

COMMENT ON TABLE public.vendor_invitations IS 'Audit log of invitations dispatched to trade contractors with secure single-use tokens';

-- ============================================================================
-- 4. Work Orders (Digital Job Dispatch & Zero-Login Tradie Verification)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.work_orders (
    id TEXT PRIMARY KEY DEFAULT ('WO-' || LPAD(nextval('public.work_order_id_seq')::TEXT, 5, '0')),
    case_id TEXT NOT NULL,
    scheme_id TEXT NOT NULL,
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
    completion_photo TEXT,
    invoice_pdf TEXT,
    submitted_at TIMESTAMPTZ,
    signed_off_at TIMESTAMPTZ,
    signed_off_by TEXT,
    sign_off_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now())
);

COMMENT ON TABLE public.work_orders IS 'Strata work orders dispatched to trades with encrypted zero-login tokens and completion verification';
COMMENT ON COLUMN public.work_orders.site_access_pin IS 'Secure digital building intercom / key box PIN generated for trade entry';
COMMENT ON COLUMN public.work_orders.guest_magic_token IS 'Encrypted single-use token enabling tradie photo & invoice upload without user account';
COMMENT ON COLUMN public.work_orders.final_cost IS 'Contractor billed amount ex-GST verified against approved budget cap';

-- ============================================================================
-- 5. Vendor Quotes (Competitive Tender Bids & Committee Quote Polls)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vendor_quotes (
    id TEXT PRIMARY KEY DEFAULT ('QTE-' || LPAD(nextval('public.vendor_quote_id_seq')::TEXT, 5, '0')),
    request_id TEXT NOT NULL,
    scheme_id TEXT NOT NULL,
    motion_id TEXT REFERENCES public.motions(id) ON DELETE SET NULL,
    vendor_id TEXT NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
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

COMMENT ON TABLE public.vendor_quotes IS 'Quotes received from contractors for building repairs and comparative tenders (links to motions)';

-- ============================================================================
-- 6. Quote Poll Votes (Strata Committee Trade Ballots)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quote_poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id TEXT NOT NULL,
    quote_id TEXT NOT NULL REFERENCES public.vendor_quotes(id) ON DELETE CASCADE,
    voter_name TEXT NOT NULL,
    voter_role TEXT NOT NULL DEFAULT 'Committee Member',
    voted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::TEXT, now()),
    UNIQUE(request_id, voter_name)
);

COMMENT ON TABLE public.quote_poll_votes IS 'Official committee member votes on competing contractor quotes';

-- ============================================================================
-- 7. High-Performance Foreign Key & Query Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_vendors_category ON public.vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_insurance_status ON public.vendors(insurance_status);

CREATE INDEX IF NOT EXISTS idx_scheme_vendors_scheme_id ON public.scheme_vendors(scheme_id);
CREATE INDEX IF NOT EXISTS idx_scheme_vendors_vendor_id ON public.scheme_vendors(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_invitations_scheme_id ON public.vendor_invitations(scheme_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invitations_invite_token ON public.vendor_invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_vendor_invitations_submitted_vendor_id ON public.vendor_invitations(submitted_vendor_id);

CREATE INDEX IF NOT EXISTS idx_work_orders_scheme_id ON public.work_orders(scheme_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_case_id ON public.work_orders(case_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_vendor_id ON public.work_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_guest_token ON public.work_orders(guest_magic_token);

CREATE INDEX IF NOT EXISTS idx_vendor_quotes_request_id ON public.vendor_quotes(request_id);
CREATE INDEX IF NOT EXISTS idx_vendor_quotes_scheme_id ON public.vendor_quotes(scheme_id);
CREATE INDEX IF NOT EXISTS idx_vendor_quotes_motion_id ON public.vendor_quotes(motion_id);
CREATE INDEX IF NOT EXISTS idx_vendor_quotes_vendor_id ON public.vendor_quotes(vendor_id);

CREATE INDEX IF NOT EXISTS idx_quote_poll_votes_quote_id ON public.quote_poll_votes(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_poll_votes_request_id ON public.quote_poll_votes(request_id);

-- ============================================================================
-- 8. Automatic Timestamp Triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::TEXT, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vendors_updated_at ON public.vendors;
CREATE TRIGGER trg_vendors_updated_at
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_work_orders_updated_at ON public.work_orders;
CREATE TRIGGER trg_work_orders_updated_at
    BEFORE UPDATE ON public.work_orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 9. Row-Level Security (RLS) & Zero-Trust Policies
-- ============================================================================
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_poll_votes ENABLE ROW LEVEL SECURITY;

-- Clean existing policies for idempotence
DROP POLICY IF EXISTS "Vendors authenticated full access" ON public.vendors;
DROP POLICY IF EXISTS "Vendors anon onboarding insert" ON public.vendors;
DROP POLICY IF EXISTS "Vendors anon active read" ON public.vendors;
DROP POLICY IF EXISTS "Anon can view and register via vendor portal" ON public.vendors;
DROP POLICY IF EXISTS "Anon can read vendor records" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated full control on vendor tables" ON public.vendors;

DROP POLICY IF EXISTS "Scheme vendors authenticated full access" ON public.scheme_vendors;
DROP POLICY IF EXISTS "Scheme vendors anon read" ON public.scheme_vendors;

DROP POLICY IF EXISTS "Invitations authenticated full access" ON public.vendor_invitations;
DROP POLICY IF EXISTS "Invitations anon token read" ON public.vendor_invitations;

DROP POLICY IF EXISTS "Work orders authenticated full access" ON public.work_orders;
DROP POLICY IF EXISTS "Work orders tradie guest token access" ON public.work_orders;
DROP POLICY IF EXISTS "Tradie can view own work order via guest token" ON public.work_orders;
DROP POLICY IF EXISTS "Tradie can update work order completion" ON public.work_orders;
DROP POLICY IF EXISTS "Authenticated full control on work orders" ON public.work_orders;

DROP POLICY IF EXISTS "Vendor quotes authenticated full access" ON public.vendor_quotes;
DROP POLICY IF EXISTS "Authenticated full control on quotes" ON public.vendor_quotes;

DROP POLICY IF EXISTS "Quote votes authenticated full access" ON public.quote_poll_votes;
DROP POLICY IF EXISTS "Authenticated full control on quote votes" ON public.quote_poll_votes;

-- VENDORS POLICIES:
CREATE POLICY "Vendors authenticated full access" ON public.vendors
    FOR ALL TO authenticated
    USING ((SELECT auth.uid()) IS NOT NULL)
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Vendors anon onboarding insert" ON public.vendors
    FOR INSERT TO anon
    WITH CHECK (
        insurance_status = 'Pending Verification' 
        AND onboarding_method = 'invite_portal'
    );

CREATE POLICY "Vendors anon active read" ON public.vendors
    FOR SELECT TO anon
    USING (insurance_status = 'Active');

-- SCHEME VENDORS POLICIES:
CREATE POLICY "Scheme vendors authenticated full access" ON public.scheme_vendors
    FOR ALL TO authenticated
    USING (
        (SELECT auth.uid()) IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.scheme_members sm
                WHERE sm.scheme_id::TEXT = scheme_vendors.scheme_id
                AND sm.profile_id = (SELECT auth.uid())
            ) OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = (SELECT auth.uid())
            )
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.scheme_members sm
                WHERE sm.scheme_id::TEXT = scheme_vendors.scheme_id
                AND sm.profile_id = (SELECT auth.uid())
            ) OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = (SELECT auth.uid())
            )
        )
    );

CREATE POLICY "Scheme vendors anon read" ON public.scheme_vendors
    FOR SELECT TO anon
    USING (is_preferred = TRUE);

-- VENDOR INVITATIONS POLICIES:
CREATE POLICY "Invitations authenticated full access" ON public.vendor_invitations
    FOR ALL TO authenticated
    USING (
        (SELECT auth.uid()) IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.scheme_members sm
                WHERE sm.scheme_id::TEXT = vendor_invitations.scheme_id
                AND sm.profile_id = (SELECT auth.uid())
            ) OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = (SELECT auth.uid())
            )
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.scheme_members sm
                WHERE sm.scheme_id::TEXT = vendor_invitations.scheme_id
                AND sm.profile_id = (SELECT auth.uid())
            ) OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = (SELECT auth.uid())
            )
        )
    );

CREATE POLICY "Invitations anon token read" ON public.vendor_invitations
    FOR SELECT TO anon
    USING (
        status = 'pending' 
        AND expires_at > timezone('utc'::TEXT, now())
    );

-- WORK ORDERS POLICIES:
CREATE POLICY "Work orders authenticated full access" ON public.work_orders
    FOR ALL TO authenticated
    USING (
        (SELECT auth.uid()) IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.scheme_members sm
                WHERE sm.scheme_id::TEXT = work_orders.scheme_id
                AND sm.profile_id = (SELECT auth.uid())
            ) OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = (SELECT auth.uid())
            )
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.scheme_members sm
                WHERE sm.scheme_id::TEXT = work_orders.scheme_id
                AND sm.profile_id = (SELECT auth.uid())
            ) OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = (SELECT auth.uid())
            )
        )
    );

CREATE POLICY "Work orders tradie guest token access" ON public.work_orders
    FOR SELECT TO anon
    USING (
        guest_magic_token IS NOT NULL
        AND guest_magic_token = COALESCE(
            current_setting('request.headers', true)::json->>'x-guest-token',
            ''
        )
    );

-- VENDOR QUOTES & QUOTE VOTES POLICIES:
CREATE POLICY "Vendor quotes authenticated full access" ON public.vendor_quotes
    FOR ALL TO authenticated
    USING (
        (SELECT auth.uid()) IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.scheme_members sm
                WHERE sm.scheme_id::TEXT = vendor_quotes.scheme_id
                AND sm.profile_id = (SELECT auth.uid())
            ) OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = (SELECT auth.uid())
            )
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.scheme_members sm
                WHERE sm.scheme_id::TEXT = vendor_quotes.scheme_id
                AND sm.profile_id = (SELECT auth.uid())
            ) OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = (SELECT auth.uid())
            )
        )
    );

CREATE POLICY "Quote votes authenticated full access" ON public.quote_poll_votes
    FOR ALL TO authenticated
    USING (
        (SELECT auth.uid()) IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.vendor_quotes vq
                JOIN public.scheme_members sm ON sm.scheme_id::TEXT = vq.scheme_id
                WHERE vq.id = quote_poll_votes.quote_id
                AND sm.profile_id = (SELECT auth.uid())
            ) OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = (SELECT auth.uid())
            )
        )
    )
    WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.vendor_quotes vq
                JOIN public.scheme_members sm ON sm.scheme_id::TEXT = vq.scheme_id
                WHERE vq.id = quote_poll_votes.quote_id
                AND sm.profile_id = (SELECT auth.uid())
            ) OR
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = (SELECT auth.uid())
            )
        )
    );

-- PostgREST API Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vendors TO authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public.vendors TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scheme_vendors TO authenticated, service_role;
GRANT SELECT ON TABLE public.scheme_vendors TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vendor_invitations TO authenticated, service_role;
GRANT SELECT ON TABLE public.vendor_invitations TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.work_orders TO authenticated, service_role;
GRANT SELECT ON TABLE public.work_orders TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vendor_quotes TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quote_poll_votes TO authenticated, service_role;

GRANT USAGE, SELECT ON SEQUENCE public.vendor_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.work_order_id_seq TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.vendor_quote_id_seq TO anon, authenticated, service_role;

-- ============================================================================
-- 10. Secure Zero-Login Tradie RPC Functions (Zero-Trust Security)
-- ============================================================================

-- Function 1: Secure Tradie Work Order Access by Token
CREATE OR REPLACE FUNCTION public.get_work_order_by_guest_token(p_token TEXT)
RETURNS TABLE (
    id TEXT,
    case_id TEXT,
    scheme_id TEXT,
    vendor_name TEXT,
    scope_of_work TEXT,
    budget_cap NUMERIC,
    final_cost NUMERIC,
    site_access_pin TEXT,
    status TEXT,
    completion_photo TEXT,
    invoice_pdf TEXT,
    submitted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.case_id,
        w.scheme_id,
        w.vendor_name,
        w.scope_of_work,
        w.budget_cap,
        w.final_cost,
        w.site_access_pin,
        w.status,
        w.completion_photo,
        w.invoice_pdf,
        w.submitted_at
    FROM public.work_orders w
    WHERE w.guest_magic_token = p_token;
END;
$$;

-- Function 2: Secure Tradie Completion Submission by Token
CREATE OR REPLACE FUNCTION public.submit_work_order_completion(
    p_token TEXT,
    p_completion_photo TEXT,
    p_invoice_pdf TEXT DEFAULT NULL,
    p_final_cost NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wo_id TEXT;
BEGIN
    SELECT id INTO v_wo_id
    FROM public.work_orders
    WHERE guest_magic_token = p_token;

    IF v_wo_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired work order token');
    END IF;

    UPDATE public.work_orders
    SET 
        status = 'completion_submitted',
        completion_photo = COALESCE(p_completion_photo, completion_photo),
        invoice_pdf = COALESCE(p_invoice_pdf, invoice_pdf),
        final_cost = COALESCE(p_final_cost, final_cost),
        submitted_at = timezone('utc'::TEXT, now()),
        updated_at = timezone('utc'::TEXT, now())
    WHERE guest_magic_token = p_token;

    RETURN jsonb_build_object(
        'success', true, 
        'work_order_id', v_wo_id,
        'status', 'completion_submitted'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_work_order_by_guest_token(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_work_order_completion(TEXT, TEXT, TEXT, NUMERIC) TO anon, authenticated, service_role;

-- ============================================================================
-- 11. Production Seed Data (Accredited Trades & Synced NSW Strata Operations)
-- ============================================================================
INSERT INTO public.vendors (
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

-- Initial Scheme Vendor Associations
INSERT INTO public.scheme_vendors (scheme_id, vendor_id, is_preferred) VALUES
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

-- Initial Work Orders with 3 synced workflow states (Needs Sign-Off, In Progress, Completed)
INSERT INTO public.work_orders (
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
