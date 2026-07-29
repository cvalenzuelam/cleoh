import { NextResponse } from "next/server";
import { resolveCoupon } from "@/lib/orders/create";

type Body = {
  code?: string;
  /** Subtotal del carrito en pesos MXN */
  subtotal?: number;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json(
      { error: "Escribe un código de cupón." },
      { status: 400 },
    );
  }

  const subtotalPesos = Number(body.subtotal);
  if (!Number.isFinite(subtotalPesos) || subtotalPesos < 0) {
    return NextResponse.json({ error: "Subtotal inválido." }, { status: 400 });
  }

  const subtotalCents = Math.round(subtotalPesos * 100);
  const result = await resolveCoupon(code, subtotalCents);

  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    code: result.couponCode,
    discountCents: result.discountCents,
    discount: (result.discountCents ?? 0) / 100,
  });
}
