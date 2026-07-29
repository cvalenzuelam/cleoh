import { revalidatePath } from "next/cache";

/**
 * Invalida las rutas de tienda que dependen del catálogo.
 * La home (destacados/tiles) y el layout (nav) deben invalidarse siempre.
 */
export function revalidateStorefront(opts?: {
  productSlug?: string | null;
  previousProductSlug?: string | null;
  categorySlug?: string | null;
}) {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/tienda");
  revalidatePath("/producto", "layout");
  revalidatePath("/categoria", "layout");

  if (opts?.productSlug) {
    revalidatePath(`/producto/${opts.productSlug}`);
  }
  if (
    opts?.previousProductSlug &&
    opts.previousProductSlug !== opts.productSlug
  ) {
    revalidatePath(`/producto/${opts.previousProductSlug}`);
  }
  if (opts?.categorySlug) {
    revalidatePath(`/categoria/${opts.categorySlug}`);
  }
}
