"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/components/cart/CartProvider";
import {
  saveCheckoutEmail,
  syncAbandonedCartNow,
} from "@/lib/cart/abandon-client";
import { site } from "@/data/site";

const STORAGE_KEY = "cleoh-newsletter";
const OPEN_DELAY_MS = 6000;
const DISMISS_DAYS = 7;

const SKIP_PATH_PREFIXES = ["/checkout", "/carrito"];

type StorageState =
  | { subscribed: true }
  | { dismissedUntil: number };

function readStorage(): StorageState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StorageState;
  } catch {
    return null;
  }
}

function shouldShowPopup(pathname: string) {
  if (SKIP_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }

  const stored = readStorage();
  if (stored && "subscribed" in stored && stored.subscribed) return false;
  if (stored && "dismissedUntil" in stored && stored.dismissedUntil > Date.now()) {
    return false;
  }

  return true;
}

function markSubscribed() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ subscribed: true }));
}

function markDismissed() {
  const dismissedUntil = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissedUntil }));
}

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

export function NewsletterModal() {
  const pathname = usePathname();
  const { items, ready } = useCart();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!mounted || !shouldShowPopup(pathname)) return;

    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [mounted, pathname]);

  useEffect(() => {
    if (!open) return;

    if (status === "idle") {
      inputRef.current?.focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, status]);

  function handleDismiss() {
    if (status !== "success") markDismissed();
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "popup" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        code?: string;
        emailSent?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "No pudimos registrar tu correo.");
        return;
      }

      markSubscribed();
      setEmailSent(Boolean(data.emailSent));
      setStatus("success");
      const normalized = email.trim().toLowerCase();
      saveCheckoutEmail(normalized);
      if (ready && items.length) {
        syncAbandonedCartNow(normalized, items);
      }
    } catch {
      setStatus("error");
      setError("Error de conexión. Intenta de nuevo.");
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(site.coupon.code);
    } catch {
      /* clipboard opcional */
    }
  }

  const modal =
    open && mounted
      ? createPortal(
          <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-ink/30 pointer-events-none"
              aria-hidden
            />
            <div
              role="dialog"
              aria-labelledby={titleId}
              className="relative pointer-events-auto w-full max-w-md animate-fade-up bg-porcelain shadow-[0_24px_80px_rgba(26,20,22,0.18)] sm:rounded-sm"
            >
              <div className="relative border-b border-line px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={handleDismiss}
                  aria-label="Cerrar"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-sm text-ink-soft transition-colors hover:bg-petal hover:text-ink sm:right-4 sm:top-4"
                >
                  <CloseIcon />
                </button>
                <h2
                  id={titleId}
                  className="pr-10 font-display text-2xl tracking-wide text-ink sm:text-3xl"
                >
                  {status === "success"
                    ? "¡Listo!"
                    : "10% en tu primera compra"}
                </h2>
              </div>

              <div className="px-5 py-5 sm:px-6 sm:py-6">
                {status === "success" ? (
                  <div className="text-center">
                    <p className="text-sm text-ink-soft">
                      Tu código de descuento:
                    </p>
                    <p className="mt-3 font-display text-4xl tracking-[0.12em] text-ink">
                      {site.coupon.code}
                    </p>
                    <p className="mt-2 text-xs text-ink-soft">
                      {site.coupon.label} · escríbelo al pagar
                    </p>
                    {emailSent ? (
                      <p className="mt-4 text-xs text-ink-soft">
                        También lo enviamos a{" "}
                        <span className="text-ink">{email}</span>
                      </p>
                    ) : (
                      <p className="mt-4 text-xs text-ink-soft">
                        Guárdalo — lo necesitarás en checkout.
                      </p>
                    )}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                      <button
                        type="button"
                        onClick={copyCode}
                        className="btn btn-secondary w-full sm:w-auto"
                      >
                        Copiar código
                      </button>
                      <Link
                        href="/tienda"
                        className="btn btn-primary w-full sm:w-auto"
                        onClick={() => setOpen(false)}
                      >
                        Ver la tienda
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed text-ink-soft">
                      Déjanos tu email y te enviamos un código del 10% de
                      descuento para tu primera compra.
                    </p>
                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                      <div>
                        <label
                          htmlFor="newsletter-email"
                          className="text-[0.65rem] uppercase tracking-[0.18em] text-ink"
                        >
                          Email
                        </label>
                        <input
                          ref={inputRef}
                          id="newsletter-email"
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input-soft mt-1.5"
                          placeholder="tu@email.com"
                          disabled={status === "loading"}
                        />
                      </div>
                      {status === "error" && error ? (
                        <p className="text-xs text-rose">{error}</p>
                      ) : null}
                      <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={status === "loading"}
                      >
                        {status === "loading"
                          ? "Enviando…"
                          : "Recibir mi 10% de descuento"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return modal;
}
