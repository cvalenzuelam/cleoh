-- Cleoh Lencería — schema inicial
-- Admin propio en Next.js + Supabase Auth (rol admin). Sin CMS externo.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Roles / perfiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  cover_image_url text,
  sort_order int not null default 0,
  is_nav boolean not null default true,
  is_tile boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category_id uuid references public.categories (id) on delete set null,
  price_cents int not null check (price_cents >= 0),
  compare_at_cents int check (compare_at_cents is null or compare_at_cents >= 0),
  currency text not null default 'MXN',
  badge text check (badge is null or badge in ('nuevo', 'mas-vendido', 'oferta')),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  -- R2 / CDN: URL principal (galería en product_images)
  primary_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create index products_active_idx on public.products (is_active);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id);

-- Variantes: talla (y color futuro). Stock por variante.
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text unique,
  size text not null,
  color text,
  stock int not null default 0 check (stock >= 0),
  price_cents int check (price_cents is null or price_cents >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size, color)
);

create index product_variants_product_idx on public.product_variants (product_id);

-- ---------------------------------------------------------------------------
-- Cupones
-- ---------------------------------------------------------------------------
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  percent_off int check (percent_off is null or (percent_off > 0 and percent_off <= 100)),
  amount_off_cents int check (amount_off_cents is null or amount_off_cents > 0),
  min_subtotal_cents int not null default 0,
  max_uses int,
  used_count int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint coupon_discount_check check (
    (percent_off is not null and amount_off_cents is null)
    or (percent_off is null and amount_off_cents is not null)
  )
);

-- ---------------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------------
create type public.order_status as enum (
  'pending',
  'paid',
  'fulfilled',
  'cancelled',
  'refunded'
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  status public.order_status not null default 'pending',
  email text not null,
  phone text,
  customer_name text,
  shipping_address jsonb,
  subtotal_cents int not null default 0,
  discount_cents int not null default 0,
  shipping_cents int not null default 0,
  total_cents int not null default 0,
  currency text not null default 'MXN',
  coupon_id uuid references public.coupons (id) on delete set null,
  coupon_code text,
  mp_preference_id text,
  mp_payment_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_status_idx on public.orders (status);
create index orders_created_idx on public.orders (created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  variant_label text,
  quantity int not null check (quantity > 0),
  unit_price_cents int not null,
  line_total_cents int not null
);

create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Catálogo: lectura pública de activos
create policy "Public read categories"
  on public.categories for select
  using (true);

create policy "Admin write categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public read active products"
  on public.products for select
  using (is_active = true or public.is_admin());

create policy "Admin write products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public read product images"
  on public.product_images for select
  using (true);

create policy "Admin write product images"
  on public.product_images for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public read active variants"
  on public.product_variants for select
  using (is_active = true or public.is_admin());

create policy "Admin write variants"
  on public.product_variants for all
  using (public.is_admin())
  with check (public.is_admin());

-- Cupones: solo admin (validación en server actions)
create policy "Admin coupons"
  on public.coupons for all
  using (public.is_admin())
  with check (public.is_admin());

-- Pedidos: insert vía service role / server; admin lee/actualiza
create policy "Admin orders"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin order items"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Seed categorías (alineado con tienda actual)
-- ---------------------------------------------------------------------------
insert into public.categories (slug, name, description, sort_order, is_nav, is_tile) values
  ('babydoll', 'BabyDoll', 'Babydolls con encaje, transparencias y siluetas coquetas.', 1, true, true),
  ('novias', 'Novias', 'Blancos y especiales para una noche inolvidable.', 2, true, true),
  ('pijamas', 'Pijamas', 'Pijamas cómodas con detalle romántico para el día a día.', 3, true, true),
  ('coordinados', 'Coordinados', 'Sets de top y panty, conjuntos y looks a juego.', 4, true, true),
  ('batas', 'Batas', 'Batas ligeras para completar tu ritual.', 5, false, false),
  ('bodies', 'Bodies', 'Bodies con encaje y cortes favorecedores.', 6, false, false);

insert into public.coupons (code, description, percent_off, is_active) values
  ('CLEOH10', '10% de descuento (migración Wix)', 10, true);
