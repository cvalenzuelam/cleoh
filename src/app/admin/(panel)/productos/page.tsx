import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SeedProductsButton } from "@/components/admin/SeedProductsButton";
import { formatMxnFromCents } from "@/lib/admin/products";
import { createClient } from "@/lib/supabase/server";

export default async function AdminProductosPage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      price_cents,
      badge,
      is_active,
      product_variants ( stock )
    `,
    )
    .order("created_at", { ascending: false });

  const rows = (products ?? []).map((p) => {
    const variants = (p.product_variants ?? []) as { stock: number }[];
    const stock = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
    return { ...p, stock };
  });

  return (
    <>
      <AdminPageHeader
        title="Productos"
        description="Catálogo, tallas y stock. Imágenes por URL por ahora; R2 después."
        actionHref="/admin/productos/nuevo"
        actionLabel="Nuevo producto"
      />

      {rows.length === 0 && (
        <div className="mb-6 rounded-lg border border-dashed border-zinc-300 bg-white p-5">
          <p className="text-sm text-zinc-600">
            Aún no hay productos en la base. Crea uno o importa el seed de Wix.
          </p>
          <div className="mt-3">
            <SeedProductsButton />
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 text-sm text-red-600">{error.message}</p>
      )}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Etiqueta</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-zinc-400"
                >
                  Sin productos
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="text-zinc-700 hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {p.badge === "nuevo"
                      ? "Nuevo"
                      : p.badge === "mas-vendido"
                        ? "Más vendido"
                        : p.badge === "oferta"
                          ? "Oferta"
                          : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatMxnFromCents(p.price_cents)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        !p.is_active
                          ? "text-zinc-400"
                          : p.stock === 0
                            ? "text-amber-700"
                            : "text-emerald-700"
                      }
                    >
                      {!p.is_active
                        ? "inactivo"
                        : p.stock === 0
                          ? "agotado"
                          : "activo"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="mt-4">
          <SeedProductsButton />
        </div>
      )}
    </>
  );
}
