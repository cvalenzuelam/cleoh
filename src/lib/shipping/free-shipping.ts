import { site } from "@/data/site";
import { formatCartMoney } from "@/lib/cart/types";

export function getFreeShippingThresholdMxn() {
  return site.freeShippingThresholdMxn;
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
