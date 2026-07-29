import type { Metadata } from "next";
import { CheckoutView } from "@/components/cart/CheckoutView";
import { listActiveShippingMethods } from "@/lib/shipping/methods";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Finaliza tu compra Cleoh.",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const shippingMethods = await listActiveShippingMethods();
  return <CheckoutView shippingMethods={shippingMethods} />;
}
