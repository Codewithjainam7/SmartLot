-- =========================================================================
-- Migration: Extend resident_requests for full Activity Management spec
-- Story 1: Resident Initiates an Activity
-- =========================================================================

-- 1. Add missing columns to resident_requests
ALTER TABLE public.resident_requests
  ADD COLUMN IF NOT EXISTS reference_id         VARCHAR(20),           -- e.g. #SL-12345
  ADD COLUMN IF NOT EXISTS building_name        VARCHAR(255),
  ADD COLUMN IF NOT EXISTS location             VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contact_preference   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS strata_manager_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS requestor_name       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS requestor_email      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS requestor_role       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS attachment_urls      TEXT[],                -- array of photo/doc URLs
  ADD COLUMN IF NOT EXISTS assigned_to_name     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS assigned_to_role     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS assigned_to_email    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Drop rigid FK constraint so activities can be raised for un-onboarded buildings/units
ALTER TABLE public.resident_requests
  DROP CONSTRAINT IF EXISTS resident_requests_scheme_id_unit_id_fkey;

-- 2. Expand the status check constraint to match full workflow
ALTER TABLE public.resident_requests
  DROP CONSTRAINT IF EXISTS resident_requests_status_check;

ALTER TABLE public.resident_requests
  ADD CONSTRAINT resident_requests_status_check
  CHECK (status IN (
    'new',
    'acknowledged',
    'in_progress',
    'waiting',
    'pending_triage',
    'approved',
    'rejected',
    'resolved',
    'closed'
  ));

-- 3. Expand the priority check constraint to match ActivityPriority type
ALTER TABLE public.resident_requests
  DROP CONSTRAINT IF EXISTS resident_requests_priority_check;

ALTER TABLE public.resident_requests
  ADD CONSTRAINT resident_requests_priority_check
  CHECK (priority IN ('Low', 'Normal', 'Medium', 'High', 'Urgent', 'Emergency'));

-- 4. Extend request_comments columns
ALTER TABLE public.request_comments
  ADD COLUMN IF NOT EXISTS author_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS author_role VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_email_reply BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reply_to_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reply_to_text TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'request_comments' AND policyname = 'Public select request_comments'
  ) THEN
    CREATE POLICY "Public select request_comments" ON public.request_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'request_comments' AND policyname = 'Public write request_comments'
  ) THEN
    CREATE POLICY "Public write request_comments" ON public.request_comments FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 5. Create activity_notes table (internal manager-only notes)
CREATE TABLE IF NOT EXISTS public.activity_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL REFERENCES public.resident_requests(id) ON DELETE CASCADE,
  author_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name   VARCHAR(255) NOT NULL,
  author_role   VARCHAR(100) NOT NULL,
  text          TEXT NOT NULL,
  is_internal   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_notes_request ON public.activity_notes(request_id);

ALTER TABLE public.activity_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_notes' AND policyname = 'Public select activity_notes'
  ) THEN
    CREATE POLICY "Public select activity_notes" ON public.activity_notes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_notes' AND policyname = 'Public write activity_notes'
  ) THEN
    CREATE POLICY "Public write activity_notes" ON public.activity_notes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Managers can read all notes for their scheme's requests
CREATE POLICY "Managers can read internal notes" ON public.activity_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.resident_requests rr
      JOIN public.members m ON m.scheme_id = rr.scheme_id
      WHERE rr.id = activity_notes.request_id
        AND m.user_id = auth.uid()
        AND m.role IN ('Strata Manager', 'Building Manager')
        AND m.status = 'Active'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_system_admin = TRUE
    )
  );

-- Only managers can insert internal notes
CREATE POLICY "Managers can insert internal notes" ON public.activity_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.resident_requests rr
      JOIN public.members m ON m.scheme_id = rr.scheme_id
      WHERE rr.id = activity_notes.request_id
        AND m.user_id = auth.uid()
        AND m.role IN ('Strata Manager', 'Building Manager')
        AND m.status = 'Active'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_system_admin = TRUE
    )
  );

-- Managers can delete their own notes
CREATE POLICY "Managers can delete own notes" ON public.activity_notes
  FOR DELETE
  USING (author_id = auth.uid());

-- 6. updated_at trigger for resident_requests
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resident_requests_updated_at ON public.resident_requests;
CREATE TRIGGER trg_resident_requests_updated_at
  BEFORE UPDATE ON public.resident_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
