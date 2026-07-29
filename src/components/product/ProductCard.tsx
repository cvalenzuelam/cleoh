import Image from "next/image";
import Link from "next/link";
import {
  isProductSoldOut,
  ProductBadge,
} from "@/components/product/ProductBadge";
import {
  formatPrice,
  isSalePrice,
  productImage,
  type CatalogProduct,
} from "@/lib/catalog/types";

type Props = {
  product: CatalogProduct;
  priority?: boolean;
};

export function ProductCard({ product, priority }: Props) {
  const src = productImage(product.image);
  const soldOut = isProductSoldOut(product);

  return (
    <article className="group">
      <Link
        href={`/producto/${product.slug}`}
        className="product-card-link block"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-mist">
          <Image
            src={src}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            priority={priority}
          />
          <ProductBadge badge={product.badge} soldOut={soldOut} />
        </div>
        <div className="product-card-meta mt-3 space-y-1 transition-colors duration-300">
          <h3 className="font-display text-lg leading-tight tracking-wide text-ink">
            {product.name}
          </h3>
          <p className="text-sm text-ink-soft">
            {isSalePrice(product.price, product.compareAtPrice) ? (
              <>
                <span className="mr-2 line-through opacity-60">
                  {formatPrice(product.compareAtPrice!)}
                </span>
                <span className="text-rose">{formatPrice(product.price)}</span>
              </>
            ) : (
              formatPrice(product.price)
            )}
          </p>
        </div>
      </Link>
    </article>
  );
}
