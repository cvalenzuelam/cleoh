import { NextResponse } from "next/server";
import { getCartUpsellProducts } from "@/lib/catalog/queries";

/**
 * Productos sugeridos para el drawer del carrito (ofertas + relacionados).
 */
export async function POST(request: Request) {
  let body: { productIds?: string[] };
  try {
    body = (await request.json()) as { productIds?: string[] };
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const productIds = (body.productIds ?? [])
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    .map((id) => id.trim())
    .slice(0, 20);

  const products = await getCartUpsellProducts(productIds, 12);

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      badge: p.badge,
      image: p.image,
    })),
  });
}
