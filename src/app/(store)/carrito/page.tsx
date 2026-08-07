import type { Metadata } from "next";
import { Suspense } from "react";
import { CartRecovery } from "@/components/cart/CartRecovery";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Tu carrito de compras Cleoh.",
};

export default function CarritoPage() {
  return (
    <>
      <Suspense fallback={null}>
        <CartRecovery />
      </Suspense>
      <CartView />
    </>
  );
}
