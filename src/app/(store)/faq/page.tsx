import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/store/InfoPage";
import { InstagramRichText } from "@/components/store/InstagramRichText";
import { faqItems } from "@/data/legal";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Envíos, tallas, pagos y cupones — respuestas rápidas de Cleoh Lencería.",
};

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow="Ayuda"
      title="Preguntas frecuentes"
      description="Lo esencial sobre envíos, tallas y pedidos. Si no encuentras tu duda, escríbenos."
    >
      <dl className="stagger-list divide-y divide-line border-t border-line">
        {faqItems.map((item) => (
          <div key={item.question} className="py-7">
            <dt className="font-display text-xl tracking-wide text-ink transition-colors duration-300">
              {item.question}
            </dt>
            <dd className="mt-3 text-sm leading-relaxed text-ink-soft">
              <InstagramRichText
                text={item.answer}
                linkClassName="link-anim text-rose"
              />
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-10 text-sm text-ink-soft">
        También puedes ver{" "}
        <Link href="/envios-devoluciones" className="link-anim text-rose">
          envíos
        </Link>
        ,{" "}
        <Link href="/guia-tallas" className="link-anim text-rose">
          guía de tallas
        </Link>{" "}
        o{" "}
        <Link href="/contacto" className="link-anim text-rose">
          contacto
        </Link>
        .
      </p>
    </InfoPage>
  );
}
