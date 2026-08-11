"use client";

import { useState, useTransition } from "react";
import { deleteOrder } from "@/app/admin/(panel)/pedidos/actions";

type Props = {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  status: string;
};

export function DeleteOrderButton({
  orderId,
  orderNumber,
  customerEmail,
  status,
}: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const stockNote =
    status === "paid" || status === "fulfilled"
      ? " Se restaurará el stock que este pedido aún tenía descontado."
      : "";

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          const ok = window.confirm(
            `¿Borrar permanentemente el pedido ${orderNumber} (${customerEmail})?\n\nEsto elimina el registro de la base de datos. No se puede deshacer.${stockNote}`,
          );
          if (!ok) return;
          start(async () => {
            const res = await deleteOrder(orderId);
            if (res?.error) setError(res.error);
          });
        }}
        className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Borrando…" : "Borrar pedido"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-xs text-zinc-400">
        Úsalo para limpiar pedidos de prueba. No reembolsa el pago en PayPal ni
        Mercado Pago — solo borra el registro.
      </p>
    </div>
  );
}
