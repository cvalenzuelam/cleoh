"use client";

import { useTransition } from "react";
import { deleteCoupon } from "@/app/admin/(panel)/cupones/actions";

export function DeleteCouponButton({ id }: { id: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Eliminar este cupón?")) return;
        start(async () => {
          await deleteCoupon(id);
        });
      }}
      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "…" : "Eliminar"}
    </button>
  );
}
