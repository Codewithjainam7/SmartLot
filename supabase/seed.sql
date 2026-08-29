-- 1. Insert dummy users into auth.users (required for the profiles foreign key)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'd8888888-8888-8888-8888-888888888888', 'authenticated', 'authenticated', 'jagrat@strata.com.au', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'alex@strata.com.au', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000', 'b2222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'sarah@duplex.com.au', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert dummy profiles
INSERT INTO public.profiles (id, full_name, email, phone_number, avatar_url)
VALUES
  ('d8888888-8888-8888-8888-888888888888', 'Jagrat', 'jagrat@strata.com.au', '0400 000 000', 'https://i.pravatar.cc/150?u=jagrat'),
  ('a1111111-1111-1111-1111-111111111111', 'Alex Vance', 'alex@strata.com.au', '0400 000 000', 'https://i.pravatar.cc/150?u=alex'),
  ('b2222222-2222-2222-2222-222222222222', 'Sarah Jones', 'sarah@duplex.com.au', '0411 111 111', 'https://i.pravatar.cc/150?u=sarah')
ON CONFLICT (id) DO NOTHING;

-- Insert Schemes
INSERT INTO schemes (id, name, scheme_plan, address, total_lots, created_by)
VALUES
  ('c3333333-3333-3333-3333-333333333333', 'Coronation Townhouses', 'SP102', '1 Coronation Ave', 4, 'd8888888-8888-8888-8888-888888888888'),
  ('e5555555-5555-5555-5555-555555555555', 'Sunset Duplex', 'SP101', '123 Sunset Blvd', 2, 'b2222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Insert Lots
INSERT INTO lots (id, scheme_id, lot_number, unit_number)
VALUES
  ('f6666666-6666-6666-6666-666666666666', 'c3333333-3333-3333-3333-333333333333', 1, 'Unit 1'),
  ('f7777777-7777-7777-7777-777777777777', 'c3333333-3333-3333-3333-333333333333', 10, 'Unit 10')
ON CONFLICT (id) DO NOTHING;
