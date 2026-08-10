type Props = {
  /** light = on dark footer; ink = on light backgrounds */
  tone?: "light" | "ink";
  className?: string;
};

type Badge = {
  src: string;
  alt: string;
  widthClass?: string;
  /** Compensa marcas más altas (Mastercard) para igualar el peso óptico */
  padClass?: string;
};

/** Official assets in /public/payments — todos a color sobre tarjeta blanca. */
const BADGES: Badge[] = [
  { src: "/payments/visa.svg", alt: "Visa" },
  {
    src: "/payments/mastercard.svg",
    alt: "Mastercard",
    padClass: "py-[3px]",
  },
  { src: "/payments/paypal.svg", alt: "PayPal" },
  {
    src: "/payments/mercadopago.png",
    alt: "Mercado Pago",
    widthClass: "w-[72px]",
    padClass: "px-[5px]",
  },
];

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="4" y="10" width="16" height="10" rx="1.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function PaymentCard({ badge }: { badge: Badge }) {
  const widthClass = badge.widthClass ?? "w-[46px]";

  return (
    <span
      className={`inline-flex h-7 ${widthClass} ${badge.padClass ?? ""} shrink-0 overflow-hidden rounded-[4px] bg-white shadow-sm ring-1 ring-black/8`}
    >
      <img
        src={badge.src}
        alt={badge.alt}
        className="h-full w-full object-contain object-center"
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

export function PaymentMethodBadges({ tone = "light", className = "" }: Props) {
  const labelColor =
    tone === "light" ? "text-porcelain/40" : "text-ink-soft/60";

  return (
    <div
      className={`flex flex-col items-center gap-2 ${className}`}
      aria-label="Métodos de pago aceptados"
    >
      <p
        className={`flex items-center gap-1.5 text-[0.6rem] font-medium uppercase tracking-[0.14em] ${labelColor}`}
      >
        <LockIcon className="shrink-0" />
        Pago seguro
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {BADGES.map((badge) => (
          <PaymentCard key={badge.alt} badge={badge} />
        ))}
      </div>
    </div>
  );
}
