import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  countryFlag,
  countryLabel,
  DeviceIcon,
} from "@/components/admin/AnalyticsMeta";
import { AdminProductThumbnail } from "@/components/admin/AdminProductThumbnail";
import {
  IconBanknote,
  IconChartBar,
  IconGlobe,
  IconListChecks,
  IconTrophy,
} from "@/components/admin/icons";
import { getStoreAnalytics } from "@/lib/admin/analytics";
import { getWebTrafficAnalytics } from "@/lib/admin/web-analytics";
import {
  formatOrderMoney,
  orderStatusBadgeClass,
  orderStatusLabel,
} from "@/lib/orders/format";

export const dynamic = "force-dynamic";

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Escritorio",
  mobile: "Móvil",
  tablet: "Tablet",
  console: "Consola",
  smarttv: "Smart TV",
  wearable: "Wearable",
  embedded: "Embebido",
};

function formatDayLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default async function AdminAnalyticsPage() {
  const [salesResult, trafficResult] = await Promise.all([
    getStoreAnalytics(),
    getWebTrafficAnalytics(),
  ]);

  const sales = salesResult.ok ? salesResult.data : null;
  const traffic = trafficResult.ok ? trafficResult.data : null;
  const maxDayViews = Math.max(
    1,
    ...(traffic?.byDay.map((d) => d.pageviews) ?? [0]),
  );

  const revenueCards = sales
    ? [
        {
          label: "Ingresos totales",
          value: formatOrderMoney(sales.revenueAllCents),
          hint: "Pedidos pagados y enviados",
        },
        {
          label: "Últimos 7 días",
          value: formatOrderMoney(sales.revenue7dCents),
          hint: "Ingresos recientes",
        },
        {
          label: "Últimos 30 días",
          value: formatOrderMoney(sales.revenue30dCents),
          hint: "Mes en curso aproximado",
        },
        {
          label: "Ticket promedio",
          value: formatOrderMoney(sales.averageTicketCents),
          hint: `${sales.paidOrdersCount} pedido${sales.paidOrdersCount === 1 ? "" : "s"} pagado${sales.paidOrdersCount === 1 ? "" : "s"}`,
        },
      ]
    : [];

  const trafficCards = traffic
    ? [
        {
          label: "Visitantes · 7 días",
          value: String(traffic.visitors7d),
          hint: "Visitantes únicos",
        },
        {
          label: "Vistas · 7 días",
          value: String(traffic.pageviews7d),
          hint: "Pageviews",
        },
        {
          label: "Visitantes · 30 días",
          value: String(traffic.visitors30d),
          hint: "Visitantes únicos",
        },
        {
          label: "Vistas · 30 días",
          value: String(traffic.pageviews30d),
          hint: "Pageviews",
        },
      ]
    : [];

  const statuses: { key: keyof NonNullable<typeof sales>["byStatus"]; label: string }[] = [
    { key: "pending", label: orderStatusLabel("pending") },
    { key: "paid", label: orderStatusLabel("paid") },
    { key: "fulfilled", label: orderStatusLabel("fulfilled") },
    { key: "cancelled", label: orderStatusLabel("cancelled") },
    { key: "refunded", label: orderStatusLabel("refunded") },
  ];

  return (
    <>
      <AdminPageHeader
        title="Analíticas"
        description="Tráfico web, ventas y productos más vendidos."
        icon={<IconChartBar className="h-[18px] w-[18px]" />}
      />

      <section>
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
          <IconGlobe className="h-4 w-4 text-zinc-400" />
          Tráfico web
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Visitantes y vistas desde Vercel Analytics
        </p>

        {traffic ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {trafficCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_0_rgba(24,24,27,0.04)]"
                >
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-zinc-500">
                    {card.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-zinc-900 sm:text-3xl">
                    {card.value}
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">{card.hint}</p>
                </div>
              ))}
            </div>

            {traffic.byDay.length > 0 && (
              <div className="mt-6 rounded-xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_0_rgba(24,24,27,0.04)]">
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-zinc-500">
                  Vistas por día · 7 días
                </p>
                <div className="mt-4 flex items-end gap-1.5 sm:gap-2">
                  {traffic.byDay.map((day) => {
                    const h = Math.max(
                      4,
                      Math.round((day.pageviews / maxDayViews) * 100),
                    );
                    return (
                      <div
                        key={day.date}
                        className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                        title={`${formatDayLabel(day.date)}: ${day.pageviews} vistas, ${day.visitors} visitantes`}
                      >
                        <div className="flex h-24 w-full items-end">
                          <div
                            className="w-full rounded-t-md bg-zinc-800/85 transition-colors hover:bg-zinc-900"
                            style={{ height: `${h}%` }}
                          />
                        </div>
                        <span className="truncate text-[0.6rem] text-zinc-400">
                          {formatDayLabel(day.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_0_rgba(24,24,27,0.04)] lg:col-span-2">
                <div className="border-b border-zinc-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Páginas más vistas
                  </h3>
                  <p className="text-xs text-zinc-500">Últimos 7 días</p>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-100 bg-zinc-50/80 text-[0.65rem] uppercase tracking-[0.12em] text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Ruta</th>
                      <th className="px-4 py-3 font-medium">Visitantes</th>
                      <th className="px-4 py-3 font-medium">Vistas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {traffic.topPages.length > 0 ? (
                      traffic.topPages.map((p) => (
                        <tr
                          key={p.path}
                          className="transition-colors hover:bg-zinc-50/80"
                        >
                          <td className="max-w-[14rem] truncate px-4 py-3 font-medium text-zinc-900 sm:max-w-none">
                            {p.path}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-zinc-800">
                            {p.visitors}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-zinc-800">
                            {p.pageviews}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-8 text-center text-sm text-zinc-400"
                        >
                          Aún no hay vistas registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_0_rgba(24,24,27,0.04)]">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Dispositivos
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {traffic.byDevice.length > 0 ? (
                      traffic.byDevice.map((d) => (
                        <li
                          key={d.device}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="flex min-w-0 items-center gap-2 text-zinc-700">
                            <DeviceIcon device={d.device} />
                            {DEVICE_LABELS[d.device] ?? d.device}
                          </span>
                          <span className="tabular-nums text-zinc-500">
                            {d.visitors}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-zinc-400">Sin datos</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_0_rgba(24,24,27,0.04)]">
                  <h3 className="text-sm font-semibold text-zinc-900">Países</h3>
                  <ul className="mt-3 space-y-2">
                    {traffic.byCountry.length > 0 ? (
                      traffic.byCountry.map((c) => (
                        <li
                          key={c.country}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="flex min-w-0 items-center gap-2 text-zinc-700">
                            <span className="text-base leading-none" aria-hidden>
                              {countryFlag(c.country)}
                            </span>
                            <span className="truncate">
                              {countryLabel(c.country)}
                            </span>
                          </span>
                          <span className="tabular-nums text-zinc-500">
                            {c.visitors}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-zinc-400">Sin datos</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {!trafficResult.ok
              ? trafficResult.message
              : "No hay datos de tráfico todavía."}
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
          <IconBanknote className="h-4 w-4 text-zinc-400" />
          Ventas
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Ingresos de pedidos pagados y enviados
        </p>

        {sales ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {revenueCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_0_rgba(24,24,27,0.04)]"
                >
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-zinc-500">
                    {card.label}
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-zinc-900 sm:text-3xl">
                    {card.value}
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">{card.hint}</p>
                </div>
              ))}
            </div>

            <section className="mt-10">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
                <IconListChecks className="h-4 w-4 text-zinc-400" />
                Pedidos por estado
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Conteo de todos los pedidos registrados
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {statuses.map(({ key, label }) => (
                  <span
                    key={key}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${orderStatusBadgeClass(key)}`}
                  >
                    {label}
                    <span className="tabular-nums opacity-80">
                      {sales.byStatus[key]}
                    </span>
                  </span>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <div className="mb-4">
                <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900">
                  <IconTrophy className="h-4 w-4 text-zinc-400" />
                  Top productos
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Por unidades en pedidos pagados o enviados
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_0_rgba(24,24,27,0.04)]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-100 bg-zinc-50/80 text-[0.65rem] uppercase tracking-[0.12em] text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Producto</th>
                      <th className="px-4 py-3 font-medium">Unidades</th>
                      <th className="px-4 py-3 font-medium">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {sales.topProducts.length > 0 ? (
                      sales.topProducts.map((p) => (
                        <tr
                          key={p.name}
                          className="transition-colors hover:bg-zinc-50/80"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <AdminProductThumbnail
                                src={p.imageUrl}
                                alt={p.name}
                                className="h-10 w-10 shrink-0 rounded-md object-cover bg-zinc-100 ring-1 ring-zinc-200/80"
                              />
                              <span className="font-medium text-zinc-900">
                                {p.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 tabular-nums text-zinc-800">
                            {p.units}
                          </td>
                          <td className="px-4 py-3.5 tabular-nums text-zinc-800">
                            {formatOrderMoney(p.revenueCents)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-10 text-center text-sm text-zinc-400"
                        >
                          Aún no hay ventas registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {!salesResult.ok
              ? salesResult.message
              : "No hay datos de ventas todavía."}
          </p>
        )}
      </section>
    </>
  );
}
