-- Método de pago explícito (PayPal, Mercado Pago, transferencia SPEI)
alter table public.orders
  add column if not exists payment_method text;

comment on column public.orders.payment_method is
  'paypal | mercadopago | spei — null en pedidos antiguos (inferir por paypal_order_id)';

create index if not exists orders_payment_method_idx
  on public.orders (payment_method)
  where payment_method is not null;
