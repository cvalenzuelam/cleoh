"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { SizeGuidePreview } from "@/components/product/SizeGuidePreview";
import { sizeLabel, sortSizes } from "@/lib/admin/products";
import { formatLowStockMessage, isLowStock } from "@/lib/catalog/stock";
import { formatPrice } from "@/lib/catalog/types";

type SizeOption = { size: string; stock: number };

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string | null;
  };
  sizes: SizeOption[];
};

const MAX_QTY = 20;

export function ProductPurchase({ product, sizes }: Props) {
  const { addItem } = useCart();
  const ordered = useMemo(() => sortSizes(sizes), [sizes]);
  const available = ordered.filter((s) => s.stock > 0);
  const [size, setSize] = useState(available[0]?.size ?? "");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const readyTimer = useRef<number | null>(null);

  const selected = ordered.find((s) => s.size === size);
  const maxQty = Math.min(MAX_QTY, selected?.stock ?? 0);
  const quantityClamped = maxQty > 0 ? Math.min(quantity, maxQty) : quantity;
  const canAdd = Boolean(selected && selected.stock > 0 && quantityClamped >= 1);
  const lowStockMessage =
    selected && selected.stock > 0
      ? formatLowStockMessage(selected.stock, sizeLabel(selected.size))
      : null;

  useEffect(() => {
    return () => {
      if (readyTimer.current) window.clearTimeout(readyTimer.current);
    };
  }, []);

  function handleAdd() {
    if (!canAdd || !size) {
      setMessage("Elige una talla disponible.");
      return;
    }
    const qty = quantityClamped;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      size,
      price: product.price,
      image: product.image,
      quantity: qty,
    });
    setMessage(
      qty === 1
        ? "Agregado al carrito."
        : `Agregaste ${qty} piezas al carrito.`,
    );
    setJustAdded(true);
    if (readyTimer.current) window.clearTimeout(readyTimer.current);
    readyTimer.current = window.setTimeout(() => setJustAdded(false), 2500);
  }

  return (
    <div>
      <fieldset>
        <legend className="text-[0.65rem] uppercase tracking-[0.18em] text-ink">
          Talla
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {ordered.map(({ size: s, stock }) => {
            const active = size === s;
            const disabled = stock <= 0;
            const low = isLowStock(stock);
            return (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setSize(s);
                  setMessage(null);
                  setQuantity(1);
                }}
                className={`chip ${active ? "chip-active" : ""} ${
                  low && !active ? "chip-low-stock" : ""
                }`}
              >
                {sizeLabel(s)}
                {disabled ? " · agotado" : low ? " · pocas" : ""}
              </button>
            );
          })}
        </div>
        {lowStockMessage ? (
          <p
            className="mt-3 animate-fade-up text-xs leading-relaxed text-rose"
            role="status"
          >
            {lowStockMessage}
          </p>
        ) : null}
        <SizeGuidePreview />
      </fieldset>

      <div className="mt-6">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-ink">
          Cantidad
        </p>
        <div className="qty-stepper mt-3">
          <button
            type="button"
            aria-label="Quitar uno"
            disabled={quantityClamped <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="min-w-8 px-2 text-center text-sm tabular-nums text-ink">
            {quantityClamped}
          </span>
          <button
            type="button"
            aria-label="Agregar uno"
            disabled={!maxQty || quantityClamped >= maxQty}
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className={`btn btn-primary ${justAdded ? "cart-add-pulse" : ""}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className={`shrink-0 transition-opacity duration-300 ${
              justAdded ? "cart-bag-bump opacity-90" : "opacity-100"
            }`}
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
          <span className="relative inline-grid text-center">
            <span
              className={`col-start-1 row-start-1 transition-all duration-300 ease-out ${
                justAdded
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-1 opacity-0"
              }`}
              aria-hidden={!justAdded}
            >
              ¡Listo!
            </span>
            <span
              className={`col-start-1 row-start-1 transition-all duration-300 ease-out ${
                justAdded
                  ? "pointer-events-none -translate-y-1 opacity-0"
                  : "translate-y-0 opacity-100"
              }`}
              aria-hidden={justAdded}
            >
              {`Agregar al carrito · ${formatPrice(product.price * quantityClamped)}`}
            </span>
          </span>
        </button>
      </div>

      {message && (
        <div className="mt-5 animate-fade-up" role="status">
          {message.startsWith("Agregad") ? (
            <>
              <p className="animate-fade-up text-sm text-ink-soft">{message}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/checkout"
                  className="btn btn-primary animate-fade-up-delay"
                >
                  Ir al checkout
                </Link>
                <Link
                  href="/carrito"
                  className="btn btn-secondary animate-fade-up-delay-2"
                >
                  Ver carrito
                </Link>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-soft">{message}</p>
          )}
        </div>
      )}
    </div>
  );
}
