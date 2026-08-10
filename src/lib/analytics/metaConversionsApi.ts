import "server-only";

import crypto from "crypto";
import { cleanEnv } from "@/lib/env/clean";

const GRAPH_VERSION = "v21.0";

function sha256(value: string) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

type PurchaseItem = { id: string; quantity: number };

/**
 * Envía el evento Purchase también desde el servidor (Conversions API),
 * como respaldo del pixel del navegador: no depende de bloqueadores de
 * anuncios, Safari/iOS, ni de que el cliente no cierre la pestaña antes de
 * que cargue el pixel. Usa `orderNumber` como event_id para que Meta
 * deduplique con el evento del navegador (mismo id en ambos lados).
 *
 * No-op silencioso si faltan las credenciales — nunca debe tronar el flujo
 * de confirmación de pago.
 */
export async function sendMetaPurchaseCapiEvent(input: {
  orderNumber: string;
  email?: string | null;
  phone?: string | null;
  valuePesos: number;
  currency: string;
  items: PurchaseItem[];
}) {
  const pixelId = cleanEnv(process.env.NEXT_PUBLIC_META_PIXEL_ID);
  const accessToken = cleanEnv(process.env.META_CAPI_ACCESS_TOKEN);
  if (!pixelId || !accessToken) return { sent: false as const, reason: "missing_config" as const };

  const userData: Record<string, string[]> = {};
  if (input.email?.trim()) userData.em = [sha256(input.email)];
  if (input.phone?.trim()) {
    // Meta espera solo dígitos con código de país (ver docs de Advanced Matching).
    const digits = input.phone.replace(/\D/g, "");
    if (digits) userData.ph = [sha256(digits)];
  }

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.orderNumber,
        action_source: "website",
        user_data: userData,
        custom_data: {
          currency: input.currency,
          value: input.valuePesos,
          content_type: "product",
          content_ids: input.items.map((i) => i.id),
          contents: input.items.map((i) => ({ id: i.id, quantity: i.quantity })),
          num_items: input.items.reduce((sum, i) => sum + i.quantity, 0),
          order_id: input.orderNumber,
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[meta-capi] Error al enviar Purchase:", res.status, text);
      return { sent: false as const, reason: "api_error" as const };
    }
    return { sent: true as const };
  } catch (error) {
    console.error("[meta-capi] Fallo al enviar Purchase:", error);
    return { sent: false as const, reason: "network_error" as const };
  }
}
