import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Tu carrito de compras Cleoh.",
};

export default function CarritoPage() {
  return <CartView />;
}
