import { NextResponse } from "next/server";
import { processAbandonedCartReminders } from "@/lib/cart/abandon";
import { cleanEnv } from "@/lib/env/clean";

function isAuthorized(request: Request) {
  const secret = cleanEnv(process.env.CRON_SECRET);
  if (!secret) return process.env.NODE_ENV !== "production";

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const result = await processAbandonedCartReminders();
  return NextResponse.json(result);
}
