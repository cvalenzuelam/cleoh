import { site } from "@/data/site";
import { formatCartMoney } from "@/lib/cart/types";

export function getFreeShippingThresholdMxn() {
  return site.freeShippingThresholdMxn;
}

/** Subtotal de productos (MXN), sin descuento ni envío. */
export function qualifiesForFreeShipping(subtotalMxn: number) {
  return Math.max(0, subtotalMxn) >= getFreeShippingThresholdMxn();
}

/** Precio de envío a cobrar: 0 si el subtotal alcanza el umbral. */
export function resolveShippingCents(
  subtotalMxn: number,
  methodPriceCents: number,
) {
  if (qualifiesForFreeShipping(subtotalMxn)) return 0;
  return Math.max(0, methodPriceCents);
}

export function getFreeShippingProgress(subtotal: number) {
  const threshold = getFreeShippingThresholdMxn();
  const safeSubtotal = Math.max(0, subtotal);
  const remaining = Math.max(0, threshold - safeSubtotal);
  const progress = Math.min(100, (safeSubtotal / threshold) * 100);
  const qualified = safeSubtotal >= threshold;

  return {
    threshold,
    remaining,
    progress,
    qualified,
    remainingLabel: formatCartMoney(remaining),
    thresholdLabel: formatCartMoney(threshold),
  };
}
