import { NextResponse } from "next/server";
import { createCheckoutPreference } from "@/lib/mercadopago/client";
import { createPendingOrder } from "@/lib/orders/create";
import { PAYMENT_METHODS } from "@/lib/orders/payment-method";
import type { ShippingAddress } from "@/lib/shipping/types";
import { createServiceClient } from "@/lib/supabase/server";

type Body = {
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
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  if (!body.email || !body.name || !body.phone?.trim() || !body.items?.length) {
    return NextResponse.json(
      { message: "Faltan datos del pedido." },
      { status: 400 },
    );
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json(
      {
        message:
          "Falta MP_ACCESS_TOKEN en .env.local. Usa un Access Token de prueba (TEST-…) de Mercado Pago Developers.",
      },
      { status: 503 },
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
    paymentMethod: PAYMENT_METHODS.mercadopago,
  });

  if ("error" in created) {
    return NextResponse.json({ message: created.error }, { status: 400 });
  }

  const { order, lines } = created;

  try {
    const preferenceItems = lines.map((l) => ({
      id: l.productId,
      title: `${l.name} · ${l.size}`,
      quantity: l.quantity,
      unit_price: l.unitPriceCents / 100,
    }));

    if (order.discount_cents > 0) {
      preferenceItems.push({
        id: "discount",
        title: order.coupon_code
          ? `Descuento (${order.coupon_code})`
          : "Descuento",
        quantity: 1,
        unit_price: -(order.discount_cents / 100),
      });
    }

    if (order.shipping_cents > 0) {
      preferenceItems.push({
        id: "shipping",
        title: "Envío",
        quantity: 1,
        unit_price: order.shipping_cents / 100,
      });
    }

    const preference = await createCheckoutPreference({
      orderId: order.id,
      orderNumber: order.order_number,
      payer: {
        name: body.name,
        email: body.email,
        phone: body.phone,
      },
      items: preferenceItems,
    });

    const supabase = createServiceClient();
    await supabase
      .from("orders")
      .update({
        mp_preference_id: preference.preferenceId,
        payment_method: PAYMENT_METHODS.mercadopago,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return NextResponse.json({
      ok: true,
      initPoint: preference.initPoint,
      preferenceId: preference.preferenceId,
      orderNumber: order.order_number,
      totalCents: order.total_cents,
      discountCents: order.discount_cents,
      shippingCents: order.shipping_cents,
    });
  } catch (e) {
    const supabase = createServiceClient();
    await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return NextResponse.json(
      {
        message:
          e instanceof Error
            ? e.message
            : "No se pudo crear la preferencia de Mercado Pago.",
      },
      { status: 502 },
    );
  }
}
