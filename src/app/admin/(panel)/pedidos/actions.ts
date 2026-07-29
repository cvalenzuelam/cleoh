"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  sendOrderCancelledEmail,
  sendOrderShippedEmail,
} from "@/lib/email/orders";
import { refundMercadoPagoPayment } from "@/lib/mercadopago/client";
import { refundPayPalCapture } from "@/lib/paypal/client";
import { createServiceClient } from "@/lib/supabase/server";

export type OrderActionState = {
  error?: string;
  ok?: boolean;
};

function validateTracking(input: {
  trackingCode?: string;
  trackingUrl?: string;
}):
  | { ok: true; trackingCode: string; trackingUrl: string }
  | { ok: false; error: string } {
  const trackingCode = String(input.trackingCode ?? "").trim();
  const trackingUrl = String(input.trackingUrl ?? "").trim();

  if (!trackingCode) {
    return { ok: false, error: "El código de rastreo es obligatorio." };
  }
  if (trackingCode.length < 4) {
    return { ok: false, error: "El código de rastreo es demasiado corto." };
  }
  if (trackingCode.length > 80) {
    return { ok: false, error: "El código de rastreo es demasiado largo." };
  }
  if (!/^[A-Za-z0-9\-_\s.]+$/.test(trackingCode)) {
    return {
      ok: false,
      error:
        "El código solo puede incluir letras, números, guiones y espacios.",
    };
  }

  if (!trackingUrl) {
    return { ok: false, error: "El link de rastreo es obligatorio." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trackingUrl);
  } catch {
    return {
      ok: false,
      error: "El link de rastreo no es una URL válida (incluye https://).",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      ok: false,
      error: "El link debe empezar con http:// o https://.",
    };
  }

  return {
    ok: true,
    trackingCode,
    trackingUrl: parsed.toString(),
  };
}

export async function markOrderFulfilled(
  orderId: string,
  input: { trackingCode: string; trackingUrl: string },
): Promise<OrderActionState> {
  try {
    await requireAdmin();

    const validated = validateTracking(input);
    if (!validated.ok) {
      return { error: validated.error };
    }

    const supabase = createServiceClient();

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError || !order) {
      return { error: "Pedido no encontrado." };
    }

    if (order.status === "fulfilled") {
      return { error: "Este pedido ya está marcado como enviado." };
    }

    if (order.status !== "paid") {
      return {
        error: "Solo se puede marcar como enviado un pedido pagado.",
      };
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: "fulfilled",
        tracking_code: validated.trackingCode,
        tracking_url: validated.trackingUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      if (
        error.message.includes("tracking_code") ||
        error.message.includes("tracking_url") ||
        error.code === "42703"
      ) {
        return {
          error:
            "Falta la migración de rastreo. Corre supabase/migrations/20260720200000_order_tracking.sql",
        };
      }
      return { error: error.message };
    }

    try {
      await sendOrderShippedEmail(orderId);
    } catch (e) {
      console.error("[email] shipped notify failed", e);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${orderId}`);
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "No se pudo actualizar.",
    };
  }
}

async function restoreOrderInventory(
  supabase: ReturnType<typeof createServiceClient>,
  orderId: string,
  couponId: string | null,
) {
  const { data: items } = await supabase
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", orderId);

  for (const item of items ?? []) {
    if (!item.variant_id) continue;
    const { data: variant } = await supabase
      .from("product_variants")
      .select("stock")
      .eq("id", item.variant_id)
      .maybeSingle();
    if (!variant) continue;
    await supabase
      .from("product_variants")
      .update({
        stock: variant.stock + item.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.variant_id);
  }

  if (couponId) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("used_count")
      .eq("id", couponId)
      .maybeSingle();
    if (coupon && (coupon.used_count ?? 0) > 0) {
      await supabase
        .from("coupons")
        .update({ used_count: (coupon.used_count ?? 0) - 1 })
        .eq("id", couponId);
    }
  }
}

export async function cancelOrder(orderId: string): Promise<OrderActionState> {
  try {
    await requireAdmin();

    const supabase = createServiceClient();

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(
        "id, status, total_cents, currency, mp_payment_id, paypal_order_id, coupon_id",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError || !order) {
      return { error: "Pedido no encontrado." };
    }

    if (order.status === "refunded" || order.status === "cancelled") {
      return { error: "Este pedido ya está cancelado." };
    }

    if (order.status === "fulfilled") {
      return {
        error: "No se puede cancelar un pedido ya enviado.",
      };
    }

    if (order.status !== "paid") {
      return {
        error: "Solo se pueden cancelar pedidos pagados.",
      };
    }

    if (!order.mp_payment_id) {
      return {
        error: "No hay referencia de pago para procesar el reembolso.",
      };
    }

    if (order.paypal_order_id) {
      await refundPayPalCapture(order.mp_payment_id, {
        amountCents: order.total_cents,
        currency: order.currency ?? "MXN",
      });
    } else {
      await refundMercadoPagoPayment(order.mp_payment_id);
    }

    await restoreOrderInventory(supabase, orderId, order.coupon_id);

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      return { error: updateError.message };
    }

    try {
      await sendOrderCancelledEmail(orderId);
    } catch (e) {
      console.error("[email] cancelled notify failed", e);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${orderId}`);
    return { ok: true };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "No se pudo cancelar el pedido.",
    };
  }
}
