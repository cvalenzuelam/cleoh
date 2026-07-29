"use client";

import { useRef } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { CatalogProduct } from "@/lib/catalog/types";

type Props = {
  products: CatalogProduct[];
};

export function RelatedProducts({ products }: Props) {
  const scroller = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  function scrollBy(dir: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.75, 360);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <section className="mt-20 border-t border-line pt-14 animate-fade-up sm:mt-24 sm:pt-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.22em] text-rose">
            También te puede gustar
          </p>
          <h2 className="mt-2 font-display text-3xl tracking-wide text-ink">
            Relacionados
          </h2>
        </div>
        {products.length > 2 ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="flex h-9 w-9 items-center justify-center border border-line text-ink transition-all duration-300 hover:border-ink hover:bg-petal active:scale-95"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="flex h-9 w-9 items-center justify-center border border-line text-ink transition-all duration-300 hover:border-ink hover:bg-petal active:scale-95"
              aria-label="Siguiente"
            >
              ›
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={scroller}
        className="stagger-grid mt-8 flex gap-4 overflow-x-auto pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="w-[42%] shrink-0 sm:w-[30%] lg:w-[22%]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
