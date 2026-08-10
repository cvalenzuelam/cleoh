"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/components/cart/CartProvider";
import { CartUpsell } from "@/components/cart/CartUpsell";
import { EmptyBagIllustration } from "@/components/cart/EmptyBagIllustration";
import { FreeShippingProgress } from "@/components/cart/FreeShippingProgress";
import { sizeLabel } from "@/lib/admin/products";
import { CART_LINE_MAX_QTY } from "@/lib/cart/stock-limits";
import { formatCartMoney } from "@/lib/cart/types";
import { productImage } from "@/lib/catalog/types";

/** Mismo tamaño que las cards del carrusel de upsell (42% × aspect 3/4). */
const CART_THUMB_CLASS =
  "relative block w-[42%] max-w-[172px] shrink-0 aspect-[3/4] overflow-hidden bg-mist sm:w-[38%]";

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M3.5 5h1.7l1.2 9.5a1.5 1.5 0 0 0 1.5 1.3h8.8a1.5 1.5 0 0 0 1.48-1.2L20 8H7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="19" r="1.2" fill="currentColor" />
      <circle cx="16.5" cy="19" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function CartDrawer() {
  const {
    items,
    count,
    subtotal,
    ready,
    isOpen,
    drawerMode,
    lastAddedKey,
    setQuantity,
    removeItem,
    closeCart,
  } = useCart();

  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeCart]);

  if (!mounted || !isOpen) return null;

  const featured =
    lastAddedKey && drawerMode === "added"
      ? items.find((i) => i.key === lastAddedKey)
      : null;
  const otherItems = featured
    ? items.filter((i) => i.key !== featured.key)
    : items;
  const cartProductIds = items.map((i) => i.productId);
  const title =
    drawerMode === "added" && featured
      ? "Producto agregado"
      : count > 0
        ? "Tu carrito"
        : "Carrito";

  const drawer = (
    <div className="pointer-events-none fixed inset-0 z-[85]">
      <button
        type="button"
        aria-label="Cerrar carrito"
        onClick={closeCart}
        className="overlay-fade-in press-ignore pointer-events-auto absolute inset-0 cursor-default bg-ink/35 transition-opacity"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="cart-drawer-panel pointer-events-auto absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-porcelain shadow-[-8px_0_40px_rgba(26,20,22,0.12)]"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4 animate-fade-up">
          <h2
            id={titleId}
            className="font-display text-xl tracking-wide text-ink sm:text-2xl"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar"
            className="pressable flex h-9 w-9 items-center justify-center text-ink-soft transition-colors hover:bg-petal hover:text-ink"
          >
            <CloseIcon />
          </button>
        </header>

        {!ready ? (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-ink-soft">
            Cargando carrito…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center animate-fade-up">
            <EmptyBagIllustration className="animate-fade-up-delay h-36 w-auto" />
            <p className="animate-fade-up-delay-2 mt-6 text-sm text-ink-soft">
              Tu carrito está vacío.
            </p>
            <Link
              href="/tienda"
              onClick={closeCart}
              className="btn btn-primary animate-fade-up-delay-2 mt-6"
            >
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-5 pt-5">
                <FreeShippingProgress subtotal={subtotal} variant="drawer" />
              </div>

              {featured ? (
                <div className="cart-added-feature mt-5 border-b border-line px-5 pb-5">
                  <div className="flex gap-4">
                    <Link
                      href={`/producto/${featured.slug}`}
                      onClick={closeCart}
                      className={`${CART_THUMB_CLASS} transition-transform duration-300 hover:scale-[1.02]`}
                    >
                      <Image
                        src={productImage(featured.image)}
                        alt={featured.name}
                        fill
                        sizes="172px"
                        className="object-cover"
                        priority
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/producto/${featured.slug}`}
                        onClick={closeCart}
                        className="font-display text-lg leading-snug tracking-wide text-ink transition-colors hover:text-rose"
                      >
                        {featured.name}
                      </Link>
                      <p className="mt-1 text-sm text-ink-soft">
                        Talla {sizeLabel(featured.size)} · Cantidad {featured.quantity}
                      </p>
                      <p className="mt-3 text-base font-medium tabular-nums text-ink">
                        {formatCartMoney(featured.price * featured.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {otherItems.length > 0 ? (
                <ul className="stagger-list divide-y divide-line border-b border-line px-5">
                  {otherItems.map((item) => (
                    <li key={item.key} className="flex items-start gap-4 py-4">
                      <Link
                        href={`/producto/${item.slug}`}
                        onClick={closeCart}
                        className={`${CART_THUMB_CLASS} transition-transform duration-300 hover:scale-[1.02]`}
                      >
                        <Image
                          src={productImage(item.image)}
                          alt={item.name}
                          fill
                          sizes="172px"
                          className="object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/producto/${item.slug}`}
                          onClick={closeCart}
                          className="text-sm font-medium text-ink transition-colors hover:text-rose"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          Talla {sizeLabel(item.size)} · {item.quantity} ud.
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <div className="qty-stepper qty-stepper-sm">
                            <button
                              type="button"
                              aria-label="Quitar uno"
                              onClick={() =>
                                setQuantity(item.key, item.quantity - 1)
                              }
                            >
                              −
                            </button>
                            <span className="min-w-6 px-1 text-center text-xs tabular-nums text-ink">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Agregar uno"
                              disabled={
                                item.quantity >=
                                Math.min(
                                  CART_LINE_MAX_QTY,
                                  item.stock ?? CART_LINE_MAX_QTY,
                                )
                              }
                              onClick={() =>
                                setQuantity(
                                  item.key,
                                  Math.min(
                                    CART_LINE_MAX_QTY,
                                    item.stock ?? CART_LINE_MAX_QTY,
                                    item.quantity + 1,
                                  ),
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="link-anim text-[0.6rem] uppercase tracking-[0.12em] text-ink-soft"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm tabular-nums text-ink">
                        {formatCartMoney(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}

              <CartUpsell
                cartProductIds={cartProductIds}
                onNavigate={closeCart}
              />
            </div>

            <footer className="shrink-0 border-t border-line bg-porcelain px-5 py-5 animate-fade-up-delay">
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">
                  Subtotal · {count}{" "}
                  {count === 1 ? "artículo" : "artículos"}
                </span>
                <span className="font-medium tabular-nums text-ink">
                  {formatCartMoney(subtotal)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                El envío se calcula en el checkout.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/carrito"
                  onClick={closeCart}
                  className="btn btn-secondary flex-1 justify-center gap-2"
                >
                  <BagIcon />
                  Ver carrito
                </Link>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="btn btn-primary flex-1 justify-center"
                >
                  Ir al checkout
                </Link>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
}
