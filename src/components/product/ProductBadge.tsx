import {
  badgeLabel,
  type CatalogBadge,
  type CatalogProduct,
} from "@/lib/catalog/types";

type Props = {
  badge: CatalogBadge | null;
  /** Si true, muestra Agotado (tiene prioridad sobre el badge) */
  soldOut?: boolean;
  className?: string;
};

/** Etiqueta legible sobre foto (fondo porcelain, no texto suelto). */
export function ProductBadge({ badge, soldOut, className = "" }: Props) {
  const label = soldOut ? "Agotado" : badge ? badgeLabel(badge) : null;
  if (!label) return null;

  return (
    <span
      className={`absolute left-2.5 top-2.5 z-10 bg-porcelain/95 px-2 py-1 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-ink shadow-sm backdrop-blur-[2px] ${
        soldOut ? "text-ink-soft" : ""
      } ${className}`}
    >
      {label}
    </span>
  );
}

export function isProductSoldOut(product: CatalogProduct) {
  if (!product.sizes.length) return false;
  return product.sizes.every((s) => s.stock <= 0);
}
