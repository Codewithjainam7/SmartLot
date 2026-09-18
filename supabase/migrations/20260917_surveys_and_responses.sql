-- =========================================================================
-- Migration: Surveys & Resident Feedback System
-- Real-time cloud persistence for surveys and zero-login resident responses
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.surveys (
  id TEXT PRIMARY KEY,
  scheme_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'General Satisfaction',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  target_audience TEXT DEFAULT 'All Residents',
  recipient_emails TEXT[] DEFAULT '{}'::TEXT[],
  cc_emails TEXT[] DEFAULT '{}'::TEXT[],
  bcc_emails TEXT[] DEFAULT '{}'::TEXT[],
  questions JSONB NOT NULL DEFAULT '[]'::JSONB,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by JSONB DEFAULT '{"name":"System Admin","role":"Strata Manager"}'::JSONB,
  closed_at TIMESTAMPTZ,
  ai_executive_summary JSONB,
  banner_image TEXT
);

CREATE TABLE IF NOT EXISTS public.survey_responses (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  scheme_id TEXT NOT NULL,
  unit_id TEXT,
  respondent_name TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  answers JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- Indexes for high performance querying
CREATE INDEX IF NOT EXISTS idx_surveys_scheme_id ON public.surveys(scheme_id);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON public.surveys(status);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_scheme_id ON public.survey_responses(scheme_id);

-- Enable Row Level Security
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Grants for Supabase Data API
GRANT SELECT ON TABLE public.surveys TO anon;
GRANT ALL ON TABLE public.surveys TO authenticated;
GRANT INSERT ON TABLE public.survey_responses TO anon;
GRANT ALL ON TABLE public.survey_responses TO authenticated;

-- RLS policies: Scoped read/write access
DROP POLICY IF EXISTS "Public and auth full access surveys" ON public.surveys;
CREATE POLICY "Allow select surveys" ON public.surveys
  FOR SELECT TO anon, authenticated
  USING (status IN ('Active', 'active', 'Closed', 'closed'));

CREATE POLICY "Allow authenticated write surveys" ON public.surveys
  FOR ALL TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Public and auth full access survey_responses" ON public.survey_responses;
CREATE POLICY "Allow insert survey_responses" ON public.survey_responses
  FOR INSERT TO anon, authenticated
  WITH CHECK (survey_id IS NOT NULL);

CREATE POLICY "Allow authenticated read survey_responses" ON public.survey_responses
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
