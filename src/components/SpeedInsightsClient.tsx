"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * El panel admin no es tráfico real de clientes; no vale la pena medirlo.
 * `beforeSend` debe definirse en un Client Component (no se puede pasar
 * una función como prop desde el layout raíz, que es Server Component).
 */
export function SpeedInsightsClient() {
  return (
    <SpeedInsights
      sampleRate={0.5}
      beforeSend={(data) => {
        if (data.url.includes("/admin")) return null;
        return data;
      }}
    />
  );
}
