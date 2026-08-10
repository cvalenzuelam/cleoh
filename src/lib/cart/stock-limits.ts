import type { CartItem } from "@/lib/cart/types";

/** Tope duro por línea aunque el stock sea mayor. */
export const CART_LINE_MAX_QTY = 20;

export type StockAvailability = {
  productId: string;
  size: string;
  stock: number;
};

export function clampLineQuantity(quantity: number, stock?: number | null) {
  const safeQty = Math.max(0, Math.floor(quantity));
  if (stock == null || !Number.isFinite(stock)) {
    return Math.min(CART_LINE_MAX_QTY, safeQty);
  }
  return Math.min(CART_LINE_MAX_QTY, Math.max(0, Math.floor(stock)), safeQty);
}

/** Aplica stock conocido a cada línea y recorta cantidades. Quita líneas sin stock. */
export function applyStockToCartItems(
  items: CartItem[],
  availability: StockAvailability[],
): { items: CartItem[]; changed: boolean } {
  const stockByKey = new Map(
    availability.map((a) => [`${a.productId}::${a.size}`, Math.max(0, a.stock)]),
  );

  let changed = false;
  const next: CartItem[] = [];

  for (const item of items) {
    const key = `${item.productId}::${item.size}`;
    const stock = stockByKey.has(key) ? stockByKey.get(key)! : item.stock;
    const quantity = clampLineQuantity(item.quantity, stock);

    if (quantity <= 0) {
      changed = true;
      continue;
    }

    if (quantity !== item.quantity || stock !== item.stock) {
      changed = true;
    }

    next.push({
      ...item,
      quantity,
      ...(stock != null ? { stock } : {}),
    });
  }

  return { items: next, changed };
}
