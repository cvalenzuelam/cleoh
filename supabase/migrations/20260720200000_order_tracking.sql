-- Rastreo de envío en pedidos

alter table public.orders
  add column if not exists tracking_code text,
  add column if not exists tracking_url text;
