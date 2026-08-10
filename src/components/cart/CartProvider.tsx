"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  applyStockToCartItems,
  clampLineQuantity,
  type StockAvailability,
} from "@/lib/cart/stock-limits";
import { trackMetaEvent } from "@/lib/analytics/metaPixel";

type AddInput = Omit<CartItem, "key" | "quantity"> & {
  quantity?: number;
  /** Stock actual de la talla — obligatorio al agregar desde ficha. */
  stock: number;
};

type AddResult = {
  added: number;
  quantity: number;
  capped: boolean;
};

type DrawerMode = "added" | "view";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  /** Timestamp of last add — header listens to animate */
  lastAddedAt: number;
  isOpen: boolean;
  drawerMode: DrawerMode;
  /** Línea recién agregada — drawer la destaca con imagen grande */
  lastAddedKey: string | null;
  addItem: (input: AddInput) => AddResult;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  restoreItems: (items: CartItem[]) => void;
  openCart: () => void;
  closeCart: () => void;
  /** Revalida stock en DB y recorta el carrito si hace falta. */
  syncStock: () => Promise<boolean>;
};

const CartContext = createContext<CartContextValue | null>(null);

function mergeAddItem(base: CartItem[], input: AddInput): {
  items: CartItem[];
  added: number;
  quantity: number;
  capped: boolean;
} {
  const key = cartItemKey(input.productId, input.size);
  const stockCap = Math.max(0, Math.floor(input.stock));
  const want = Math.max(1, input.quantity ?? 1);
  const existing = base.find((i) => i.key === key);
  const currentQty = existing?.quantity ?? 0;
  const nextQty = clampLineQuantity(currentQty + want, stockCap);
  const added = Math.max(0, nextQty - currentQty);
  const capped = nextQty < currentQty + want || stockCap < want + currentQty;

  if (existing) {
    return {
      items: base.map((i) =>
        i.key === key
          ? {
              ...i,
              ...input,
              key,
              quantity: nextQty,
              stock: stockCap,
            }
          : i,
      ),
      added,
      quantity: nextQty,
      capped,
    };
  }

  if (nextQty <= 0) {
    return { items: base, added: 0, quantity: 0, capped: true };
  }

  return {
    items: [
      ...base,
      {
        ...input,
        key,
        quantity: nextQty,
        stock: stockCap,
      },
    ],
    added: nextQty,
    quantity: nextQty,
    capped: nextQty < want,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("view");
  const [lastAddedKey, setLastAddedKey] = useState<string | null>(null);
  const syncingRef = useRef(false);
  const lastSyncSigRef = useRef("");

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

  const commitItems = useCallback((next: CartItem[], bumpAdded = false) => {
    writeCartItems(next);
    setItems(next);
    if (bumpAdded) setLastAddedAt(Date.now());
  }, []);

  const syncStock = useCallback(async () => {
    const base = readCartItems();
    if (!base.length) return false;
    if (syncingRef.current) return false;
    syncingRef.current = true;

    try {
      const res = await fetch("/api/cart/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: base.map((i) => ({
            productId: i.productId,
            size: i.size,
          })),
        }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as {
        lines?: StockAvailability[];
      };
      if (!data.lines?.length) return false;

      const { items: next, changed } = applyStockToCartItems(base, data.lines);
      if (changed) commitItems(next);
      return changed;
    } catch {
      return false;
    } finally {
      syncingRef.current = false;
    }
  }, [commitItems]);

  // Al cargar / al cambiar líneas del carrito, revalida stock real.
  useEffect(() => {
    if (!ready || !items.length) return;
    const sig = items
      .map((i) => `${i.productId}::${i.size}`)
      .sort()
      .join("|");
    if (sig === lastSyncSigRef.current) return;
    lastSyncSigRef.current = sig;
    void syncStock();
  }, [ready, items, syncStock]);

  // Al volver a la pestaña, vuelve a checar stock (otra compra pudo agotarlo).
  useEffect(() => {
    if (!ready) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        lastSyncSigRef.current = "";
        void syncStock();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [ready, syncStock]);

  const openCart = useCallback(() => {
    setDrawerMode("view");
    setIsOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);

  const addItem = useCallback(
    (input: AddInput): AddResult => {
      const base = readCartItems();
      const result = mergeAddItem(base, input);
      const key = cartItemKey(input.productId, input.size);
      if (result.added > 0) {
        commitItems(result.items, true);
        setLastAddedKey(key);
        setDrawerMode("added");
        setIsOpen(true);
        trackMetaEvent("AddToCart", {
          content_ids: [input.productId],
          content_name: input.name,
          content_type: "product",
          contents: [{ id: input.productId, quantity: result.added }],
          value: input.price * result.added,
          currency: "MXN",
        });
      } else {
        // Actualiza stock conocido aunque no se haya podido agregar.
        commitItems(result.items);
      }
      return {
        added: result.added,
        quantity: result.quantity,
        capped: result.capped,
      };
    },
    [commitItems],
  );

  const setQuantity = useCallback(
    (key: string, quantity: number) => {
      const base = readCartItems();
      if (quantity <= 0) {
        commitItems(base.filter((i) => i.key !== key));
        return;
      }
      commitItems(
        base
          .map((i) => {
            if (i.key !== key) return i;
            return {
              ...i,
              quantity: clampLineQuantity(quantity, i.stock),
            };
          })
          .filter((i) => i.quantity > 0),
      );
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

  const restoreItems = useCallback(
    (next: CartItem[]) => {
      const normalized = next.map((i) => ({
        ...i,
        key: i.key || cartItemKey(i.productId, i.size),
        quantity: clampLineQuantity(i.quantity, i.stock),
      })).filter((i) => i.quantity > 0);
      commitItems(normalized);
      lastSyncSigRef.current = "";
      void syncStock();
    },
    [commitItems, syncStock],
  );

  const value = useMemo(
    () => ({
      items,
      count: cartCount(items),
      subtotal: cartSubtotal(items),
      ready,
      lastAddedAt,
      isOpen,
      drawerMode,
      lastAddedKey,
      addItem,
      setQuantity,
      removeItem,
      clear,
      restoreItems,
      openCart,
      closeCart,
      syncStock,
    }),
    [
      items,
      ready,
      lastAddedAt,
      isOpen,
      drawerMode,
      lastAddedKey,
      addItem,
      setQuantity,
      removeItem,
      clear,
      restoreItems,
      openCart,
      closeCart,
      syncStock,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
