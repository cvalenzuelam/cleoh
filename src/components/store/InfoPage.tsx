import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function InfoPage({ eyebrow, title, description, children }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {eyebrow ? (
        <p className="animate-fade-up text-[0.65rem] uppercase tracking-[0.22em] text-rose">
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={`animate-fade-up-delay font-display text-4xl tracking-wide text-ink ${eyebrow ? "mt-2" : ""}`}
      >
        {title}
      </h1>
      {description ? (
        <p className="animate-fade-up-delay-2 mt-4 text-sm leading-relaxed text-ink-soft">
          {description}
        </p>
      ) : null}
      <div className="mt-12">{children}</div>
      <p className="animate-fade-up-delay-2 mt-14 border-t border-line pt-8">
        <Link href="/tienda" className="link-anim text-sm text-ink-soft">
          ← Volver a la tienda
        </Link>
      </p>
    </div>
  );
}

export function InfoSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 border-t border-line py-8 first:border-t-0 first:pt-0"
    >
      <h2 className="font-display text-2xl tracking-wide text-ink">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
        {children}
      </div>
    </section>
  );
}
