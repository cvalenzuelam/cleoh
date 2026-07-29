import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { getFeaturedProducts } from "@/lib/catalog/queries";

export async function FeaturedProducts() {
  const featured = await getFeaturedProducts(8);

  if (featured.length === 0) {
    return (
      <section className="bg-porcelain">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl tracking-wide text-ink">
            Destacados
          </h2>
          <p className="mt-3 text-sm text-ink-soft">
            Pronto verás piezas aquí. Importa el catálogo desde el admin.
          </p>
          <Link
            href="/admin/productos"
            className="mt-4 inline-block text-[0.65rem] uppercase tracking-[0.18em] text-rose"
          >
            Ir al admin
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-porcelain">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 animate-fade-up">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.22em] text-rose">
              Selección
            </p>
            <h2 className="mt-2 font-display text-3xl tracking-wide text-ink sm:text-4xl">
              Destacados
            </h2>
          </div>
          <Link
            href="/tienda"
            className="link-anim text-[0.65rem] uppercase tracking-[0.18em] text-ink-soft"
          >
            Ver todos
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 stagger-grid md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}
