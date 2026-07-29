"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createShippingMethod,
  updateShippingMethod,
  type ShippingActionState,
} from "@/app/admin/(panel)/envios/actions";
import { centsToPesos } from "@/lib/admin/products";

export type ShippingMethodFormValues = {
  id?: string;
  name: string;
  description: string;
  eta_label: string;
  price_cents: number;
  sort_order: number;
  is_active: boolean;
};

const initial: ShippingActionState = {};

const inputClass =
  "mt-1.5 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400";
const labelClass =
  "block text-xs font-medium uppercase tracking-wide text-zinc-500";

type Props = { method?: ShippingMethodFormValues };

export function ShippingMethodForm({ method }: Props) {
  const isEdit = Boolean(method?.id);
  const action = isEdit
    ? updateShippingMethod.bind(null, method!.id!)
    : createShippingMethod;

  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form
      action={formAction}
      className="max-w-xl space-y-5 rounded-lg border border-zinc-200 bg-white p-6"
    >
      <div>
        <label htmlFor="name" className={labelClass}>
          Nombre
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={method?.name}
          placeholder="Estafeta Terrestre"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descripción (opcional)
        </label>
        <input
          id="description"
          name="description"
          defaultValue={method?.description}
          placeholder="Envío estándar a todo México"
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className={labelClass}>
            Precio (MXN)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={
              method ? String(centsToPesos(method.price_cents)) : "150"
            }
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="sort_order" className={labelClass}>
            Orden
          </label>
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={method?.sort_order ?? 0}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="eta_label" className={labelClass}>
          Tiempo estimado (opcional)
        </label>
        <input
          id="eta_label"
          name="eta_label"
          defaultValue={method?.eta_label}
          placeholder="3–5 días hábiles"
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={method?.is_active ?? true}
        />
        Activo en checkout
      </label>

      {state.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-700">Guardado.</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar" : "Crear método"}
        </button>
        <Link
          href="/admin/envios"
          className="text-sm text-zinc-500 underline-offset-2 hover:underline"
        >
          Volver
        </Link>
      </div>
    </form>
  );
}
