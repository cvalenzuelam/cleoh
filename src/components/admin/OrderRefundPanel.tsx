"use client";

import { useMemo, useState, useTransition } from "react";
import { processOrderRefund } from "@/app/admin/(panel)/pedidos/actions";
import { sizeDisplayName } from "@/lib/admin/products";
import { formatOrderMoney } from "@/lib/orders/format";
import {
  availableItemQuantity,
  calculateRefundAmountCents,
} from "@/lib/orders/refund";

export type RefundItem = {
  id: string;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  refunded_quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
};

type Props = {
  orderId: string;
  status: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  refundedCents: number;
  paymentLabel: string;
  manualOnly?: boolean;
  items: RefundItem[];
};

type LineState = {
  selected: boolean;
  quantity: number;
};

export function OrderRefundPanel({
  orderId,
  status,
  subtotalCents,
  discountCents,
  shippingCents,
  totalCents,
  refundedCents,
  paymentLabel,
  manualOnly = false,
  items,
}: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [restock, setRestock] = useState(true);
  const [amountOverride, setAmountOverride] = useState<string | null>(null);

  const refundableItems = items.filter((i) => availableItemQuantity(i) > 0);

  const [lines, setLines] = useState<Record<string, LineState>>(() => {
    const init: Record<string, LineState> = {};
    for (const item of items) {
      const available = availableItemQuantity(item);
      init[item.id] = {
        selected: available > 0,
        quantity: available,
      };
    }
    return init;
  });

  const remainingCents = Math.max(0, totalCents - refundedCents);

  const selectedLines = useMemo(
    () =>
      Object.entries(lines)
        .filter(([, v]) => v.selected && v.quantity > 0)
        .map(([itemId, v]) => ({ itemId, quantity: v.quantity })),
    [lines],
  );

  const suggestedCents = useMemo(() => {
    if (!selectedLines.length) return 0;
    return calculateRefundAmountCents(
      {
        subtotal_cents: subtotalCents,
        discount_cents: discountCents,
        shipping_cents: shippingCents,
        total_cents: totalCents,
        refunded_cents: refundedCents,
      },
      items,
      selectedLines,
    ).amountCents;
  }, [
    selectedLines,
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents,
    refundedCents,
    items,
  ]);

  const refundCents = amountOverride != null
    ? Math.round(parseFloat(amountOverride.replace(/,/g, "")) * 100) || 0
    : suggestedCents;

  const selectedCount = selectedLines.reduce((s, l) => s + l.quantity, 0);

  if (status === "refunded" || status === "cancelled") {
    return (
      <p className="text-sm text-violet-800">
        {status === "refunded"
          ? "Pedido reembolsado por completo."
          : "Pedido cancelado."}
        {refundedCents > 0 ? (
          <span className="block text-zinc-500">
            Total reembolsado: {formatOrderMoney(refundedCents)}
          </span>
        ) : null}
      </p>
    );
  }

  if (status !== "paid" && status !== "fulfilled") {
    return null;
  }

  if (!refundableItems.length) {
    return (
      <p className="text-sm text-zinc-500">
        No quedan artículos por reembolsar en este pedido.
      </p>
    );
  }

  function updateLine(itemId: string, patch: Partial<LineState>) {
    setAmountOverride(null);
    setLines((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...patch },
    }));
  }

  return (
    <div className="space-y-4">
      {refundedCents > 0 ? (
        <p className="rounded-md bg-violet-50 px-3 py-2 text-sm text-violet-800">
          Reembolso parcial previo: {formatOrderMoney(refundedCents)} · Disponible:{" "}
          {formatOrderMoney(remainingCents)}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Ítems a reembolsar
          </p>
          <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200">
            {refundableItems.map((item) => {
              const available = availableItemQuantity(item);
              const state = lines[item.id];
              const lineTotal =
                state.selected && state.quantity > 0
                  ? item.unit_price_cents * state.quantity
                  : 0;

              return (
                <li key={item.id} className="p-3">
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={state.selected}
                      disabled={pending}
                      onChange={(e) =>
                        updateLine(item.id, { selected: e.target.checked })
                      }
                      className="mt-1 h-4 w-4 rounded border-zinc-300"
                      aria-label={`Seleccionar ${item.product_name}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatOrderMoney(item.unit_price_cents)}
                        {item.variant_label
                          ? ` · Talla ${sizeDisplayName(item.variant_label)}`
                          : ""}
                      </p>
                      {item.refunded_quantity > 0 ? (
                        <p className="mt-1 text-xs text-violet-600">
                          Ya reembolsados: {item.refunded_quantity}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-zinc-500">
                          Cantidad
                          <input
                            type="number"
                            min={0}
                            max={available}
                            value={state.quantity}
                            disabled={!state.selected || pending}
                            onChange={(e) => {
                              const qty = Math.min(
                                available,
                                Math.max(0, parseInt(e.target.value, 10) || 0),
                              );
                              updateLine(item.id, { quantity: qty });
                            }}
                            className="w-16 rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-900"
                          />
                        </label>
                        <span className="text-xs text-zinc-400">
                          Disponibles: {available}
                        </span>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm tabular-nums text-zinc-700">
                      {formatOrderMoney(lineTotal)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Resumen
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500">
                Ítems ({selectedCount})
              </dt>
              <dd className="tabular-nums text-zinc-900">
                {formatOrderMoney(
                  selectedLines.reduce((sum, l) => {
                    const item = items.find((i) => i.id === l.itemId);
                    return sum + (item ? item.unit_price_cents * l.quantity : 0);
                  }, 0),
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-2 border-t border-zinc-200 pt-2 font-medium">
              <dt className="text-zinc-900">A reembolsar</dt>
              <dd className="tabular-nums text-zinc-900">
                {formatOrderMoney(refundCents)}
              </dd>
            </div>
          </dl>
          <div className="mt-4">
            <label className="block text-xs font-medium text-zinc-500">
              Monto ({paymentLabel})
            </label>
            <input
              type="number"
              min={0}
              max={remainingCents / 100}
              step="0.01"
              value={(refundCents / 100).toFixed(2)}
              disabled={pending}
              onChange={(e) => setAmountOverride(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-200 px-2 py-1.5 text-sm tabular-nums"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Máximo: {formatOrderMoney(remainingCents)}
            </p>
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          checked={restock}
          disabled={pending}
          onChange={(e) => setRestock(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        Actualizar inventario (devolver stock)
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || refundCents <= 0 || !selectedLines.length}
          onClick={() => {
            setError(null);
            start(async () => {
              const res = await processOrderRefund(orderId, {
                lines: selectedLines,
                restock,
                amountCents: refundCents,
              });
              if (res.error) {
                setError(res.error);
                return;
              }
              setAmountOverride(null);
            });
          }}
          className="rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-50"
        >
          {pending
            ? "Procesando…"
            : manualOnly
              ? `Registrar reembolso ${formatOrderMoney(refundCents)}`
              : `Reembolsar ${formatOrderMoney(refundCents)}`}
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-xs text-zinc-400">
        {manualOnly
          ? "Transfiere el monto al cliente desde tu banco y luego registra el reembolso aquí para actualizar el pedido, el stock y avisar por correo."
          : "Puedes reembolsar una parte o todo el pedido. El cliente recibe un correo con el detalle."}
      </p>
    </div>
  );
}
