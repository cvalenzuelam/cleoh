"use client";

type CapiClientInput = {
  eventName: string;
  eventId: string;
  customData?: Record<string, unknown>;
  email?: string;
  phone?: string;
};

function readMetaCookies() {
  if (typeof document === "undefined") return {};
  const fbp = document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/)?.[1];
  const fbc = document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/)?.[1];
  return { fbp, fbc };
}

const EXTERNAL_ID_KEY = "cleoh-meta-external-id";

function getMetaExternalId() {
  if (typeof window === "undefined") return undefined;
  try {
    let id = window.sessionStorage.getItem(EXTERNAL_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `cleoh-${Date.now()}`;
      window.sessionStorage.setItem(EXTERNAL_ID_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

/** Respaldo CAPI desde el navegador (fire-and-forget). Purchase solo va por servidor. */
export function sendMetaCapiFromClient(input: CapiClientInput) {
  if (typeof window === "undefined") return;
  const { fbp, fbc } = readMetaCookies();

  void fetch("/api/analytics/meta-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      eventSourceUrl: window.location.href,
      externalId: getMetaExternalId(),
      fbp,
      fbc,
    }),
    keepalive: true,
  }).catch(() => {
    // Medición no debe bloquear UX.
  });
}
