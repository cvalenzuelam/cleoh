"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M3.5 5h1.7l1.2 10.2a1.6 1.6 0 0 0 1.6 1.4h9.3a1.6 1.6 0 0 0 1.58-1.3L20.5 8H7.1"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="19.2" r="1.35" fill="currentColor" />
      <circle cx="17" cy="19.2" r="1.35" fill="currentColor" />
    </svg>
  );
}

export function CartBagLink() {
  const { count, ready, lastAddedAt } = useCart();
  const bumpKey = lastAddedAt || "idle";

  return (
    <Link
      href="/carrito"
      className="cart-bag-link group relative inline-flex items-center text-ink"
      aria-label={`Carrito${ready ? `, ${count} artículos` : ""}`}
    >
      <span
        key={bumpKey}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 group-hover:bg-petal ${
          lastAddedAt ? "cart-bag-bump" : ""
        }`}
      >
        <CartIcon
          className={`transition-transform duration-300 ${lastAddedAt ? "origin-bottom" : ""}`}
        />
        {ready && count > 0 && (
          <span
            key={bumpKey}
            className={`cart-bag-badge absolute right-0 top-0 flex h-4 min-w-4 translate-x-0.5 -translate-y-0.5 items-center justify-center rounded-full bg-ink px-1 text-[0.58rem] font-medium leading-none tracking-wide text-porcelain ${
              lastAddedAt ? "cart-bag-badge-pop" : ""
            }`}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
    </Link>
  );
}
