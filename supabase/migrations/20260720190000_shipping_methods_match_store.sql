-- Alinear métodos con la tienda de referencia (Estafeta + DHL)

-- Estafeta Terrestre
update public.shipping_methods
set
  name = 'Estafeta Terrestre',
  description = 'Envío estándar a todo México',
  price_cents = 15000,
  eta_label = '3-5 hábiles',
  sort_order = 1,
  is_active = true,
  updated_at = now()
where name ilike '%estafeta%terrestre%'
   or name = 'Estafeta Terrestre';

-- Renombrar express anterior → DHL Express
update public.shipping_methods
set
  name = 'DHL Express',
  description = 'Entrega express',
  price_cents = 19500,
  eta_label = '1-3 días hábiles',
  sort_order = 2,
  is_active = true,
  updated_at = now()
where name ilike '%estafeta%express%'
   or name ilike 'dhl%'
   or (name ilike '%express%' and name not ilike '%estafeta%terrestre%');

-- Si aún no existe DHL, insertarlo
insert into public.shipping_methods (name, description, price_cents, eta_label, sort_order, is_active)
select
  'DHL Express',
  'Entrega express',
  19500,
  '1-3 días hábiles',
  2,
  true
where not exists (
  select 1 from public.shipping_methods where name = 'DHL Express'
);

-- Asegurar Estafeta si la tabla quedó vacía / sin terrestre
insert into public.shipping_methods (name, description, price_cents, eta_label, sort_order, is_active)
select
  'Estafeta Terrestre',
  'Envío estándar a todo México',
  15000,
  '3-5 hábiles',
  1,
  true
where not exists (
  select 1 from public.shipping_methods where name = 'Estafeta Terrestre'
);
