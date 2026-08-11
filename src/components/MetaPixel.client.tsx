"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackMetaEvent } from "@/lib/analytics/metaPixel";

/**
 * El snippet base ya dispara el PageView de la primera carga; aquí solo se
 * cubren las navegaciones del App Router, que no vuelven a ejecutarlo.
 */
export function MetaPixelRouteChange() {
  const pathname = usePathname();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    trackMetaEvent("PageView");
  }, [pathname]);

  return null;
}
