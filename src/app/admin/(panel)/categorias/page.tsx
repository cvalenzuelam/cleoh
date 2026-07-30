import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { IconLayers } from "@/components/admin/icons";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminCategoriasPage() {
  const supabase = createServiceClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select(
      "id, name, slug, sort_order, is_nav, is_tile, cover_image_url, description",
    )
    .order("sort_order", { ascending: true });

  return (
    <>
      <AdminPageHeader
        title="Categorías"
        description="Controlan el menú, los tiles del home y las páginas /categoria/…"
        actionHref="/admin/categorias/nuevo"
        actionLabel="Nueva categoría"
        icon={<IconLayers className="h-[18px] w-[18px]" />}
      />

      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error.message}
        </p>
      ) : !categories?.length ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500">
          No hay categorías.{" "}
          <Link href="/admin/categorias/nuevo" className="underline">
            Crear una
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Orden</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Nav</th>
                <th className="px-4 py-3 font-medium">Tile</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {categories.map((c) => (
                <tr key={c.id} className="text-zinc-700">
                  <td className="px-4 py-3 tabular-nums text-zinc-400">
                    {c.sort_order}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{c.slug}</td>
                  <td className="px-4 py-3">{c.is_nav ? "sí" : "no"}</td>
                  <td className="px-4 py-3">{c.is_tile ? "sí" : "no"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/categorias/${c.id}`}
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
