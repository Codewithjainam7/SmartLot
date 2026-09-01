-- 1. Upsert profiles for the 4 active creators
INSERT INTO public.profiles (id, full_name, email, is_system_admin)
VALUES 
  ('e55a6f2a-c481-4a0f-bf11-2672835fb297', 'Sarah Jones', 'sarah.jones@duplex.com', false),
  ('35caa1af-3c2b-4311-9e79-667120160787', 'Michael Chen', 'michael.chen@coronation.com', false),
  ('630c271e-f845-45f9-b02e-cee79194dc31', 'Emma Wilson', 'emma.wilson@agency.com', false),
  ('db591196-5212-4799-961d-ab38fb32edd6', 'Roman Joe', 'romanjoe@gmail.com', true)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  is_system_admin = EXCLUDED.is_system_admin;

-- 2. Clean out unauthenticated profiles
DELETE FROM public.profiles 
WHERE email NOT IN ('sarah.jones@duplex.com', 'michael.chen@coronation.com', 'emma.wilson@agency.com', 'romanjoe@gmail.com');

-- 3. Reset user_id to NULL for all invited members except the 4 active creators
UPDATE public.members
SET user_id = NULL
WHERE LOWER(email) NOT IN ('sarah.jones@duplex.com', 'michael.chen@coronation.com', 'emma.wilson@agency.com', 'romanjoe@gmail.com');

-- 4. Link user_id for the 4 active creators
UPDATE public.members SET user_id = 'e55a6f2a-c481-4a0f-bf11-2672835fb297' WHERE LOWER(email) = 'sarah.jones@duplex.com';
UPDATE public.members SET user_id = '35caa1af-3c2b-4311-9e79-667120160787' WHERE LOWER(email) = 'michael.chen@coronation.com';
UPDATE public.members SET user_id = '630c271e-f845-45f9-b02e-cee79194dc31' WHERE LOWER(email) = 'emma.wilson@agency.com';
UPDATE public.members SET user_id = 'db591196-5212-4799-961d-ab38fb32edd6' WHERE LOWER(email) = 'romanjoe@gmail.com';
