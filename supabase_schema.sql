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
