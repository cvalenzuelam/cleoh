"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { EmptyBagIllustration } from "@/components/cart/EmptyBagIllustration";
import { FreeShippingProgress } from "@/components/cart/FreeShippingProgress";
import { sizeLabel } from "@/lib/admin/products";
import { CART_LINE_MAX_QTY } from "@/lib/cart/stock-limits";
import { formatCartMoney } from "@/lib/cart/types";
import { productImage } from "@/lib/catalog/types";

export function CartView() {
  const { items, subtotal, ready, setQuantity, removeItem, count, syncStock } =
    useCart();

  useEffect(() => {
    if (!ready || !items.length) return;
    void syncStock();
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps -- revalidar al entrar al carrito

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-sm text-ink-soft">
        Cargando carrito…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <h1 className="animate-fade-up font-display text-4xl tracking-wide text-ink">
          Carrito
        </h1>
        <EmptyBagIllustration className="animate-fade-up-delay mx-auto mt-8 h-44 w-auto sm:h-52" />
        <p className="animate-fade-up-delay-2 mt-6 text-sm text-ink-soft">
          Tu carrito está vacío.
        </p>
        <p className="animate-fade-up-delay-2 mt-2 text-xs tracking-wide text-ink-soft/80">
          Aún no hay piezas esperándote aquí.
        </p>
        <Link
          href="/tienda"
          className="btn btn-primary animate-fade-up-delay-2 mt-8"
        >
          Seguir comprando
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-4xl tracking-wide text-ink">
            Carrito
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {count} {count === 1 ? "artículo" : "artículos"}
          </p>
        </div>
        <Link
          href="/tienda"
          className="link-anim text-[0.65rem] uppercase tracking-[0.18em] text-ink-soft"
        >
          Seguir comprando
        </Link>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <ul className="stagger-list divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex gap-5 py-6 transition-colors duration-300 hover:bg-petal/40 sm:gap-6"
            >
              <Link
                href={`/producto/${item.slug}`}
                className="relative h-48 w-36 shrink-0 overflow-hidden bg-mist transition-transform duration-300 hover:scale-[1.02] sm:h-64 sm:w-48"
              >
                <Image
                  src={productImage(item.image)}
                  alt={item.name}
                  fill
                  sizes="192px"
                  className="object-cover"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/producto/${item.slug}`}
                      className="font-display text-xl tracking-wide text-ink transition-colors duration-300 hover:text-rose"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-ink-soft">
                      Talla {sizeLabel(item.size)}
                    </p>
                  </div>
                  <p className="text-sm text-ink">
                    {formatCartMoney(item.price * item.quantity)}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-4 pt-4">
                  <div className="qty-stepper">
                    <button
                      type="button"
                      aria-label="Quitar uno"
                      onClick={() => setQuantity(item.key, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="min-w-8 px-2 text-center text-sm tabular-nums text-ink">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Agregar uno"
                      disabled={
                        item.quantity >=
                        Math.min(CART_LINE_MAX_QTY, item.stock ?? CART_LINE_MAX_QTY)
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
                    className="link-anim text-xs uppercase tracking-[0.14em] text-ink-soft"
                  >
                    Quitar
                  </button>
                </div>
                {item.stock != null && item.quantity >= item.stock ? (
                  <p className="mt-2 text-xs text-rose" role="status">
                    {item.stock === 1
                      ? "Solo queda 1 pieza de esta talla."
                      : `Máximo ${item.stock} de esta talla.`}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-4 animate-fade-up-delay">
          <FreeShippingProgress subtotal={subtotal} variant="cart" />
          <div className="border border-line bg-petal p-6 transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(26,20,22,0.06)]">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-ink">
              Resumen
            </p>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-ink-soft">Subtotal</span>
              <span key={subtotal} className="animate-fade-up text-ink tabular-nums">
                {formatCartMoney(subtotal)}
              </span>
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              El envío se calcula en el checkout.
            </p>
            <Link
              href="/checkout"
              className="btn btn-primary btn-block mt-6 transition-transform duration-300 hover:-translate-y-0.5"
            >
              Ir al checkout
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
