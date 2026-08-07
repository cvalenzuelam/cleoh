import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { PageTransition } from "@/components/layout/PageTransition";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartAbandonSync } from "@/components/cart/CartAbandonSync";
import { NewsletterModal } from "@/components/newsletter/NewsletterModal";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { getNavCategories } from "@/lib/catalog/queries";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = await getNavCategories();
  const navLinks = nav.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col">
        <AnnouncementBar />
        <SiteHeader navLinks={navLinks} />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <SiteFooter navLinks={navLinks} />
        <CartAbandonSync />
        <NewsletterModal />
        <WhatsAppButton />
      </div>
    </CartProvider>
  );
}
