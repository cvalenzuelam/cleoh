"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { pesosToCents } from "@/lib/admin/products";

export type CouponActionState = {
  error?: string;
  ok?: boolean;
};

function parseOptionalDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseCouponFields(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const description = String(formData.get("description") ?? "").trim();
  const discountType = String(formData.get("discount_type") ?? "percent");
  const percentRaw = String(formData.get("percent_off") ?? "").trim();
  const amountRaw = String(formData.get("amount_off") ?? "").trim();
  const minRaw = String(formData.get("min_subtotal") ?? "").trim();
  const maxUsesRaw = String(formData.get("max_uses") ?? "").trim();
  const isActive = formData.get("is_active") === "on";
  const startsAt = parseOptionalDate(formData.get("starts_at"));
  const endsAt = parseOptionalDate(formData.get("ends_at"));

  let percent_off: number | null = null;
  let amount_off_cents: number | null = null;

  if (discountType === "percent") {
    const p = Number(percentRaw);
    if (!Number.isFinite(p) || p < 1 || p > 100) {
      return { error: "El porcentaje debe ser entre 1 y 100." as const };
    }
    percent_off = Math.floor(p);
  } else {
    const a = Number(amountRaw);
    if (!Number.isFinite(a) || a <= 0) {
      return { error: "El monto fijo debe ser mayor a 0." as const };
    }
    amount_off_cents = pesosToCents(a);
  }

  const min_subtotal_cents =
    minRaw === "" ? 0 : pesosToCents(Math.max(0, Number(minRaw) || 0));

  let max_uses: number | null = null;
  if (maxUsesRaw !== "") {
    const m = Number(maxUsesRaw);
    if (!Number.isFinite(m) || m < 1) {
      return { error: "Máximo de usos inválido." as const };
    }
    max_uses = Math.floor(m);
  }

  if (!code) return { error: "El código es obligatorio." as const };

  return {
    code,
    description: description || null,
    percent_off,
    amount_off_cents,
    min_subtotal_cents,
    max_uses,
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: isActive,
  };
}

export async function createCoupon(
  _prev: CouponActionState,
  formData: FormData,
): Promise<CouponActionState> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = parseCouponFields(formData);
    if ("error" in parsed && parsed.error) return { error: parsed.error };

    const { error } = await supabase.from("coupons").insert({
      code: parsed.code!,
      description: parsed.description,
      percent_off: parsed.percent_off,
      amount_off_cents: parsed.amount_off_cents,
      min_subtotal_cents: parsed.min_subtotal_cents ?? 0,
      max_uses: parsed.max_uses,
      starts_at: parsed.starts_at,
      ends_at: parsed.ends_at,
      is_active: parsed.is_active ?? true,
    });

    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        return { error: "Ese código de cupón ya existe." };
      }
      return { error: error.message };
    }

    revalidatePath("/admin/cupones");
    redirect("/admin/cupones");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return {
      error: e instanceof Error ? e.message : "No se pudo crear el cupón.",
    };
  }
}

export async function updateCoupon(
  id: string,
  _prev: CouponActionState,
  formData: FormData,
): Promise<CouponActionState> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = parseCouponFields(formData);
    if ("error" in parsed && parsed.error) return { error: parsed.error };

    const { error } = await supabase
      .from("coupons")
      .update({
        code: parsed.code!,
        description: parsed.description,
        percent_off: parsed.percent_off,
        amount_off_cents: parsed.amount_off_cents,
        min_subtotal_cents: parsed.min_subtotal_cents ?? 0,
        max_uses: parsed.max_uses,
        starts_at: parsed.starts_at,
        ends_at: parsed.ends_at,
        is_active: parsed.is_active ?? true,
      })
      .eq("id", id);

    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        return { error: "Ese código de cupón ya existe." };
      }
      return { error: error.message };
    }

    revalidatePath("/admin/cupones");
    revalidatePath(`/admin/cupones/${id}`);
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "No se pudo guardar el cupón.",
    };
  }
}

export async function deleteCoupon(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/admin/cupones");
  redirect("/admin/cupones");
}
