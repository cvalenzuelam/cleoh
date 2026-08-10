import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { StoreFilters } from "@/components/store/StoreFilters";
import {
  filterAndSortStoreProducts,
  parseStoreSort,
} from "@/lib/catalog/store-filters";
import { getActiveProducts, getNavCategories } from "@/lib/catalog/queries";
import { site } from "@/data/site";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ categoria?: string; orden?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { categoria, orden } = await searchParams;
  const categories = await getNavCategories();
  const category = categories.find((c) => c.slug === categoria);

  let title = "Tienda";
  if (category) title = `Tienda — ${category.name}`;

  const description = category
    ? `${category.name} y más piezas de Cleoh — lencería romántica.`
    : "Toda la colección Cleoh — babydolls, sets, pijamas y más.";

  const params = new URLSearchParams();
  if (categoria) params.set("categoria", categoria);
  if (orden && orden !== "novedades") params.set("orden", orden);
  const query = params.toString();
  const canonical = query ? `${site.url}/tienda?${query}` : `${site.url}/tienda`;

  return {
    title,
    description,
    alternates: { canonical },
  };
}

export default async function TiendaPage({ searchParams }: Props) {
  const { categoria, orden } = await searchParams;
  const sort = parseStoreSort(orden);
  const categorySlug = categoria?.trim() || undefined;

  const [products, categories] = await Promise.all([
    getActiveProducts(),
    getNavCategories(),
  ]);

  const filtered = filterAndSortStoreProducts(products, {
    categorySlug,
    sort,
  });

  const categoryOptions = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
  }));

  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          ...(activeCategory
            ? [{ name: activeCategory.name, path: `/categoria/${activeCategory.slug}` }]
            : []),
          { name: "Tienda", path: "/tienda" },
        ])}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="max-w-xl animate-fade-up">
          <p className="text-[0.65rem] uppercase tracking-[0.22em] text-rose">
            Catálogo
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-wide text-ink">
            {activeCategory ? activeCategory.name : "Toda la tienda"}
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            {activeCategory?.description ??
              "Explora la colección completa de lencería romántica."}
          </p>
        </header>

        <Suspense
          fallback={
            <div className="mt-8 h-24 animate-pulse rounded-md bg-mist/60" />
          }
        >
          <StoreFilters
            categories={categoryOptions}
            totalCount={products.length}
            filteredCount={filtered.length}
          />
        </Suspense>

        {filtered.length === 0 ? (
          <p className="mt-16 text-sm text-ink-soft">
            {products.length === 0
              ? "El catálogo está vacío. Importa productos desde el admin."
              : "No hay piezas en esta categoría. Prueba otra o muestra todas."}
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 stagger-grid md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
