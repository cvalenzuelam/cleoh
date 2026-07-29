"use client";

import { useState, useTransition } from "react";
import { cancelOrder } from "@/app/admin/(panel)/pedidos/actions";
import { formatOrderMoney } from "@/lib/orders/format";

type Props = {
  orderId: string;
  status: string;
  totalCents: number;
};

export function OrderCancelAction({ orderId, status, totalCents }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (status === "refunded") {
    return (
      <p className="text-sm text-violet-800">
        Pedido cancelado y reembolsado al cliente.
      </p>
    );
  }

  if (status === "cancelled") {
    return <p className="text-sm text-zinc-600">Pedido cancelado.</p>;
  }

  if (status !== "paid") {
    return null;
  }

  if (confirming) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-zinc-700">
          Se reembolsará{" "}
          <span className="font-medium">{formatOrderMoney(totalCents)}</span> al
          método de pago del cliente y se enviará un correo de confirmación.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              start(async () => {
                const res = await cancelOrder(orderId);
                if (res.error) {
                  setError(res.error);
                  return;
                }
                setConfirming(false);
              });
            }}
            className="rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-50"
          >
            {pending ? "Cancelando…" : "Sí, cancelar y reembolsar"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            No, volver
          </button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100 disabled:opacity-50"
      >
        Cancelar pedido
      </button>
      <p className="text-xs text-zinc-400">
        Procesa el reembolso en PayPal o Mercado Pago y avisa al cliente por
        correo.
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
