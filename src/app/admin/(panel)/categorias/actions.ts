"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { slugify } from "@/lib/admin/products";
import { revalidateStorefront } from "@/lib/admin/revalidate-store";

export type CategoryActionState = {
  error?: string;
  ok?: boolean;
};

function parseCategoryFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const cover = String(formData.get("cover_image_url") ?? "")
    .replace(/[\r\n\t]+/g, "")
    .trim();
  const sortRaw = String(formData.get("sort_order") ?? "0").trim();
  const isNav = formData.get("is_nav") === "on";
  const isTile = formData.get("is_tile") === "on";

  if (!name) return { error: "El nombre es obligatorio." as const };

  const slug = slugify(slugInput || name);
  if (!slug) return { error: "Slug inválido." as const };

  const sort_order = Number(sortRaw);
  if (!Number.isFinite(sort_order)) {
    return { error: "Orden inválido." as const };
  }

  return {
    name,
    slug,
    description: description || null,
    cover_image_url: cover || null,
    sort_order: Math.floor(sort_order),
    is_nav: isNav,
    is_tile: isTile,
  };
}

export async function createCategory(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = parseCategoryFields(formData);
    if ("error" in parsed && parsed.error) return { error: parsed.error };

    const { error } = await supabase.from("categories").insert({
      name: parsed.name!,
      slug: parsed.slug!,
      description: parsed.description,
      cover_image_url: parsed.cover_image_url,
      sort_order: parsed.sort_order ?? 0,
      is_nav: parsed.is_nav ?? true,
      is_tile: parsed.is_tile ?? true,
    });

    if (error) {
      if (error.code === "23505") {
        return { error: "Ese slug ya existe." };
      }
      return { error: error.message };
    }

    revalidatePath("/admin/categorias");
    revalidateStorefront({ categorySlug: parsed.slug });
    redirect("/admin/categorias");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return {
      error: e instanceof Error ? e.message : "No se pudo crear la categoría.",
    };
  }
}

export async function updateCategory(
  id: string,
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = parseCategoryFields(formData);
    if ("error" in parsed && parsed.error) return { error: parsed.error };

    const { error } = await supabase
      .from("categories")
      .update({
        name: parsed.name!,
        slug: parsed.slug!,
        description: parsed.description,
        cover_image_url: parsed.cover_image_url,
        sort_order: parsed.sort_order ?? 0,
        is_nav: parsed.is_nav ?? true,
        is_tile: parsed.is_tile ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      if (error.code === "23505") {
        return { error: "Ese slug ya existe." };
      }
      return { error: error.message };
    }

    revalidatePath("/admin/categorias");
    revalidatePath(`/admin/categorias/${id}`);
    revalidateStorefront({ categorySlug: parsed.slug });
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "No se pudo guardar.",
    };
  }
}

export async function deleteCategory(id: string) {
  const { supabase } = await requireAdmin();
  const { data: before } = await supabase
    .from("categories")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/categorias");
  revalidateStorefront({ categorySlug: before?.slug });
  redirect("/admin/categorias");
}
