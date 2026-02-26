-- Migration: Create notifications_log table
-- Purpose: Track notification sends for debugging and analytics (OPTIONAL)

-- 1. Create notifications_log table
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id integer REFERENCES public."PlanningEvent"(id) ON DELETE SET NULL,
  event_title text,
  event_time text,
  sent_at timestamptz DEFAULT now() NOT NULL,
  recipient_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  error_count integer DEFAULT 0
);

-- 2. Create index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_notifications_log_sent_at
  ON public.notifications_log(sent_at DESC);

-- 3. Create index for event lookups
CREATE INDEX IF NOT EXISTS idx_notifications_log_event_id
  ON public.notifications_log(event_id)
  WHERE event_id IS NOT NULL;

-- 4. Add RLS (optional - allow service role full access, users read-only)
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'notifications_log'
    AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
      ON public.notifications_log FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Allow authenticated users to read notification logs (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'notifications_log'
    AND policyname = 'Authenticated users can read'
  ) THEN
    CREATE POLICY "Authenticated users can read"
      ON public.notifications_log FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 5. Comments for documentation
COMMENT ON TABLE public.notifications_log IS 'Logs of push notifications sent via Edge Functions';
COMMENT ON COLUMN public.notifications_log.event_id IS 'Reference to the PlanningEvent that triggered this notification';
COMMENT ON COLUMN public.notifications_log.recipient_count IS 'Number of users who should have received the notification';
COMMENT ON COLUMN public.notifications_log.success_count IS 'Number of notifications successfully sent';
COMMENT ON COLUMN public.notifications_log.error_count IS 'Number of notifications that failed';
