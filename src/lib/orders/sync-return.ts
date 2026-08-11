import "server-only";

import { fulfillMercadoPagoPayment } from "@/lib/orders/fulfill-mercadopago";

/**
 * Al volver de Checkout Pro, confirma el pago con la API de MP
 * (crea el pedido solo si el pago está approved).
 */
export async function syncPaymentFromReturn(params: {
  paymentId?: string;
  externalReference?: string;
  status?: string;
}) {
  const paymentId = params.paymentId;
  if (!paymentId || !process.env.MP_ACCESS_TOKEN) {
    return { synced: false as const };
  }

  try {
    const result = await fulfillMercadoPagoPayment(paymentId);

    if ("orderNumber" in result && result.orderNumber) {
      return {
        synced: true as const,
        orderNumber: result.orderNumber,
        status:
          result.ok && !("ignored" in result && result.ignored)
            ? ("paid" as const)
            : (("status" in result && result.status) ||
                params.status ||
                "unknown"),
      };
    }

    return { synced: false as const };
  } catch (e) {
    console.error("[mp sync return]", e);
    return { synced: false as const };
  }
}
