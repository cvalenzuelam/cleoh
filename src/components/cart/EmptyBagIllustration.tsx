/** Empty cart with a soft lingerie accent (lace bow / ribbon). */
export function EmptyBagIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Carrito vacío"
    >
      <defs>
        <radialGradient id="empty-cart-glow" cx="50%" cy="55%" r="52%">
          <stop offset="0%" stopColor="#c9a8ad" stopOpacity="0.38" />
          <stop offset="55%" stopColor="#f3eaeb" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#faf7f6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cart-body" x1="60" y1="70" x2="180" y2="170">
          <stop offset="0%" stopColor="#f7f0f1" />
          <stop offset="100%" stopColor="#ebe2e3" />
        </linearGradient>
        <linearGradient id="cart-inside" x1="120" y1="78" x2="120" y2="140">
          <stop offset="0%" stopColor="#faf7f6" />
          <stop offset="100%" stopColor="#e8dde0" />
        </linearGradient>
      </defs>

      <ellipse cx="120" cy="132" rx="90" ry="72" fill="url(#empty-cart-glow)" />

      <g className="empty-bag-float">
        {/* Handle */}
        <path
          d="M58 78 L72 78"
          stroke="#8f5a66"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M58 78
             C52 78 48 84 50 92
             L58 128"
          stroke="#8f5a66"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />

        {/* Basket */}
        <path
          d="M70 88
             L178 88
             L168 152
             C166 160 160 164 152 164
             L88 164
             C80 164 74 160 72 152
             Z"
          fill="url(#cart-body)"
          stroke="#8f5a66"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Empty interior */}
        <path
          d="M80 96
             L168 96
             L160 140
             L88 140
             Z"
          fill="url(#cart-inside)"
          opacity="0.95"
        />

        {/* Wire lines — empty cart depth */}
        <path
          d="M96 96 L92 140"
          stroke="#c9a8ad"
          strokeWidth="1.1"
          opacity="0.55"
        />
        <path
          d="M120 96 L120 140"
          stroke="#c9a8ad"
          strokeWidth="1.1"
          opacity="0.4"
        />
        <path
          d="M152 96 L148 140"
          stroke="#c9a8ad"
          strokeWidth="1.1"
          opacity="0.55"
        />
        <path
          d="M88 140 L160 140"
          stroke="#8f5a66"
          strokeWidth="1"
          opacity="0.22"
        />

        {/* Soft lace bow resting in the empty cart */}
        <g transform="translate(120 118)" opacity="0.9">
          <path
            d="M0 -2
               C-14 -12 -22 -2 -16 8
               C-12 14 -6 10 0 2
               C6 10 12 14 16 8
               C22 -2 14 -12 0 -2 Z"
            fill="#c9a8ad"
          />
          <circle cx="0" cy="2" r="3.2" fill="#8f5a66" opacity="0.7" />
          <path
            d="M0 5 L-3 18 M0 5 L3 18"
            stroke="#8f5a66"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.55"
          />
          {/* Tiny lace scallop hint */}
          <path
            d="M-18 0 C-16 -4 -12 -4 -10 0 C-8 -4 -4 -4 -2 0"
            stroke="#8f5a66"
            strokeWidth="0.9"
            fill="none"
            opacity="0.35"
          />
          <path
            d="M2 0 C4 -4 8 -4 10 0 C12 -4 16 -4 18 0"
            stroke="#8f5a66"
            strokeWidth="0.9"
            fill="none"
            opacity="0.35"
          />
        </g>

        {/* Wheels */}
        <circle
          cx="96"
          cy="178"
          r="10"
          fill="#f3eaeb"
          stroke="#8f5a66"
          strokeWidth="1.6"
        />
        <circle cx="96" cy="178" r="3.5" fill="#8f5a66" opacity="0.45" />
        <circle
          cx="152"
          cy="178"
          r="10"
          fill="#f3eaeb"
          stroke="#8f5a66"
          strokeWidth="1.6"
        />
        <circle cx="152" cy="178" r="3.5" fill="#8f5a66" opacity="0.45" />
      </g>

      {/* Petal floating away */}
      <g className="empty-bag-petal">
        <path
          d="M188 64
             C196 56 206 60 206 70
             C206 80 196 86 188 78
             C180 86 170 80 170 70
             C170 60 180 56 188 64 Z"
          fill="#c9a8ad"
          opacity="0.7"
        />
        <path
          d="M188 66 L188 78"
          stroke="#8f5a66"
          strokeWidth="0.8"
          opacity="0.4"
        />
      </g>
    </svg>
  );
}
