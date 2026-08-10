"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SizeGuideContent } from "@/components/product/SizeGuideContent";

type Props = {
  className?: string;
};

export function SizeGuidePreview({
  className = "link-anim mt-3 text-xs text-rose",
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const modal =
    open && mounted
      ? createPortal(
          <div className="pointer-events-none fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
            <button
              type="button"
              aria-label="Cerrar guía de tallas"
              onClick={() => setOpen(false)}
              className="overlay-fade-in press-ignore pointer-events-auto absolute inset-0 cursor-default bg-ink/45"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="modal-sheet-panel pointer-events-auto relative max-h-[min(92vh,720px)] w-full max-w-2xl overflow-y-auto bg-porcelain shadow-[0_24px_80px_rgba(26,20,22,0.18)] sm:rounded-sm"
            >
              <div className="sticky top-0 z-10 flex animate-fade-up items-start justify-between gap-4 border-b border-line bg-porcelain/95 px-5 py-4 backdrop-blur-sm sm:px-6">
                <div>
                  <h2
                    id={titleId}
                    className="font-display text-2xl tracking-wide text-ink sm:text-3xl"
                  >
                    Guía de tallas
                  </h2>
                  <p className="mt-1 text-xs text-ink-soft">
                    Consulta las medidas sin salir del producto
                  </p>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="pressable shrink-0 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-ink-soft transition-colors hover:text-ink"
                >
                  Cerrar
                </button>
              </div>

              <div className="px-5 py-5 sm:px-6 sm:py-6">
                <SizeGuideContent compact />
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Ver guía de tallas
      </button>
      {modal}
    </>
  );
}
