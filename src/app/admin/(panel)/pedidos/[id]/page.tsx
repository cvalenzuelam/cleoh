import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrderCancelAction } from "@/components/admin/OrderCancelAction";
import { OrderStatusActions } from "@/components/admin/OrderStatusActions";
import {
  formatOrderMoney,
  orderStatusBadgeClass,
  orderStatusLabel,
} from "@/lib/orders/format";
import { sizeDisplayName } from "@/lib/admin/products";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

type Address = {
  street?: string;
  exterior?: string;
  interior?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  methodName?: string;
};

export default async function AdminPedidoDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, email, phone, customer_name, shipping_address, subtotal_cents, discount_cents, shipping_cents, total_cents, coupon_code, notes, tracking_code, tracking_url, mp_payment_id, paypal_order_id, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, variant_label, quantity, unit_price_cents, line_total_cents")
    .eq("order_id", order.id);

  const address = (order.shipping_address ?? {}) as Address;

  return (
    <>
      <AdminPageHeader
        title={order.order_number}
        description={new Date(order.created_at).toLocaleString("es-MX")}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/pedidos"
          className="text-sm text-zinc-500 underline-offset-2 hover:underline"
        >
          ← Pedidos
        </Link>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${orderStatusBadgeClass(order.status)}`}
        >
          {orderStatusLabel(order.status)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Cliente
            </h2>
            <p className="mt-2 text-sm text-zinc-900">{order.customer_name}</p>
            <p className="text-sm text-zinc-500">{order.email}</p>
            {order.phone ? (
              <p className="text-sm text-zinc-500">{order.phone}</p>
            ) : null}
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Dirección
            </h2>
            {address.street ? (
              <div className="mt-2 space-y-1 text-sm text-zinc-700">
                <p>
                  {address.street} {address.exterior}
                  {address.interior ? ` Int. ${address.interior}` : ""}
                </p>
                <p>{address.neighborhood}</p>
                <p>
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.country || "México"}</p>
                {address.methodName ? (
                  <p className="pt-2 text-zinc-500">
                    Envío: {address.methodName}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">Sin dirección</p>
            )}
          </section>

          {order.notes ? (
            <section className="rounded-lg border border-zinc-200 bg-white p-5">
              <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Nota
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                {order.notes}
              </p>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Artículos
            </h2>
            <ul className="mt-3 divide-y divide-zinc-100 text-sm">
              {(items ?? []).map((item, idx) => (
                <li key={idx} className="flex justify-between gap-3 py-2">
                  <span>
                    {item.product_name}
                    {item.variant_label
                      ? ` · ${sizeDisplayName(item.variant_label)}`
                      : ""} ×{" "}
                    {item.quantity}
                  </span>
                  <span className="tabular-nums">
                    {formatOrderMoney(item.line_total_cents)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-zinc-100 pt-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatOrderMoney(order.subtotal_cents)}</span>
              </div>
              {order.discount_cents > 0 ? (
                <div className="flex justify-between text-zinc-500">
                  <span>
                    Descuento
                    {order.coupon_code ? ` (${order.coupon_code})` : ""}
                  </span>
                  <span>-{formatOrderMoney(order.discount_cents)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Envío</span>
                <span>{formatOrderMoney(order.shipping_cents)}</span>
              </div>
              <div className="flex justify-between font-medium text-zinc-900">
                <span>Total</span>
                <span>{formatOrderMoney(order.total_cents)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Fulfillment
            </h2>
            <div className="mt-3">
              <OrderStatusActions
                orderId={order.id}
                status={order.status}
                trackingCode={order.tracking_code}
                trackingUrl={order.tracking_url}
              />
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Cancelación
            </h2>
            <div className="mt-3">
              <OrderCancelAction
                orderId={order.id}
                status={order.status}
                totalCents={order.total_cents}
              />
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-500">
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Pago
            </h2>
            <div className="mt-3 space-y-1">
              {order.paypal_order_id ? (
                <>
                  <p>PayPal order: {order.paypal_order_id}</p>
                  {order.mp_payment_id ? (
                    <p>PayPal capture: {order.mp_payment_id}</p>
                  ) : null}
                </>
              ) : order.mp_payment_id ? (
                <p>Mercado Pago: {order.mp_payment_id}</p>
              ) : (
                <p>Sin referencia de pago aún.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
