import Image from "next/image";
import Link from "next/link";
import { productImage } from "@/lib/catalog/types";

export type DiscoverCategory = {
  slug: string;
  name: string;
  coverImage: string | null;
};

export function SearchDiscoverStrip({
  categories,
  onNavigate,
}: {
  categories: DiscoverCategory[];
  onNavigate?: () => void;
}) {
  return (
    <section className="mt-4 border-b border-line pb-4">
      <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-ink-soft">
        Descubre por categoría
      </p>
      <ul className="search-discover-track mt-3 flex gap-3 sm:gap-4">
        {categories.map((cat) => (
          <li key={cat.slug} className="shrink-0 snap-start">
            <Link
              href={`/categoria/${cat.slug}`}
              onClick={onNavigate}
              className="search-discover-item pressable group flex w-[4.25rem] flex-col items-center gap-2 sm:w-20"
            >
              <span className="relative h-[4.25rem] w-[4.25rem] overflow-hidden rounded-full border border-line bg-mist transition-transform duration-300 group-hover:scale-[1.04] sm:h-20 sm:w-20">
                <Image
                  src={productImage(cat.coverImage)}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </span>
              <span className="max-w-full truncate text-center text-[0.58rem] uppercase tracking-[0.14em] text-ink-soft transition-colors group-hover:text-ink sm:text-[0.62rem]">
                {cat.name}
              </span>
            </Link>
          </li>
        ))}
        <li className="shrink-0 snap-start">
          <Link
            href="/tienda"
            onClick={onNavigate}
            className="search-discover-item pressable group flex w-[4.25rem] flex-col items-center gap-2 sm:w-20"
          >
            <span className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border border-line bg-petal transition-transform duration-300 group-hover:scale-[1.04] sm:h-20 sm:w-20">
              <span className="font-display text-lg tracking-[0.2em] text-rose">
                +
              </span>
            </span>
            <span className="text-center text-[0.58rem] uppercase tracking-[0.14em] text-ink-soft transition-colors group-hover:text-ink sm:text-[0.62rem]">
              Todo
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
