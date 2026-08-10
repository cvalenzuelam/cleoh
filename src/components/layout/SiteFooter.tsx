import Link from "next/link";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { PaymentMethodBadges } from "@/components/layout/PaymentMethodBadges";
import { SocialIcons } from "@/components/layout/SocialIcons";
import type { NavLink } from "@/components/layout/SiteHeader";
import { site } from "@/data/site";

export function SiteFooter({ navLinks = [] }: { navLinks?: NavLink[] }) {
  return (
    <footer className="mt-auto bg-ink text-porcelain">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="lg:col-span-6">
            <Link
              href="/"
              className="inline-block font-display text-4xl tracking-[0.16em] text-porcelain transition-opacity hover:opacity-85 sm:text-5xl"
            >
              CLEOH
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-porcelain/70 sm:text-base">
              {site.tagline}.
              <br />
              {site.slogan}.
            </p>
            <SocialIcons tone="light" className="mt-8" />
          </div>

          {/* Nav */}
          <div className="grid grid-cols-2 gap-10 sm:gap-12 lg:col-span-6 lg:justify-items-end lg:pt-2">
            <div className="lg:w-40">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-blush">
                Tienda
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-porcelain/70">
                {navLinks.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/categoria/${c.slug}`}
                      className="inline-block transition-all duration-300 hover:translate-x-0.5 hover:text-porcelain"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/tienda"
                    className="inline-block transition-all duration-300 hover:translate-x-0.5 hover:text-porcelain"
                  >
                    Colección
                  </Link>
                </li>
              </ul>
            </div>

            <div className="lg:w-44">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-blush">
                Ayuda
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-porcelain/70">
                <li>
                  <Link
                    href="/faq"
                    className="inline-block transition-all duration-300 hover:translate-x-0.5 hover:text-porcelain"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/guia-tallas"
                    className="inline-block transition-all duration-300 hover:translate-x-0.5 hover:text-porcelain"
                  >
                    Guía de tallas
                  </Link>
                </li>
                <li>
                  <Link
                    href="/envios-devoluciones"
                    className="inline-block transition-all duration-300 hover:translate-x-0.5 hover:text-porcelain"
                  >
                    Envíos
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contacto"
                    className="inline-block transition-all duration-300 hover:translate-x-0.5 hover:text-porcelain"
                  >
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <section
          id="newsletter"
          className="mt-14 scroll-mt-28 border-t border-porcelain/10 pt-14 lg:mt-16 lg:pt-16"
        >
          <div className="max-w-xl">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-blush">
              Newsletter
            </p>
            <h2 className="mt-3 font-display text-2xl tracking-wide text-porcelain sm:text-3xl">
              {site.newsletter.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-porcelain/70">
              {site.newsletter.description}
            </p>
            <NewsletterSignup source="footer" variant="footer" />
          </div>
        </section>
      </div>

      <div className="border-t border-porcelain/10">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-between sm:gap-6">
              <p className="text-xs text-porcelain/45">
                © {new Date().getFullYear()} Cleoh Lencería
              </p>
              <PaymentMethodBadges tone="light" />
            </div>
            <nav
              aria-label="Legal"
              className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-porcelain/45"
            >
              <Link
                href="/politicas#privacidad"
                className="transition-colors hover:text-porcelain/70"
              >
                Privacidad
              </Link>
              <span aria-hidden className="text-porcelain/25">
                |
              </span>
              <Link
                href="/politicas#terminos"
                className="transition-colors hover:text-porcelain/70"
              >
                Términos
              </Link>
              <span aria-hidden className="text-porcelain/25">
                |
              </span>
              <Link
                href="/politicas#derechos-arco"
                className="transition-colors hover:text-porcelain/70"
              >
                Derechos ARCO
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
