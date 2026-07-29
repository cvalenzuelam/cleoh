import "server-only";

export type WebTrafficSnapshot = {
  visitors7d: number;
  pageviews7d: number;
  visitors30d: number;
  pageviews30d: number;
  byDay: { date: string; visitors: number; pageviews: number }[];
  topPages: { path: string; visitors: number; pageviews: number }[];
  byCountry: { country: string; visitors: number; pageviews: number }[];
  byDevice: { device: string; visitors: number; pageviews: number }[];
};

type CountPayload = {
  data?: { visitors?: number; pageviews?: number };
};

type AggregateRow = Record<string, string | number | undefined>;

type AggregatePayload = {
  data?: AggregateRow[];
};

function daysAgoIso(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function tomorrowIso() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

async function vercelQuery<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const token = process.env.VERCEL_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  const teamId = process.env.VERCEL_TEAM_ID?.trim();

  if (!token || !projectId) {
    throw new Error("missing_env");
  }

  const qs = new URLSearchParams({
    projectId,
    ...params,
  });
  if (teamId) qs.set("teamId", teamId);

  const res = await fetch(
    `https://api.vercel.com/v1/query/web-analytics/${path}?${qs}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`vercel_${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`);
  }

  return (await res.json()) as T;
}

function num(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export async function getWebTrafficAnalytics(): Promise<
  | { ok: true; data: WebTrafficSnapshot }
  | { ok: false; message: string }
> {
  try {
    if (!process.env.VERCEL_TOKEN?.trim() || !process.env.VERCEL_PROJECT_ID?.trim()) {
      return {
        ok: false,
        message:
          "Faltan VERCEL_TOKEN y VERCEL_PROJECT_ID para mostrar visitantes.",
      };
    }

    const since7 = daysAgoIso(7);
    const since30 = daysAgoIso(30);
    const until = tomorrowIso();

    const [count7, count30, byDay, topPages, byCountry, byDevice] =
      await Promise.all([
        vercelQuery<CountPayload>("visits/count", {
          since: since7,
          until,
        }),
        vercelQuery<CountPayload>("visits/count", {
          since: since30,
          until,
        }),
        vercelQuery<AggregatePayload>("visits/aggregate", {
          since: since7,
          until,
          by: "day",
          limit: "14",
        }),
        vercelQuery<AggregatePayload>("visits/aggregate", {
          since: since7,
          until,
          by: "requestPath",
          limit: "10",
        }),
        vercelQuery<AggregatePayload>("visits/aggregate", {
          since: since7,
          until,
          by: "country",
          limit: "8",
        }),
        vercelQuery<AggregatePayload>("visits/aggregate", {
          since: since7,
          until,
          by: "deviceType",
          limit: "6",
        }),
      ]);

    return {
      ok: true,
      data: {
        visitors7d: num(count7.data?.visitors),
        pageviews7d: num(count7.data?.pageviews),
        visitors30d: num(count30.data?.visitors),
        pageviews30d: num(count30.data?.pageviews),
        byDay: (byDay.data ?? []).map((row) => ({
          date: String(row.timestamp ?? ""),
          visitors: num(row.visitors),
          pageviews: num(row.pageviews),
        })),
        topPages: (topPages.data ?? []).map((row) => ({
          path: String(row.requestPath ?? "/"),
          visitors: num(row.visitors),
          pageviews: num(row.pageviews),
        })),
        byCountry: (byCountry.data ?? []).map((row) => ({
          country: String(row.country ?? "—"),
          visitors: num(row.visitors),
          pageviews: num(row.pageviews),
        })),
        byDevice: (byDevice.data ?? []).map((row) => ({
          device: String(row.deviceType ?? "—"),
          visitors: num(row.visitors),
          pageviews: num(row.pageviews),
        })),
      },
    };
  } catch (e) {
    if (e instanceof Error && e.message === "missing_env") {
      return {
        ok: false,
        message:
          "Faltan VERCEL_TOKEN y VERCEL_PROJECT_ID para mostrar visitantes.",
      };
    }
    return {
      ok: false,
      message:
        e instanceof Error
          ? `No se pudo leer el tráfico de Vercel (${e.message})`
          : "No se pudo leer el tráfico de Vercel",
    };
  }
}
