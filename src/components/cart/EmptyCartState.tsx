"use client";

import Image from "next/image";
import Link from "next/link";
import { CartUpsell } from "@/components/cart/CartUpsell";
import { EmptyBagIllustration } from "@/components/cart/EmptyBagIllustration";
import { navCategories } from "@/data/categories";
import { site } from "@/data/site";
import { formatCartMoney } from "@/lib/cart/types";
import { productImage } from "@/lib/catalog/types";

type Props = {
  variant?: "drawer" | "page";
  pageTitle?: string;
  onNavigate?: () => void;
};

function CategoryChip({
  slug,
  label,
  onNavigate,
}: {
  slug: string;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={`/categoria/${slug}`}
      onClick={onNavigate}
      className="pressable border border-line bg-white/60 px-3.5 py-2 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-rose/40 hover:bg-petal"
    >
      {label}
    </Link>
  );
}

function CategoryMiniCard({
  slug,
  name,
  image,
  onNavigate,
}: {
  slug: string;
  name: string;
  image: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={`/categoria/${slug}`}
      onClick={onNavigate}
      className="group relative block aspect-[4/5] overflow-hidden bg-mist"
    >
      <Image
        src={productImage(image)}
        alt={name}
        fill
        sizes="(max-width: 640px) 45vw, 200px"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/5 to-transparent" />
      <p className="absolute inset-x-0 bottom-0 p-3 font-display text-lg tracking-wide text-porcelain">
        {name}
      </p>
    </Link>
  );
}

export function EmptyCartState({
  variant = "page",
  pageTitle,
  onNavigate,
}: Props) {
  const isDrawer = variant === "drawer";
  const freeShippingLabel = formatCartMoney(site.freeShippingThresholdMxn);

  if (isDrawer) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <div className="mx-5 mt-5 border border-line/70 bg-gradient-to-b from-petal/90 via-petal/40 to-porcelain px-6 py-8 text-center animate-fade-up">
          <div className="mx-auto flex h-44 max-w-[280px] items-center justify-center">
            <EmptyBagIllustration className="h-full w-auto" />
          </div>
          <h3 className="mt-4 font-display text-2xl tracking-wide text-ink">
            Tu bolsa está vacía
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Aún no hay piezas esperándote. Explora la colección y encuentra tu
            próximo favorito.
          </p>
          <p className="mt-3 text-[0.65rem] uppercase tracking-[0.16em] text-rose">
            Envío gratis desde {freeShippingLabel}
          </p>
          <Link
            href="/tienda"
            onClick={onNavigate}
            className="btn btn-primary mt-6 w-full justify-center"
          >
            Explorar la colección
          </Link>
        </div>

        <div className="px-5 py-6 animate-fade-up-delay">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-soft">
            Explora por categoría
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {navCategories.map((c) => (
              <CategoryChip
                key={c.slug}
                slug={c.slug}
                label={c.navLabel}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>

        <CartUpsell cartProductIds={[]} onNavigate={onNavigate ?? (() => {})} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      {pageTitle ? (
        <h1 className="animate-fade-up text-center font-display text-4xl tracking-wide text-ink">
          {pageTitle}
        </h1>
      ) : null}

      <div
        className={`border border-line/70 bg-gradient-to-b from-petal/80 via-petal/30 to-porcelain px-6 py-10 text-center animate-fade-up sm:px-10 sm:py-12 ${
          pageTitle ? "mt-8" : ""
        }`}
      >
        <div className="mx-auto flex h-48 max-w-sm items-center justify-center sm:h-56">
          <EmptyBagIllustration className="h-full w-auto" />
        </div>
        <h2 className="mt-6 font-display text-3xl tracking-wide text-ink sm:text-4xl">
          Tu bolsa está vacía
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
          Todavía no has elegido ninguna pieza. Date un momento para descubrir
          lencería romántica pensada para ti.
        </p>
        <p className="mt-4 text-[0.65rem] uppercase tracking-[0.18em] text-rose">
          Envío gratis en compras desde {freeShippingLabel}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/tienda" className="btn btn-primary min-w-[220px] justify-center">
            Explorar la colección
          </Link>
          <Link
            href="/guia-tallas"
            className="btn btn-secondary min-w-[220px] justify-center"
          >
            Guía de tallas
          </Link>
        </div>
      </div>

      <div className="mt-12 animate-fade-up-delay">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-rose">
              Inspírate
            </p>
            <h3 className="mt-1 font-display text-2xl tracking-wide text-ink">
              Explora por categoría
            </h3>
          </div>
          <Link
            href="/tienda"
            className="link-anim shrink-0 text-[0.65rem] uppercase tracking-[0.16em] text-ink-soft"
          >
            Ver todo
          </Link>
        </div>
        <div className="stagger-grid mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {navCategories.slice(0, 4).map((c) => (
            <CategoryMiniCard
              key={c.slug}
              slug={c.slug}
              name={c.name}
              image={c.coverImage}
            />
          ))}
        </div>
      </div>

      <div className="mt-12">
        <CartUpsell
          cartProductIds={[]}
          onNavigate={() => {}}
          className="border-t-0 px-0"
        />
      </div>
    </div>
  );
}
