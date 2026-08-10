import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { categories as staticCategories } from "@/data/categories";
import { cleanEnv } from "@/lib/env/clean";
import type { SearchHit } from "@/lib/search/types";
import {
  isSalePrice,
  type CatalogBadge,
  type CatalogCategory,
  type CatalogProduct,
} from "./types";

function publicClient() {
  // Catálogo siempre fresco: cambios del admin se ven al recargar la tienda
  noStore();
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !key) {
    throw new Error("Supabase no configurado (URL / ANON_KEY)");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  badge: string | null;
  primary_image_url: string | null;
  is_featured: boolean;
  categories:
    | { slug: string; name: string }
    | { slug: string; name: string }[]
    | null;
  product_variants: { size: string; stock: number; is_active: boolean }[] | null;
  product_images: { url: string; sort_order: number }[] | null;
};

function mapBadge(badge: string | null): CatalogBadge | null {
  if (badge === "nuevo" || badge === "mas-vendido" || badge === "oferta") {
    return badge;
  }
  return null;
}

function mapProduct(row: ProductRow): CatalogProduct {
  const cat = Array.isArray(row.categories)
    ? row.categories[0]
    : row.categories;

  const variants = (row.product_variants ?? [])
    .filter((v) => v.is_active !== false)
    .map((v) => ({ size: v.size, stock: v.stock }));

  const gallery = [...(row.product_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.url?.replace(/[\r\n\t]+/g, "").trim())
    .filter((url): url is string => Boolean(url));

  const primary = row.primary_image_url?.replace(/[\r\n\t]+/g, "").trim() || null;

  const images =
    gallery.length > 0 ? gallery : primary ? [primary] : [];

  const price = row.price_cents / 100;
  const compareRaw = row.compare_at_cents
    ? row.compare_at_cents / 100
    : null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price,
    compareAtPrice: isSalePrice(price, compareRaw) ? compareRaw : null,
    badge: mapBadge(row.badge),
    image: images[0] ?? primary,
    images,
    isFeatured: row.is_featured,
    categorySlug: cat?.slug ?? null,
    categoryName: cat?.name ?? null,
    sizes: variants,
  };
}

const productSelect = `
  id,
  slug,
  name,
  description,
  price_cents,
  compare_at_cents,
  badge,
  primary_image_url,
  is_featured,
  categories ( slug, name ),
  product_variants ( size, stock, is_active ),
  product_images ( url, sort_order )
`;

export async function getActiveProducts(): Promise<CatalogProduct[]> {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getActiveProducts", error.message);
    return [];
  }

  return ((data ?? []) as unknown as ProductRow[]).map(mapProduct);
}

export async function getFeaturedProducts(
  limit = 8,
): Promise<CatalogProduct[]> {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedProducts", error.message);
    return [];
  }

  const featured = ((data ?? []) as unknown as ProductRow[]).map(mapProduct);
  if (featured.length > 0) return featured;

  // Fallback: últimos activos si no hay destacados
  const all = await getActiveProducts();
  return all.slice(0, limit);
}

export async function getProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("getProductBySlug", error.message);
    return null;
  }
  if (!data) return null;
  return mapProduct(data as unknown as ProductRow);
}

export async function getProductsByCategorySlug(
  categorySlug: string,
): Promise<CatalogProduct[]> {
  const supabase = publicClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!category) return [];

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .eq("category_id", category.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProductsByCategorySlug", error.message);
    return [];
  }

  return ((data ?? []) as unknown as ProductRow[]).map(mapProduct);
}

export async function getCategories(): Promise<CatalogCategory[]> {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("categories")
    .select(
      "id, slug, name, description, cover_image_url, is_nav, is_tile, sort_order",
    )
    .order("sort_order");

  if (error) {
    console.error("getCategories", error.message);
    return [];
  }

  return (data ?? []).map((c) => {
    const fallback = staticCategories.find((s) => s.slug === c.slug);
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      coverImage: c.cover_image_url || fallback?.coverImage || null,
      isNav: c.is_nav,
      isTile: c.is_tile,
    };
  });
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CatalogCategory | null> {
  const cats = await getCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}

export async function getTileCategories(): Promise<CatalogCategory[]> {
  const cats = await getCategories();
  return cats.filter((c) => c.isTile);
}

export async function getNavCategories(): Promise<CatalogCategory[]> {
  const cats = await getCategories();
  return cats.filter((c) => c.isNav);
}

export async function getProductSlugs(): Promise<string[]> {
  const supabase = publicClient();
  const { data } = await supabase
    .from("products")
    .select("slug")
    .eq("is_active", true);
  return (data ?? []).map((p) => p.slug);
}

export type AdjacentProduct = { slug: string; name: string };

/** Previo / próximo en el catálogo activo (orden created_at desc). */
export async function getAdjacentProducts(
  slug: string,
): Promise<{ prev: AdjacentProduct | null; next: AdjacentProduct | null }> {
  const products = await getActiveProducts();
  if (products.length < 2) {
    return { prev: null, next: null };
  }

  const index = products.findIndex((p) => p.slug === slug);
  if (index < 0) {
    return { prev: null, next: null };
  }

  const prevProduct =
    products[(index - 1 + products.length) % products.length]!;
  const nextProduct =
    products[(index + 1) % products.length]!;

  return {
    prev: { slug: prevProduct.slug, name: prevProduct.name },
    next: { slug: nextProduct.slug, name: nextProduct.name },
  };
}

