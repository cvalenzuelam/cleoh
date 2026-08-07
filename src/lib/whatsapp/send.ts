import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { getWhatsAppConfig } from "@/lib/whatsapp/config";

export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null,
) {
  const { appSecret } = getWhatsAppConfig();
  if (!appSecret) return true;

  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  const received = signatureHeader.slice("sha256=".length);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export async function sendWhatsAppText(to: string, body: string) {
  const { accessToken, phoneNumberId, graphVersion, configured } =
    getWhatsAppConfig();

  if (!configured) {
    console.warn("[whatsapp] Falta configuración — no se envía respuesta.");
    return { sent: false as const, reason: "missing_config" as const };
  }

  const res = await fetch(
    `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body, preview_url: true },
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    console.error("[whatsapp] send failed:", res.status, detail);
    return { sent: false as const, reason: "send_failed" as const };
  }

  return { sent: true as const };
}
