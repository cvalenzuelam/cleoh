import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatOrderMoney } from "@/lib/orders/format";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function couponDetail(c: {
  percent_off: number | null;
  amount_off_cents: number | null;
  min_subtotal_cents: number;
  max_uses: number | null;
  used_count: number;
}) {
  const parts: string[] = [];
  if (c.percent_off) parts.push(`${c.percent_off}%`);
  if (c.amount_off_cents) parts.push(formatOrderMoney(c.amount_off_cents));
  if (c.min_subtotal_cents > 0) {
    parts.push(`mín. ${formatOrderMoney(c.min_subtotal_cents)}`);
  }
  if (c.max_uses != null) {
    parts.push(`${c.used_count}/${c.max_uses} usos`);
  } else if (c.used_count > 0) {
    parts.push(`${c.used_count} usos`);
  }
  return parts.join(" · ");
}

export default async function AdminCuponesPage() {
  const supabase = createServiceClient();
  const { data: coupons, error } = await supabase
    .from("coupons")
    .select(
      "id, code, description, percent_off, amount_off_cents, min_subtotal_cents, max_uses, used_count, is_active, ends_at",
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <AdminPageHeader
        title="Cupones"
        description="Porcentaje o monto fijo. Se validan al pagar en checkout."
        actionHref="/admin/cupones/nuevo"
        actionLabel="Nuevo cupón"
      />

      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error.message}
        </p>
      ) : !coupons?.length ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500">
          No hay cupones. Crea el primero con{" "}
          <Link href="/admin/cupones/nuevo" className="underline">
            Nuevo cupón
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-zinc-50 text-zinc-600">
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-zinc-900">
                      {c.code}
                    </span>
                    {c.description ? (
                      <span className="mt-0.5 block text-xs text-zinc-400">
                        {c.description}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs">{couponDetail(c)}</td>
                  <td className="px-4 py-3">
                    {c.is_active ? (
                      <span className="text-emerald-700">Activo</span>
                    ) : (
                      <span className="text-zinc-400">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/cupones/${c.id}`}
                      className="text-xs font-medium text-zinc-900 underline-offset-2 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
