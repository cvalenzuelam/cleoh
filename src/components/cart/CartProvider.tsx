"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CART_STORAGE_KEY,
  cartCount,
  cartItemKey,
  cartSubtotal,
  type CartItem,
} from "@/lib/cart/types";

type AddInput = Omit<CartItem, "key" | "quantity"> & { quantity?: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  /** Timestamp of last add — header listens to animate */
  lastAddedAt: number;
  addItem: (input: AddInput) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { items?: CartItem[] };
          if (Array.isArray(parsed.items)) setItems(parsed.items);
        }
      } catch {
        // ignore corrupt storage
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }));
  }, [items, ready]);

  const addItem = useCallback((input: AddInput) => {
    const key = cartItemKey(input.productId, input.size);
    const qty = Math.max(1, input.quantity ?? 1);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [...prev, { ...input, key, quantity: qty }];
    });
    setLastAddedAt(Date.now());
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.key !== key);
      return prev.map((i) => (i.key === key ? { ...i, quantity } : i));
    });
    setLastAddedAt(Date.now());
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
    setLastAddedAt(Date.now());
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setLastAddedAt(Date.now());
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: cartCount(items),
      subtotal: cartSubtotal(items),
      ready,
      lastAddedAt,
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [items, ready, lastAddedAt, addItem, setQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
