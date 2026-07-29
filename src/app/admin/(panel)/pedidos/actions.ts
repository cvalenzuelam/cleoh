"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  sendOrderRefundEmail,
  sendOrderShippedEmail,
} from "@/lib/email/orders";
import { refundMercadoPagoPayment } from "@/lib/mercadopago/client";
import { refundPayPalCapture } from "@/lib/paypal/client";
import {
  calculateRefundAmountCents,
  type RefundLineInput,
  validateRefundLines,
} from "@/lib/orders/refund";
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

async function restockRefundedItems(
  supabase: ReturnType<typeof createServiceClient>,
  items: { variant_id: string | null; quantity: number }[],
) {
  for (const item of items) {
    if (!item.variant_id || item.quantity <= 0) continue;
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
}

async function processPaymentRefund(
  order: {
    mp_payment_id: string | null;
    paypal_order_id: string | null;
    currency: string | null;
  },
  amountCents: number,
) {
  if (!order.mp_payment_id) {
    throw new Error("No hay referencia de pago para procesar el reembolso.");
  }

  if (order.paypal_order_id) {
    await refundPayPalCapture(order.mp_payment_id, {
      amountCents,
      currency: order.currency ?? "MXN",
    });
  } else {
    await refundMercadoPagoPayment(order.mp_payment_id, { amountCents });
  }
}

export async function processOrderRefund(
  orderId: string,
  input: {
    lines: RefundLineInput[];
    restock: boolean;
    amountCents: number;
  },
): Promise<OrderActionState> {
  try {
    await requireAdmin();

    const supabase = createServiceClient();

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(
        "id, status, subtotal_cents, discount_cents, shipping_cents, total_cents, refunded_cents, currency, mp_payment_id, paypal_order_id, coupon_id",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError || !order) {
      return { error: "Pedido no encontrado." };
    }

    if (order.status === "refunded" || order.status === "cancelled") {
      return { error: "Este pedido ya no admite reembolsos." };
    }

    if (order.status !== "paid" && order.status !== "fulfilled") {
      return {
        error: "Solo se pueden reembolsar pedidos pagados o enviados.",
      };
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select(
        "id, variant_id, quantity, refunded_quantity, unit_price_cents, line_total_cents, product_name, variant_label",
      )
      .eq("order_id", orderId);

    if (itemsError || !items?.length) {
      return { error: "No se encontraron artículos del pedido." };
    }

    const lineError = validateRefundLines(items, input.lines);
    if (lineError) {
      return { error: lineError };
    }

    const remainingCents = Math.max(
      0,
      order.total_cents - (order.refunded_cents ?? 0),
    );

    if (remainingCents <= 0) {
      return { error: "Este pedido ya fue reembolsado por completo." };
    }

    const { amountCents: suggestedCents, allItemsFullyRefunded } =
      calculateRefundAmountCents(order, items, input.lines);

    const refundAmount = Math.round(input.amountCents);

    if (refundAmount <= 0) {
      return { error: "El monto del reembolso debe ser mayor a cero." };
    }

    if (refundAmount > remainingCents) {
      return {
        error: `El monto no puede superar ${remainingCents / 100} MXN disponibles.`,
      };
    }

    if (refundAmount > suggestedCents) {
      return {
        error: "El monto supera el calculado para los ítems seleccionados.",
      };
    }

    await processPaymentRefund(order, refundAmount);

    const lineMap = new Map(
      input.lines.map((l) => [l.itemId, l.quantity]),
    );

    for (const item of items) {
      const qty = lineMap.get(item.id) ?? 0;
      if (qty <= 0) continue;

      const { error: itemUpdateError } = await supabase
        .from("order_items")
        .update({
          refunded_quantity: (item.refunded_quantity ?? 0) + qty,
        })
        .eq("id", item.id);

      if (itemUpdateError) {
        if (
          itemUpdateError.message.includes("refunded_quantity") ||
          itemUpdateError.code === "42703"
        ) {
          return {
            error:
              "Falta la migración de reembolsos parciales. Corre supabase/migrations/20260729120000_order_partial_refunds.sql",
          };
        }
        return { error: itemUpdateError.message };
      }
    }

    if (input.restock) {
      await restockRefundedItems(
        supabase,
        items
          .map((item) => ({
            variant_id: item.variant_id,
            quantity: lineMap.get(item.id) ?? 0,
          }))
          .filter((i) => i.quantity > 0),
      );
    }

    const newRefundedCents = (order.refunded_cents ?? 0) + refundAmount;
    const fullyRefunded = allItemsFullyRefunded;

    if (fullyRefunded && order.coupon_id) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("used_count")
        .eq("id", order.coupon_id)
        .maybeSingle();
      if (coupon && (coupon.used_count ?? 0) > 0) {
        await supabase
          .from("coupons")
          .update({ used_count: (coupon.used_count ?? 0) - 1 })
          .eq("id", order.coupon_id);
      }
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        refunded_cents: newRefundedCents,
        status: fullyRefunded ? "refunded" : order.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      if (
        updateError.message.includes("refunded_cents") ||
        updateError.code === "42703"
      ) {
        return {
          error:
            "Falta la migración de reembolsos parciales. Corre supabase/migrations/20260729120000_order_partial_refunds.sql",
        };
      }
      return { error: updateError.message };
    }

    try {
      await sendOrderRefundEmail(orderId, {
        amountCents: refundAmount,
        fullyRefunded,
        lines: input.lines
          .filter((l) => l.quantity > 0)
          .map((l) => {
            const item = items.find((i) => i.id === l.itemId)!;
            return {
              product_name: item.product_name,
              variant_label: item.variant_label,
              quantity: l.quantity,
            };
          }),
      });
    } catch (e) {
      console.error("[email] refund notify failed", e);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${orderId}`);
    return { ok: true };
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "No se pudo procesar el reembolso.",
    };
  }
}

/** Reembolso total del pedido (atajo). */
export async function cancelOrder(orderId: string): Promise<OrderActionState> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();

    const { data: items } = await supabase
      .from("order_items")
      .select("id, quantity, refunded_quantity")
      .eq("order_id", orderId);

    if (!items?.length) {
      return { error: "Pedido no encontrado." };
    }

    const lines = items
      .map((item) => ({
        itemId: item.id,
        quantity: Math.max(
          0,
          item.quantity - (item.refunded_quantity ?? 0),
        ),
      }))
      .filter((l) => l.quantity > 0);

    const { data: order } = await supabase
      .from("orders")
      .select("total_cents, refunded_cents")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
      return { error: "Pedido no encontrado." };
    }

    const remaining = Math.max(
      0,
      order.total_cents - (order.refunded_cents ?? 0),
    );

    return processOrderRefund(orderId, {
      lines,
      restock: true,
      amountCents: remaining,
    });
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "No se pudo cancelar el pedido.",
    };
  }
}
