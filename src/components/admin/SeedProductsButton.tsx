"use client";

import { useState, useTransition } from "react";
import { seedProductsFromStatic } from "@/app/admin/(panel)/productos/actions";

export function SeedProductsButton() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          start(async () => {
            const res = await seedProductsFromStatic();
            if (res.error) setMessage(res.error);
            else setMessage(res.message ?? "Listo.");
          });
        }}
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
      >
        {pending ? "Sincronizando…" : "Sincronizar descripciones (seed)"}
      </button>
      {message && (
        <p className="text-xs text-zinc-500" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
