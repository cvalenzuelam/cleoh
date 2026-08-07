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
  readCartItems,
  writeCartItems,
  type CartItem,
} from "@/lib/cart/storage";
import { trackMetaEvent } from "@/lib/analytics/metaPixel";

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

function mergeAddItem(base: CartItem[], input: AddInput): CartItem[] {
  const key = cartItemKey(input.productId, input.size);
  const qty = Math.max(1, input.quantity ?? 1);
  const existing = base.find((i) => i.key === key);
  if (existing) {
    return base.map((i) =>
      i.key === key ? { ...i, quantity: i.quantity + qty } : i,
    );
  }
  return [...base, { ...input, key, quantity: qty }];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState(0);

  const syncFromStorage = useCallback(() => {
    setItems(readCartItems());
  }, []);

  useEffect(() => {
    syncFromStorage();
    setReady(true);
  }, [syncFromStorage]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== CART_STORAGE_KEY) return;
      syncFromStorage();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        syncFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", syncFromStorage);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", syncFromStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [syncFromStorage]);

  const commitItems = useCallback((next: CartItem[]) => {
    writeCartItems(next);
    setItems(next);
    setLastAddedAt(Date.now());
  }, []);

  const addItem = useCallback(
    (input: AddInput) => {
      const base = readCartItems();
      commitItems(mergeAddItem(base, input));
      const qty = Math.max(1, input.quantity ?? 1);
      trackMetaEvent("AddToCart", {
        content_ids: [input.productId],
        content_name: input.name,
        content_type: "product",
        contents: [{ id: input.productId, quantity: qty }],
        value: input.price * qty,
        currency: "MXN",
      });
    },
    [commitItems],
  );

  const setQuantity = useCallback(
    (key: string, quantity: number) => {
      const base = readCartItems();
      const next =
        quantity <= 0
          ? base.filter((i) => i.key !== key)
          : base.map((i) => (i.key === key ? { ...i, quantity } : i));
      commitItems(next);
    },
    [commitItems],
  );

  const removeItem = useCallback(
    (key: string) => {
      const base = readCartItems();
      commitItems(base.filter((i) => i.key !== key));
    },
    [commitItems],
  );

  const clear = useCallback(() => {
    commitItems([]);
  }, [commitItems]);

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
