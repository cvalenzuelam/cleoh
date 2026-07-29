import "server-only";

import { getMercadoPagoPayment } from "@/lib/mercadopago/client";
import { markOrderPaid } from "@/lib/orders/create";

/**
 * Al volver de Checkout Pro (sobre todo en local sin webhook),
 * confirma el pago con la API de MP usando payment_id / collection_id.
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
    const payment = await getMercadoPagoPayment(paymentId);
    const orderNumber =
      payment.external_reference || params.externalReference;

    if (!orderNumber) return { synced: false as const };

    if (payment.status === "approved") {
      await markOrderPaid({
        orderNumber,
        paymentId: String(payment.id ?? paymentId),
      });
      return { synced: true as const, orderNumber, status: "paid" as const };
    }

    return {
      synced: true as const,
      orderNumber,
      status: payment.status ?? params.status ?? "unknown",
    };
  } catch (e) {
    console.error("[mp sync return]", e);
    return { synced: false as const };
  }
}
