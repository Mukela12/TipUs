-- Enable pg_cron and pg_net for scheduled HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule: run daily at 2:00 AM UTC
SELECT cron.schedule(
  'auto-payouts',
  '0 2 * * *',
  $$
  SELECT extensions.http_post(
    'https://ghxwritgesdhtoupwvwm.supabase.co/functions/v1/auto-payout',
    '{}'::jsonb,
    'application/json',
    ARRAY[
      extensions.http_header('apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoeHdyaXRnZXNkaHRvdXB3dndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NTc2NjgsImV4cCI6MjA4NTIzMzY2OH0.KUNaR3SaAUL8Wa9AeAi9UmLjmg-pw6wTgRe1QYUQAj8')
    ]
  );
  $$
);
