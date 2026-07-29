import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { ShippingMethodPublic } from "@/lib/shipping/types";

export async function listActiveShippingMethods(): Promise<
  ShippingMethodPublic[]
> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shipping_methods")
    .select("id, name, description, price_cents, eta_label")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return data.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    priceCents: m.price_cents,
    etaLabel: m.eta_label,
  }));
}

export async function getShippingMethodById(id: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shipping_methods")
    .select("id, name, description, price_cents, eta_label, is_active")
    .eq("id", id)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    priceCents: data.price_cents,
    etaLabel: data.eta_label,
  } satisfies ShippingMethodPublic;
}
