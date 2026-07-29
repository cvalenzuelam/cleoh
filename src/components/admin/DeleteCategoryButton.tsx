"use client";

import { useTransition } from "react";
import { deleteCategory } from "@/app/admin/(panel)/categorias/actions";

export function DeleteCategoryButton({ id }: { id: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            "¿Eliminar esta categoría? Los productos quedarán sin categoría.",
          )
        ) {
          return;
        }
        start(async () => {
          await deleteCategory(id);
        });
      }}
      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "…" : "Eliminar"}
    </button>
  );
}
