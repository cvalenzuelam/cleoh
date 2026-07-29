import type { Metadata } from "next";
import { CheckoutSuccessClient } from "@/components/cart/CheckoutSuccessClient";
import { syncPaymentFromReturn } from "@/lib/orders/sync-return";

export const metadata: Metadata = {
  title: "Pago exitoso",
};

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function CheckoutExitoPage({ searchParams }: Props) {
  const params = await searchParams;
  const paymentId = params.payment_id || params.collection_id;
  const orderNumber = params.external_reference;

  await syncPaymentFromReturn({
    paymentId,
    externalReference: orderNumber,
    status: params.status || params.collection_status,
  });

  return <CheckoutSuccessClient orderNumber={orderNumber} />;
}
