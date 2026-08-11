import { NextResponse } from "next/server";
import {
  generateOrderNumber,
  prepareCheckoutOrder,
} from "@/lib/orders/create";
import { createPayPalOrder, paypalConfigured } from "@/lib/paypal/client";
import type { ShippingAddress } from "@/lib/shipping/types";

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

  const orderNumber = generateOrderNumber();

  try {
    const paypal = await createPayPalOrder({
      orderNumber,
      totalCents: prepared.totalCents,
      description: `Pedido Cleoh ${orderNumber}`,
    });

    return NextResponse.json({
      ok: true,
      orderId: paypal.paypalOrderId,
      orderNumber,
    });
  } catch (e) {
    return NextResponse.json(
      {
        message:
          e instanceof Error ? e.message : "No se pudo crear la orden PayPal.",
      },
      { status: 502 },
    );
  }
}
