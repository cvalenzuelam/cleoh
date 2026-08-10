import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Horarios de atención Cleoh y contacto por Instagram @cleoh.mex.",
};

const HOURS = [
  { days: "Lunes a viernes", time: "7:00 a.m. – 10:00 p.m." },
  { days: "Sábado y domingo", time: "8:00 a.m. – 10:00 p.m." },
] as const;

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1.15" fill="currentColor" />
    </svg>
  );
}

export default function ContactoPage() {
  return (
    <div className="relative overflow-hidden bg-porcelain">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-gradient-to-b from-petal via-petal/50 to-transparent"
      />

      <div className="relative mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <h1 className="animate-fade-up font-display text-5xl tracking-wide text-ink sm:text-6xl">
          Contáctanos
        </h1>
        <p className="animate-fade-up-delay mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
          Dudas de tallas, pedidos o envíos — te atendemos por Instagram. Es
          nuestra única vía de contacto.
        </p>

        <a
          href={site.social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="group animate-fade-up-delay-2 pressable mt-10 inline-flex items-center gap-3 border border-ink bg-ink px-8 py-3.5 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-porcelain transition-all duration-300 hover:border-rose hover:bg-rose hover:shadow-[0_10px_30px_rgba(26,20,22,0.12)]"
        >
          <InstagramGlyph className="shrink-0 text-porcelain transition-transform duration-300 group-hover:scale-110" />
          <span className="text-porcelain">Escribir en Instagram</span>
        </a>
        <div className="animate-fade-up-delay-2 mx-auto mt-16 max-w-sm">
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-ink/15" aria-hidden />
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.22em] text-blush">
              Horarios
            </p>
            <span className="h-px flex-1 bg-ink/15" aria-hidden />
          </div>

          <ul className="stagger-list mt-8 space-y-5 text-left">
            {HOURS.map((row) => (
              <li
                key={row.days}
                className="flex items-baseline justify-between gap-6 border-b border-line pb-4 last:border-b-0"
              >
                <span className="font-display text-lg tracking-wide text-ink">
                  {row.days}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-ink-soft">
                  {row.time}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-ink-soft/70">
            Horario de México. Respondemos en horas hábiles; si escribes fuera
            de este horario, te contestamos al siguiente turno.
          </p>
        </div>

        <div className="animate-fade-up-delay-2 mt-14 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-soft">
          <Link href="/faq" className="link-anim">
            FAQ
          </Link>
          <Link href="/guia-tallas" className="link-anim">
            Guía de tallas
          </Link>
          <Link href="/envios-devoluciones" className="link-anim">
            Envíos
          </Link>
        </div>
      </div>
    </div>
  );
}
