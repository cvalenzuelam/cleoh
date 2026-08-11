"use client";

import { useEffect, useRef } from "react";
import { trackMetaCommerceEvent } from "@/lib/analytics/metaPixel";

type Props = {
  productId: string;
  name: string;
  price: number;
};

/** ViewContent una vez por visita a la ficha (pixel + CAPI). */
export function ProductViewContent({ productId, name, price }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    trackMetaCommerceEvent("ViewContent", {
      content_ids: [productId],
      content_name: name,
      content_type: "product",
      value: price,
      currency: "MXN",
    });
  }, [productId, name, price]);

  return null;
}
