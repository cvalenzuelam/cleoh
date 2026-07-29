"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { pesosToCents } from "@/lib/admin/products";

export type ShippingActionState = {
  error?: string;
  ok?: boolean;
};

function parseShippingFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const etaLabel = String(formData.get("eta_label") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const sortRaw = String(formData.get("sort_order") ?? "0").trim();
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "El nombre es obligatorio." as const };

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    return { error: "El precio de envío no es válido." as const };
  }

  const sort_order = Number(sortRaw);
  if (!Number.isFinite(sort_order)) {
    return { error: "El orden no es válido." as const };
  }

  return {
    name,
    description: description || null,
    eta_label: etaLabel || null,
    price_cents: pesosToCents(price),
    sort_order: Math.floor(sort_order),
    is_active: isActive,
  };
}

export async function createShippingMethod(
  _prev: ShippingActionState,
  formData: FormData,
): Promise<ShippingActionState> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = parseShippingFields(formData);
    if ("error" in parsed && parsed.error) return { error: parsed.error };

    const { error } = await supabase.from("shipping_methods").insert({
      name: parsed.name!,
      description: parsed.description,
      eta_label: parsed.eta_label,
      price_cents: parsed.price_cents!,
      sort_order: parsed.sort_order ?? 0,
      is_active: parsed.is_active ?? true,
    });

    if (error) return { error: error.message };

    revalidatePath("/admin/envios");
    revalidatePath("/checkout");
    redirect("/admin/envios");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return {
      error: e instanceof Error ? e.message : "No se pudo crear el método.",
    };
  }
}

export async function updateShippingMethod(
  id: string,
  _prev: ShippingActionState,
  formData: FormData,
): Promise<ShippingActionState> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = parseShippingFields(formData);
    if ("error" in parsed && parsed.error) return { error: parsed.error };

    const { error } = await supabase
      .from("shipping_methods")
      .update({
        name: parsed.name!,
        description: parsed.description,
        eta_label: parsed.eta_label,
        price_cents: parsed.price_cents!,
        sort_order: parsed.sort_order ?? 0,
        is_active: parsed.is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/envios");
    revalidatePath(`/admin/envios/${id}`);
    revalidatePath("/checkout");
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "No se pudo guardar.",
    };
  }
}

export async function deleteShippingMethod(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("shipping_methods")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/envios");
  revalidatePath("/checkout");
  redirect("/admin/envios");
}
