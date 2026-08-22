export type OrderAttribution = {
  channel: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  landing_path: string | null;
  referrer_host: string | null;
  has_fbclid: boolean;
  captured_at: string;
};

const MAX = 80;
const PATH_MAX = 200;

function clip(value: string | null | undefined, max = MAX) {
  const t = value?.trim() ?? "";
  if (!t) return null;
  return t.slice(0, max);
}

function isPaidMedium(medium: string | null) {
  const m = (medium ?? "").toLowerCase();
  return m === "ads" || m === "cpc" || m === "paid" || m === "ppc";
}

export function isPaidAttribution(a: Pick<OrderAttribution, "utm_medium">) {
  return isPaidMedium(a.utm_medium);
}

export function channelFromAttribution(input: {
  utm_source: string | null;
  utm_medium: string | null;
  referrer_host: string | null;
  has_fbclid: boolean;
}) {
  const source = (input.utm_source ?? "").toLowerCase();
  const medium = (input.utm_medium ?? "").toLowerCase();
  const host = (input.referrer_host ?? "").toLowerCase();

  if (isPaidMedium(medium)) {
    if (source.includes("instagram") || source === "ig") return "Instagram Ads";
    if (
      source.includes("facebook") ||
      source === "fb" ||
      source === "meta"
    ) {
      return "Facebook Ads";
    }
    return `Ads (${source || "campaña"})`;
  }

  if (input.has_fbclid) return "Facebook (clic)";
  if (host.includes("instagram")) return "Instagram";
  if (host.includes("facebook")) return "Facebook";
  if (host.includes("google")) return "Google";
  if (host.includes("whatsapp") || host.includes("wa.me")) return "WhatsApp";
  if (!host && !source) return "Directo / no identificado";
  return source || host || "Otro";
}

export function sanitizeAttribution(
  raw: unknown,
): OrderAttribution | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const utm_source = clip(typeof o.utm_source === "string" ? o.utm_source : null);
  const utm_medium = clip(typeof o.utm_medium === "string" ? o.utm_medium : null);
  const utm_campaign = clip(
    typeof o.utm_campaign === "string" ? o.utm_campaign : null,
  );
  const utm_content = clip(
    typeof o.utm_content === "string" ? o.utm_content : null,
  );
  const landing_path = clip(
    typeof o.landing_path === "string" ? o.landing_path : null,
    PATH_MAX,
  );
  const referrer_host = clip(
    typeof o.referrer_host === "string" ? o.referrer_host : null,
  );
  const has_fbclid = o.has_fbclid === true;
  const captured_at =
    typeof o.captured_at === "string" && o.captured_at
      ? o.captured_at.slice(0, 40)
      : new Date().toISOString();

  const parsed = {
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    landing_path,
    referrer_host,
    has_fbclid,
    captured_at,
    channel: "",
  };

  parsed.channel = channelFromAttribution(parsed);

  const hasSignal =
    parsed.utm_source ||
    parsed.utm_medium ||
    parsed.utm_campaign ||
    parsed.referrer_host ||
    parsed.has_fbclid ||
    parsed.landing_path;

  if (!hasSignal) return null;
  return parsed;
}

export function attributionSummary(a: OrderAttribution | null | undefined) {
  if (!a?.channel || a.channel === "Directo / no identificado") {
    return a?.channel ?? "Sin dato";
  }
  if (a.utm_campaign) return `${a.channel} · ${a.utm_campaign}`;
  return a.channel;
}
