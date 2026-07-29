import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pago no completado",
};

export default function CheckoutFalloPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="animate-fade-up text-[0.65rem] uppercase tracking-[0.22em] text-rose">
        Pago
      </p>
      <h1 className="animate-fade-up-delay mt-2 font-display text-4xl tracking-wide text-ink">
        No se completó el pago
      </h1>
      <p className="animate-fade-up-delay-2 mt-4 text-sm leading-relaxed text-ink-soft">
        Puedes intentar de nuevo desde el checkout. Tu carrito se mantiene si no
        vaciaste.
      </p>
      <div className="animate-fade-up-delay-2 mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link href="/checkout" className="btn btn-primary">
          Reintentar
        </Link>
        <Link href="/carrito" className="btn btn-secondary">
          Ver carrito
        </Link>
      </div>
    </div>
  );
}
