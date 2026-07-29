import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guía de tallas",
  description:
    "Tabla de tallas Cleoh — Extra Chica a Grande, con medidas de pecho y cintura.",
};

const SIZE_ROWS = [
  {
    size: "Extra Chica",
    label: "XS",
    bust: "70–75 cm",
    waist: "59–65 cm",
  },
  {
    size: "Chica",
    label: "S",
    bust: "75–88 cm",
    waist: "65–75 cm",
  },
  {
    size: "Mediano",
    label: "M",
    bust: "85–98 cm",
    waist: "70–90 cm",
  },
  {
    size: "Grande",
    label: "G",
    bust: "95–115 cm",
    waist: "85–110 cm",
  },
] as const;

export default function GuiaTallasPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="animate-fade-up font-display text-4xl tracking-wide text-ink">
        Guía de tallas
      </h1>
      <p className="animate-fade-up-delay mt-4 text-sm leading-relaxed text-ink-soft">
        Las medidas son una referencia. Pueden existir variaciones de 1–2 cm en
        las prendas. Si dudas entre dos tallas, elige la mayor.
      </p>

      <div className="animate-fade-up-delay-2 mt-10 overflow-x-auto border border-line">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="bg-petal text-[0.65rem] uppercase tracking-[0.16em]">
            <tr>
              <th className="px-4 py-3 font-medium">Talla Cleoh</th>
              <th className="px-4 py-3 font-medium">Ref.</th>
              <th className="px-4 py-3 font-medium">Pecho</th>
              <th className="px-4 py-3 font-medium">Cintura</th>
            </tr>
          </thead>
          <tbody className="text-ink-soft">
            {SIZE_ROWS.map((row) => (
              <tr
                key={row.size}
                className="border-t border-line transition-colors duration-300 hover:bg-petal/50"
              >
                <td className="px-4 py-3 text-ink">{row.size}</td>
                <td className="px-4 py-3">{row.label}</td>
                <td className="px-4 py-3">{row.bust}</td>
                <td className="px-4 py-3">{row.waist}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="animate-fade-up-delay-2 mt-6 text-sm leading-relaxed text-ink-soft">
        Nota: si el modelo tiene copa, la talla corresponde a copa{" "}
        <span className="text-ink">B–C</span>. No manejamos copa D.
      </p>

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
