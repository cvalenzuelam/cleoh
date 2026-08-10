import { NextResponse } from "next/server";
import { createPendingOrder } from "@/lib/orders/create";
import { PAYMENT_METHODS } from "@/lib/orders/payment-method";
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
    paymentMethod: PAYMENT_METHODS.spei,
  });

  if ("error" in created) {
    return NextResponse.json({ message: created.error }, { status: 400 });
  }

  const { order } = created;

  return NextResponse.json({
    ok: true,
    orderNumber: order.order_number,
    totalCents: order.total_cents,
  });
}
