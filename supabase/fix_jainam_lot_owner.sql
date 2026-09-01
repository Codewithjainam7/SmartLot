-- 1. Ensure Roman Empire scheme exists (update SP823 or insert)
INSERT INTO public.schemes (id, name, lots, active, created_by)
VALUES ('SP823', 'Roman Empire', 2, true, 'db591196-5212-4799-961d-ab38fb32edd6')
ON CONFLICT (id) DO UPDATE SET
  name = 'Roman Empire',
  lots = 2,
  active = true;

-- 2. Ensure units exist for Roman Empire (SP823)
INSERT INTO public.units (scheme_id, unit_id, lot_number, entitlement, status)
VALUES 
  ('SP823', 'Unit 1', 1, 50.00, 'Occupied'),
  ('SP823', 'Unit 2', 2, 50.00, 'Vacant')
ON CONFLICT (scheme_id, unit_id) DO UPDATE SET
  entitlement = EXCLUDED.entitlement,
  status = EXCLUDED.status;

-- 3. Set Jainam profile as regular user (is_system_admin = false)
UPDATE public.profiles
SET is_system_admin = false, full_name = 'Jainam'
WHERE LOWER(email) = 'jain@gmail.com';

-- 4. Set Jainam in members as Lot Owner of Unit 1 in Roman Empire (SP823)
UPDATE public.members
SET 
  scheme_id = 'SP823',
  unit_id = 'Unit 1',
  role = 'Lot Owner',
  status = 'Active'
WHERE LOWER(email) = 'jain@gmail.com';

-- 5. Ensure Roman Joe is also registered as Strata Manager for Roman Empire (SP823)
INSERT INTO public.members (scheme_id, user_id, name, email, phone, role, unit_id, status)
VALUES (
  'SP823',
  'db591196-5212-4799-961d-ab38fb32edd6',
  'Roman Joe',
  'romanjoe@gmail.com',
  '0411 888 777',
  'Strata Manager',
  'Unit 1',
  'Active'
)
ON CONFLICT DO NOTHING;
