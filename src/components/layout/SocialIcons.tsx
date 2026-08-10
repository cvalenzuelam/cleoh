import { site } from "@/data/site";

type Props = {
  /** ink = dark icons on light bg; light = porcelain on dark footer */
  tone?: "ink" | "light";
  className?: string;
};

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
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
        strokeWidth="1.35"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.35" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.5l.5-3H14V9c0-.6.4-1 1-1Z" />
    </svg>
  );
}

export function SocialIcons({ tone = "ink", className = "" }: Props) {
  const color =
    tone === "light"
      ? "text-porcelain/75 hover:text-porcelain"
      : "text-ink hover:text-rose";

  return (
    <div className={`flex items-center gap-7 ${className}`}>
      <a
        href={site.social.facebook}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook Cleoh"
        className={`inline-flex scale-100 transition-transform duration-300 hover:scale-110 ${color}`}
      >
        <FacebookIcon />
      </a>
      <a
        href={site.social.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Instagram ${site.social.instagramHandle}`}
        className={`inline-flex translate-y-[2px] scale-100 transition-transform duration-300 hover:scale-110 ${color}`}
      >
        <InstagramIcon />
      </a>
    </div>
  );
}
