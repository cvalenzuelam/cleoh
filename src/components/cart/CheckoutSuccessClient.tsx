"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { useEffect } from "react";

function SuccessMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id="success-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c9a8ad" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#f3eaeb" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#faf7f6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="url(#success-glow)" />
      <circle
        cx="60"
        cy="60"
        r="34"
        stroke="#8f5a66"
        strokeWidth="1.25"
        opacity="0.55"
        className="checkout-success-ring"
      />
      <path
        d="M42 61.5 L54 73.5 L80 46"
        stroke="#8f5a66"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="checkout-success-check"
      />
    </svg>
  );
}

export function CheckoutSuccessClient({
  orderNumber,
}: {
  orderNumber?: string;
}) {
  const { clear } = useCart();

  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,#f3eaeb_0%,transparent_55%),linear-gradient(180deg,#faf7f6_0%,#f3eaeb_48%,#faf7f6_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-blush/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 bottom-10 h-48 w-48 rounded-full bg-rose/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-24">
        <SuccessMark className="animate-fade-up h-28 w-28 sm:h-32 sm:w-32" />

        <p className="animate-fade-up-delay mt-2 font-display text-sm tracking-[0.28em] text-rose">
          Cleoh
        </p>

        <h1 className="animate-fade-up-delay mt-3 font-display text-5xl tracking-wide text-ink sm:text-6xl">
          ¡Gracias!
        </h1>

        <p className="animate-fade-up-delay-2 mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-soft">
          Tu pago quedó confirmado. Prepararemos tu pedido con cuidado y te
          escribiremos con los detalles del envío.
        </p>

        {orderNumber ? (
          <div className="animate-fade-up-delay-2 mt-8 w-full max-w-sm border-y border-line/80 py-5">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-ink-soft">
              Número de pedido
            </p>
            <p className="mt-2 font-display text-xl tracking-wide text-ink">
              {orderNumber}
            </p>
          </div>
        ) : null}

        <div className="animate-fade-up-delay-2 mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link href="/tienda" className="btn btn-primary">
            Seguir comprando
          </Link>
          <Link
            href="/contacto"
            className="link-anim text-[0.7rem] uppercase tracking-[0.16em] text-ink-soft"
          >
            ¿Dudas? Contáctanos
          </Link>
        </div>
      </div>
    </div>
  );
}
