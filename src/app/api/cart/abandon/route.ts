import { NextResponse } from "next/server";
import { saveAbandonedCart } from "@/lib/cart/abandon";
import type { CartItem } from "@/lib/cart/types";

export async function POST(request: Request) {
  let body: { email?: string; items?: CartItem[] };
  try {
    body = (await request.json()) as { email?: string; items?: CartItem[] };
  } catch {
    return NextResponse.json({ message: "JSON inválido." }, { status: 400 });
  }

  if (!body.email?.trim()) {
    return NextResponse.json({ message: "Falta el email." }, { status: 400 });
  }

  if (!Array.isArray(body.items) || !body.items.length) {
    return NextResponse.json({ message: "Carrito vacío." }, { status: 400 });
  }

  const result = await saveAbandonedCart({
    email: body.email,
    items: body.items,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
