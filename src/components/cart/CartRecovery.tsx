"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { saveCheckoutEmail } from "@/lib/cart/abandon-client";
import type { CartItem } from "@/lib/cart/types";

export function CartRecovery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { restoreItems } = useCart();
  const handledRef = useRef(false);

  useEffect(() => {
    const token = searchParams.get("recover")?.trim();
    if (!token || handledRef.current) return;
    handledRef.current = true;

    void (async () => {
      try {
        const res = await fetch(
          `/api/cart/recover?token=${encodeURIComponent(token)}`,
        );
        if (!res.ok) {
          router.replace("/carrito");
          return;
        }

        const data = (await res.json()) as {
          email?: string;
          items?: CartItem[];
        };

        if (data.items?.length) {
          restoreItems(data.items);
        }
        if (data.email) {
          saveCheckoutEmail(data.email);
        }
      } finally {
        router.replace("/carrito");
      }
    })();
  }, [searchParams, router, restoreItems]);

  return null;
}
