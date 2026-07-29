"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import {
  createProduct,
  updateProduct,
  type ProductActionState,
} from "@/app/admin/(panel)/productos/actions";
import { ProductImagesField } from "@/components/admin/ProductImagesField";
import { DEFAULT_SIZES } from "@/lib/admin/products";

export type CategoryOption = { id: string; name: string; slug: string };

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  price: string;
  compare_at: string;
  /** Galería (primera = principal) */
  image_urls: string[];
  badge: string;
  is_featured: boolean;
  is_active: boolean;
  default_stock?: string;
  stocks?: Record<string, number>;
};

const initial: ProductActionState = {};

const inputClass =
  "mt-1.5 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400";
const labelClass =
  "block text-xs font-medium uppercase tracking-wide text-zinc-500";

type Props = {
  categories: CategoryOption[];
  product?: ProductFormValues;
};

export function ProductForm({ categories, product }: Props) {
  const isEdit = Boolean(product?.id);
  const router = useRouter();

  const action = isEdit
    ? updateProduct.bind(null, product!.id!)
    : createProduct;

  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  const formKey = [
    product?.price,
    product?.compare_at,
    product?.badge,
    product?.is_featured,
    product?.is_active,
    JSON.stringify(product?.stocks ?? {}),
    JSON.stringify(product?.image_urls ?? []),
  ].join("|");

  return (
    <form
      key={formKey}
      action={formAction}
      className="max-w-2xl space-y-5 rounded-lg border border-zinc-200 bg-white p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className={labelClass}>
            Nombre
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={product?.name}
            placeholder="BabyDoll Noche"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="slug" className={labelClass}>
            Slug (URL)
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={product?.slug}
            placeholder="babydoll-noche (auto si vacío)"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className={labelClass}>
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={product?.description}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="price" className={labelClass}>
            Precio actual (MXN)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={product?.price ?? ""}
            placeholder="490"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-zinc-400">
            El precio que paga la clienta.
          </p>
        </div>

        <div>
          <label htmlFor="compare_at" className={labelClass}>
            Precio tachado / oferta (opcional)
          </label>
          <input
            id="compare_at"
            name="compare_at"
            type="number"
            min={0}
            step={1}
            defaultValue={product?.compare_at ?? ""}
            placeholder="590"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-zinc-400">
            Solo se muestra tachado si es mayor al precio actual. Si es igual o
            menor, se ignora.
          </p>
        </div>

        <div>
          <label htmlFor="category_id" className={labelClass}>
            Categoría
          </label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={product?.category_id ?? ""}
            className={inputClass}
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="badge" className={labelClass}>
            Etiqueta en foto
          </label>
          <select
            id="badge"
            name="badge"
            defaultValue={product?.badge ?? ""}
            className={inputClass}
          >
            <option value="">Ninguna</option>
            <option value="nuevo">Nuevo</option>
            <option value="mas-vendido">Más vendido</option>
            <option value="oferta">Oferta</option>
          </select>
          <p className="mt-1 text-xs text-zinc-400">
            Para oferta: elige “Oferta” + precio tachado mayor al actual. Si el
            stock llega a 0, se muestra “Agotado”.
          </p>
        </div>

        <ProductImagesField
          defaultUrls={product?.image_urls ?? []}
          labelClass={labelClass}
          inputClass={inputClass}
        />
      </div>

      <div className="flex flex-wrap gap-6 border-t border-zinc-100 pt-4">
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={product?.is_active ?? true}
            className="rounded border-zinc-300"
          />
          Activo (visible en tienda)
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={product?.is_featured ?? false}
            className="rounded border-zinc-300"
          />
          Destacado en home
        </label>
      </div>

      {!isEdit && (
        <div>
          <label htmlFor="default_stock" className={labelClass}>
            Stock inicial (todas las tallas)
          </label>
          <input
            id="default_stock"
            name="default_stock"
            type="number"
            min={0}
            defaultValue={product?.default_stock ?? "5"}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-zinc-400">
            Se crean tallas: {DEFAULT_SIZES.join(", ")}
          </p>
        </div>
      )}

      {isEdit && (
        <div>
          <p className={labelClass}>Stock por talla</p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DEFAULT_SIZES.map((size) => (
              <div key={size}>
                <label
                  htmlFor={`stock_${size}`}
                  className="text-xs text-zinc-500"
                >
                  {size}
                </label>
                <input
                  id={`stock_${size}`}
                  name={`stock_${size}`}
                  type="number"
                  min={0}
                  defaultValue={product?.stocks?.[size] ?? 0}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>
      )}

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
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
        </button>
        <Link
          href="/admin/productos"
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
