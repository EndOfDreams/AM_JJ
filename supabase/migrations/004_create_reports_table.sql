-- Migration: Create reports table for UGC moderation
-- Purpose: STORE COMPLIANCE - Required for apps with User Generated Content

-- 1. Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reporter_name text,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  moderator_notes text
);

-- 2. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_photo_id
  ON public.reports(photo_id);

CREATE INDEX IF NOT EXISTS idx_reports_reported_by
  ON public.reports(reported_by);

CREATE INDEX IF NOT EXISTS idx_reports_status
  ON public.reports(status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_reports_created_at
  ON public.reports(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow authenticated users to create reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'reports'
    AND policyname = 'Users can create reports'
  ) THEN
    CREATE POLICY "Users can create reports"
      ON public.reports FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = reported_by);
  END IF;
END $$;

-- Allow users to read their own reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'reports'
    AND policyname = 'Users can read own reports'
  ) THEN
    CREATE POLICY "Users can read own reports"
      ON public.reports FOR SELECT
      TO authenticated
      USING (auth.uid() = reported_by);
  END IF;
END $$;

-- Allow service role full access (for admin moderation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'reports'
    AND policyname = 'Service role full access on reports'
  ) THEN
    CREATE POLICY "Service role full access on reports"
      ON public.reports FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- 5. Comments for documentation
COMMENT ON TABLE public.reports IS 'User reports for inappropriate content (STORE COMPLIANCE - UGC moderation)';
COMMENT ON COLUMN public.reports.photo_id IS 'Reference to the reported photo';
COMMENT ON COLUMN public.reports.reported_by IS 'User who reported the content';
COMMENT ON COLUMN public.reports.reason IS 'Reason for reporting (inappropriate, spam, harassment, etc.)';
COMMENT ON COLUMN public.reports.status IS 'Moderation status: pending, reviewed, resolved, dismissed';