export async function getCategorySlugs(): Promise<string[]> {
  const cats = await getCategories();
  return cats.map((c) => c.slug);
}

/** Productos de la misma categoría (u otros activos si no hay). */
export async function getRelatedProducts(
  productId: string,
  categorySlug: string | null,
  limit = 8,
): Promise<CatalogProduct[]> {
  const supabase = publicClient();

  if (categorySlug) {
    const byCat = await getProductsByCategorySlug(categorySlug);
    const related = byCat.filter((p) => p.id !== productId).slice(0, limit);
    if (related.length > 0) return related;
  }

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .neq("id", productId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRelatedProducts", error.message);
    return [];
  }

  return ((data ?? []) as unknown as ProductRow[]).map(mapProduct);
}

function hasAvailableStock(product: CatalogProduct) {
  return product.sizes.some((s) => s.stock > 0);
}

/** Productos para upsell en drawer: ofertas primero, luego misma categoría, luego catálogo. */
export async function getCartUpsellProducts(
  cartProductIds: string[],
  limit = 12,
): Promise<CatalogProduct[]> {
  const exclude = new Set(cartProductIds);
  const seen = new Set<string>();
  const result: CatalogProduct[] = [];

  const tryAdd = (products: CatalogProduct[]) => {
    for (const p of products) {
      if (exclude.has(p.id) || seen.has(p.id) || !hasAvailableStock(p)) continue;
      seen.add(p.id);
      result.push(p);
      if (result.length >= limit) return true;
    }
    return false;
  };

  const all = await getActiveProducts();

  const onSale = all
    .filter(
      (p) =>
        !exclude.has(p.id) &&
        (p.badge === "oferta" || isSalePrice(p.price, p.compareAtPrice)),
    )
    .filter(hasAvailableStock)
    .sort((a, b) => a.price - b.price);

  if (tryAdd(onSale)) return result;

  const supabase = publicClient();
  const uniqueIds = [...new Set(cartProductIds)].slice(0, 8);
  if (uniqueIds.length) {
    const { data } = await supabase
      .from("products")
      .select("categories ( slug )")
      .in("id", uniqueIds);

    const categorySlugs = new Set<string>();
    for (const row of data ?? []) {
      const cat = Array.isArray(row.categories)
        ? row.categories[0]
        : row.categories;
      if (cat?.slug) categorySlugs.add(cat.slug);
    }

    for (const slug of categorySlugs) {
      const byCat = await getProductsByCategorySlug(slug);
      if (tryAdd(byCat)) return result;
    }
  }

  tryAdd(all);
  return result;
}

const searchSelect = `
  id,
  slug,
  name,
  price_cents,
  compare_at_cents,
  primary_image_url,
  categories ( slug, name )
`;

type SearchRow = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  compare_at_cents: number | null;
  primary_image_url: string | null;
  categories:
    | { slug: string; name: string }
    | { slug: string; name: string }[]
    | null;
};

function mapSearchHit(row: SearchRow): SearchHit {
  const cat = Array.isArray(row.categories)
    ? row.categories[0]
    : row.categories;
  const price = row.price_cents / 100;
  const compareRaw = row.compare_at_cents
    ? row.compare_at_cents / 100
    : null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price,
    compareAtPrice: isSalePrice(price, compareRaw) ? compareRaw : null,
    image: row.primary_image_url?.replace(/[\r\n\t]+/g, "").trim() || null,
    categorySlug: cat?.slug ?? null,
    categoryName: cat?.name ?? null,
  };
}

function sanitizeSearchQuery(query: string) {
  return query.trim().replace(/[%_\\]/g, "").slice(0, 80);
}

/** Búsqueda por nombre o descripción (ilike). */
export async function searchProducts(
  query: string,
  limit = 24,
): Promise<{ hits: SearchHit[]; total: number }> {
  const q = sanitizeSearchQuery(query);
  if (q.length < 2) return { hits: [], total: 0 };

  const supabase = publicClient();
  const pattern = `%${q}%`;

  const { data, error, count } = await supabase
    .from("products")
    .select(searchSelect, { count: "exact" })
    .eq("is_active", true)
    .or(`name.ilike.${pattern},description.ilike.${pattern}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("searchProducts", error.message);
    return { hits: [], total: 0 };
  }

  return {
    hits: ((data ?? []) as unknown as SearchRow[]).map(mapSearchHit),
    total: count ?? 0,
  };
}

/** Búsqueda con datos completos para cards de catálogo. */
export async function searchCatalogProducts(
  query: string,
  limit = 48,
): Promise<{ products: CatalogProduct[]; total: number }> {
  const q = sanitizeSearchQuery(query);
  if (q.length < 2) return { products: [], total: 0 };

  const supabase = publicClient();
  const pattern = `%${q}%`;

  const { data, error, count } = await supabase
    .from("products")
    .select(productSelect, { count: "exact" })
    .eq("is_active", true)
    .or(`name.ilike.${pattern},description.ilike.${pattern}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("searchCatalogProducts", error.message);
    return { products: [], total: 0 };
  }

  return {
    products: ((data ?? []) as unknown as ProductRow[]).map(mapProduct),
    total: count ?? 0,
  };
}
