-- 1. Set scheme name to Spear Empire
UPDATE public.schemes
SET name = 'Spear Empire'
WHERE id = 'SP823';

-- 2. Ensure Jainam profile has is_system_admin = false
UPDATE public.profiles
SET is_system_admin = false
WHERE LOWER(email) = 'jain@gmail.com';

-- 3. Ensure Jainam is Lot Owner in Unit 1 of Spear Empire (SP823)
UPDATE public.members
SET 
  scheme_id = 'SP823',
  unit_id = 'Unit 1',
  role = 'Lot Owner',
  status = 'Active'
WHERE LOWER(email) = 'jain@gmail.com';
