type AdminProductThumbnailProps = {
  src: string | null;
  alt: string;
  className?: string;
};

export function AdminProductThumbnail({
  src,
  alt,
  className = "h-10 w-10 shrink-0 rounded-md object-cover bg-zinc-100 ring-1 ring-zinc-200/80",
}: AdminProductThumbnailProps) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center text-[0.65rem] font-medium uppercase tracking-wide text-zinc-400 ${className}`}
        aria-hidden
      >
        —
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
