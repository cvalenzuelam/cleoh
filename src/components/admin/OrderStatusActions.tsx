"use client";

import { useState, useTransition } from "react";
import { markOrderFulfilled } from "@/app/admin/(panel)/pedidos/actions";

type Props = {
  orderId: string;
  status: string;
  trackingCode?: string | null;
  trackingUrl?: string | null;
};

const inputClass =
  "mt-1.5 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400";
const labelClass =
  "block text-xs font-medium uppercase tracking-wide text-zinc-500";

export function OrderStatusActions({
  orderId,
  status,
  trackingCode,
  trackingUrl,
}: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState(trackingCode ?? "");
  const [url, setUrl] = useState(trackingUrl ?? "");

  if (status === "fulfilled") {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-sky-800">Pedido marcado como enviado.</p>
        {trackingCode ? (
          <div>
            <p className={labelClass}>Código de rastreo</p>
            <p className="mt-1 font-mono text-zinc-900">{trackingCode}</p>
          </div>
        ) : null}
        {trackingUrl ? (
          <div>
            <p className={labelClass}>Link de rastreo</p>
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block break-all text-zinc-700 underline-offset-2 hover:underline"
            >
              {trackingUrl}
            </a>
          </div>
        ) : null}
      </div>
    );
  }

  if (status === "refunded" || status === "cancelled") {
    return (
      <p className="text-sm text-zinc-500">
        Este pedido fue cancelado; no aplica fulfillment.
      </p>
    );
  }

  if (status !== "paid") {
    return (
      <p className="text-sm text-zinc-500">
        Cuando el pedido esté pagado, podrás marcarlo como enviado.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="tracking-code" className={labelClass}>
          Código de rastreo <span className="text-rose-700">*</span>
        </label>
        <input
          id="tracking-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ej. 1234567890MX"
          className={inputClass}
          autoComplete="off"
        />
      </div>
      <div>
        <label htmlFor="tracking-url" className={labelClass}>
          Link de rastreo <span className="text-rose-700">*</span>
        </label>
        <input
          id="tracking-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.estafeta.com/..."
          className={inputClass}
          autoComplete="off"
        />
        <p className="mt-1 text-xs text-zinc-400">
          Debe incluir https:// (sitio de la paquetería).
        </p>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          const trimmedCode = code.trim();
          const trimmedUrl = url.trim();
          if (!trimmedCode) {
            setError("El código de rastreo es obligatorio.");
            return;
          }
          if (trimmedCode.length < 4) {
            setError("El código de rastreo es demasiado corto.");
            return;
          }
          if (!trimmedUrl) {
            setError("El link de rastreo es obligatorio.");
            return;
          }
          try {
            const parsed = new URL(trimmedUrl);
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
              setError("El link debe empezar con http:// o https://.");
              return;
            }
          } catch {
            setError(
              "El link de rastreo no es una URL válida (incluye https://).",
            );
            return;
          }

          start(async () => {
            const res = await markOrderFulfilled(orderId, {
              trackingCode: trimmedCode,
              trackingUrl: trimmedUrl,
            });
            if (res.error) setError(res.error);
          });
        }}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Marcar como enviado"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-xs text-zinc-400">
        Al confirmar se guarda el rastreo y se envía un correo al cliente.
      </p>
    </div>
  );
}
