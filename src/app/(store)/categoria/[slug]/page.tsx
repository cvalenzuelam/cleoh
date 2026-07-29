import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import {
  getCategoryBySlug,
  getCategorySlugs,
  getProductsByCategorySlug,
} from "@/lib/catalog/queries";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  try {
    const slugs = await getCategorySlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description ?? undefined,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const list = await getProductsByCategorySlug(category.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-xl animate-fade-up">
        <p className="text-[0.65rem] uppercase tracking-[0.22em] text-rose">
          Colección
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-wide text-ink">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {category.description}
          </p>
        )}
      </header>

      {list.length === 0 ? (
        <p className="mt-16 text-sm text-ink-soft">
          Pronto agregaremos piezas a esta colección.
        </p>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 stagger-grid md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
