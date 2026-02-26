-- Migration: Setup CRON job for push notifications
-- Purpose: Automatically trigger send-event-notifications Edge Function every minute

-- IMPORTANT: Replace VOTRE_PROJECT_REF with your actual Supabase project reference
-- You can find it in your Supabase project settings or URL:
-- Example: https://sxdgvuqawjehfjexziwu.supabase.co → project ref is "sxdgvuqawjehfjexziwu"

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule the notification check to run every minute
SELECT cron.schedule(
  'send-event-notifications-every-minute',  -- Job name
  '* * * * *',  -- Every minute (cron format: minute hour day month weekday)
  $$
  SELECT
    net.http_post(
      url := 'https://sxdgvuqawjehfjexziwu.supabase.co/functions/v1/send-event-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- 3. Verify the CRON job is scheduled
-- Run this query to check:
-- SELECT * FROM cron.job WHERE jobname = 'send-event-notifications-every-minute';

-- 4. To unschedule/disable the CRON job (if needed):
-- SELECT cron.unschedule('send-event-notifications-every-minute');

-- 5. To reschedule with different timing (examples):
-- Every 5 minutes: '*/5 * * * *'
-- Every 15 minutes: '*/15 * * * *'
-- Every hour: '0 * * * *'
