import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  formatOrderMoney,
  orderStatusBadgeClass,
  orderStatusLabel,
} from "@/lib/orders/format";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage() {
  const supabase = createServiceClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, email, total_cents, status, created_at, mp_payment_id",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <AdminPageHeader
        title="Pedidos"
        description="Estados: pending → paid → fulfilled. Actualizados por webhook de Mercado Pago."
      />

      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error.message}
        </p>
      ) : !orders?.length ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500">
          Aún no hay pedidos. Se crean al iniciar checkout con Mercado Pago.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-zinc-50 text-zinc-600">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {o.order_number}
                    </Link>
                    {o.mp_payment_id ? (
                      <span className="mt-0.5 block text-[0.65rem] font-normal text-zinc-400">
                        MP {o.mp_payment_id}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block">{o.customer_name}</span>
                    <span className="text-xs text-zinc-400">{o.email}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatOrderMoney(o.total_cents)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${orderStatusBadgeClass(o.status)}`}
                    >
                      {orderStatusLabel(o.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {new Date(o.created_at).toLocaleString("es-MX")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
