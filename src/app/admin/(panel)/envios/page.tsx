import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconTruck } from "@/components/admin/icons";
import { formatMxnFromCents } from "@/lib/admin/products";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminEnviosPage() {
  const supabase = createServiceClient();
  const { data: methods, error } = await supabase
    .from("shipping_methods")
    .select(
      "id, name, description, price_cents, eta_label, sort_order, is_active",
    )
    .order("sort_order", { ascending: true });

  return (
    <>
      <AdminPageHeader
        title="Envíos"
        description="Métodos y tarifas que aparecen en el checkout."
        actionLabel="Nuevo método"
        actionHref="/admin/envios/nuevo"
        icon={<IconTruck className="h-[18px] w-[18px]" />}
      />

      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error.message}
          {error.message.includes("shipping_methods") ||
          error.code === "42P01" ? (
            <span className="mt-2 block">
              Aplica la migración{" "}
              <code className="text-xs">
                20260720180000_shipping_and_notes.sql
              </code>{" "}
              en Supabase.
            </span>
          ) : null}
        </p>
      ) : !methods?.length ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500">
          No hay métodos.{" "}
          <Link href="/admin/envios/nuevo" className="underline">
            Crear el primero
          </Link>
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Método</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">ETA</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m.id} className="border-t border-zinc-50 text-zinc-600">
                  <td className="px-4 py-3">
                    <span className="font-medium text-zinc-900">{m.name}</span>
                    {m.description ? (
                      <span className="mt-0.5 block text-xs text-zinc-400">
                        {m.description}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatMxnFromCents(m.price_cents)}
                  </td>
                  <td className="px-4 py-3 text-xs">{m.eta_label || "—"}</td>
                  <td className="px-4 py-3">
                    {m.is_active ? "Activo" : "Inactivo"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/envios/${m.id}`}
                      className="text-sm text-zinc-900 underline-offset-2 hover:underline"
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
