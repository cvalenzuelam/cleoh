"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";
import {
  readCheckoutEmail,
  scheduleAbandonedCartSync,
} from "@/lib/cart/abandon-client";

export function CartAbandonSync() {
  const { items, ready } = useCart();

  useEffect(() => {
    if (!ready || !items.length) return;
    const email = readCheckoutEmail();
    if (!email) return;
    scheduleAbandonedCartSync(email, items);
  }, [items, ready]);

  return null;
}
