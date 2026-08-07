"use client";

import Link from "next/link";
import { getFreeShippingProgress } from "@/lib/shipping/free-shipping";

type Props = {
  subtotal: number;
  variant?: "cart" | "checkout";
};

export function FreeShippingProgress({
  subtotal,
  variant = "cart",
}: Props) {
  const { progress, qualified, remainingLabel, thresholdLabel } =
    getFreeShippingProgress(subtotal);

  const boxClass =
    variant === "checkout"
      ? "border border-line bg-petal/50 p-4"
      : "border border-line/80 bg-porcelain p-4";

  return (
    <div className={boxClass}>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-mist"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label={
          qualified
            ? "Envío gratis desbloqueado"
            : `Progreso hacia envío gratis: ${Math.round(progress)}%`
        }
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            qualified ? "bg-rose" : "bg-ink/70"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {qualified ? (
        <p className="mt-3 text-xs leading-relaxed text-ink">
          <span className="font-medium">¡Envío gratis desbloqueado!</span>
          <span className="text-ink-soft">
            {" "}
            Tu subtotal supera {thresholdLabel}.
          </span>
        </p>
      ) : (
        <>
          <p className="mt-3 text-xs leading-relaxed text-ink">
            Te faltan{" "}
            <span className="font-medium tabular-nums">{remainingLabel}</span>{" "}
            para{" "}
            <span className="font-medium">envío gratis</span> en compras desde{" "}
            {thresholdLabel}.
          </p>
          {variant === "cart" ? (
            <Link
              href="/tienda"
              className="mt-2 inline-block text-[0.65rem] uppercase tracking-[0.16em] text-ink-soft underline decoration-blush underline-offset-4 transition-colors hover:text-ink"
            >
              Agregar otra pieza
            </Link>
          ) : null}
        </>
      )}
    </div>
  );
}
