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

const DEFAULT_PROJECT_ID = "prj_3jV3lCl9BBojqiFMCp72i9kdpBMJ";
const DEFAULT_TEAM_ID = "team_Fe3Ld4xrAgFma4ZNRHycwgUM";

function getConfig() {
  const token =
    process.env.VERCEL_ACCESS_TOKEN?.trim() ||
    process.env.VERCEL_TOKEN?.trim() ||
    "";
  const projectId =
    process.env.VERCEL_PROJECT_ID?.trim() || DEFAULT_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID?.trim() || DEFAULT_TEAM_ID;

  return { token, projectId, teamId };
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rangeForDays(days: number) {
  const until = new Date();
  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - (days - 1));
  return { since: toIsoDate(since), until: toIsoDate(until) };
}

function trafficConfigError(token: string): string | null {
  if (!token) {
    return "Falta VERCEL_TOKEN (token personal vcp_…) para mostrar visitantes.";
  }
  if (token.startsWith("vca_") || token.startsWith("vcr_")) {
    return "VERCEL_TOKEN es un token de app (vca_/vcr_), no sirve para la API de Analytics. Crea un token personal en vercel.com/account/tokens.";
  }
  return null;
}

async function vercelQuery<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const { token, projectId, teamId } = getConfig();
  const configError = trafficConfigError(token);
  if (configError) throw new Error("missing_env");

  const qs = new URLSearchParams({
    projectId,
    teamId,
    ...params,
  });

  const res = await fetch(
    `https://api.vercel.com/v1/query/web-analytics/${path}?${qs}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 403 && body.includes("invalidToken")) {
      throw new Error("invalid_token");
    }
    throw new Error(
      `vercel_${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`,
    );
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
    const { token } = getConfig();
    const configError = trafficConfigError(token);
    if (configError) {
      return { ok: false, message: configError };
    }

    const range7 = rangeForDays(7);
    const range30 = rangeForDays(30);

    const [count7, count30, byDay, topPages, byCountry, byDevice] =
      await Promise.all([
        vercelQuery<CountPayload>("visits/count", range7),
        vercelQuery<CountPayload>("visits/count", range30),
        vercelQuery<AggregatePayload>("visits/aggregate", {
          ...range7,
          by: "day",
          limit: "14",
        }),
        vercelQuery<AggregatePayload>("visits/aggregate", {
          ...range7,
          by: "requestPath",
          limit: "10",
        }),
        vercelQuery<AggregatePayload>("visits/aggregate", {
          ...range7,
          by: "country",
          limit: "8",
        }),
        vercelQuery<AggregatePayload>("visits/aggregate", {
          ...range7,
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
          date: String(row.timestamp ?? "").slice(0, 10),
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
      const configError = trafficConfigError(getConfig().token);
      return {
        ok: false,
        message:
          configError ??
          "Falta VERCEL_TOKEN (token personal vcp_…) para mostrar visitantes.",
      };
    }
    if (e instanceof Error && e.message === "invalid_token") {
      return {
        ok: false,
        message:
          "VERCEL_TOKEN inválido o expirado. Crea uno nuevo en vercel.com/account/tokens (prefijo vcp_) y actualízalo en Settings → Environment Variables.",
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
