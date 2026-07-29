export type CatalogBadge = "nuevo" | "mas-vendido" | "oferta";

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  badge: CatalogBadge | null;
  /** Imagen principal (cards, carrito) */
  image: string | null;
  /** Galería completa (principal primero) */
  images: string[];
  isFeatured: boolean;
  categorySlug: string | null;
  categoryName: string | null;
  sizes: { size: string; stock: number }[];
};

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  isNav: boolean;
  isTile: boolean;
};

export const PLACEHOLDER_IMAGE =
  "https://static.wixstatic.com/media/7f4d67_64e50f84607944118736f90535394c8b~mv2.jpeg/v1/fill/w_900,h_1200,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/7f4d67_64e50f84607944118736f90535394c8b~mv2.jpeg";

export function badgeLabel(badge: CatalogBadge) {
  switch (badge) {
    case "nuevo":
      return "Nuevo";
    case "mas-vendido":
      return "Más vendido";
    case "oferta":
      return "Oferta";
  }
}

export function formatPrice(amount: number) {
  return `${new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(amount)} MXN`;
}

/** Solo hay oferta si el tachado es estrictamente mayor al precio actual. */
export function isSalePrice(
  price: number,
  compareAtPrice: number | null | undefined,
) {
  return (
    compareAtPrice != null &&
    Number.isFinite(compareAtPrice) &&
    compareAtPrice > price
  );
}

export function productImage(url: string | null | undefined) {
  const clean = url?.replace(/[\r\n\t]+/g, "").trim();
  return clean && clean.length > 0 ? clean : PLACEHOLDER_IMAGE;
}
