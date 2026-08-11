-- Intents de checkout: guardan el carrito hasta que MP/PayPal confirman el pago.
-- Evita pedidos "pending" fantasma cuando el usuario abandona o falla el pago.

create table if not exists public.checkout_intents (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  payment_method text not null,
  payload jsonb not null,
  mp_preference_id text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists checkout_intents_expires_idx
  on public.checkout_intents (expires_at);

create index if not exists checkout_intents_preference_idx
  on public.checkout_intents (mp_preference_id)
  where mp_preference_id is not null;

alter table public.checkout_intents enable row level security;

comment on table public.checkout_intents is
  'Checkout en curso antes de crear orders; se consume al confirmar pago.';
