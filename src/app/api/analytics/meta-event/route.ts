import { NextResponse } from "next/server";
import {
  isClientMetaCapiEvent,
  sendMetaCapiEvent,
} from "@/lib/analytics/metaConversionsApi";

type Body = {
  eventName?: string;
  eventId?: string;
  customData?: Record<string, unknown>;
  email?: string;
  phone?: string;
  eventSourceUrl?: string;
  fbp?: string;
  fbc?: string;
  externalId?: string;
};

function clientIpFromRequest(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  return request.headers.get("x-real-ip")?.trim() ?? undefined;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ message: "JSON inválido." }, { status: 400 });
  }

  const eventName = body.eventName?.trim() ?? "";
  const eventId = body.eventId?.trim() ?? "";

  if (!eventName || !eventId) {
    return NextResponse.json(
      { message: "Faltan eventName o eventId." },
      { status: 400 },
    );
  }

  if (!isClientMetaCapiEvent(eventName)) {
    return NextResponse.json({ message: "Evento no permitido." }, { status: 400 });
  }

  const result = await sendMetaCapiEvent({
    eventName,
    eventId,
    email: body.email,
    phone: body.phone,
    customData: body.customData,
    eventSourceUrl: body.eventSourceUrl,
    clientUserAgent: request.headers.get("user-agent"),
    clientIpAddress: clientIpFromRequest(request),
    externalId: body.externalId,
    fbp: body.fbp,
    fbc: body.fbc,
  });

  return NextResponse.json({ ok: result.sent });
}
