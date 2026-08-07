/**
 * Envía un evento al Meta Pixel si está cargado (no-op si el usuario tiene
 * bloqueador de anuncios, el pixel no cargó, o estamos en el servidor).
 */
export function trackMetaEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", event, params);
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
