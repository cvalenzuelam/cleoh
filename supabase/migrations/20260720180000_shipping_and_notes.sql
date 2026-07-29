-- Métodos de envío (CMS) + paypal_order_id para no pisar notas del cliente

create table public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents int not null default 0 check (price_cents >= 0),
  eta_label text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipping_methods_active_idx on public.shipping_methods (is_active, sort_order);

alter table public.orders
  add column if not exists paypal_order_id text;

alter table public.shipping_methods enable row level security;

-- Lectura pública de métodos activos (checkout)
create policy "Public read active shipping methods"
  on public.shipping_methods for select
  using (is_active = true or public.is_admin());

create policy "Admin write shipping methods"
  on public.shipping_methods for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.shipping_methods (name, description, price_cents, eta_label, sort_order, is_active)
values
  (
    'Estafeta Terrestre',
    'Envío estándar a todo México',
    15000,
    '3-5 hábiles',
    1,
    true
  ),
  (
    'DHL Express',
    'Entrega express',
    19500,
    '1-3 días hábiles',
    2,
    true
  );
