import { NextResponse } from "next/server";
import { createCheckoutPreference } from "@/lib/mercadopago/client";
import {
  saveCheckoutIntent,
  setCheckoutIntentPreference,
} from "@/lib/orders/checkout-intent";
import {
  generateOrderNumber,
  prepareCheckoutOrder,
} from "@/lib/orders/create";
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

  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json(
      {
        message:
          "Falta MP_ACCESS_TOKEN. Usa credenciales de producción (APP_USR-…) de Mercado Pago.",
      },
      { status: 503 },
    );
  }

  if (!body.shippingMethodId || !body.shippingAddress) {
    return NextResponse.json(
      { message: "Faltan datos de envío." },
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
    await saveCheckoutIntent({
      orderNumber,
      paymentMethod: PAYMENT_METHODS.mercadopago,
      payload: {
        email: body.email,
        name: body.name,
        phone: body.phone,
        coupon: body.coupon,
        notes: body.notes,
        shippingMethodId: body.shippingMethodId,
        shippingAddress: body.shippingAddress,
        items: body.items,
      },
    });

    const preferenceItems = prepared.lines.map((l) => ({
      id: l.productId,
      title: `${l.name} · ${l.size}`,
      quantity: l.quantity,
      unit_price: l.unitPriceCents / 100,
    }));

    if (prepared.discountCents > 0) {
      preferenceItems.push({
        id: "discount",
        title: prepared.couponCode
          ? `Descuento (${prepared.couponCode})`
          : "Descuento",
        quantity: 1,
        unit_price: -(prepared.discountCents / 100),
      });
    }

    if (prepared.shippingCents > 0) {
      preferenceItems.push({
        id: "shipping",
        title: "Envío",
        quantity: 1,
        unit_price: prepared.shippingCents / 100,
      });
    }

    const preference = await createCheckoutPreference({
      orderNumber,
      payer: {
        name: body.name,
        email: body.email,
        phone: body.phone,
      },
      items: preferenceItems,
    });

    await setCheckoutIntentPreference(orderNumber, preference.preferenceId);

    return NextResponse.json({
      ok: true,
      initPoint: preference.initPoint,
      preferenceId: preference.preferenceId,
      orderNumber,
      totalCents: prepared.totalCents,
      discountCents: prepared.discountCents,
      shippingCents: prepared.shippingCents,
    });
  } catch (e) {
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
