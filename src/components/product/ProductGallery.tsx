"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { productImage } from "@/lib/catalog/types";

type Props = {
  name: string;
  images: string[];
};

export function ProductGallery({ name, images }: Props) {
  const gallery =
    images.length > 0 ? images.map(productImage) : [productImage(null)];
  const [active, setActive] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const current = gallery[Math.min(active, gallery.length - 1)]!;

  const go = useCallback(
    (dir: -1 | 1) => {
      setActive((i) => (i + dir + gallery.length) % gallery.length);
    },
    [gallery.length],
  );

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [previewOpen, go]);

  const lightbox =
    previewOpen && mounted
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Vista previa · ${name}`}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/92 p-4 sm:p-8"
            onClick={() => setPreviewOpen(false)}
          >
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute right-4 top-4 z-10 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-porcelain/80 hover:text-porcelain sm:right-8 sm:top-8"
            >
              Cerrar
            </button>

            {gallery.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(-1);
                  }}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 px-3 py-4 text-2xl text-porcelain/70 hover:text-porcelain sm:left-6"
                  aria-label="Anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(1);
                  }}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 px-3 py-4 text-2xl text-porcelain/70 hover:text-porcelain sm:right-6"
                  aria-label="Siguiente"
                >
                  ›
                </button>
              </>
            ) : null}

            <div
              className="relative h-[min(85vh,900px)] w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current}
                alt={name}
                className="h-full w-full object-contain"
              />
            </div>

            {gallery.length > 1 ? (
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs tracking-[0.16em] text-porcelain/60">
                {active + 1} / {gallery.length}
              </p>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="group relative aspect-[3/4] w-full overflow-hidden bg-mist text-left"
        aria-label={`Ver ${name} en grande`}
      >
        <Image
          src={current}
          alt={name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
        <span className="absolute bottom-3 right-3 bg-porcelain/90 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Ver
        </span>
      </button>

      {gallery.length > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {gallery.map((src, i) => (
            <li key={`${src}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Foto ${i + 1}`}
                aria-current={i === active ? "true" : undefined}
                className={`relative block h-20 w-16 overflow-hidden bg-mist ring-1 transition duration-300 ${
                  i === active
                    ? "scale-105 ring-ink"
                    : "ring-transparent opacity-75 hover:opacity-100"
                }`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {lightbox}
    </div>
  );
}
