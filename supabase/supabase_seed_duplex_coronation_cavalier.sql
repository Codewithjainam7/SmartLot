-- =========================================================================
-- SMARTLOT MASTER DATABASE SYNC & SEED SCRIPT
-- Schemes: Sunset Duplex (SP101), Coronation Residences (SP102), Cavalier Grand (SP103)
-- Users: Roman Joe (romanjoe@gmail.com) + Committee + Owners + Tenants + Residents
-- =========================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Configure Permissive Row Level Security for Collaboration
-- Ensures all schemes, units, members, and requests are readable/writable by Super Admin & clients
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select schemes" ON public.schemes;
CREATE POLICY "Public select schemes" ON public.schemes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write schemes" ON public.schemes;
CREATE POLICY "Public write schemes" ON public.schemes FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select units" ON public.units;
CREATE POLICY "Public select units" ON public.units FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write units" ON public.units;
CREATE POLICY "Public write units" ON public.units FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select members" ON public.members;
CREATE POLICY "Public select members" ON public.members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write members" ON public.members;
CREATE POLICY "Public write members" ON public.members FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select resident_requests" ON public.resident_requests;
CREATE POLICY "Public select resident_requests" ON public.resident_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write resident_requests" ON public.resident_requests;
CREATE POLICY "Public write resident_requests" ON public.resident_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select role_permissions" ON public.role_permissions;
CREATE POLICY "Public select role_permissions" ON public.role_permissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write role_permissions" ON public.role_permissions;
CREATE POLICY "Public write role_permissions" ON public.role_permissions FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select individual_permissions" ON public.individual_permissions;
CREATE POLICY "Public select individual_permissions" ON public.individual_permissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write individual_permissions" ON public.individual_permissions;
CREATE POLICY "Public write individual_permissions" ON public.individual_permissions FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select profiles" ON public.profiles;
CREATE POLICY "Public select profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write profiles" ON public.profiles;
CREATE POLICY "Public write profiles" ON public.profiles FOR ALL USING (true);

