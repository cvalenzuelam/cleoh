"use client";

import { useTransition } from "react";
import { deleteShippingMethod } from "@/app/admin/(panel)/envios/actions";

export function DeleteShippingMethodButton({ id }: { id: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Eliminar este método de envío?")) return;
        start(async () => {
          await deleteShippingMethod(id);
        });
      }}
      className="text-sm text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
    >
      {pending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
