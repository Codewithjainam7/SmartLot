-- Add requestor detail columns to public.resident_requests
ALTER TABLE public.resident_requests 
ADD COLUMN IF NOT EXISTS requestor_name TEXT,
ADD COLUMN IF NOT EXISTS requestor_email TEXT,
ADD COLUMN IF NOT EXISTS requestor_role TEXT;
