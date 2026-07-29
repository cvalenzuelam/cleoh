import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders/create";
import { capturePayPalOrder, paypalConfigured } from "@/lib/paypal/client";

type Body = { orderID?: string };

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

    await markOrderPaid({
      orderNumber: captured.orderNumber,
      paymentId: captured.captureId || captured.paypalOrderId,
    });

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
