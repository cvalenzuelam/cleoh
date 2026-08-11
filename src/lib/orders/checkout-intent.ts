import "server-only";

import type { CheckoutLine } from "@/lib/orders/create";
import type { PaymentMethod } from "@/lib/orders/payment-method";
import type { ShippingAddress } from "@/lib/shipping/types";
import { createServiceClient } from "@/lib/supabase/server";

export type CheckoutIntentPayload = {
  email: string;
  name: string;
  phone: string;
  coupon?: string;
  notes?: string;
  shippingMethodId: string;
  shippingAddress: ShippingAddress;
  items: CheckoutLine[];
};

const INTENT_TTL_HOURS = 48;

export async function saveCheckoutIntent(input: {
  orderNumber: string;
  paymentMethod: PaymentMethod;
  payload: CheckoutIntentPayload;
  mpPreferenceId?: string;
}) {
  const supabase = createServiceClient();
  const expiresAt = new Date(
    Date.now() + INTENT_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("checkout_intents").upsert(
    {
      order_number: input.orderNumber,
      payment_method: input.paymentMethod,
      payload: input.payload,
      mp_preference_id: input.mpPreferenceId ?? null,
      expires_at: expiresAt,
    },
    { onConflict: "order_number" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function setCheckoutIntentPreference(
  orderNumber: string,
  mpPreferenceId: string,
) {
  const supabase = createServiceClient();
  await supabase
    .from("checkout_intents")
    .update({ mp_preference_id: mpPreferenceId })
    .eq("order_number", orderNumber);
}

export async function getCheckoutIntent(orderNumber: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("checkout_intents")
    .select("order_number, payment_method, payload, expires_at")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !data) return null;

  if (new Date(data.expires_at).getTime() < Date.now()) {
    await supabase
      .from("checkout_intents")
      .delete()
      .eq("order_number", orderNumber);
    return null;
  }

  return {
    orderNumber: data.order_number as string,
    paymentMethod: data.payment_method as PaymentMethod,
    payload: data.payload as CheckoutIntentPayload,
  };
}

export async function deleteCheckoutIntent(orderNumber: string) {
  const supabase = createServiceClient();
  await supabase
    .from("checkout_intents")
    .delete()
    .eq("order_number", orderNumber);
}
