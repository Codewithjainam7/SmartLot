-- Enable pgcrypto extension for password encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- FUNCTION TO CREATE AUTH USER + PROFILE + LINK MEMBER
-- =========================================================================
CREATE OR REPLACE FUNCTION public.seed_user_account(
  p_email VARCHAR,
  p_full_name VARCHAR,
  p_phone VARCHAR DEFAULT NULL,
  p_is_admin BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if user already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(p_email);

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    -- Insert into auth.users with standard password 'SmartLot2026!'
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      p_email,
      crypt('SmartLot2026!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', p_full_name),
      now(),
      now()
    );
  END IF;

  -- Upsert into public.profiles
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone_number,
    is_system_admin,
    created_at
  ) VALUES (
    v_user_id,
    p_full_name,
    p_email,
    p_phone,
    p_is_admin,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone_number = EXCLUDED.phone_number,
    is_system_admin = EXCLUDED.is_system_admin;

  -- Link all matching members
  UPDATE public.members
  SET user_id = v_user_id
  WHERE LOWER(email) = LOWER(p_email);

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- SEED ALL PLATFORM MEMBERS INTO AUTH & PROFILES
-- =========================================================================
SELECT public.seed_user_account('romanjoe@gmail.com', 'Roman Joe', '0411 888 777', true);
SELECT public.seed_user_account('sarah.jones@duplex.com', 'Sarah Jones', '0400 111 222', false);
SELECT public.seed_user_account('david.m@duplex.com', 'David Miller', '0412 333 444', false);
SELECT public.seed_user_account('elena.r@coronation.com', 'Elena Rostov', '0422 100 200', false);
SELECT public.seed_user_account('michael.chen@coronation.com', 'Michael Chen', '0411 222 333', false);
SELECT public.seed_user_account('marcus.s@coronation.com', 'Marcus Sterling', '0433 444 555', false);
SELECT public.seed_user_account('chloe.b@coronation.com', 'Chloe Bennett', '0444 555 666', false);
SELECT public.seed_user_account('liam.h@coronation.com', 'Liam Hemsworth', '0455 666 777', false);
SELECT public.seed_user_account('rachel.a@coronation.com', 'Rachel Adams', '0466 777 888', false);
SELECT public.seed_user_account('emma.wilson@agency.com', 'Emma Wilson', '0499 888 111', false);
SELECT public.seed_user_account('arthur.p@cavalier.com', 'Arthur Pendelton', '0477 111 999', false);
SELECT public.seed_user_account('sophia.z@cavalier.com', 'Sophia Zhang', '0488 222 888', false);
SELECT public.seed_user_account('oliver.v@cavalier.com', 'Oliver Vance', '0499 333 777', false);
SELECT public.seed_user_account('jessica.t@cavalier.com', 'Jessica Taylor', '0400 444 666', false);
SELECT public.seed_user_account('brandon.c@cavalier.com', 'Brandon Cole', '0411 555 555', false);
SELECT public.seed_user_account('jain@gmail.com', 'Jainam', '1234', true);
