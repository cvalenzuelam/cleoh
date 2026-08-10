import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

type LineIn = { productId?: string; size?: string };

/**
 * Stock actual por producto+talla para recortar el carrito en cliente.
 * Solo lectura — no muta inventario.
 */
export async function POST(request: Request) {
  let body: { lines?: LineIn[] };
  try {
    body = (await request.json()) as { lines?: LineIn[] };
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const lines = (body.lines ?? [])
    .map((l) => ({
      productId: typeof l.productId === "string" ? l.productId.trim() : "",
      size: typeof l.size === "string" ? l.size.trim() : "",
    }))
    .filter((l) => l.productId && l.size)
    .slice(0, 40);

  if (!lines.length) {
    return NextResponse.json({ lines: [] as const });
  }

  const productIds = [...new Set(lines.map((l) => l.productId))];
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("product_variants")
    .select("product_id, size, stock, is_active")
    .in("product_id", productIds);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo consultar el stock." },
      { status: 500 },
    );
  }

  const stockMap = new Map<string, number>();
  for (const row of data ?? []) {
    if (row.is_active === false) {
      stockMap.set(`${row.product_id}::${row.size}`, 0);
      continue;
    }
    stockMap.set(
      `${row.product_id}::${row.size}`,
      Math.max(0, Number(row.stock) || 0),
    );
  }

  return NextResponse.json({
    lines: lines.map((l) => ({
      productId: l.productId,
      size: l.size,
      stock: stockMap.get(`${l.productId}::${l.size}`) ?? 0,
    })),
  });
}
