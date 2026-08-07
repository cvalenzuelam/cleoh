import { NextResponse } from "next/server";
import { createPendingOrder } from "@/lib/orders/create";
import { createPayPalOrder, paypalConfigured } from "@/lib/paypal/client";
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
  if (!paypalConfigured()) {
    return NextResponse.json(
      {
        message:
          "Faltan NEXT_PUBLIC_PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET en .env.local",
      },
      { status: 503 },
    );
  }

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

  const created = await createPendingOrder({
    email: body.email,
    name: body.name,
    phone: body.phone,
    couponCode: body.coupon,
    notes: body.notes,
    shippingMethodId: body.shippingMethodId,
    shippingAddress: body.shippingAddress,
    items: body.items,
  });

  if ("error" in created) {
    return NextResponse.json({ message: created.error }, { status: 400 });
  }

  const { order } = created;

  try {
    const paypal = await createPayPalOrder({
      orderNumber: order.order_number,
      totalCents: order.total_cents,
      description: `Pedido Cleoh ${order.order_number}`,
    });

    const supabase = createServiceClient();
    await supabase
      .from("orders")
      .update({
        paypal_order_id: paypal.paypalOrderId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return NextResponse.json({
      ok: true,
      orderId: paypal.paypalOrderId,
      orderNumber: order.order_number,
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
          e instanceof Error ? e.message : "No se pudo crear la orden PayPal.",
      },
      { status: 502 },
    );
  }
}
