"use client";

import { useEffect, useState } from "react";

function isIosSafariBrowser() {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isStandalone =
    ("standalone" in window.navigator &&
      Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone,
      )) ||
    window.matchMedia("(display-mode: standalone)").matches;

  return isIos && !isStandalone;
}

export function AdminInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIosSafariBrowser()) return;
    if (window.localStorage.getItem("cleoh-admin-install-hint") === "dismissed") {
      return;
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 [padding-top:max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-start gap-3">
        <p className="flex-1 text-sm leading-snug text-zinc-200">
          Para usarlo como app en tu iPhone: pulsa{" "}
          <span className="font-medium text-white">Compartir</span> y elige{" "}
          <span className="font-medium text-white">
            Agregar a pantalla de inicio
          </span>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem("cleoh-admin-install-hint", "dismissed");
            setVisible(false);
          }}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          OK
        </button>
      </div>
    </div>
  );
}
