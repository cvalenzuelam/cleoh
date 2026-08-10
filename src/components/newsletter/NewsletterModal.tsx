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
import {
  markNewsletterDismissed,
  markNewsletterSubscribed,
  shouldShowNewsletterPopup,
} from "@/lib/newsletter/client-storage";
import { site } from "@/data/site";

const OPEN_DELAY_MS = 6000;

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
  const [resendStatus, setResendStatus] = useState<
    "idle" | "loading" | "sent" | "error"
  >("idle");
  const [resendError, setResendError] = useState("");
  const [resendCooldownUntil, setResendCooldownUntil] = useState(0);
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const RESEND_COOLDOWN_MS = 45_000;

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!mounted || !shouldShowNewsletterPopup(pathname)) return;

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
    if (status !== "success") markNewsletterDismissed();
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

      const normalized = email.trim().toLowerCase();
      markNewsletterSubscribed(normalized);
      setEmail(normalized);
      setEmailSent(Boolean(data.emailSent));
      setStatus("success");
      saveCheckoutEmail(normalized);
      if (ready && items.length) {
        syncAbandonedCartNow(normalized, items);
      }
    } catch {
      setStatus("error");
      setError("Error de conexión. Intenta de nuevo.");
    }
  }

  useEffect(() => {
    if (!resendCooldownUntil) return;
    const remaining = resendCooldownUntil - Date.now();
    if (remaining <= 0) {
      setResendCooldownUntil(0);
      return;
    }
    const timer = window.setTimeout(() => {
      setResendCooldownUntil(0);
      setResendStatus("idle");
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [resendCooldownUntil]);

  async function handleResend() {
    const target = email.trim().toLowerCase();
    if (!target || Date.now() < resendCooldownUntil) return;

    setResendError("");
    setResendStatus("loading");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target, source: "popup-resend" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        emailSent?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setResendStatus("error");
        setResendError(data.error ?? "No pudimos reenviar el correo.");
        return;
      }

      markNewsletterSubscribed(target);
      setEmailSent(Boolean(data.emailSent));
      if (!data.emailSent) {
        setResendStatus("error");
        setResendError("No pudimos enviar el correo ahora. Intenta más tarde.");
        return;
      }
      setResendStatus("sent");
      setResendCooldownUntil(Date.now() + RESEND_COOLDOWN_MS);
    } catch {
      setResendStatus("error");
      setResendError("Error de conexión. Intenta de nuevo.");
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
            <button
              type="button"
              aria-label="Cerrar"
              onClick={handleDismiss}
              className="absolute inset-0 cursor-default bg-ink/30 pointer-events-auto"
            />
            <div
              role="dialog"
              aria-labelledby={titleId}
              aria-modal="true"
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
                    {email ? (
                      <div className="mt-3">
                        {resendStatus === "sent" ? (
                          <p className="text-xs text-ink-soft" role="status">
                            Listo — revisa tu bandeja (y spam).
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResend}
                            disabled={
                              resendStatus === "loading" ||
                              Date.now() < resendCooldownUntil
                            }
                            className="text-xs text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline disabled:opacity-50"
                          >
                            {resendStatus === "loading"
                              ? "Reenviando…"
                              : Date.now() < resendCooldownUntil
                                ? "Espera un momento para reenviar"
                                : "¿No te llegó? Reenviar correo"}
                          </button>
                        )}
                        {resendStatus === "error" && resendError ? (
                          <p className="mt-2 text-xs text-rose" role="alert">
                            {resendError}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
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
                      {site.newsletter.description}
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
