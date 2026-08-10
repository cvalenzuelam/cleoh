import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/catalog/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limitRaw = Number(searchParams.get("limit") ?? "6");
  const limit = Number.isFinite(limitRaw)
    ? Math.min(24, Math.max(1, Math.floor(limitRaw)))
    : 6;

  const { hits, total } = await searchProducts(q, limit);

  return NextResponse.json({
    results: hits,
    total,
  });
}
