-- Daily on-call reminder job.
-- Prereqs: deploy the send-oncall-reminders edge function and set the
-- CRON_SECRET / VAPID_* secrets first. Replace REPLACE_WITH_CRON_SECRET below
-- with the same CRON_SECRET value (see .vapid-keys.local.txt).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any previous schedule with this name (safe to re-run)
select cron.unschedule('pillr-oncall-reminders')
where exists (select 1 from cron.job where jobname = 'pillr-oncall-reminders');

-- 06:00 UTC == 09:00 Kuwait — notify users of on-call shifts happening the next day
select cron.schedule(
  'pillr-oncall-reminders',
  '0 6 * * *',
  $$
  select net.http_post(
    url     := 'https://dcwpukpxnqipjglksymg.supabase.co/functions/v1/send-oncall-reminders',
    -- send-oncall-reminders has JWT verification turned OFF, so no key is
    -- needed here — the x-cron-secret is the auth gate (checked in the function).
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'REPLACE_WITH_CRON_SECRET'
    ),
    body    := '{}'::jsonb
  );
  $$
);
