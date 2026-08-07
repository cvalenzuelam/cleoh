-- Carritos abandonados (recordatorio por correo)

create table if not exists public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  recovery_token uuid not null default gen_random_uuid(),
  items jsonb not null default '[]'::jsonb,
  subtotal_cents int not null default 0,
  item_count int not null default 0,
  updated_at timestamptz not null default now(),
  reminder_sent_at timestamptz,
  recovered_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists abandoned_carts_email_idx
  on public.abandoned_carts (email);

create unique index if not exists abandoned_carts_recovery_token_idx
  on public.abandoned_carts (recovery_token);

create index if not exists abandoned_carts_reminder_idx
  on public.abandoned_carts (updated_at)
  where reminder_sent_at is null and recovered_at is null;

alter table public.abandoned_carts enable row level security;
