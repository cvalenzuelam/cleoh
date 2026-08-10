import { site } from "@/data/site";
import type { CatalogProduct } from "@/lib/catalog/types";
import { productImage } from "@/lib/catalog/types";

function isSoldOut(product: CatalogProduct) {
  if (!product.sizes.length) return false;
  return product.sizes.every((s) => s.stock <= 0);
}

const ORG_LOGO =
  "https://static.wixstatic.com/media/7f4d67_64e50f84607944118736f90535394c8b~mv2.jpeg/v1/fill/w_512,h_512,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/7f4d67_64e50f84607944118736f90535394c8b~mv2.jpeg";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    description: site.description,
    logo: ORG_LOGO,
    sameAs: [site.social.instagram, site.social.facebook],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: site.description,
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
  };
}

type BreadcrumbItem = { name: string; path: string };

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${site.url}${item.path}`,
    })),
  };
}

export function productJsonLd(product: CatalogProduct) {
  const soldOut = isSoldOut(product);
  const image = productImage(product.image);
  const url = `${site.url}/producto/${product.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? site.description,
    image: product.images.length > 0 ? product.images : [image],
    url,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: site.name,
    },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "MXN",
      price: product.price,
      availability: soldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: site.name,
      },
    },
  };
}
