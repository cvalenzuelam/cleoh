import Link from "next/link";
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
      </div>

      <div className="border-t border-porcelain/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-porcelain/45 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Cleoh Lencería</p>
          <Link
            href="/politicas"
            className="transition-colors hover:text-porcelain/70"
          >
            Aviso de privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
}
