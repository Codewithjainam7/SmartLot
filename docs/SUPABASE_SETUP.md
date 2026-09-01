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
