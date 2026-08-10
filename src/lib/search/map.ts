import type { CatalogProduct } from "@/lib/catalog/types";
import type { SearchHit } from "./types";

export function catalogProductToSearchHit(product: CatalogProduct): SearchHit {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    image: product.image,
    categorySlug: product.categorySlug,
    categoryName: product.categoryName,
  };
}
