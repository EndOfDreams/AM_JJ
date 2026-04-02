-- Fix: le cron job utilisait current_setting('app.settings.service_role_key') qui n'était pas configuré
-- Résultat: les notifs ne partaient jamais (Authorization header vide)

-- 1. Supprimer l'ancien cron job cassé
SELECT cron.unschedule('send-event-notifications-every-minute');

-- 2. Recréer avec la service_role_key en dur (sécurisé: pg_cron = server-side only)
SELECT cron.schedule(
  'send-event-notifications-every-minute',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://sxdgvuqawjehfjexziwu.supabase.co/functions/v1/send-event-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZGd2dXFhd2plaGZqZXh6aXd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgzMjAxOCwiZXhwIjoyMDc5NDA4MDE4fQ.iuyWOsphGWJYAEY6AeeSSgdEelRgZJStG5b6HCXGYB0'
      ),
      body := '{}'::jsonb
    );
  $$
);
