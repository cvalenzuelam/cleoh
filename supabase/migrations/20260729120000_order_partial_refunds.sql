-- Partial refunds: track refunded qty per line and cumulative refund on order
alter table public.orders
  add column if not exists refunded_cents int not null default 0;

alter table public.order_items
  add column if not exists refunded_quantity int not null default 0;

alter table public.order_items
  drop constraint if exists order_items_refunded_quantity_check;

alter table public.order_items
  add constraint order_items_refunded_quantity_check
  check (refunded_quantity >= 0);
