"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/data/site";

const INTERVAL_MS = 4500;

/** Banner superior: rota entre promos de envío y cupón */
export function AnnouncementBar() {
  const messages = site.announcements;
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (messages.length < 2) return;

    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 280);
    }, INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [messages.length]);

  const message = messages[index] ?? messages[0];

  return (
    <div className="bg-ink text-center uppercase tracking-[0.18em] text-porcelain">
      <div className="relative mx-auto flex h-11 max-w-7xl items-center justify-center px-4 sm:h-12">
        <Link
          href="/tienda"
          className={`absolute inset-x-4 flex items-center justify-center text-[0.7rem] font-medium transition-opacity duration-300 hover:opacity-80 sm:text-[0.75rem] ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          {message}
        </Link>
      </div>
    </div>
  );
}
