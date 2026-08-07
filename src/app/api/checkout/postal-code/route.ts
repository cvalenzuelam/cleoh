import { NextResponse } from "next/server";
import { lookupPostalCode } from "@/lib/shipping/postal-lookup";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cp = searchParams.get("cp") ?? "";

  if (!/^\d{5}$/.test(cp)) {
    return NextResponse.json(
      { error: "Código postal inválido." },
      { status: 400 },
    );
  }

  const info = lookupPostalCode(cp);
  if (!info) {
    return NextResponse.json(
      { error: "No encontramos ese código postal." },
      { status: 404 },
    );
  }

  return NextResponse.json(info);
}
