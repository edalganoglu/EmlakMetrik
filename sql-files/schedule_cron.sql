-- 1. Eklentileri Aktif Et (Eğer açık değilse)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Cron Job Oluştur (Her ayın 1'inde sabah 09:00'da çalışır)
-- NOT: 'Authorization' kısmındaki 'YOUR_SERVICE_ROLE_KEY' yerine
-- Supabase Dashboard > Project Settings > API > service_role key'ini yapıştırmalısın.

select
  cron.schedule(
    'update-housing-indices-monthly', -- Görev Adı
    '0 9 1 * *',                      -- Zamanlama: Her ayın 1'i, Saat 09:00
    $$
    select
      net.http_post(
          url:='https://vrawkzzyftwwfnqtebwm.supabase.co/functions/v1/quick-responder',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
  );

-- Cron Job'ları listelemek için:
-- select * from cron.job;

-- Cron Job silmek için (gerekirse):
-- select cron.unschedule('update-housing-indices-monthly');
