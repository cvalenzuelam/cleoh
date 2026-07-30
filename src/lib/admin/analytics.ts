import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { productThumbnailUrl } from "@/lib/admin/products";

const PAID_STATUSES = ["paid", "fulfilled"] as const;

export type AnalyticsSnapshot = {
  revenueAllCents: number;
  revenue7dCents: number;
  revenue30dCents: number;
  paidOrdersCount: number;
  averageTicketCents: number;
  byStatus: {
    pending: number;
    paid: number;
    fulfilled: number;
    cancelled: number;
    refunded: number;
  };
  topProducts: {
    name: string;
    units: number;
    revenueCents: number;
    imageUrl: string | null;
  }[];
};

function daysAgoIso(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export async function getStoreAnalytics(): Promise<
  | { ok: true; data: AnalyticsSnapshot }
  | { ok: false; message: string }
> {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return { ok: false, message: "Faltan env vars de Supabase" };
    }

    const supabase = createServiceClient();
    const since7 = daysAgoIso(7);
    const since30 = daysAgoIso(30);

    const [
      { data: allPaid, error: e1 },
      { data: paid7, error: e2 },
      { data: paid30, error: e3 },
      { data: statusRows, error: e4 },
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("id, total_cents")
        .in("status", [...PAID_STATUSES]),
      supabase
        .from("orders")
        .select("total_cents")
        .in("status", [...PAID_STATUSES])
        .gte("created_at", since7),
      supabase
        .from("orders")
        .select("total_cents")
        .in("status", [...PAID_STATUSES])
        .gte("created_at", since30),
      supabase.from("orders").select("status"),
    ]);

    const errEarly = e1 || e2 || e3 || e4;
    if (errEarly) {
      return {
        ok: false,
        message: errEarly.message.includes("schema cache")
          ? "Tablas no encontradas — corre las migraciones SQL"
          : errEarly.message,
      };
    }

    const paidIds = (allPaid ?? []).map((o) => o.id);
    let items: {
      product_name: string;
      quantity: number;
      line_total_cents: number;
    }[] = [];

    if (paidIds.length > 0) {
      const { data: itemRows, error: e5 } = await supabase
        .from("order_items")
        .select("product_name, quantity, line_total_cents")
        .in("order_id", paidIds);
      if (e5) {
        return {
          ok: false,
          message: e5.message.includes("schema cache")
            ? "Tablas no encontradas — corre las migraciones SQL"
            : e5.message,
        };
      }
      items = itemRows ?? [];
    }

    const sum = (rows: { total_cents: number }[] | null) =>
      (rows ?? []).reduce((acc, r) => acc + (r.total_cents ?? 0), 0);

    const revenueAllCents = sum(allPaid);
    const revenue7dCents = sum(paid7);
    const revenue30dCents = sum(paid30);
    const paidOrdersCount = allPaid?.length ?? 0;
    const averageTicketCents =
      paidOrdersCount > 0 ? Math.round(revenueAllCents / paidOrdersCount) : 0;

    const byStatus = {
      pending: 0,
      paid: 0,
      fulfilled: 0,
      cancelled: 0,
      refunded: 0,
    };
    for (const row of statusRows ?? []) {
      const s = row.status as keyof typeof byStatus;
      if (s in byStatus) byStatus[s] += 1;
    }

    const productMap = new Map<
      string,
      { name: string; units: number; revenueCents: number }
    >();
    for (const item of items) {
      const name = item.product_name || "Sin nombre";
      const cur = productMap.get(name) ?? {
        name,
        units: 0,
        revenueCents: 0,
      };
      cur.units += item.quantity ?? 0;
      cur.revenueCents += item.line_total_cents ?? 0;
      productMap.set(name, cur);
    }

    const topProductsBase = [...productMap.values()]
      .sort((a, b) => b.units - a.units || b.revenueCents - a.revenueCents)
      .slice(0, 10);

    const topNames = topProductsBase.map((p) => p.name);
    const imageByName = new Map<string, string | null>();

    if (topNames.length > 0) {
      const { data: productRows } = await supabase
        .from("products")
        .select("name, primary_image_url, product_images ( url, sort_order )")
        .in("name", topNames);

      for (const row of productRows ?? []) {
        imageByName.set(
          row.name,
          productThumbnailUrl({
            primary_image_url: row.primary_image_url,
            product_images: (row.product_images ?? []) as {
              url: string;
              sort_order: number;
            }[],
          }),
        );
      }
    }

    const topProducts = topProductsBase.map((p) => ({
      ...p,
      imageUrl: imageByName.get(p.name) ?? null,
    }));

    return {
      ok: true,
      data: {
        revenueAllCents,
        revenue7dCents,
        revenue30dCents,
        paidOrdersCount,
        averageTicketCents,
        byStatus,
        topProducts,
      },
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Error de conexión",
    };
  }
}
