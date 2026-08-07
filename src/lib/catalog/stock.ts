/** Umbral para aviso de stock bajo en ficha de producto (solo stock real). */
export const LOW_STOCK_THRESHOLD = 3;

export function isLowStock(stock: number) {
  return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
}

export function formatLowStockMessage(stock: number, sizeLabel: string) {
  if (!isLowStock(stock)) return null;
  if (stock === 1) {
    return `Queda 1 pieza en talla ${sizeLabel}`;
  }
  return `Quedan ${stock} en talla ${sizeLabel}`;
}
