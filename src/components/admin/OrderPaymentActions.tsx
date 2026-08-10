"use client";

import { useState, useTransition } from "react";
import {
  cancelPendingOrder,
  markSpeiOrderPaid,
} from "@/app/admin/(panel)/pedidos/actions";

type Props = {
  orderId: string;
  status: string;
  paymentMethod: string | null;
};

export function OrderPaymentActions({
  orderId,
  status,
  paymentMethod,
}: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (paymentMethod !== "spei") return null;

  if (status === "paid" || status === "fulfilled") {
    return (
      <p className="text-sm text-emerald-800">
        Transferencia validada manualmente.
      </p>
    );
  }

  if (status === "cancelled" || status === "refunded") {
    return null;
  }

  if (status !== "pending") {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-amber-900">
        Pedido por transferencia SPEI — valida el comprobante recibido por
        Instagram antes de marcar como pagado.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            setMessage(null);
            start(async () => {
              const res = await markSpeiOrderPaid(orderId);
              if (res.error) setError(res.error);
              else setMessage("Pedido marcado como pagado.");
            });
          }}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Validar pago SPEI"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (
              !window.confirm(
                "¿Cancelar este pedido? El stock no se descontó aún.",
              )
            ) {
              return;
            }
            setError(null);
            setMessage(null);
            start(async () => {
              const res = await cancelPendingOrder(orderId);
              if (res.error) setError(res.error);
              else setMessage("Pedido cancelado.");
            });
          }}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Cancelar pedido
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
    </div>
  );
}
