"use client";

import { useSearch } from "@/components/search/SearchProvider";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="11"
        cy="11"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <path
        d="M16.2 16.2L20 20"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SearchTrigger({ className }: { className?: string }) {
  const { openSearch } = useSearch();

  return (
    <button
      type="button"
      onClick={openSearch}
      className={`pressable group inline-flex items-center text-ink ${className ?? ""}`}
      aria-label="Buscar productos"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 group-hover:bg-petal">
        <SearchIcon />
      </span>
    </button>
  );
}
