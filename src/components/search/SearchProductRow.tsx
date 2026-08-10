import Image from "next/image";
import { productImage } from "@/lib/catalog/types";
import type { SearchHit } from "@/lib/search/types";

type Props = {
  hit: SearchHit;
  active: boolean;
  index: number;
  listboxId: string;
  onSelect: () => void;
  onHover: () => void;
};

export function SearchProductRow({
  hit,
  active,
  index,
  listboxId,
  onSelect,
  onHover,
}: Props) {
  return (
    <li
      id={`${listboxId}-option-${index}`}
      role="option"
      aria-selected={active}
      data-search-index={index}
    >
      <button
        type="button"
        className={`search-result-row pressable flex w-full items-center gap-3 py-3 text-left transition-colors ${
          active ? "bg-petal" : "hover:bg-petal/60"
        }`}
        onClick={onSelect}
        onMouseEnter={onHover}
      >
        <span className="relative h-14 w-11 shrink-0 overflow-hidden bg-mist">
          <Image
            src={productImage(hit.image)}
            alt=""
            fill
            sizes="44px"
            className="object-cover"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base tracking-wide text-ink">
            {hit.name}
          </span>
          <span className="mt-0.5 block text-[0.62rem] uppercase tracking-[0.18em] text-ink-soft">
            {hit.categoryName ?? "Colección"}
          </span>
        </span>
      </button>
    </li>
  );
}
