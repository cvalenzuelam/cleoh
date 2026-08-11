import { NextResponse } from "next/server";
import { sendNewOrderAdminNotifyEmail } from "@/lib/email/orders";
import {
  createPendingOrder,
  markOrderPaid,
  prepareCheckoutOrder,
} from "@/lib/orders/create";
import { PAYMENT_METHODS } from "@/lib/orders/payment-method";
import { capturePayPalOrder, paypalConfigured } from "@/lib/paypal/client";
import type { ShippingAddress } from "@/lib/shipping/types";
import { createServiceClient } from "@/lib/supabase/server";

type Body = {
  orderID?: string;
  email?: string;
  name?: string;
  phone?: string;
  coupon?: string;
  notes?: string;
  shippingMethodId?: string;
  shippingAddress?: ShippingAddress;
  items?: {
    productId: string;
    slug: string;
    name: string;
    size: string;
    price: number;
    quantity: number;
  }[];
};

export async function POST(request: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json(
      { message: "PayPal no configurado" },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  if (!body.orderID) {
    return NextResponse.json({ message: "Falta orderID" }, { status: 400 });
  }

  if (!body.email || !body.name || !body.phone?.trim() || !body.items?.length) {
    return NextResponse.json(
      { message: "Faltan datos del pedido." },
      { status: 400 },
    );
  }

  try {
    const captured = await capturePayPalOrder(body.orderID);

    if (captured.status !== "COMPLETED" && captured.captureStatus !== "COMPLETED") {
      return NextResponse.json(
        { message: `Pago no completado (${captured.status})` },
        { status: 400 },
      );
    }

    if (!captured.orderNumber) {
      return NextResponse.json(
        { message: "PayPal no devolvió referencia del pedido." },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("orders")
      .select("id, order_number, status")
      .eq("order_number", captured.orderNumber)
      .maybeSingle();

    if (existing?.status === "paid" || existing?.status === "fulfilled") {
      return NextResponse.json({
        ok: true,
        orderNumber: existing.order_number,
        captureId: captured.captureId,
      });
    }

    const prepared = await prepareCheckoutOrder({
      email: body.email,
      items: body.items,
      couponCode: body.coupon,
      shippingMethodId: body.shippingMethodId,
      shippingAddress: body.shippingAddress,
    });

    if ("error" in prepared) {
      return NextResponse.json({ message: prepared.error }, { status: 400 });
    }

    if (
      captured.amountCents != null &&
      captured.amountCents !== prepared.totalCents
    ) {
      console.error("[paypal] amount mismatch", {
        captured: captured.amountCents,
        expected: prepared.totalCents,
        orderNumber: captured.orderNumber,
      });
      return NextResponse.json(
        { message: "El monto pagado no coincide con el pedido." },
        { status: 400 },
      );
    }

    const created = await createPendingOrder({
      email: body.email,
      name: body.name,
      phone: body.phone,
      couponCode: body.coupon,
      notes: body.notes,
      shippingMethodId: body.shippingMethodId,
      shippingAddress: body.shippingAddress,
      items: body.items,
      paymentMethod: PAYMENT_METHODS.paypal,
      orderNumber: captured.orderNumber,
      paypalOrderId: captured.paypalOrderId,
      notifyAdmin: false,
    });

    if ("error" in created) {
      return NextResponse.json({ message: created.error }, { status: 400 });
    }

    const paid = await markOrderPaid({
      orderNumber: captured.orderNumber,
      paymentId: captured.captureId || captured.paypalOrderId,
    });

    if ("error" in paid) {
      return NextResponse.json({ message: paid.error }, { status: 400 });
    }

    try {
      await sendNewOrderAdminNotifyEmail(created.order.id);
    } catch (e) {
      console.error("[email] admin notify on paypal capture failed", e);
    }

    return NextResponse.json({
      ok: true,
      orderNumber: captured.orderNumber,
      captureId: captured.captureId,
    });
  } catch (e) {
    return NextResponse.json(
      {
        message:
          e instanceof Error ? e.message : "Error al capturar pago PayPal.",
      },
      { status: 502 },
    );
  }
}
