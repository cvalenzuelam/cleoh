import { NextResponse } from "next/server";
import { getMercadoPagoPayment } from "@/lib/mercadopago/client";
import { markOrderPaid } from "@/lib/orders/create";

/**
 * Webhook Mercado Pago.
 * Query típica: ?topic=payment&id=123
 * o body JSON type/action + data.id
 *
 * En local usa ngrok/cloudflare tunnel y pon esa URL en
 * NEXT_PUBLIC_SITE_URL para notification_url.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    let paymentId =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      "";

    const topic =
      url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      "";

    try {
      const body = (await request.json()) as {
        type?: string;
        action?: string;
        data?: { id?: string | number };
      };
      if (body?.data?.id) paymentId = String(body.data.id);
    } catch {
      // body vacío o no JSON — ok con query params
    }

    if (!paymentId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Solo nos interesan pagos
    if (topic && !topic.includes("payment")) {
      return NextResponse.json({ ok: true, ignored: true, topic });
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json({ ok: false, message: "Sin token" }, { status: 503 });
    }

    const payment = await getMercadoPagoPayment(paymentId);
    const orderNumber = payment.external_reference;

    if (!orderNumber) {
      return NextResponse.json({ ok: true, ignored: true, reason: "no_ref" });
    }

    if (payment.status === "approved") {
      await markOrderPaid({
        orderNumber,
        paymentId: String(payment.id ?? paymentId),
      });
    }

    return NextResponse.json({
      ok: true,
      status: payment.status,
      orderNumber,
    });
  } catch (e) {
    console.error("[mp webhook]", e);
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  // MP a veces hace GET de prueba
  return POST(request);
}
