import type { Metadata } from "next";
import Link from "next/link";
import { SizeGuideContent } from "@/components/product/SizeGuideContent";

export const metadata: Metadata = {
  title: "Guía de tallas",
  description:
    "Tabla de tallas Cleoh — Extra Chica a Grande, con medidas de pecho y cintura.",
};

export default function GuiaTallasPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="animate-fade-up font-display text-4xl tracking-wide text-ink">
        Guía de tallas
      </h1>

      <SizeGuideContent />

      <Link
        href="/contacto"
        className="link-anim animate-fade-up-delay-2 mt-8 inline-block text-sm text-rose"
      >
        ¿Dudas? Contáctanos
      </Link>

      <p className="mt-10">
        <Link href="/tienda" className="link-anim text-sm text-ink-soft">
          ← Volver a la tienda
        </Link>
      </p>
    </div>
  );
}
