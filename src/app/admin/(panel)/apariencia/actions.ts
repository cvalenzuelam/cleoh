"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { revalidateStorefront } from "@/lib/admin/revalidate-store";

export type AparienciaActionState = {
  error?: string;
  ok?: boolean;
};

export async function updateHeroImage(
  _prev: AparienciaActionState,
  formData: FormData,
): Promise<AparienciaActionState> {
  try {
    const { supabase } = await requireAdmin();
    const url = String(formData.get("hero_image_url") ?? "")
      .replace(/[\r\n\t]+/g, "")
      .trim();

    if (!url) {
      return { error: "La URL de la imagen es obligatoria." };
    }

    try {
      new URL(url);
    } catch {
      return { error: "URL inválida." };
    }

    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "hero_image_url",
        value: url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (error) {
      if (error.message.includes("site_settings") || error.code === "42P01") {
        return {
          error:
            "Falta la tabla site_settings. Aplica la migración 20260722100000_site_settings.sql en Supabase.",
        };
      }
      return { error: error.message };
    }

    revalidatePath("/admin/apariencia");
    revalidateStorefront();
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "No se pudo guardar.",
    };
  }
}
