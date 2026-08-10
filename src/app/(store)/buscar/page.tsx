import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import {
  getFeaturedProducts,
  getNavCategories,
  searchCatalogProducts,
} from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  const term = q?.trim() ?? "";
  if (!term) {
    return { title: "Buscar" };
  }
  return {
    title: `Buscar: ${term}`,
    description: `Resultados de búsqueda para ${term} en Cleoh.`,
  };
}

export default async function BuscarPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const term = q?.trim() ?? "";
  const nav = await getNavCategories();
  const exploreLinks = nav.map((c) => ({ slug: c.slug, name: c.name }));
  const featured = await getFeaturedProducts(6);

  const { products, total } =
    term.length >= 2
      ? await searchCatalogProducts(term, 48)
      : { products: [], total: 0 };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-xl animate-fade-up">
        <p className="text-[0.65rem] uppercase tracking-[0.22em] text-rose">
          Búsqueda
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-wide text-ink">
          {term ? (
            <>
              &ldquo;{term}&rdquo;
            </>
          ) : (
            "Buscar"
          )}
        </h1>
        {term.length >= 2 && (
          <p className="mt-3 text-sm text-ink-soft">
            {total} {total === 1 ? "pieza encontrada" : "piezas encontradas"}
          </p>
        )}
      </header>

      <form
        action="/buscar"
        method="get"
        className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input
          type="search"
          name="q"
          defaultValue={term}
          className="search-input flex-1"
          aria-label="Refinar búsqueda"
          placeholder="Buscar productos…"
          minLength={2}
          required
        />
        <button type="submit" className="btn btn-primary shrink-0">
          Buscar
        </button>
      </form>

      {term.length < 2 ? (
        <div className="mt-12 max-w-xl text-sm text-ink-soft">
          <p>Escribe al menos 2 caracteres para buscar en la colección.</p>
          {featured.length > 0 && (
            <section className="mt-10">
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-ink-soft">
                Te puede interesar
              </p>
              <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3">
                {featured.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={i < 3}
                  />
                ))}
              </div>
            </section>
          )}
          <section className="mt-10">
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-ink-soft">
              Explora
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {exploreLinks.map((link) => (
                <li key={link.slug}>
                  <Link href={`/categoria/${link.slug}`} className="chip">
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/tienda" className="chip">Toda la colección</Link>
              </li>
            </ul>
          </section>
        </div>
      ) : products.length === 0 ? (
        <div className="mt-12">
          <p className="text-sm text-ink-soft">
            No encontramos piezas para &ldquo;{term}&rdquo;. Quizá te interesa:
          </p>
          {featured.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 stagger-grid md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
              {featured.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={i < 4}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 stagger-grid md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
