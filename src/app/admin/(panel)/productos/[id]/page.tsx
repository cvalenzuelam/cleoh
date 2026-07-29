import { notFound } from "next/navigation";
import { AdminProductThumbnail } from "@/components/admin/AdminProductThumbnail";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { ProductForm } from "@/components/admin/ProductForm";
import { centsToPesos, canonicalSize, productThumbnailUrl } from "@/lib/admin/products";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditProductoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        description,
        category_id,
        price_cents,
        compare_at_cents,
        primary_image_url,
        badge,
        is_featured,
        is_active,
        product_variants ( size, stock ),
        product_images ( url, sort_order )
      `,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name, slug").order("sort_order"),
  ]);

  if (!product) notFound();

  const stocks: Record<string, number> = {};
  for (const v of (product.product_variants ?? []) as {
    size: string;
    stock: number;
  }[]) {
    const key = canonicalSize(v.size);
    stocks[key] = v.stock;
  }

  const gallery = [
    ...((product.product_images ?? []) as {
      url: string;
      sort_order: number;
    }[]),
  ]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.url)
    .filter(Boolean);

  const imageUrls =
    gallery.length > 0
      ? gallery
      : product.primary_image_url
        ? [product.primary_image_url]
        : [];

  const thumbnail = productThumbnailUrl({
    primary_image_url: product.primary_image_url,
    product_images: (product.product_images ?? []) as {
      url: string;
      sort_order: number;
    }[],
  });

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <AdminProductThumbnail
            src={thumbnail}
            alt={product.name}
            className="h-16 w-16 shrink-0 rounded-lg object-cover bg-zinc-100 ring-1 ring-zinc-200/80 sm:h-20 sm:w-20"
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Editar datos, galería, etiqueta y stock por talla.
            </p>
          </div>
        </div>
        <DeleteProductButton productId={product.id} />
      </div>

      <ProductForm
        categories={categories ?? []}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          category_id: product.category_id ?? "",
          price: String(centsToPesos(product.price_cents)),
          compare_at: product.compare_at_cents
            ? String(centsToPesos(product.compare_at_cents))
            : "",
          image_urls: imageUrls,
          badge: product.badge ?? "",
          is_featured: product.is_featured,
          is_active: product.is_active,
          stocks,
        }}
      />
    </>
  );
}
