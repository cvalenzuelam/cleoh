"use client";

import type { CartItem } from "@/lib/cart/types";

export const CHECKOUT_EMAIL_KEY = "cleoh-checkout-email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function saveCheckoutEmail(email: string) {
  if (typeof window === "undefined") return;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  localStorage.setItem(CHECKOUT_EMAIL_KEY, normalized);
}

export function readCheckoutEmail() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(CHECKOUT_EMAIL_KEY)?.trim().toLowerCase() ?? "";
}

export function scheduleAbandonedCartSync(email: string, items: CartItem[]) {
  if (typeof window === "undefined") return;

  const normalized = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized) || !items.length) return;

  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void fetch("/api/cart/abandon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalized, items }),
    });
  }, 2000);
}

export function syncAbandonedCartNow(email: string, items: CartItem[]) {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized) || !items.length) return;
  void fetch("/api/cart/abandon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalized, items }),
  });
}
