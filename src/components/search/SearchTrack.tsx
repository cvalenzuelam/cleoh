"use client";

import { useEffect, useRef } from "react";
import { trackMetaCommerceEvent } from "@/lib/analytics/metaPixel";

type Props = {
  term: string;
  resultIds: string[];
};

/**
 * Search se mide en la página de resultados y no en el panel: ahí el término
 * ya es una intención deliberada y no cada tecla que el usuario escribe.
 */
export function SearchTrack({ term, resultIds }: Props) {
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (term.length < 2 || lastTracked.current === term) return;
    lastTracked.current = term;

    trackMetaCommerceEvent("Search", {
      search_string: term,
      content_type: "product",
      content_ids: resultIds,
    });
  }, [term, resultIds]);

  return null;
}
