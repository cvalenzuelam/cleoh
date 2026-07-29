"use client";

import { useTransition } from "react";
import { deleteProduct } from "@/app/admin/(panel)/productos/actions";

export function DeleteProductButton({ productId }: { productId: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Eliminar este producto y sus variantes?")) return;
        start(async () => {
          await deleteProduct(productId);
        });
      }}
      className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
