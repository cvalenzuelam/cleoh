import Link from "next/link";
import type { ReactNode } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  formatOrderMoney,
  orderStatusBadgeClass,
  orderStatusLabel,
} from "@/lib/orders/format";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getDashboard() {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return { ok: false as const, message: "Faltan env vars de Supabase" };
    }

    const supabase = createServiceClient();
    const [
      { count: categories, error },
      { count: products },
      { count: ordersOpen },
      { count: couponsActive },
      { data: recentOrders },
    ] = await Promise.all([
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "paid"]),
      supabase
        .from("coupons")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("orders")
        .select("id, order_number, customer_name, email, total_cents, status, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    if (error) {
      return {
        ok: false as const,
        message: error.message.includes("schema cache")
          ? "Tablas no encontradas — corre el SQL de supabase/migrations"
          : error.message,
      };
    }

    return {
      ok: true as const,
      categories: categories ?? 0,
      products: products ?? 0,
      ordersOpen: ordersOpen ?? 0,
      couponsActive: couponsActive ?? 0,
      recentOrders: recentOrders ?? [],
      hasAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasMp: Boolean(process.env.MP_ACCESS_TOKEN),
      hasPaypal: Boolean(
        process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID &&
          process.env.PAYPAL_CLIENT_SECRET,
      ),
    };
  } catch (e) {
    return {
      ok: false as const,
      message: e instanceof Error ? e.message : "Error de conexión",
    };
  }
}

export default async function AdminHomePage() {
  const db = await getDashboard();

  const cards = db.ok
    ? [
        {
          label: "Productos",
          value: db.products,
          href: "/admin/productos",
          hint: "Activos en tienda",
        },
        {
          label: "Pedidos abiertos",
          value: db.ordersOpen,
          href: "/admin/pedidos",
          hint: "Pendiente o pagado",
        },
        {
          label: "Cupones activos",
          value: db.couponsActive,
          href: "/admin/cupones",
          hint: "Listos para checkout",
        },
        {
          label: "Categorías",
          value: db.categories,
          href: "/admin/categorias",
          hint: "Nav y catálogo",
        },
      ]
    : [];

  return (
    <>
      <AdminPageHeader
        title="Resumen"
        description="Panel Cleoh · catálogo, pedidos y pagos."
      />

      <div
        className={`mb-8 overflow-hidden rounded-xl border ${
          db.ok
            ? "border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-white"
            : "border-amber-200/80 bg-gradient-to-r from-amber-50 to-white"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 px-4 py-3.5 sm:gap-3">
          {db.ok ? (
            <>
              <StatusChip ok>Supabase</StatusChip>
              <StatusChip ok={db.hasMp}>Mercado Pago</StatusChip>
              <StatusChip ok={db.hasPaypal}>PayPal</StatusChip>
              {!db.hasAnon ? (
                <span className="text-xs text-amber-800">
                  Falta{" "}
                  <code className="rounded bg-amber-100/80 px-1">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </code>
                </span>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-amber-900">Supabase: {db.message}</p>
          )}
        </div>
      </div>

      {cards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-xl border border-zinc-200/90 bg-white p-5 shadow-[0_1px_0_rgba(24,24,27,0.04)] transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-sm"
            >
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-zinc-500">
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-zinc-900">
                {card.value}
              </p>
              <p className="mt-2 text-xs text-zinc-400 transition-colors group-hover:text-zinc-600">
                {card.hint}
              </p>
            </Link>
          ))}
        </div>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">
              Pedidos recientes
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Últimos movimientos de la tienda
            </p>
          </div>
          <Link
            href="/admin/pedidos"
            className="text-xs font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
          >
            Ver todos
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_0_rgba(24,24,27,0.04)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50/80 text-[0.65rem] uppercase tracking-[0.12em] text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  Cliente
                </th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {db.ok && db.recentOrders.length > 0 ? (
                db.recentOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="transition-colors hover:bg-zinc-50/80"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/pedidos/${o.id}`}
                        className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                      >
                        {o.order_number}
                      </Link>
                      <span className="mt-0.5 block text-xs text-zinc-400 sm:hidden">
                        {o.customer_name || o.email}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3.5 sm:table-cell">
                      <span className="block text-zinc-800">
                        {o.customer_name || "—"}
                      </span>
                      {o.email ? (
                        <span className="text-xs text-zinc-400">{o.email}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-zinc-800">
                      {formatOrderMoney(o.total_cents)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${orderStatusBadgeClass(o.status)}`}
                      >
                        {orderStatusLabel(o.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-zinc-400"
                  >
                    Sin pedidos aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function StatusChip({
  children,
  ok,
}: {
  children: ReactNode;
  ok: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
        ok
          ? "bg-white/80 text-emerald-800 ring-emerald-200"
          : "bg-white/80 text-amber-800 ring-amber-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-500"}`}
        aria-hidden
      />
      {children}
      <span className="font-normal opacity-70">{ok ? "OK" : "falta"}</span>
    </span>
  );
}
