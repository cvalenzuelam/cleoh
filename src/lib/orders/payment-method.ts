export const PAYMENT_METHODS = {
  paypal: "paypal",
  mercadopago: "mercadopago",
  spei: "spei",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export function paymentMethodLabel(
  method: string | null | undefined,
  opts?: { paypalOrderId?: string | null },
): string {
  if (method === PAYMENT_METHODS.spei) return "Transferencia SPEI";
  if (method === PAYMENT_METHODS.paypal || opts?.paypalOrderId) return "PayPal";
  if (method === PAYMENT_METHODS.mercadopago) return "Mercado Pago";
  return "Mercado Pago";
}

export function resolvePaymentMethod(order: {
  payment_method?: string | null;
  paypal_order_id?: string | null;
}): PaymentMethod | null {
  if (order.payment_method === PAYMENT_METHODS.spei) return PAYMENT_METHODS.spei;
  if (
    order.payment_method === PAYMENT_METHODS.paypal ||
    order.paypal_order_id
  ) {
    return PAYMENT_METHODS.paypal;
  }
  if (order.payment_method === PAYMENT_METHODS.mercadopago) {
    return PAYMENT_METHODS.mercadopago;
  }
  return order.paypal_order_id ? PAYMENT_METHODS.paypal : PAYMENT_METHODS.mercadopago;
}
