import type { Metadata } from "next";
import { ProductCard } from "@/components/product/ProductCard";
import { getActiveProducts } from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Toda la colección Cleoh — babydolls, sets, pijamas y más.",
};

export default async function TiendaPage() {
  const products = await getActiveProducts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-xl animate-fade-up">
        <p className="text-[0.65rem] uppercase tracking-[0.22em] text-rose">
          Catálogo
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-wide text-ink">
          Toda la tienda
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          {products.length} {products.length === 1 ? "pieza" : "piezas"}
        </p>
      </header>

      {products.length === 0 ? (
        <p className="mt-16 text-sm text-ink-soft">
          El catálogo está vacío. Importa productos desde el admin.
        </p>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 stagger-grid md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
