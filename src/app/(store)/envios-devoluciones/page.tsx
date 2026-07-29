import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/store/InfoPage";
import { enviosSections } from "@/data/legal";

export const metadata: Metadata = {
  title: "Envíos",
  description:
    "Métodos de envío, rastreo y plazos de entrega de Cleoh Lencería a todo México.",
};

export default function EnviosDevolucionesPage() {
  return (
    <InfoPage
      eyebrow="Logística"
      title="Envíos"
      description="Paquetería a todo México, tiempos de entrega y cómo rastrear tu pedido."
    >
      <div className="stagger-list">
        {enviosSections.map((section) => (
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
          ¿Dudas? Revisa el{" "}
          <Link href="/faq" className="link-anim text-rose">
            FAQ
          </Link>{" "}
          o{" "}
          <Link href="/contacto" className="link-anim text-rose">
            contáctanos
          </Link>
          .
        </p>
      </div>
    </InfoPage>
  );
}
