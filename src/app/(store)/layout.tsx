import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { PageTransition } from "@/components/layout/PageTransition";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartAbandonSync } from "@/components/cart/CartAbandonSync";
import { NewsletterModal } from "@/components/newsletter/NewsletterModal";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { SearchPanel } from "@/components/search/SearchPanel";
import { SearchProvider } from "@/components/search/SearchProvider";
import { MetaPixel } from "@/components/MetaPixel";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFeaturedProducts, getNavCategories } from "@/lib/catalog/queries";
import { catalogProductToSearchHit } from "@/lib/search/map";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = await getNavCategories();
  const navLinks = nav.map((c) => ({ slug: c.slug, name: c.name }));
  const discoverCategories = nav.map((c) => ({
    slug: c.slug,
    name: c.name,
    coverImage: c.coverImage,
  }));
  const featured = await getFeaturedProducts(6);
  const suggestedProducts = featured.map(catalogProductToSearchHit);

  return (
    <CartProvider>
      <SearchProvider>
        <MetaPixel />
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <div className="storefront flex min-h-dvh flex-col">
          <AnnouncementBar />
          <SiteHeader navLinks={navLinks} />
          <main className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <SiteFooter navLinks={navLinks} />
          <CartAbandonSync />
          <CartDrawer />
          <SearchPanel
            discoverCategories={discoverCategories}
            suggestedProducts={suggestedProducts}
          />
          <NewsletterModal />
          <WhatsAppButton />
        </div>
      </SearchProvider>
    </CartProvider>
  );
}
