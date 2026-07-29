import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/store/InfoPage";
import { politicasSections } from "@/data/legal";

export const metadata: Metadata = {
  title: "Políticas de la tienda",
  description:
    "Atención al cliente, privacidad, pagos y condiciones generales de Cleoh Lencería.",
};

export default function PoliticasPage() {
  return (
    <InfoPage
      eyebrow="Confianza"
      title="Políticas de la tienda"
      description="Cómo te atendemos, cómo cuidamos tus datos y cómo funcionan los pagos en Cleoh."
    >
      <div className="stagger-list">
        {politicasSections.map((section) => (
          <InfoSection key={section.title} title={section.title}>
            {section.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {section.bullets ? (
              <ul className="list-disc space-y-1.5 pl-5">
                {section.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : null}
          </InfoSection>
        ))}

        <p className="mt-2 text-sm text-ink-soft">
          Para plazos de entrega y seguimiento, consulta{" "}
          <Link href="/envios-devoluciones" className="link-anim text-rose">
            envíos
          </Link>
          .
        </p>
      </div>
    </InfoPage>
  );
}
