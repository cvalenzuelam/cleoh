import "server-only";

import crypto from "crypto";
import { cleanEnv } from "@/lib/env/clean";

const GRAPH_VERSION = "v21.0";

const CLIENT_ALLOWED_EVENTS = new Set([
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
]);

export function isClientMetaCapiEvent(name: string) {
  return CLIENT_ALLOWED_EVENTS.has(name);
}

function sha256(value: string) {
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

type UserDataInput = {
  email?: string | null;
  phone?: string | null;
  clientUserAgent?: string | null;
  clientIpAddress?: string | null;
  externalId?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

function buildUserData(input: UserDataInput) {
  const userData: Record<string, string | string[]> = {};

  if (input.email?.trim()) userData.em = [sha256(input.email)];
  if (input.phone?.trim()) {
    const digits = input.phone.replace(/\D/g, "");
    if (digits) userData.ph = [sha256(digits)];
  }
  if (input.externalId?.trim()) {
    userData.external_id = [sha256(input.externalId)];
  }
  if (input.clientUserAgent?.trim()) {
    userData.client_user_agent = input.clientUserAgent.trim();
  }
  if (input.clientIpAddress?.trim()) {
    userData.client_ip_address = input.clientIpAddress.trim();
  }
  if (input.fbp?.trim()) userData.fbp = input.fbp.trim();
  if (input.fbc?.trim()) userData.fbc = input.fbc.trim();

  return userData;
}

export async function sendMetaCapiEvent(input: {
  eventName: string;
  eventId: string;
  email?: string | null;
  phone?: string | null;
  customData?: Record<string, unknown>;
  eventSourceUrl?: string | null;
  clientUserAgent?: string | null;
  clientIpAddress?: string | null;
  externalId?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}) {
  const pixelId = cleanEnv(process.env.NEXT_PUBLIC_META_PIXEL_ID);
  const accessToken = cleanEnv(process.env.META_CAPI_ACCESS_TOKEN);
  if (!pixelId || !accessToken) {
    return { sent: false as const, reason: "missing_config" as const };
  }

  const eventData: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: "website",
    user_data: buildUserData(input),
  };

  if (input.eventSourceUrl?.trim()) {
    eventData.event_source_url = input.eventSourceUrl.trim();
  }
  if (input.customData && Object.keys(input.customData).length > 0) {
    eventData.custom_data = input.customData;
  }

  const testEventCode = cleanEnv(process.env.META_CAPI_TEST_EVENT_CODE);
  const body: Record<string, unknown> = { data: [eventData] };
  if (testEventCode) {
    body.test_event_code = testEventCode;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[meta-capi] Error al enviar ${input.eventName}:`,
        res.status,
        text,
      );
      return { sent: false as const, reason: "api_error" as const };
    }
    return { sent: true as const };
  } catch (error) {
    console.error(`[meta-capi] Fallo al enviar ${input.eventName}:`, error);
    return { sent: false as const, reason: "network_error" as const };
  }
}

type PurchaseItem = { id: string; quantity: number };

/** Purchase solo desde servidor (markOrderPaid) — nunca desde el cliente. */
export async function sendMetaPurchaseCapiEvent(input: {
  orderNumber: string;
  email?: string | null;
  phone?: string | null;
  valuePesos: number;
  currency: string;
  items: PurchaseItem[];
}) {
  return sendMetaCapiEvent({
    eventName: "Purchase",
    eventId: input.orderNumber,
    email: input.email,
    phone: input.phone,
    customData: {
      currency: input.currency,
      value: input.valuePesos,
      content_type: "product",
      content_ids: input.items.map((i) => i.id),
      contents: input.items.map((i) => ({ id: i.id, quantity: i.quantity })),
      num_items: input.items.reduce((sum, i) => sum + i.quantity, 0),
      order_id: input.orderNumber,
    },
  });
}