-- =========================================================================
-- 3. SEED SCHEMES (Duplex, Coronation, Cavalier)
-- =========================================================================
INSERT INTO public.schemes (id, name, lots, active) VALUES
  ('SP101', 'Sunset Duplex', 2, true),
  ('SP102', 'Coronation Residences', 12, true),
  ('SP103', 'Cavalier Grand Residences', 24, true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  lots = EXCLUDED.lots, 
  active = EXCLUDED.active;

-- =========================================================================
-- 4. SEED UNITS (Duplex 1-2, Coronation 1-12, Cavalier 1-24)
-- =========================================================================
INSERT INTO public.units (scheme_id, unit_id, lot_number, entitlement, status) VALUES
  -- Duplex (SP101)
  ('SP101', 'Unit 1', 1, 50.00, 'Occupied'),
  ('SP101', 'Unit 2', 2, 50.00, 'Occupied'),

  -- Coronation (SP102)
  ('SP102', 'Unit 1', 1, 8.33, 'Occupied'),
  ('SP102', 'Unit 2', 2, 8.33, 'Occupied'),
  ('SP102', 'Unit 3', 3, 8.33, 'Occupied'),
  ('SP102', 'Unit 4', 4, 8.33, 'Occupied'),
  ('SP102', 'Unit 5', 5, 8.33, 'Occupied'),
  ('SP102', 'Unit 6', 6, 8.33, 'Occupied'),
  ('SP102', 'Unit 7', 7, 8.33, 'Vacant'),
  ('SP102', 'Unit 8', 8, 8.33, 'Vacant'),
  ('SP102', 'Unit 9', 9, 8.33, 'Vacant'),
  ('SP102', 'Unit 10', 10, 8.33, 'Vacant'),
  ('SP102', 'Unit 11', 11, 8.33, 'Vacant'),
  ('SP102', 'Unit 12', 12, 8.33, 'Vacant'),

  -- Cavalier Grand (SP103)
  ('SP103', 'Unit 101', 1, 4.16, 'Occupied'),
  ('SP103', 'Unit 102', 2, 4.16, 'Vacant'),
  ('SP103', 'Unit 103', 3, 4.16, 'Vacant'),
  ('SP103', 'Unit 201', 4, 4.16, 'Vacant'),
  ('SP103', 'Unit 202', 5, 4.16, 'Vacant'),
  ('SP103', 'Unit 203', 6, 4.16, 'Vacant'),
  ('SP103', 'Unit 204', 7, 4.16, 'Occupied'),
  ('SP103', 'Unit 301', 8, 4.16, 'Vacant'),
  ('SP103', 'Unit 305', 9, 4.16, 'Occupied'),
  ('SP103', 'Unit 401', 10, 4.16, 'Vacant'),
  ('SP103', 'Unit 410', 11, 4.16, 'Occupied'),
  ('SP103', 'Unit 502', 12, 4.16, 'Occupied')
ON CONFLICT (scheme_id, unit_id) DO UPDATE SET 
  lot_number = EXCLUDED.lot_number,
  entitlement = EXCLUDED.entitlement,
  status = EXCLUDED.status;

-- =========================================================================
-- 5. SEED MEMBERS (Including Roman Joe as Strata Manager)
-- =========================================================================
-- Link Roman Joe from profiles if exists, or insert directly
INSERT INTO public.members (scheme_id, name, email, phone, role, unit_id, status, joined_at) VALUES
  -- 1. Roman Joe (Strata Manager across all 3 schemes)
  ('SP102', 'Roman Joe', 'romanjoe@gmail.com', '0411 888 777', 'Strata Manager', 'Unit 1', 'Active', '2024-01-10'),
  ('SP101', 'Roman Joe', 'romanjoe@gmail.com', '0411 888 777', 'Strata Manager', 'Unit 1', 'Active', '2024-01-10'),
  ('SP103', 'Roman Joe', 'romanjoe@gmail.com', '0411 888 777', 'Strata Manager', 'Unit 101', 'Active', '2024-01-10'),

  -- 2. Sunset Duplex (SP101)
  ('SP101', 'Sarah Jones', 'sarah.jones@duplex.com', '0400 111 222', 'Lot Owner', 'Unit 1', 'Active', '2024-03-15'),
  ('SP101', 'David Miller', 'david.m@duplex.com', '0412 333 444', 'Tenant', 'Unit 2', 'Active', '2024-06-01'),

  -- 3. Coronation Residences (SP102)
  ('SP102', 'Elena Rostov', 'elena.r@coronation.com', '0422 100 200', 'Lot Owner', 'Unit 1', 'Active', '2024-02-20'),
  ('SP102', 'Michael Chen', 'michael.chen@coronation.com', '0411 222 333', 'Committee Member', 'Unit 2', 'Active', '2024-04-10'),
  ('SP102', 'Marcus Sterling', 'marcus.s@coronation.com', '0433 444 555', 'Committee Member', 'Unit 3', 'Active', '2024-05-01'),
  ('SP102', 'Chloe Bennett', 'chloe.b@coronation.com', '0444 555 666', 'Tenant', 'Unit 4', 'Active', '2024-07-15'),
  ('SP102', 'Liam Hemsworth', 'liam.h@coronation.com', '0455 666 777', 'Resident', 'Unit 5', 'Active', '2024-08-01'),
  ('SP102', 'Rachel Adams', 'rachel.a@coronation.com', '0466 777 888', 'Lot Owner', 'Unit 6', 'Active', '2024-08-15'),

  -- 4. Cavalier Grand Residences (SP103)
  ('SP103', 'Emma Wilson', 'emma.wilson@agency.com', '0499 888 111', 'Strata Manager', 'Unit 101', 'Active', '2024-01-05'),
  ('SP103', 'Arthur Pendelton', 'arthur.p@cavalier.com', '0477 111 999', 'Committee Member', 'Unit 101', 'Active', '2024-02-15'),
  ('SP103', 'Sophia Zhang', 'sophia.z@cavalier.com', '0488 222 888', 'Lot Owner', 'Unit 204', 'Active', '2024-03-22'),
  ('SP103', 'Oliver Vance', 'oliver.v@cavalier.com', '0499 333 777', 'Resident', 'Unit 305', 'Active', '2024-05-11'),
  ('SP103', 'Jessica Taylor', 'jessica.t@cavalier.com', '0400 444 666', 'Tenant', 'Unit 410', 'Active', '2024-06-19'),
  ('SP103', 'Brandon Cole', 'brandon.c@cavalier.com', '0411 555 555', 'Lot Owner', 'Unit 502', 'Active', '2024-07-01');

-- =========================================================================
-- 6. SEED RESIDENT REQUESTS (Maintenance Tickets)
-- =========================================================================
INSERT INTO public.resident_requests (scheme_id, unit_id, title, description, request_type, priority, status) VALUES
  -- Duplex (SP101)
  ('SP101', 'Unit 1', 'Shared Driveway Motorized Gate Sensor Glitch', 'Vehicle entrance swing gate safety beam is tripping intermittently during sunset, causing gate to stall halfway.', 'common_area_repair', 'High', 'pending_triage'),
  ('SP101', 'Unit 2', 'Roof Guttering & Downpipe Overflow Cleaning', 'Heavy rain caused stormwater gutter overflowing along the common boundary fence wall.', 'common_area_repair', 'Medium', 'approved'),

  -- Coronation (SP102)
  ('SP102', 'Unit 2', 'Emergency Main Foyer Intercom Power Failure', 'Central door release intercom board is unresponsive; delivery couriers and guests unable to ring apartments.', 'emergency_repair', 'Emergency', 'approved'),
  ('SP102', 'Unit 1', 'Central Garden Irrigation Valve Burst', 'Irrigation pipe in courtyard garden sprung a pressurized leak flooding the walkway lawn.', 'common_area_repair', 'High', 'pending_triage'),
  ('SP102', 'Unit 3', 'Visitor Car Parking Bay Line Marking Refresh', 'Yellow visitor bay line markings have faded in the underground parking bays.', 'common_area_repair', 'Low', 'resolved'),

  -- Cavalier Grand (SP103)
  ('SP103', 'Unit 101', 'Elevator 2 Power Inverter Fault - Tower B', 'Passenger Lift #2 showing Error Code E-41 on display panel and running at half speed.', 'emergency_repair', 'Emergency', 'approved'),
  ('SP103', 'Unit 204', 'Basement Level B2 Sump Pump Sensor Alert', 'Telemetry monitoring system flagged high water table in lower drainage pit.', 'emergency_repair', 'Emergency', 'pending_triage'),
  ('SP103', 'Unit 305', 'Rooftop Solar Array Inverter 3 Communication Dropout', 'Smart meter portal is unable to read telemetry data from the commercial inverter bank.', 'common_area_repair', 'Medium', 'approved'),
  ('SP103', 'Unit 410', 'Heated Lap Pool Filtration & Chlorination Servicing', 'Pool chlorine readout is low; salt cell chlorinator requires scheduled acid wash.', 'common_area_repair', 'Medium', 'new');
