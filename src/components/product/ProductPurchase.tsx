"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { SizeGuidePreview } from "@/components/product/SizeGuidePreview";
import { sizeLabel, sortSizes } from "@/lib/admin/products";
import { CART_LINE_MAX_QTY } from "@/lib/cart/stock-limits";
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

export function ProductPurchase({ product, sizes }: Props) {
  const { addItem, items } = useCart();
  const ordered = useMemo(() => sortSizes(sizes), [sizes]);
  const available = ordered.filter((s) => s.stock > 0);
  const [size, setSize] = useState(available[0]?.size ?? "");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const readyTimer = useRef<number | null>(null);

  const selected = ordered.find((s) => s.size === size);
  const inCart =
    items.find((i) => i.productId === product.id && i.size === size)
      ?.quantity ?? 0;
  const stock = selected?.stock ?? 0;
  const remaining = Math.max(0, stock - inCart);
  const maxQty = Math.min(CART_LINE_MAX_QTY, remaining);
  const quantityClamped = maxQty > 0 ? Math.min(quantity, maxQty) : 1;
  const canAdd = Boolean(selected && stock > 0 && remaining > 0 && quantityClamped >= 1);
  const lowStockMessage =
    selected && stock > 0
      ? formatLowStockMessage(stock, sizeLabel(selected.size))
      : null;

  useEffect(() => {
    return () => {
      if (readyTimer.current) window.clearTimeout(readyTimer.current);
    };
  }, []);

  // Si cambia la talla o el stock restante, no dejes cantidad > disponible.
  useEffect(() => {
    if (maxQty > 0 && quantity > maxQty) {
      setQuantity(maxQty);
    }
  }, [maxQty, quantity]);

  function handleAdd() {
    if (!size || !selected) {
      setMessage("Elige una talla disponible.");
      return;
    }
    if (remaining <= 0) {
      setMessage(
        stock <= 0
          ? "Esta talla está agotada."
          : `Ya tienes en el carrito las ${stock} ${
              stock === 1 ? "pieza disponible" : "piezas disponibles"
            } de esta talla.`,
      );
      return;
    }

    const qty = quantityClamped;
    const result = addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      size,
      price: product.price,
      image: product.image,
      quantity: qty,
      stock,
    });

    if (result.added <= 0) {
      setMessage(
        `Solo hay ${stock} ${stock === 1 ? "pieza" : "piezas"} en talla ${sizeLabel(size)}. Ya están en tu carrito.`,
      );
      setJustAdded(false);
      return;
    }

    if (result.capped && result.added < qty) {
      setMessage(
        `Solo pudimos agregar ${result.added} ${
          result.added === 1 ? "pieza" : "piezas"
        } (stock de esta talla: ${stock}).`,
      );
    } else {
      setMessage(null);
    }

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
          {ordered.map(({ size: s, stock: sizeStock }) => {
            const active = size === s;
            const disabled = sizeStock <= 0;
            const low = isLowStock(sizeStock);
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
                {disabled ? " · agotado" : ""}
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
        {inCart > 0 && stock > 0 ? (
          <p className="mt-2 text-xs text-ink-soft" role="status">
            {remaining > 0
              ? `Ya tienes ${inCart} en el carrito · puedes agregar ${remaining} más.`
              : `Ya tienes en el carrito todas las piezas disponibles de esta talla (${stock}).`}
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
            disabled={quantityClamped <= 1 || remaining <= 0}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="min-w-8 px-2 text-center text-sm tabular-nums text-ink">
            {remaining > 0 ? quantityClamped : 0}
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
              {remaining <= 0 && stock > 0
                ? "Ya en el carrito"
                : `Agregar al carrito · ${formatPrice(product.price * Math.max(1, quantityClamped))}`}
            </span>
          </span>
        </button>
      </div>

      {message && (
        <div className="mt-5 animate-fade-up" role="status">
          <p className="text-sm text-ink-soft">{message}</p>
        </div>
      )}
    </div>
  );
}
