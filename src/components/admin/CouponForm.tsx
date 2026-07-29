"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createCoupon,
  updateCoupon,
  type CouponActionState,
} from "@/app/admin/(panel)/cupones/actions";

export type CouponFormValues = {
  id?: string;
  code: string;
  description: string;
  discount_type: "percent" | "amount";
  percent_off: string;
  amount_off: string;
  min_subtotal: string;
  max_uses: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

const initial: CouponActionState = {};

const inputClass =
  "mt-1.5 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400";
const labelClass =
  "block text-xs font-medium uppercase tracking-wide text-zinc-500";

function toDatetimeLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Props = { coupon?: CouponFormValues };

export function CouponForm({ coupon }: Props) {
  const isEdit = Boolean(coupon?.id);
  const action = isEdit
    ? updateCoupon.bind(null, coupon!.id!)
    : createCoupon;

  const [state, formAction, pending] = useActionState(action, initial);
  const [discountType, setDiscountType] = useState<"percent" | "amount">(
    coupon?.discount_type ?? "percent",
  );

  return (
    <form
      action={formAction}
      className="max-w-xl space-y-5 rounded-lg border border-zinc-200 bg-white p-6"
    >
      <input type="hidden" name="discount_type" value={discountType} />

      <div>
        <label htmlFor="code" className={labelClass}>
          Código
        </label>
        <input
          id="code"
          name="code"
          required
          defaultValue={coupon?.code}
            placeholder="CLEOH10"
          className={`${inputClass} font-mono`}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descripción (opcional)
        </label>
        <input
          id="description"
          name="description"
          defaultValue={coupon?.description}
          placeholder="10% de descuento"
          className={inputClass}
        />
      </div>

      <div>
        <p className={labelClass}>Tipo de descuento</p>
        <div className="mt-2 flex gap-4 text-sm text-zinc-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="discount_type_ui"
              checked={discountType === "percent"}
              onChange={() => setDiscountType("percent")}
            />
            Porcentaje
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="discount_type_ui"
              checked={discountType === "amount"}
              onChange={() => setDiscountType("amount")}
            />
            Monto fijo (MXN)
          </label>
        </div>
      </div>

      {discountType === "percent" ? (
        <div>
          <label htmlFor="percent_off" className={labelClass}>
            Porcentaje
          </label>
          <input
            id="percent_off"
            name="percent_off"
            type="number"
            min={1}
            max={100}
            required
            defaultValue={coupon?.percent_off ?? "10"}
            className={inputClass}
          />
        </div>
      ) : (
        <div>
          <label htmlFor="amount_off" className={labelClass}>
            Monto (MXN)
          </label>
          <input
            id="amount_off"
            name="amount_off"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={coupon?.amount_off ?? ""}
            placeholder="100"
            className={inputClass}
          />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="min_subtotal" className={labelClass}>
            Mínimo de compra (MXN)
          </label>
          <input
            id="min_subtotal"
            name="min_subtotal"
            type="number"
            min={0}
            step={1}
            defaultValue={coupon?.min_subtotal ?? "0"}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="max_uses" className={labelClass}>
            Máx. usos (vacío = ilimitado)
          </label>
          <input
            id="max_uses"
            name="max_uses"
            type="number"
            min={1}
            defaultValue={coupon?.max_uses ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="starts_at" className={labelClass}>
            Inicio (opcional)
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            defaultValue={toDatetimeLocal(coupon?.starts_at)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="ends_at" className={labelClass}>
            Fin (opcional)
          </label>
          <input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            defaultValue={toDatetimeLocal(coupon?.ends_at)}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={coupon?.is_active ?? true}
          className="rounded border-zinc-300"
        />
        Activo (usable en checkout)
      </label>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="text-sm text-emerald-700">Guardado correctamente.</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear cupón"}
        </button>
        <Link
          href="/admin/cupones"
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
