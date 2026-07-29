import Image from "next/image";
import Link from "next/link";
import { getTileCategories } from "@/lib/catalog/queries";
import { productImage } from "@/lib/catalog/types";

export async function CategoryTiles() {
  const tiles = await getTileCategories();
  const feature =
    tiles.find((c) => c.slug === "novias") ?? tiles[0] ?? null;
  const rest = tiles.filter((c) => c.slug !== feature?.slug);

  if (!feature) return null;

  return (
    <section className="bg-porcelain">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 animate-fade-up">
          <h2 className="font-display text-3xl tracking-wide text-ink sm:text-4xl">
            Colecciones
          </h2>
          <Link
            href="/tienda"
            className="link-anim text-[0.65rem] uppercase tracking-[0.18em] text-ink-soft"
          >
            Ver todo
          </Link>
        </div>

        <div className="mt-8 grid gap-2 stagger-grid sm:gap-3 lg:h-[720px] lg:grid-cols-2 lg:grid-rows-3 lg:gap-3">
          <Link
            href={`/categoria/${feature.slug}`}
            className="group relative block min-h-[360px] overflow-hidden bg-mist sm:min-h-[420px] lg:row-span-3 lg:min-h-0 lg:h-auto"
          >
            <Image
              src={productImage(feature.coverImage)}
              alt={feature.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="font-display text-3xl tracking-[0.08em] text-porcelain sm:text-4xl">
                {feature.name}
              </p>
              {feature.description && (
                <p className="mt-2 max-w-xs text-sm text-porcelain/80">
                  {feature.description}
                </p>
              )}
              <span className="mt-4 inline-block text-[0.65rem] uppercase tracking-[0.2em] text-porcelain/90 transition-transform duration-300 group-hover:translate-x-1">
                Explorar
              </span>
            </div>
          </Link>

          {rest.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="group relative block min-h-[200px] overflow-hidden bg-mist sm:min-h-[220px] lg:min-h-0 lg:h-auto"
            >
              <Image
                src={productImage(c.coverImage)}
                alt={c.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <p className="font-display text-2xl tracking-[0.06em] text-porcelain">
                  {c.name}
                </p>
                <span className="mt-1 inline-block text-[0.6rem] uppercase tracking-[0.18em] text-porcelain/85 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Explorar
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
