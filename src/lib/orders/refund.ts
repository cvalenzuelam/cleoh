export type RefundLineInput = {
  itemId: string;
  quantity: number;
};

export type OrderItemForRefund = {
  id: string;
  quantity: number;
  refunded_quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
};

export type OrderForRefundCalc = {
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  total_cents: number;
  refunded_cents: number;
};

export function availableItemQuantity(item: OrderItemForRefund) {
  return Math.max(0, item.quantity - (item.refunded_quantity ?? 0));
}

export function calculateRefundAmountCents(
  order: OrderForRefundCalc,
  items: OrderItemForRefund[],
  lines: RefundLineInput[],
): { amountCents: number; allItemsFullyRefunded: boolean } {
  const lineMap = new Map(lines.map((l) => [l.itemId, l.quantity]));

  let itemsSubtotalCents = 0;
  for (const item of items) {
    const qty = lineMap.get(item.id) ?? 0;
    if (qty <= 0) continue;
    itemsSubtotalCents += item.unit_price_cents * qty;
  }

  let discountPortion = 0;
  if (order.subtotal_cents > 0 && order.discount_cents > 0) {
    discountPortion = Math.floor(
      (itemsSubtotalCents * order.discount_cents) / order.subtotal_cents,
    );
  }

  const itemsRefundCents = Math.max(0, itemsSubtotalCents - discountPortion);

  const allItemsFullyRefunded = items.every((item) => {
    const refundQty = lineMap.get(item.id) ?? 0;
    return (item.refunded_quantity ?? 0) + refundQty >= item.quantity;
  });

  const remainingCents = Math.max(0, order.total_cents - order.refunded_cents);

  if (allItemsFullyRefunded) {
    return { amountCents: remainingCents, allItemsFullyRefunded: true };
  }

  return {
    amountCents: Math.min(itemsRefundCents, remainingCents),
    allItemsFullyRefunded: false,
  };
}

export function validateRefundLines(
  items: OrderItemForRefund[],
  lines: RefundLineInput[],
): string | null {
  if (!lines.length) {
    return "Selecciona al menos un artículo para reembolsar.";
  }

  const itemMap = new Map(items.map((i) => [i.id, i]));

  for (const line of lines) {
    if (line.quantity <= 0) continue;
    const item = itemMap.get(line.itemId);
    if (!item) {
      return "Artículo no válido en el pedido.";
    }
    const available = availableItemQuantity(item);
    if (line.quantity > available) {
      return `Cantidad inválida: máximo ${available} unidades disponibles.`;
    }
  }

  const hasQty = lines.some((l) => l.quantity > 0);
  if (!hasQty) {
    return "Indica la cantidad a reembolsar.";
  }

  return null;
}
