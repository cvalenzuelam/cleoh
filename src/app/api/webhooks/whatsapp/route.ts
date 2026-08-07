import { NextResponse } from "next/server";
import { getWhatsAppConfig } from "@/lib/whatsapp/config";
import { handleWhatsAppIncomingMessages } from "@/lib/whatsapp/bot";
import { verifyWhatsAppSignature } from "@/lib/whatsapp/send";

export async function GET(request: Request) {
  const { verifyToken, configured } = getWhatsAppConfig();
  const params = new URL(request.url).searchParams;

  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (!configured) {
    return NextResponse.json(
      { message: "WhatsApp webhook no configurado." },
      { status: 503 },
    );
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ message: "Verificación fallida." }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifyWhatsAppSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ message: "Firma inválida." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ message: "JSON inválido." }, { status: 400 });
  }

  try {
    await handleWhatsAppIncomingMessages(payload);
  } catch (error) {
    console.error("[whatsapp] webhook error:", error);
  }

  return NextResponse.json({ ok: true });
}
