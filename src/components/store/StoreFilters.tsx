"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  STORE_SORT_OPTIONS,
  parseStoreSort,
  type StoreSort,
} from "@/lib/catalog/store-filters";

type CategoryOption = { slug: string; name: string };

type Props = {
  categories: CategoryOption[];
  totalCount: number;
  filteredCount: number;
};

export function StoreFilters({
  categories,
  totalCount,
  filteredCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categorySlug = searchParams.get("categoria") ?? "";
  const sort = parseStoreSort(searchParams.get("orden") ?? undefined);

  const pushParams = useCallback(
    (next: { categoria?: string; orden?: StoreSort }) => {
      const params = new URLSearchParams(searchParams.toString());

      const cat =
        next.categoria !== undefined ? next.categoria : categorySlug;
      const orden = next.orden !== undefined ? next.orden : sort;

      if (cat) params.set("categoria", cat);
      else params.delete("categoria");

      if (orden && orden !== "novedades") params.set("orden", orden);
      else params.delete("orden");

      const q = params.toString();
      router.push(q ? `/tienda?${q}` : "/tienda", { scroll: false });
    },
    [categorySlug, router, searchParams, sort],
  );

  return (
    <div className="animate-fade-up-delay mt-8 space-y-5 border-b border-line pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-ink-soft">
          {filteredCount === totalCount ? (
            <>
              {filteredCount}{" "}
              {filteredCount === 1 ? "pieza" : "piezas"}
            </>
          ) : (
            <>
              {filteredCount} de {totalCount}{" "}
              {totalCount === 1 ? "pieza" : "piezas"}
            </>
          )}
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.62rem] font-medium uppercase tracking-[0.18em] text-ink-soft">
            Ordenar
          </span>
          <select
            value={sort}
            onChange={(e) =>
              pushParams({ orden: parseStoreSort(e.target.value) })
            }
            className="input-soft min-w-[11rem] cursor-pointer py-2.5 pr-8 text-sm"
            aria-label="Ordenar productos"
          >
            {STORE_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.18em] text-ink-soft">
          Categoría
        </p>
        <ul className="stagger-list mt-3 flex flex-wrap gap-2">
          <li>
            <button
              type="button"
              onClick={() => pushParams({ categoria: "" })}
              className={`chip ${!categorySlug ? "chip-active" : ""}`}
            >
              Todas
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.slug}>
              <button
                type="button"
                onClick={() => pushParams({ categoria: cat.slug })}
                className={`chip ${
                  categorySlug === cat.slug ? "chip-active" : ""
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
