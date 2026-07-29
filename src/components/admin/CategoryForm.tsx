"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createCategory,
  updateCategory,
  type CategoryActionState,
} from "@/app/admin/(panel)/categorias/actions";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

export type CategoryFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  cover_image_url: string;
  sort_order: string;
  is_nav: boolean;
  is_tile: boolean;
};

const initial: CategoryActionState = {};

const inputClass =
  "mt-1.5 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400";
const labelClass =
  "block text-xs font-medium uppercase tracking-wide text-zinc-500";

type Props = { category?: CategoryFormValues };

export function CategoryForm({ category }: Props) {
  const isEdit = Boolean(category?.id);
  const action = isEdit
    ? updateCategory.bind(null, category!.id!)
    : createCategory;

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
          defaultValue={category?.name}
          placeholder="Novias"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="slug" className={labelClass}>
          Slug (URL)
        </label>
        <input
          id="slug"
          name="slug"
          defaultValue={category?.slug}
          placeholder="novias (auto si vacío)"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={category?.description}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="sort_order" className={labelClass}>
          Orden (menor = primero)
        </label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          defaultValue={category?.sort_order ?? "0"}
          className={inputClass}
        />
      </div>

      <ImageUploadField
        name="cover_image_url"
        defaultValue={category?.cover_image_url}
        labelClass={labelClass}
        inputClass={inputClass}
      />

      <div className="flex flex-wrap gap-6 border-t border-zinc-100 pt-4">
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="is_nav"
            defaultChecked={category?.is_nav ?? true}
            className="rounded border-zinc-300"
          />
          Mostrar en menú
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="is_tile"
            defaultChecked={category?.is_tile ?? true}
            className="rounded border-zinc-300"
          />
          Tile en home
        </label>
      </div>

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
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium !text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending
            ? "Guardando…"
            : isEdit
              ? "Guardar cambios"
              : "Crear categoría"}
        </button>
        <Link
          href="/admin/categorias"
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
