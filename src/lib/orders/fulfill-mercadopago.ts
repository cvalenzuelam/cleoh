import "server-only";

import { sendNewOrderAdminNotifyEmail } from "@/lib/email/orders";
import { getMercadoPagoPayment } from "@/lib/mercadopago/client";
import {
  deleteCheckoutIntent,
  getCheckoutIntent,
} from "@/lib/orders/checkout-intent";
import { createPendingOrder, markOrderPaid } from "@/lib/orders/create";
import { PAYMENT_METHODS } from "@/lib/orders/payment-method";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Confirma un pago MP aprobado: crea el pedido si aún no existe (desde
 * checkout_intent) y lo marca paid. Sin intent + sin pedido = no-op.
 */
export async function fulfillMercadoPagoPayment(paymentId: string) {
  const payment = await getMercadoPagoPayment(paymentId);
  const orderNumber = payment.external_reference?.trim();

  if (!orderNumber) {
    return { ok: true as const, ignored: true as const, reason: "no_ref" as const };
  }

  if (payment.status !== "approved") {
    return {
      ok: true as const,
      ignored: true as const,
      reason: "not_approved" as const,
      status: payment.status,
      orderNumber,
    };
  }

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("orders")
    .select("id, order_number, status")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (existing?.status === "paid" || existing?.status === "fulfilled") {
    await deleteCheckoutIntent(orderNumber);
    return {
      ok: true as const,
      already: true as const,
      orderNumber: existing.order_number,
    };
  }

  if (!existing) {
    const intent = await getCheckoutIntent(orderNumber);
    if (!intent) {
      console.error("[mp fulfill] approved payment without order or intent", {
        orderNumber,
        paymentId,
      });
      return {
        ok: false as const,
        reason: "missing_intent" as const,
        orderNumber,
      };
    }

    const created = await createPendingOrder({
      email: intent.payload.email,
      name: intent.payload.name,
      phone: intent.payload.phone,
      couponCode: intent.payload.coupon,
      notes: intent.payload.notes,
      shippingMethodId: intent.payload.shippingMethodId,
      shippingAddress: intent.payload.shippingAddress,
      items: intent.payload.items,
      paymentMethod: PAYMENT_METHODS.mercadopago,
      orderNumber,
      notifyAdmin: false,
    });

    if ("error" in created) {
      console.error("[mp fulfill] create order failed", created.error);
      return {
        ok: false as const,
        reason: "create_failed" as const,
        message: created.error,
        orderNumber,
      };
    }

    await supabase
      .from("orders")
      .update({
        mp_payment_id: String(payment.id ?? paymentId),
        payment_method: PAYMENT_METHODS.mercadopago,
        updated_at: new Date().toISOString(),
      })
      .eq("id", created.order.id);

    const paid = await markOrderPaid({
      orderNumber,
      paymentId: String(payment.id ?? paymentId),
    });

    if ("error" in paid) {
      return {
        ok: false as const,
        reason: "mark_paid_failed" as const,
        message: paid.error,
        orderNumber,
      };
    }

    try {
      await sendNewOrderAdminNotifyEmail(created.order.id);
    } catch (e) {
      console.error("[email] admin notify on mp fulfill failed", e);
    }

    await deleteCheckoutIntent(orderNumber);

    return { ok: true as const, created: true as const, orderNumber };
  }

  // Pedido legacy creado antes del cambio (pending): solo marcar paid.
  await markOrderPaid({
    orderNumber,
    paymentId: String(payment.id ?? paymentId),
  });
  await deleteCheckoutIntent(orderNumber);

  return { ok: true as const, created: false as const, orderNumber };
}
