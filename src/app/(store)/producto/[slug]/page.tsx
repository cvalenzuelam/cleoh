import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isProductSoldOut } from "@/components/product/ProductBadge";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { ProductViewContent } from "@/components/product/ProductViewContent";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getAdjacentProducts,
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
} from "@/lib/catalog/queries";
import { badgeLabel, formatPrice, isSalePrice } from "@/lib/catalog/types";
import { productMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/json-ld";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  try {
    const slugs = await getProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return productMetadata({
    name: product.name,
    description: product.description,
    image: product.image,
    slug: product.slug,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [{ prev, next }, related] = await Promise.all([
    getAdjacentProducts(slug),
    getRelatedProducts(product.id, product.categorySlug, 8),
  ]);

  const sizes =
    product.sizes.length > 0
      ? product.sizes
      : [
          { size: "Extra Chica", stock: 0 },
          { size: "Chica", stock: 0 },
          { size: "Mediano", stock: 0 },
          { size: "Grande", stock: 0 },
        ];

  const soldOut = isProductSoldOut(product);

  const breadcrumbItems = [
    { name: "Inicio", path: "/" },
    ...(product.categorySlug && product.categoryName
      ? [
          {
            name: product.categoryName,
            path: `/categoria/${product.categorySlug}`,
          },
        ]
      : []),
    { name: product.name, path: `/producto/${product.slug}` },
  ];

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />

      <ProductViewContent
        productId={product.id}
        name={product.name}
        price={product.price}
      />

    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft animate-fade-up">
        <nav aria-label="Ruta" className="min-w-0">
          <ol className="flex flex-wrap items-center gap-x-1.5">
            <li>
              <Link href="/" className="link-anim hover:text-ink">
                Inicio
              </Link>
            </li>
            {product.categorySlug && product.categoryName ? (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href={`/categoria/${product.categorySlug}`}
                    className="link-anim hover:text-ink"
                  >
                    {product.categoryName}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden="true">/</li>
            <li className="truncate text-ink">{product.name}</li>
          </ol>
        </nav>

        {(prev || next) && (
          <nav
            aria-label="Productos vecinos"
            className="flex shrink-0 items-center gap-2.5 text-sm text-ink-soft"
          >
            {prev ? (
              <Link
                href={`/producto/${prev.slug}`}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                title={prev.name}
              >
                <span aria-hidden="true" className="text-xs tracking-tight">
                  &lt;
                </span>
                Previo
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 opacity-40">
                <span aria-hidden="true" className="text-xs tracking-tight">
                  &lt;
                </span>
                Previo
              </span>
            )}
            <span aria-hidden="true" className="text-ink/25">
              |
            </span>
            {next ? (
              <Link
                href={`/producto/${next.slug}`}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
                title={next.name}
              >
                Próximo
                <span aria-hidden="true" className="text-xs tracking-tight">
                  &gt;
                </span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 opacity-40">
                Próximo
                <span aria-hidden="true" className="text-xs tracking-tight">
                  &gt;
                </span>
              </span>
            )}
          </nav>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="animate-fade-up">
          <ProductGallery
            name={product.name}
            images={product.images}
          />
        </div>

        <div className="flex flex-col animate-fade-up-delay lg:pt-2">
          {product.badge && !soldOut ? (
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-rose">
              {badgeLabel(product.badge)}
            </p>
          ) : soldOut ? (
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ink-soft">
              Agotado
            </p>
          ) : null}
          <h1 className="mt-2 font-display text-4xl tracking-wide text-ink sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-lg text-ink-soft">
            {isSalePrice(product.price, product.compareAtPrice) && (
              <span className="mr-2 line-through opacity-60">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
            {formatPrice(product.price)}
          </p>
          {product.description && (
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-soft">
              {product.description}
            </p>
          )}

          <div className="mt-8 animate-fade-up-delay-2">
            <ProductPurchase
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: product.image,
              }}
              sizes={sizes}
            />
          </div>
        </div>
      </div>

      <RelatedProducts products={related} />
    </div>
    </>
  );
}
