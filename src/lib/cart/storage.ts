import {
  CART_STORAGE_KEY,
  cartCount,
  cartItemKey,
  cartSubtotal,
  type CartItem,
} from "@/lib/cart/types";

export function readCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: CartItem[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

export function writeCartItems(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }));
}

export { CART_STORAGE_KEY, cartCount, cartItemKey, cartSubtotal };
export type { CartItem };
