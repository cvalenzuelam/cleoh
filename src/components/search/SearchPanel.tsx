"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearch } from "@/components/search/SearchProvider";
import {
  SearchDiscoverStrip,
  type DiscoverCategory,
} from "@/components/search/SearchDiscoverStrip";
import { SearchProductRow } from "@/components/search/SearchProductRow";
import type { SearchHit } from "@/lib/search/types";

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function SearchPanel({
  discoverCategories = [],
  suggestedProducts = [],
}: {
  discoverCategories?: DiscoverCategory[];
  suggestedProducts?: SearchHit[];
}) {
  const { open, closeSearch } = useSearch();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const listboxId = useId();

  const trimmed = query.trim();
  const showViewAll = trimmed.length >= 2 && total > results.length;
  const showDiscover = trimmed.length < 2 && discoverCategories.length > 0;
  const showSuggestions =
    trimmed.length < 2 ||
    (!loading && trimmed.length >= 2 && results.length === 0);
  const suggestionNavCount = showSuggestions ? suggestedProducts.length : 0;
  const searchNavCount =
    trimmed.length >= 2 && results.length > 0
      ? results.length + (showViewAll ? 1 : 0)
      : 0;
  const navigableCount = suggestionNavCount || searchNavCount;

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(-1);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setTotal(0);
      setLoading(false);
      setActiveIndex(-1);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results, trimmed, suggestedProducts]);

  useEffect(() => {
    if (!open || trimmed.length < 2) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&limit=6`,
        );
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as {
          results?: SearchHit[];
          total?: number;
        };
        setResults(data.results ?? []);
        setTotal(data.total ?? 0);
      } catch {
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [open, trimmed]);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-search-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const goToResults = useCallback(
    (term: string) => {
      const q = term.trim();
      if (q.length < 2) return;
      closeSearch();
      router.push(`/buscar?q=${encodeURIComponent(q)}`);
    },
    [closeSearch, router],
  );

  const goToProduct = useCallback(
    (slug: string) => {
      closeSearch();
      router.push(`/producto/${slug}`);
    },
    [closeSearch, router],
  );

  const goToSuggestedProduct = useCallback(
    (slug: string) => {
      closeSearch();
      router.push(`/producto/${slug}`);
    },
    [closeSearch, router],
  );

  const handleSelectIndex = useCallback(
    (index: number) => {
      if (showSuggestions) {
        const hit = suggestedProducts[index];
        if (hit) goToSuggestedProduct(hit.slug);
        return;
      }

      if (index < 0 || index >= results.length) {
        if (index === results.length && showViewAll) {
          goToResults(trimmed);
        }
        return;
      }
      goToProduct(results[index]!.slug);
    },
    [
      goToProduct,
      goToResults,
      goToSuggestedProduct,
      results,
      showSuggestions,
      showViewAll,
      suggestedProducts,
      trimmed,
    ],
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeSearch();
      return;
    }

    if (e.key === "ArrowDown") {
      if (navigableCount === 0) return;
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < navigableCount - 1 ? prev + 1 : 0,
      );
      return;
    }

    if (e.key === "ArrowUp") {
      if (navigableCount === 0) return;
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : navigableCount - 1,
      );
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) {
        handleSelectIndex(activeIndex);
      } else if (trimmed.length >= 2) {
        goToResults(trimmed);
      }
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-ink/20 backdrop-blur-[1px]"
        aria-label="Cerrar búsqueda"
        onClick={closeSearch}
      />
      <div
        className="search-panel relative border-b border-line bg-porcelain shadow-[0_12px_40px_rgba(26,20,22,0.08)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <label id={labelId} className="sr-only" htmlFor="site-search-input">
              Buscar productos
            </label>
            <input
              ref={inputRef}
              id="site-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Buscar babydolls, pijamas, coordinados…"
              className="search-input flex-1"
              role="combobox"
              aria-expanded={navigableCount > 0}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                activeIndex >= 0
                  ? `${listboxId}-option-${activeIndex}`
                  : undefined
              }
              autoComplete="off"
            />
            <button
              type="button"
              onClick={closeSearch}
              className="pressable inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-petal hover:text-ink"
              aria-label="Cerrar búsqueda"
            >
              <CloseIcon />
            </button>
          </div>

          {showDiscover && (
            <SearchDiscoverStrip
              categories={discoverCategories}
              onNavigate={closeSearch}
            />
          )}

          <div ref={listRef} className="mt-4 max-h-[min(52vh,480px)] overflow-y-auto">
            {trimmed.length < 2 ? (
              suggestedProducts.length > 0 ? (
                <section>
                  <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-ink-soft">
                    Te puede interesar
                  </p>
                  <ul
                    id={listboxId}
                    role="listbox"
                    aria-label="Productos sugeridos"
                    className="mt-3 divide-y divide-line"
                  >
                    {suggestedProducts.map((hit, index) => (
                      <SearchProductRow
                        key={hit.id}
                        hit={hit}
                        active={activeIndex === index}
                        index={index}
                        listboxId={listboxId}
                        onSelect={() => goToSuggestedProduct(hit.slug)}
                        onHover={() => setActiveIndex(index)}
                      />
                    ))}
                  </ul>
                </section>
              ) : null
            ) : loading ? (
              <p className="py-6 text-sm text-ink-soft">Buscando…</p>
            ) : results.length === 0 ? (
              <div className="py-2">
                <p className="text-sm text-ink-soft">
                  No encontramos piezas para &ldquo;{trimmed}&rdquo;. Quizá te
                  interesa:
                </p>
                {suggestedProducts.length > 0 ? (
                  <ul
                    id={listboxId}
                    role="listbox"
                    aria-label="Productos sugeridos"
                    className="mt-3 divide-y divide-line"
                  >
                    {suggestedProducts.map((hit, index) => (
                      <SearchProductRow
                        key={hit.id}
                        hit={hit}
                        active={activeIndex === index}
                        index={index}
                        listboxId={listboxId}
                        onSelect={() => goToSuggestedProduct(hit.slug)}
                        onHover={() => setActiveIndex(index)}
                      />
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <ul
                id={listboxId}
                role="listbox"
                aria-label="Resultados de búsqueda"
                className="divide-y divide-line"
              >
                {results.map((hit, index) => (
                  <SearchProductRow
                    key={hit.id}
                    hit={hit}
                    active={activeIndex === index}
                    index={index}
                    listboxId={listboxId}
                    onSelect={() => goToProduct(hit.slug)}
                    onHover={() => setActiveIndex(index)}
                  />
                ))}

                {showViewAll && (
                  <li
                    id={`${listboxId}-option-${results.length}`}
                    role="option"
                    aria-selected={activeIndex === results.length}
                    data-search-index={results.length}
                  >
                    <button
                      type="button"
                      className={`search-result-row pressable w-full py-3 text-center text-[0.68rem] font-medium uppercase tracking-[0.2em] text-ink transition-colors ${
                        activeIndex === results.length
                          ? "bg-petal text-rose"
                          : "hover:bg-petal/60 hover:text-rose"
                      }`}
                      onClick={() => goToResults(trimmed)}
                      onMouseEnter={() => setActiveIndex(results.length)}
                    >
                      Ver los {total} resultados
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
