-- Ajustes de apariencia de la tienda (hero, etc.)

create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Public read site settings"
  on public.site_settings for select
  using (true);

create policy "Admin write site settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.site_settings (key, value)
values (
  'hero_image_url',
  'https://static.wixstatic.com/media/7f4d67_64e50f84607944118736f90535394c8b~mv2.jpeg/v1/fill/w_1600,h_2000,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/7f4d67_64e50f84607944118736f90535394c8b~mv2.jpeg'
)
on conflict (key) do nothing;
