ALTER TABLE public.resident_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public and authenticated full access to resident_requests" ON public.resident_requests;
CREATE POLICY "Allow public and authenticated full access to resident_requests" 
ON public.resident_requests FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);
