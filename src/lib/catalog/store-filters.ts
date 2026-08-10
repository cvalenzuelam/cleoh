import type { CatalogProduct } from "./types";

export const STORE_SORT_OPTIONS = [
  { value: "novedades", label: "Más recientes" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
] as const;

export type StoreSort = (typeof STORE_SORT_OPTIONS)[number]["value"];

export function parseStoreSort(value: string | undefined): StoreSort {
  if (value === "precio-asc" || value === "precio-desc") return value;
  return "novedades";
}

export function filterAndSortStoreProducts(
  products: CatalogProduct[],
  input: { categorySlug?: string; sort: StoreSort },
): CatalogProduct[] {
  let list = products;

  if (input.categorySlug) {
    list = list.filter((p) => p.categorySlug === input.categorySlug);
  }

  const sorted = [...list];

  switch (input.sort) {
    case "precio-asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "precio-desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "novedades":
    default:
      sorted.sort((a, b) => {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bTime - aTime;
      });
      break;
  }

  return sorted;
}
