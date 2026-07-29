"use client";

import { useActionState } from "react";
import {
  updateHeroImage,
  type AparienciaActionState,
} from "@/app/admin/(panel)/apariencia/actions";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

const initial: AparienciaActionState = {};

const inputClass =
  "mt-1.5 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400";
const labelClass =
  "block text-xs font-medium uppercase tracking-wide text-zinc-500";

type Props = {
  heroImageUrl: string;
};

export function AparienciaForm({ heroImageUrl }: Props) {
  const [state, formAction, pending] = useActionState(updateHeroImage, initial);

  return (
    <form
      action={formAction}
      className="max-w-xl space-y-5 rounded-lg border border-zinc-200 bg-white p-6"
    >
      <div>
        <h2 className="text-base font-semibold text-zinc-900">
          Imagen principal (landing)
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Fondo del hero en la página de inicio. Sube una foto vertical o
          panorámica (recomendado ≥ 1600px de ancho).
        </p>
      </div>

      <ImageUploadField
        name="hero_image_url"
        defaultValue={heroImageUrl}
        label="Imagen del hero"
        labelClass={labelClass}
        inputClass={inputClass}
        previewClassName="h-56 w-full max-w-md rounded-md border border-zinc-200 object-cover object-[center_20%]"
      />

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="text-sm text-emerald-700">
          Guardado. La landing ya muestra la nueva imagen.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium !text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar imagen"}
      </button>
    </form>
  );
}
