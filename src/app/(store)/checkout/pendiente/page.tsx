import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pago pendiente",
};

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function CheckoutPendientePage({ searchParams }: Props) {
  const params = await searchParams;
  const orderNumber = params.external_reference;

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="animate-fade-up text-[0.65rem] uppercase tracking-[0.22em] text-rose">
        Pago
      </p>
      <h1 className="animate-fade-up-delay mt-2 font-display text-4xl tracking-wide text-ink">
        Pago pendiente
      </h1>
      <p className="animate-fade-up-delay-2 mt-4 text-sm leading-relaxed text-ink-soft">
        Tu pago
        {orderNumber ? (
          <>
            {" "}
            del pedido <span className="text-ink">{orderNumber}</span>
          </>
        ) : null}{" "}
        está en proceso. Te avisaremos cuando se confirme.
      </p>
      <Link href="/tienda" className="btn btn-primary animate-fade-up-delay-2 mt-10">
        Volver a la tienda
      </Link>
    </div>
  );
}
