"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Re-dispara la animación de entrada al cambiar de ruta en la tienda. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
