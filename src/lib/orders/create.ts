import "server-only";

import { sendMetaPurchaseCapiEvent } from "@/lib/analytics/metaConversionsApi";
import { markAbandonedCartRecovered } from "@/lib/cart/abandon";
import { sendOrderPaidEmail } from "@/lib/email/orders";
import { resolveShippingCents } from "@/lib/shipping/free-shipping";
import { getShippingMethodById } from "@/lib/shipping/methods";
import type { ShippingAddress } from "@/lib/shipping/types";
import { createServiceClient } from "@/lib/supabase/server";

export type CheckoutLine = {
  productId: string;
  slug: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
};

export function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CLH-${stamp}-${rand}`;
}

export async function resolveCoupon(code: string | undefined, subtotalCents: number) {
  if (!code?.trim()) {
    return { couponId: null as string | null, couponCode: null as string | null, discountCents: 0 };
  }

  const supabase = createServiceClient();
  const normalized = code.trim();

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .ilike("code", normalized)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !coupon) {
    return { error: "Cupón no válido." as const };
  }

  if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
    return { error: "Este cupón aún no es válido." as const };
  }
  if (coupon.ends_at && new Date(coupon.ends_at) < new Date()) {
    return { error: "Este cupón ya expiró." as const };
  }
  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
    return { error: "Este cupón ya no tiene usos disponibles." as const };
  }
  if (subtotalCents < (coupon.min_subtotal_cents ?? 0)) {
    return { error: "No alcanza el mínimo para este cupón." as const };
  }

  let discountCents = 0;
  if (coupon.percent_off) {
    discountCents = Math.floor((subtotalCents * coupon.percent_off) / 100);
  } else if (coupon.amount_off_cents) {
    discountCents = coupon.amount_off_cents;
  }
  discountCents = Math.min(discountCents, subtotalCents);

  return {
    couponId: coupon.id as string,
    couponCode: coupon.code as string,
    discountCents,
  };
}

export type PendingOrderResult =
  | { error: string }
  | {
      order: {
        id: string;
        order_number: string;
        total_cents: number;
        subtotal_cents: number;
        discount_cents: number;
        shipping_cents: number;
        coupon_code: string | null;
      };
      lines: {
        productId: string;
        variantId: string | null;
        name: string;
        size: string;
        quantity: number;
        unitPriceCents: number;
        lineTotalCents: number;
      }[];
      discountCents: number;
    };

function validateAddress(address: ShippingAddress | undefined) {
  if (!address) return "Falta la dirección de envío." as const;
  if (!address.street?.trim()) return "Indica la calle." as const;
  if (!address.exterior?.trim()) return "Indica el número exterior." as const;
  if (!address.neighborhood?.trim()) return "Indica la colonia." as const;
  if (!address.city?.trim()) return "Indica la ciudad." as const;
  if (!address.state?.trim()) return "Indica el estado." as const;
  if (!address.postalCode?.trim()) return "Indica el código postal." as const;
  return null;
}

export async function createPendingOrder(input: {
  email: string;
  name: string;
  phone?: string;
  items: CheckoutLine[];
  couponCode?: string;
  shippingMethodId?: string;
  shippingAddress?: ShippingAddress;
  notes?: string;
}): Promise<PendingOrderResult> {
  const supabase = createServiceClient();

  if (!input.items.length) {
    return { error: "El carrito está vacío." as const };
  }

  const addressError = validateAddress(input.shippingAddress);
  if (addressError) return { error: addressError };

  if (!input.shippingMethodId) {
    return { error: "Elige un método de envío." as const };
  }

  const shippingMethod = await getShippingMethodById(input.shippingMethodId);
  if (!shippingMethod) {
    return { error: "Método de envío no disponible." as const };
  }

  // Revalidar precios/stock desde DB
  const lines: {
    productId: string;
    variantId: string | null;
    name: string;
    size: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[] = [];

  for (const item of input.items) {
    const { data: product } = await supabase
      .from("products")
      .select("id, name, price_cents, is_active")
      .eq("id", item.productId)
      .maybeSingle();

    if (!product || !product.is_active) {
      return { error: `Producto no disponible: ${item.name}` as const };
    }

    const { data: variant } = await supabase
      .from("product_variants")
      .select("id, stock, is_active, price_cents")
      .eq("product_id", item.productId)
      .eq("size", item.size)
      .maybeSingle();

    if (!variant || !variant.is_active) {
      return { error: `Talla no disponible: ${item.name} (${item.size})` as const };
    }
    if (variant.stock < item.quantity) {
      return {
        error: `Stock insuficiente: ${item.name} (${item.size})` as const,
      };
    }

    const unit = variant.price_cents ?? product.price_cents;
    lines.push({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      size: item.size,
      quantity: item.quantity,
      unitPriceCents: unit,
      lineTotalCents: unit * item.quantity,
    });
  }

  const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  const couponResult = await resolveCoupon(input.couponCode, subtotalCents);
  if ("error" in couponResult && couponResult.error) {
    return { error: couponResult.error };
  }

  const discountCents = couponResult.discountCents ?? 0;
  // Misma regla que el checkout: envío gratis por subtotal de productos (sin cupón).
  const shippingCents = resolveShippingCents(
    subtotalCents / 100,
    shippingMethod.priceCents,
  );
  const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents);
  const orderNumber = generateOrderNumber();

  const address = input.shippingAddress!;
  const shippingAddress = {
    street: address.street.trim(),
    exterior: address.exterior.trim(),
    interior: address.interior?.trim() || "",
    neighborhood: address.neighborhood.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    postalCode: address.postalCode.trim(),
    country: (address.country || "México").trim(),
    methodId: shippingMethod.id,
    methodName: shippingMethod.name,
  };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      status: "pending",
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || null,
      customer_name: input.name.trim(),
      shipping_address: shippingAddress,
      subtotal_cents: subtotalCents,
      discount_cents: discountCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      currency: "MXN",
      coupon_id: couponResult.couponId,
      coupon_code: couponResult.couponCode,
      notes: input.notes?.trim() || null,
    })
    .select(
      "id, order_number, total_cents, subtotal_cents, discount_cents, shipping_cents, coupon_code",
    )
    .single();

  if (orderError || !order) {
    return { error: orderError?.message ?? "No se pudo crear el pedido." as const };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      variant_id: l.variantId,
      product_name: l.name,
      variant_label: l.size,
      quantity: l.quantity,
      unit_price_cents: l.unitPriceCents,
      line_total_cents: l.lineTotalCents,
    })),
  );

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: itemsError.message };
  }

  try {
    await markAbandonedCartRecovered(input.email);
  } catch (e) {
    console.warn("[abandon] recover on order create failed", e);
  }

  return {
    order,
    lines,
    discountCents,
  };
}

export async function markOrderPaid(opts: {
  orderNumber: string;
  paymentId: string;
}) {
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status, coupon_id, email, phone, total_cents, currency")
    .eq("order_number", opts.orderNumber)
    .maybeSingle();

  if (!order) return { error: "Pedido no encontrado" as const };
  if (order.status === "paid" || order.status === "fulfilled") {
    return { ok: true as const, already: true };
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, variant_id, quantity")
    .eq("order_id", order.id);

  // Descontar stock
  for (const item of items ?? []) {
    if (!item.variant_id) continue;
    const { data: variant } = await supabase
      .from("product_variants")
      .select("stock")
      .eq("id", item.variant_id)
      .maybeSingle();
    if (!variant) continue;
    const next = Math.max(0, variant.stock - item.quantity);
    await supabase
      .from("product_variants")
      .update({ stock: next, updated_at: new Date().toISOString() })
      .eq("id", item.variant_id);
  }

  await supabase
    .from("orders")
    .update({
      status: "paid",
      mp_payment_id: opts.paymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (order.coupon_id) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("used_count")
      .eq("id", order.coupon_id)
      .maybeSingle();
    if (coupon) {
      await supabase
        .from("coupons")
        .update({ used_count: (coupon.used_count ?? 0) + 1 })
        .eq("id", order.coupon_id);
    }
  }

  // Confirmación al cliente (+ BCC tienda). No bloquea el pago si falla.
  try {
    await sendOrderPaidEmail(order.id);
  } catch (e) {
    console.error("[email] markOrderPaid notify failed", e);
  }

  // Respaldo server-side del pixel: cubre casos donde el navegador nunca
  // llegó a disparar el Purchase (adblock, cierre de pestaña, Safari ITP).
  try {
    await sendMetaPurchaseCapiEvent({
      orderNumber: order.order_number,
      email: order.email,
      phone: order.phone,
      valuePesos: order.total_cents / 100,
      currency: order.currency ?? "MXN",
      items: (items ?? [])
        .filter((i) => i.product_id)
        .map((i) => ({ id: i.product_id as string, quantity: i.quantity })),
    });
  } catch (e) {
    console.error("[meta-capi] markOrderPaid notify failed", e);
  }

  return { ok: true as const, already: false };
}
