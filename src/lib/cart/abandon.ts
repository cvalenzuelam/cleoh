import "server-only";

import type { CartItem } from "@/lib/cart/types";
import { sendAbandonedCartEmail } from "@/lib/email/abandoned-cart";
import { createServiceClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Tiempo mínimo con carrito guardado antes del recordatorio. */
export const ABANDON_CART_MIN_AGE_MS = 2 * 60 * 60 * 1000;

export function normalizeAbandonEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function serializeCartItems(items: CartItem[]) {
  return items.map((item) => ({
    key: item.key,
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    size: item.size,
    price: item.price,
    image: item.image,
    quantity: item.quantity,
  }));
}

export async function saveAbandonedCart(input: {
  email: string;
  items: CartItem[];
}) {
  const email = normalizeAbandonEmail(input.email);
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false as const, error: "Correo inválido." };
  }

  if (!input.items.length) {
    return { ok: false as const, error: "Carrito vacío." };
  }

  const items = serializeCartItems(input.items);
  const subtotalCents = Math.round(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const now = new Date().toISOString();

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("abandoned_carts")
    .select("id, recovered_at, reminder_sent_at")
    .eq("email", email)
    .maybeSingle();

  const basePayload = {
    items,
    subtotal_cents: subtotalCents,
    item_count: itemCount,
    updated_at: now,
  };

  if (existing) {
    const { error } = await supabase
      .from("abandoned_carts")
      .update({
        ...basePayload,
        ...(existing.recovered_at
          ? { recovered_at: null, reminder_sent_at: null }
          : {}),
      })
      .eq("id", existing.id);

    if (error) {
      console.error("[abandon] update:", error.message);
      return { ok: false as const, error: "No se pudo guardar el carrito." };
    }

    return { ok: true as const };
  }

  const { error } = await supabase.from("abandoned_carts").insert({
    email,
    ...basePayload,
  });

  if (error) {
    console.error("[abandon] insert:", error.message);
    return { ok: false as const, error: "No se pudo guardar el carrito." };
  }

  return { ok: true as const };
}

export async function markAbandonedCartRecovered(email: string) {
  const normalized = normalizeAbandonEmail(email);
  if (!normalized) return;

  const supabase = createServiceClient();
  await supabase
    .from("abandoned_carts")
    .update({
      recovered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("email", normalized)
    .is("recovered_at", null);
}

export async function getAbandonedCartByToken(token: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("abandoned_carts")
    .select("email, items, recovered_at")
    .eq("recovery_token", token)
    .maybeSingle();

  if (error || !data || data.recovered_at) {
    return null;
  }

  const items = Array.isArray(data.items) ? (data.items as CartItem[]) : [];
  if (!items.length) return null;

  return { email: data.email as string, items };
}

export async function processAbandonedCartReminders() {
  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - ABANDON_CART_MIN_AGE_MS).toISOString();

  const { data: carts, error } = await supabase
    .from("abandoned_carts")
    .select(
      "id, email, items, subtotal_cents, item_count, recovery_token, updated_at",
    )
    .is("reminder_sent_at", null)
    .is("recovered_at", null)
    .gt("item_count", 0)
    .lt("updated_at", cutoff);

  if (error) {
    console.error("[abandon] cron query:", error.message);
    return { processed: 0, sent: 0, skipped: 0, errors: 1 };
  }

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const cart of carts ?? []) {
    const { data: recentOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("email", cart.email)
      .gte("created_at", cart.updated_at)
      .limit(1)
      .maybeSingle();

    if (recentOrder) {
      await markAbandonedCartRecovered(cart.email);
      skipped += 1;
      continue;
    }

    const result = await sendAbandonedCartEmail({
      email: cart.email,
      items: Array.isArray(cart.items) ? cart.items : [],
      subtotalCents: cart.subtotal_cents,
      recoveryToken: cart.recovery_token,
    });

    if (!result.sent) {
      errors += 1;
      continue;
    }

    await supabase
      .from("abandoned_carts")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", cart.id);

    sent += 1;
  }

  return {
    processed: carts?.length ?? 0,
    sent,
    skipped,
    errors,
  };
}
