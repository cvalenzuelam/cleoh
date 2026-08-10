"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import type { CatalogBadge, CatalogProduct } from "@/lib/catalog/types";

type UpsellProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  badge: CatalogBadge | null;
  image: string | null;
};

type Props = {
  cartProductIds: string[];
  onNavigate: () => void;
};

function toCatalogProduct(p: UpsellProduct): CatalogProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    badge: p.badge,
    image: p.image,
    description: null,
    images: p.image ? [p.image] : [],
    isFeatured: false,
    categorySlug: null,
    categoryName: null,
    sizes: [{ size: "M", stock: 1 }],
  };
}

export function CartUpsell({ cartProductIds, onNavigate }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<UpsellProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cartProductIds.length) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetch("/api/cart/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: cartProductIds }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { products?: UpsellProduct[] } | null) => {
        if (cancelled) return;
        setProducts(data?.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cartProductIds.join("|")]);

  function scrollBy(dir: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.7, 200);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="animate-fade-up border-t border-line px-5 py-6">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-soft">
          Sugerencias
        </p>
        <div className="mt-4 flex gap-3">
          <div className="content-shimmer aspect-[3/4] w-[42%] shrink-0 sm:w-[38%]" />
          <div className="content-shimmer aspect-[3/4] w-[42%] shrink-0 sm:w-[38%]" />
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  const saleCount = products.filter(
    (p) => p.badge === "oferta" || (p.compareAtPrice != null && p.compareAtPrice > p.price),
  ).length;

  return (
    <div className="animate-fade-up border-t border-line px-5 py-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-rose">
            Completa tu pedido
          </p>
          <h3 className="mt-1 font-display text-lg tracking-wide text-ink">
            {saleCount > 0
              ? `Ofertas y relacionados · ${products.length}`
              : "También te puede gustar"}
          </h3>
        </div>
        {products.length > 2 ? (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="pressable flex h-8 w-8 items-center justify-center border border-line text-ink transition-colors hover:bg-petal"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="pressable flex h-8 w-8 items-center justify-center border border-line text-ink transition-colors hover:bg-petal"
              aria-label="Siguiente"
            >
              ›
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={scroller}
        className="stagger-grid mt-4 flex gap-3 overflow-x-auto pb-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[42%] shrink-0 sm:w-[38%]">
            <div onClick={onNavigate}>
              <ProductCard product={toCatalogProduct(p)} />
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/tienda"
        onClick={onNavigate}
        className="link-anim mt-4 inline-block text-[0.65rem] uppercase tracking-[0.16em] text-ink-soft underline decoration-blush underline-offset-4 transition-colors hover:text-ink"
      >
        Ver toda la tienda
      </Link>
    </div>
  );
}
