import type { Metadata } from "next";
import Link from "next/link";
import { InstagramLink } from "@/components/store/InstagramLink";
import { BANK_TRANSFER } from "@/lib/orders/bank-transfer";

export const metadata: Metadata = {
  title: "Pago pendiente",
};

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function CheckoutPendientePage({ searchParams }: Props) {
  const params = await searchParams;
  const orderNumber = params.external_reference;
  const isSpei = params.method === "spei";

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="animate-fade-up text-[0.65rem] uppercase tracking-[0.22em] text-rose">
        Pago
      </p>
      <h1 className="animate-fade-up-delay mt-2 font-display text-4xl tracking-wide text-ink">
        {isSpei ? "Pedido registrado" : "Pago pendiente"}
      </h1>
      <p className="animate-fade-up-delay-2 mt-4 text-sm leading-relaxed text-ink-soft">
        {isSpei ? (
          <>
            Tu pedido
            {orderNumber ? (
              <>
                {" "}
                <span className="text-ink">{orderNumber}</span>
              </>
            ) : null}{" "}
            quedó registrado. Realiza la transferencia y envía tu comprobante
            para que podamos validarlo.
          </>
        ) : (
          <>
            Tu pago
            {orderNumber ? (
              <>
                {" "}
                del pedido <span className="text-ink">{orderNumber}</span>
              </>
            ) : null}{" "}
            está en proceso. Te avisaremos cuando se confirme.
          </>
        )}
      </p>

      {isSpei ? (
        <div className="animate-fade-up-delay-2 mx-auto mt-8 max-w-md rounded-sm border border-line/80 bg-petal/50 px-5 py-5 text-left text-sm">
          <h2 className="font-display text-lg tracking-wide text-ink">
            Datos de pago — depósito y transferencia
          </h2>
          <dl className="mt-4 space-y-2 text-ink-soft">
            <div className="flex justify-between gap-4">
              <dt className="text-[0.65rem] uppercase tracking-[0.16em]">
                Banco
              </dt>
              <dd className="font-medium text-ink">{BANK_TRANSFER.bank}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[0.65rem] uppercase tracking-[0.16em]">
                Cuenta
              </dt>
              <dd className="font-mono text-[0.8rem] text-ink">
                {BANK_TRANSFER.accountNumber}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[0.65rem] uppercase tracking-[0.16em]">
                Titular
              </dt>
              <dd className="text-right text-ink">{BANK_TRANSFER.holder}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed">
            Transfiere el total exacto de tu pedido y manda tu comprobante por{" "}
            <InstagramLink /> ({BANK_TRANSFER.instagram})
            {orderNumber ? (
              <>
                {" "}
                indicando el número <span className="text-ink">{orderNumber}</span>
              </>
            ) : null}
            . Validamos el pago manualmente y te avisamos por correo cuando
            quede confirmado.
          </p>
        </div>
      ) : null}

      <Link
        href="/tienda"
        className="btn btn-primary animate-fade-up-delay-2 mt-10"
      >
        Volver a la tienda
      </Link>
    </div>
  );
}
