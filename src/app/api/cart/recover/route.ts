import { NextResponse } from "next/server";
import { getAbandonedCartByToken } from "@/lib/cart/abandon";
import type { CartItem } from "@/lib/cart/types";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ message: "Token inválido." }, { status: 400 });
  }

  const cart = await getAbandonedCartByToken(token);
  if (!cart) {
    return NextResponse.json({ message: "Carrito no encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    email: cart.email,
    items: cart.items as CartItem[],
  });
}
