# Supabase Database Architecture & Setup

## 1. Table Definitions

### `public.schemes`
- `id` (VARCHAR PRIMARY KEY, e.g. `SP101`)
- `name` (VARCHAR NOT NULL)
- `lots` (INTEGER NOT NULL DEFAULT 0)
- `active` (BOOLEAN NOT NULL DEFAULT TRUE)
- `created_by` (UUID REFERENCES auth.users(id))
- `created_at` (TIMESTAMPTZ DEFAULT now())

### `public.profiles`
- `id` (UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE)
- `full_name` (VARCHAR NOT NULL)
- `email` (VARCHAR UNIQUE NOT NULL)
- `phone_number` (VARCHAR)
- `avatar_url` (TEXT)
- `is_system_admin` (BOOLEAN DEFAULT FALSE)
- `created_at` (TIMESTAMPTZ DEFAULT now())


### `public.members`
- `id` (UUID PRIMARY KEY DEFAULT gen_random_uuid())
- `scheme_id` (VARCHAR REFERENCES public.schemes(id) ON DELETE CASCADE)
- `user_id` (UUID REFERENCES public.profiles(id) ON DELETE SET NULL)
- `name` (VARCHAR NOT NULL)
- `email` (VARCHAR NOT NULL)
- `phone` (VARCHAR)
- `role` (VARCHAR NOT NULL CHECK role IN ('Strata Manager', 'Building Manager', 'Committee Member', 'Lot Owner', 'Resident', 'Tenant'))
- `unit_id` (VARCHAR NOT NULL)
- `status` (VARCHAR DEFAULT 'Active' CHECK status IN ('Active', 'Invited', 'Restricted'))

### `public.units`
- `scheme_id` (VARCHAR REFERENCES public.schemes(id) ON DELETE CASCADE)
- `unit_id` (VARCHAR NOT NULL)
- `lot_number` (INTEGER NOT NULL)
- `entitlement` (NUMERIC(5,2) DEFAULT 25.00)
- `status` (VARCHAR DEFAULT 'Occupied')
