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


## 2. Automated Trigger: `tr_link_profile_to_members`

Whenever an invited member accepts their invite and registers their account in `auth.users` / `public.profiles`, the trigger automatically matches their email and links `members.user_id`:

```sql
CREATE OR REPLACE FUNCTION public.handle_profile_member_link()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.members
  SET user_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_link_profile_to_members
AFTER INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_member_link();
```
