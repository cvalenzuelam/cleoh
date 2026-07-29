"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  DEFAULT_SIZES,
  pesosToCents,
  sizeDbAliases,
  slugify,
} from "@/lib/admin/products";
import { revalidateStorefront } from "@/lib/admin/revalidate-store";
import { products as seedProducts } from "@/data/products";
import { createServiceClient } from "@/lib/supabase/server";

export type ProductActionState = {
  error?: string;
  ok?: boolean;
  message?: string;
};

function parseBadge(value: FormDataEntryValue | null) {
  const v = String(value ?? "");
  if (v === "nuevo" || v === "mas-vendido" || v === "oferta") return v;
  return null;
}

function parseImageUrls(formData: FormData): string[] {
  const raw = String(formData.get("image_urls") ?? "").trim();
  const clean = (u: string) => u.replace(/[\r\n\t]+/g, "").trim();
  if (!raw) {
    // compat: formulario antiguo
    const single = clean(String(formData.get("primary_image_url") ?? ""));
    return single ? [single] : [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((u) => clean(String(u ?? "")))
      .filter((u) => u.length > 0);
  } catch {
    return [];
  }
}

async function syncProductImages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  productId: string,
  urls: string[],
) {
  await supabase.from("product_images").delete().eq("product_id", productId);
  if (urls.length === 0) return;
  const rows = urls.map((url, i) => ({
    product_id: productId,
    url,
    sort_order: i,
  }));
  const { error } = await supabase.from("product_images").insert(rows);
  if (error) throw new Error(error.message);
}

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  try {
    const { supabase } = await requireAdmin();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const categoryId = String(formData.get("category_id") ?? "").trim();
    const pricePesos = Number(formData.get("price"));
    const comparePesosRaw = String(formData.get("compare_at") ?? "").trim();
    const imageUrls = parseImageUrls(formData);
    const slugInput = String(formData.get("slug") ?? "").trim();
    const badge = parseBadge(formData.get("badge"));
    const isFeatured = formData.get("is_featured") === "on";
    const isActive = formData.get("is_active") === "on";
    const defaultStock = Math.max(0, Number(formData.get("default_stock") ?? 0));

    if (!name) return { error: "El nombre es obligatorio." };
    if (!Number.isFinite(pricePesos) || pricePesos < 0) {
      return { error: "Precio inválido." };
    }

    let slug = slugify(slugInput || name);
    if (!slug) return { error: "Slug inválido." };

    // Evitar colisión de slug
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const priceCents = pesosToCents(pricePesos);
    const compareAt =
      comparePesosRaw === ""
        ? null
        : (() => {
            const cents = pesosToCents(Number(comparePesosRaw));
            return cents > priceCents ? cents : null;
          })();

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name,
        slug,
        description: description || null,
        category_id: categoryId || null,
        price_cents: priceCents,
        compare_at_cents: compareAt,
        badge,
        is_featured: isFeatured,
        is_active: isActive,
        primary_image_url: imageUrls[0] ?? null,
      })
      .select("id")
      .single();

    if (error || !product) {
      return { error: error?.message ?? "No se pudo crear el producto." };
    }

    try {
      await syncProductImages(supabase, product.id, imageUrls);
    } catch (e) {
      return {
        error:
          e instanceof Error
            ? `Producto creado, pero falló la galería: ${e.message}`
            : "Producto creado, pero falló la galería.",
      };
    }

    const variants = DEFAULT_SIZES.map((size) => ({
      product_id: product.id,
      size,
      color: "",
      stock: defaultStock,
      sku: `${slug}-${size.toLowerCase().replace(/\s+/g, "-")}`,
      is_active: true,
    }));

    const { error: vError } = await supabase
      .from("product_variants")
      .insert(variants);

    if (vError) {
      return {
        error: `Producto creado, pero fallaron las tallas: ${vError.message}`,
      };
    }

    revalidatePath("/admin/productos");
    revalidateStorefront({ productSlug: slug });
    redirect(`/admin/productos/${product.id}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return {
      error: e instanceof Error ? e.message : "Error al crear producto",
    };
  }
}

export async function updateProduct(
  productId: string,
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  try {
    const { supabase } = await requireAdmin();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const categoryId = String(formData.get("category_id") ?? "").trim();
    const pricePesos = Number(formData.get("price"));
    const comparePesosRaw = String(formData.get("compare_at") ?? "").trim();
    const imageUrls = parseImageUrls(formData);
    const slugInput = String(formData.get("slug") ?? "").trim();
    const badge = parseBadge(formData.get("badge"));
    const isFeatured = formData.get("is_featured") === "on";
    const isActive = formData.get("is_active") === "on";

    if (!name) return { error: "El nombre es obligatorio." };
    if (!Number.isFinite(pricePesos) || pricePesos < 0) {
      return { error: "Precio inválido." };
    }

    const slug = slugify(slugInput || name);
    if (!slug) return { error: "Slug inválido." };

    const { data: before } = await supabase
      .from("products")
      .select("slug, category_id")
      .eq("id", productId)
      .maybeSingle();

    const previousSlug = before?.slug as string | undefined;
    let previousCategorySlug: string | undefined;
    if (before?.category_id) {
      const { data: prevCat } = await supabase
        .from("categories")
        .select("slug")
        .eq("id", before.category_id)
        .maybeSingle();
      previousCategorySlug = prevCat?.slug;
    }

    const priceCents = pesosToCents(pricePesos);
    const compareAt =
      comparePesosRaw === ""
        ? null
        : (() => {
            const cents = pesosToCents(Number(comparePesosRaw));
            return cents > priceCents ? cents : null;
          })();

    const { error } = await supabase
      .from("products")
      .update({
        name,
        slug,
        description: description || null,
        category_id: categoryId || null,
        price_cents: priceCents,
        compare_at_cents: compareAt,
        badge,
        is_featured: isFeatured,
        is_active: isActive,
        primary_image_url: imageUrls[0] ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) return { error: error.message };

    try {
      await syncProductImages(supabase, productId, imageUrls);
    } catch (e) {
      return {
        error:
          e instanceof Error
            ? `Datos guardados, pero falló la galería: ${e.message}`
            : "Datos guardados, pero falló la galería.",
      };
    }

    // Stock por talla (acepta alias Extra Chico/Chico → Extra Chica/Chica)
    for (const size of DEFAULT_SIZES) {
      const key = `stock_${size}`;
      const raw = formData.get(key);
      if (raw === null) continue;
      const stock = Math.max(0, Number(raw));
      if (!Number.isFinite(stock)) continue;

      const aliases = sizeDbAliases(size);
      const { data: rows, error: findErr } = await supabase
        .from("product_variants")
        .select("id, size")
        .eq("product_id", productId)
        .in("size", aliases);

      if (findErr) return { error: findErr.message };

      if (!rows?.length) {
        const { error: insErr } = await supabase.from("product_variants").insert({
          product_id: productId,
          size,
          color: "",
          stock,
          is_active: true,
        });
        if (insErr) return { error: insErr.message };
        continue;
      }

      // Una fila canónica con el stock; el resto se elimina si había duplicados
      const [keep, ...dupes] = rows;
      const { error: vErr } = await supabase
        .from("product_variants")
        .update({
          size,
          stock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", keep.id);

      if (vErr) return { error: vErr.message };

      if (dupes.length > 0) {
        const { error: delErr } = await supabase
          .from("product_variants")
          .delete()
          .in(
            "id",
            dupes.map((d) => d.id),
          );
        if (delErr) return { error: delErr.message };
      }
    }

    let categorySlug: string | undefined;
    if (categoryId) {
      const { data: cat } = await supabase
        .from("categories")
        .select("slug")
        .eq("id", categoryId)
        .maybeSingle();
      categorySlug = cat?.slug;
    }

    revalidatePath("/admin/productos");
    revalidatePath(`/admin/productos/${productId}`);
    revalidateStorefront({
      productSlug: slug,
      previousProductSlug: previousSlug,
      categorySlug: categorySlug ?? previousCategorySlug,
    });
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Error al actualizar",
    };
  }
}

export async function deleteProduct(productId: string) {
  const { supabase } = await requireAdmin();
  const { data: before } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/admin/productos");
  revalidateStorefront({ productSlug: before?.slug });
  redirect("/admin/productos");
}

/** Importa el seed estático (Wix) una vez. Si ya hay productos, solo actualiza descripciones. */
export async function seedProductsFromStatic(): Promise<ProductActionState> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();

    const { data: categories, error: cErr } = await supabase
      .from("categories")
      .select("id, slug");
    if (cErr) return { error: cErr.message };

    const bySlug = new Map((categories ?? []).map((c) => [c.slug, c.id]));

    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    if ((count ?? 0) > 0) {
      let updated = 0;
      for (const p of seedProducts) {
        const { data, error } = await supabase
          .from("products")
          .update({ description: p.description })
          .eq("slug", p.slug)
          .select("id");
        if (error) return { error: error.message };
        if ((data?.length ?? 0) > 0) updated += 1;
      }
      revalidatePath("/admin/productos");
      revalidateStorefront();
      return {
        ok: true,
        message: `Actualizadas ${updated} descripciones del catálogo.`,
      };
    }

    for (const p of seedProducts) {
      const { data: product, error } = await supabase
        .from("products")
        .insert({
          name: p.name,
          slug: p.slug,
          description: p.description,
          category_id: bySlug.get(p.category) ?? null,
          price_cents: pesosToCents(p.price),
          compare_at_cents: p.compareAtPrice
            ? pesosToCents(p.compareAtPrice)
            : null,
          badge: p.badge ?? null,
          is_featured: Boolean(p.featured),
          is_active: true,
          primary_image_url: p.image,
        })
        .select("id")
        .single();

      if (error || !product) {
        return { error: error?.message ?? `Falló ${p.slug}` };
      }

      if (p.image) {
        await supabase.from("product_images").insert({
          product_id: product.id,
          url: p.image,
          sort_order: 0,
        });
      }

      const variants = (p.sizes.length ? p.sizes : [...DEFAULT_SIZES]).map(
        (size) => ({
          product_id: product.id,
          size,
          color: "",
          stock: 5,
          sku: `${p.slug}-${size.toLowerCase().replace(/\s+/g, "-")}`,
          is_active: true,
        }),
      );

      const { error: vError } = await supabase
        .from("product_variants")
        .insert(variants);
      if (vError) return { error: vError.message };
    }

    revalidatePath("/admin/productos");
    revalidateStorefront();
    return { ok: true, message: "Importados los productos del seed Wix." };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Error al importar seed",
    };
  }
}
