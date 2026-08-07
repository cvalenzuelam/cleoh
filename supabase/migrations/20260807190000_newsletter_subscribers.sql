-- Suscriptores del popup de newsletter (cupón CLEOH10)

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  subscribed_at timestamptz not null default now()
);

create unique index if not exists newsletter_subscribers_email_lower_idx
  on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;

create policy "Admin read newsletter subscribers"
  on public.newsletter_subscribers for select
  using (public.is_admin());
