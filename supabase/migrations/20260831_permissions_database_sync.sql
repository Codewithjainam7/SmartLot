-- 1. Ensure role_permissions table exists with RLS enabled
CREATE TABLE IF NOT EXISTS public.role_permissions (
    scheme_id VARCHAR(50) REFERENCES public.schemes(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    permission_label VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT FALSE NOT NULL,
    locked BOOLEAN DEFAULT FALSE NOT NULL,
    PRIMARY KEY (scheme_id, role, permission_label)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read role_permissions" ON public.role_permissions;
CREATE POLICY "Allow authenticated read role_permissions" 
ON public.role_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert/update role_permissions" ON public.role_permissions;
CREATE POLICY "Allow authenticated insert/update role_permissions" 
ON public.role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Ensure individual_permissions table exists with RLS enabled
CREATE TABLE IF NOT EXISTS public.individual_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    permission_label VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (member_id, permission_label)
);

ALTER TABLE public.individual_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read individual_permissions" ON public.individual_permissions;
CREATE POLICY "Allow authenticated read individual_permissions" 
ON public.individual_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert/update individual_permissions" ON public.individual_permissions;
CREATE POLICY "Allow authenticated insert/update individual_permissions" 
ON public.individual_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
