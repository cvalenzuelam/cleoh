/**
 * `fbq` carga con strategy="afterInteractive" (next/script), así que puede
 * no existir todavía cuando un componente monta y dispara un evento de
 * inmediato (p. ej. InitiateCheckout al entrar a /checkout). Reintenta unos
 * segundos antes de darse por vencido, en vez de perder el evento en
 * silencio con `window.fbq?.(...)`.
 */
import { sendMetaCapiFromClient } from "@/lib/analytics/metaCapiClient";
import { createMetaEventId } from "@/lib/analytics/metaEventId";

function whenPixelReady(callback: () => void, attemptsLeft = 20) {
  if (typeof window === "undefined") return;
  if (window.fbq) {
    callback();
    return;
  }
  if (attemptsLeft <= 0) return;
  setTimeout(() => whenPixelReady(callback, attemptsLeft - 1), 150);
}

/**
 * Envía un evento al Meta Pixel si está o llega a estar cargado (no-op si
 * el usuario tiene bloqueador de anuncios, no hay Pixel ID configurado, o
 * estamos en el servidor).
 *
 * `eventId` es opcional: cuando el mismo evento también se manda desde el
 * servidor (Conversions API, p. ej. Purchase en `markOrderPaid`), pasar el
 * mismo id en ambos lados (usamos el `order_number`) le permite a Meta
 * deduplicar y no contar el evento dos veces.
 */
export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string,
) {
  whenPixelReady(() => {
    if (eventId) {
      window.fbq?.("track", event, params, { eventID: eventId });
    } else {
      window.fbq?.("track", event, params);
    }
  });
}

type CommerceTrackOptions = {
  /** Si no se pasa, se genera uno automáticamente. */
  eventId?: string;
  /** Respaldo Conversions API (default true). */
  capi?: boolean;
  email?: string;
  phone?: string;
};

/**
 * Pixel del navegador + CAPI con el mismo event_id (deduplicación en Meta).
 * Usar en ViewContent, AddToCart e InitiateCheckout.
 */
export function trackMetaCommerceEvent(
  event: string,
  params: Record<string, unknown>,
  options: CommerceTrackOptions = {},
) {
  const eventId = options.eventId ?? createMetaEventId(event.toLowerCase());
  trackMetaEvent(event, params, eventId);

  if (options.capi !== false) {
    sendMetaCapiFromClient({
      eventName: event,
      eventId,
      customData: params,
      email: options.email,
      phone: options.phone,
    });
  }

  return eventId;
}

const PURCHASE_SNAPSHOT_KEY = "cleoh-pixel-purchase-snapshot";

export type PurchaseSnapshot = {
  value: number;
  currency: "MXN";
  contentIds: string[];
  contents: { id: string; quantity: number }[];
  numItems: number;
};

/** Se guarda justo antes de mandar al usuario a pagar (MP/PayPal). */
export function savePurchaseSnapshot(snapshot: PurchaseSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      PURCHASE_SNAPSHOT_KEY,
      JSON.stringify(snapshot),
    );
  } catch {
    // sessionStorage no disponible (modo privado, etc.) — no bloquea el pago
  }
}

/** Se lee una sola vez en la página de éxito y se borra para no duplicar. */
export function takePurchaseSnapshot(): PurchaseSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PURCHASE_SNAPSHOT_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PURCHASE_SNAPSHOT_KEY);
    return JSON.parse(raw) as PurchaseSnapshot;
  } catch {
    return null;
  }
}
