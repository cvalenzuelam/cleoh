"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOrders } from "@/app/admin/(panel)/pedidos/actions";
import {
  formatOrderMoney,
  orderStatusBadgeClass,
  orderStatusLabel,
} from "@/lib/orders/format";
import { paymentMethodLabel } from "@/lib/orders/payment-method";

export type AdminOrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  total_cents: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  mp_payment_id: string | null;
};

export function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const allIds = useMemo(() => orders.map((o) => o.id), [orders]);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.has(id));
  const selectedCount = selected.size;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allIds.length > 0 && allIds.every((id) => prev.has(id))) {
        return new Set();
      }
      return new Set(allIds);
    });
  }

  function handleBulkDelete() {
    if (!selectedCount) return;
    const ok = window.confirm(
      `¿Borrar permanentemente ${selectedCount} pedido${selectedCount === 1 ? "" : "s"}?\n\nSe eliminan de la base de datos. Si alguno estaba pagado/enviado, se restaura el stock pendiente. No se reembolsa en PayPal ni Mercado Pago.`,
    );
    if (!ok) return;

    setError(null);
    const ids = [...selected];
    start(async () => {
      const res = await deleteOrders(ids);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {selectedCount > 0
            ? `${selectedCount} seleccionado${selectedCount === 1 ? "" : "s"}`
            : "Selecciona pedidos para borrarlos juntos"}
        </p>
        <button
          type="button"
          disabled={pending || selectedCount === 0}
          onClick={handleBulkDelete}
          className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {pending
            ? "Borrando…"
            : selectedCount > 0
              ? `Borrar ${selectedCount}`
              : "Borrar seleccionados"}
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={pending}
                  aria-label="Seleccionar todos"
                  className="h-4 w-4 rounded border-zinc-300"
                />
              </th>
              <th className="px-4 py-3 font-medium">Pedido</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const isChecked = selected.has(o.id);
              return (
                <tr
                  key={o.id}
                  className={`border-t border-zinc-50 text-zinc-600 ${
                    isChecked ? "bg-red-50/40" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(o.id)}
                      disabled={pending}
                      aria-label={`Seleccionar ${o.order_number}`}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    <Link
                      href={`/admin/pedidos/${o.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {o.order_number}
                    </Link>
                    {o.payment_method === "spei" ? (
                      <span className="mt-0.5 block text-[0.65rem] font-normal text-amber-700">
                        {paymentMethodLabel(o.payment_method)}
                      </span>
                    ) : o.mp_payment_id ? (
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
