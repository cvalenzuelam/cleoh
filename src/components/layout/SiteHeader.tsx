"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CartBagLink } from "@/components/cart/CartBagLink";
import { useCart } from "@/components/cart/CartProvider";

export type NavLink = { slug: string; name: string };

export function SiteHeader({ navLinks = [] }: { navLinks?: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const { count, ready } = useCart();
  const pathname = usePathname();

  function isCatActive(slug: string) {
    return pathname === `/categoria/${slug}`;
  }

  const tiendaActive =
    pathname === "/tienda" || pathname.startsWith("/tienda/");

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-porcelain/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
        <button
          type="button"
          className="inline-flex items-center justify-center p-2 text-ink transition-transform duration-200 active:scale-95 md:hidden"
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menú</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" />
            )}
          </svg>
        </button>

        <Link
          href="/"
          className="font-display text-2xl tracking-[0.12em] text-ink transition-opacity duration-300 hover:opacity-80 sm:text-[1.65rem]"
        >
          CLEOH
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Principal">
          {navLinks.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className={`text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ink-soft nav-link ${
                isCatActive(c.slug) ? "nav-link-active" : ""
              }`}
            >
              {c.name}
            </Link>
          ))}
          <Link
            href="/tienda"
            className={`text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ink-soft nav-link ${
              tiendaActive ? "nav-link-active" : ""
            }`}
          >
            Colección
          </Link>
        </nav>

        <div className="flex items-center gap-5 sm:gap-6">
          <Link
            href="/guia-tallas"
            className="header-util hidden lg:inline"
          >
            Tallas
          </Link>
          <Link
            href="/contacto"
            className="header-util hidden sm:inline"
          >
            Contacto
          </Link>
          <span
            className="hidden h-3 w-px bg-line sm:block"
            aria-hidden
          />
          <CartBagLink />
        </div>
      </div>

      {open && (
        <div className="mobile-nav-panel border-t border-line bg-porcelain md:hidden">
          <nav className="flex flex-col px-4 py-4" aria-label="Móvil">
            {navLinks.map((c) => (
              <Link
                key={c.slug}
                href={`/categoria/${c.slug}`}
                className={`border-b border-line py-3 text-sm uppercase tracking-[0.16em] ${
                  isCatActive(c.slug) ? "text-rose" : ""
                }`}
                onClick={() => setOpen(false)}
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/tienda"
              className={`border-b border-line py-3 text-sm uppercase tracking-[0.16em] ${
                tiendaActive ? "text-rose" : ""
              }`}
              onClick={() => setOpen(false)}
            >
              Colección
            </Link>
            <Link
              href="/guia-tallas"
              className="border-b border-line py-3 text-sm uppercase tracking-[0.16em]"
              onClick={() => setOpen(false)}
            >
              Guía de tallas
            </Link>
            <Link
              href="/carrito"
              className="border-b border-line py-3 text-sm uppercase tracking-[0.16em]"
              onClick={() => setOpen(false)}
            >
              Carrito ({ready ? count : 0})
            </Link>
            <Link
              href="/contacto"
              className="py-3 text-sm uppercase tracking-[0.16em]"
              onClick={() => setOpen(false)}
            >
              Contacto
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
