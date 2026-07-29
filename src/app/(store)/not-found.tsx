import Link from "next/link";
import { site } from "@/data/site";

export default function StoreNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-rose">
        404
      </p>
      <h1 className="mt-4 font-display text-4xl tracking-wide text-ink sm:text-5xl">
        No encontramos esta página
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        Puede que el enlace haya cambiado o el producto ya no esté disponible.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/tienda"
          className="inline-flex min-h-11 items-center bg-ink px-6 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-porcelain transition-opacity hover:opacity-90"
        >
          Ver colección
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center border border-line px-6 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:bg-petal"
        >
          Ir al inicio
        </Link>
      </div>
      <p className="mt-12 text-xs text-ink-soft/70">{site.name}</p>
    </div>
  );
}
