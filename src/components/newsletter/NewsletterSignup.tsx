"use client";

import { useEffect, useId, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import {
  saveCheckoutEmail,
  syncAbandonedCartNow,
} from "@/lib/cart/abandon-client";
import {
  getNewsletterEmail,
  isNewsletterSubscribed,
  markNewsletterSubscribed,
} from "@/lib/newsletter/client-storage";
import { site } from "@/data/site";

const RESEND_COOLDOWN_MS = 45_000;

type Props = {
  source?: string;
  variant?: "footer" | "inline";
};

export function NewsletterSignup({
  source = "footer",
  variant = "footer",
}: Props) {
  const formId = useId();
  const emailId = `${formId}-email`;
  const resendEmailId = `${formId}-resend-email`;
  const { items, ready } = useCart();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "loading" | "sent" | "error"
  >("idle");
  const [resendError, setResendError] = useState("");
  const [resendCooldownUntil, setResendCooldownUntil] = useState(0);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [resendEmail, setResendEmail] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      const subscribed = isNewsletterSubscribed();
      setAlreadySubscribed(subscribed);
      if (subscribed) {
        const stored = getNewsletterEmail();
        if (stored) {
          setEmail(stored);
          setResendEmail(stored);
        }
      }
    });
  }, []);

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

  async function subscribe(targetEmail: string) {
    const res = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, source }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      emailSent?: boolean;
      error?: string;
    };
    return { res, data };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");

    try {
      const { res, data } = await subscribe(email);

      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "No pudimos registrar tu correo.");
        return;
      }

      const normalized = email.trim().toLowerCase();
      markNewsletterSubscribed(normalized);
      setAlreadySubscribed(true);
      setEmail(normalized);
      setResendEmail(normalized);
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

  async function handleResend() {
    const target = (email || resendEmail).trim().toLowerCase();
    if (!target) {
      setShowResendEmail(true);
      return;
    }

    if (Date.now() < resendCooldownUntil) return;

    setResendError("");
    setResendStatus("loading");

    try {
      const { res, data } = await subscribe(target);

      if (!res.ok || !data.ok) {
        setResendStatus("error");
        setResendError(data.error ?? "No pudimos reenviar el correo.");
        return;
      }

      markNewsletterSubscribed(target);
      setEmail(target);
      setResendEmail(target);
      setResendStatus(data.emailSent ? "sent" : "error");
      if (!data.emailSent) {
        setResendError("No pudimos enviar el correo ahora. Intenta más tarde.");
        return;
      }
      setResendCooldownUntil(Date.now() + RESEND_COOLDOWN_MS);
      setShowResendEmail(false);
    } catch {
      setResendStatus("error");
      setResendError("Error de conexión. Intenta de nuevo.");
    }
  }

  if (!mounted) {
    return (
      <div
        className={
          variant === "footer" ? "mt-5 h-11 animate-pulse bg-porcelain/10" : ""
        }
        aria-hidden
      />
    );
  }

  if (alreadySubscribed || status === "success") {
    const muted =
      variant === "footer" ? "text-porcelain/70" : "text-ink-soft";
    const linkClass =
      variant === "footer"
        ? "text-porcelain/80 underline-offset-2 transition-colors hover:text-porcelain hover:underline"
        : "text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline";
    const coolingDown = Date.now() < resendCooldownUntil;
    const knownEmail = Boolean(email || resendEmail);

    return (
      <div
        className={
          variant === "footer"
            ? "mt-5 rounded-sm border border-porcelain/15 bg-porcelain/5 px-4 py-4"
            : "mt-4 rounded-sm border border-line bg-petal/40 px-4 py-4"
        }
      >
        <p
          className={
            variant === "footer"
              ? "font-display text-xl tracking-wide text-porcelain"
              : "font-display text-2xl tracking-wide text-ink"
          }
        >
          ¡Listo! Tu código es {site.coupon.code}
        </p>
        <p className={`mt-2 text-sm ${muted}`}>
          {email ? `También lo enviamos a ${email}. ` : null}
          Escríbelo al pagar en checkout.
        </p>

        <div className="mt-3">
          {resendStatus === "sent" ? (
            <p className={`text-xs ${muted}`} role="status">
              Listo — revisa tu bandeja (y spam). Puedes reenviar de nuevo en un
              momento.
            </p>
          ) : showResendEmail || !knownEmail ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <label htmlFor={resendEmailId} className="sr-only">
                Email para reenviar
              </label>
              <input
                id={resendEmailId}
                type="email"
                required
                autoComplete="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className={
                  variant === "footer"
                    ? "min-w-0 flex-1 border border-porcelain/20 bg-porcelain/10 px-3 py-2 text-sm text-porcelain placeholder:text-porcelain/40 outline-none focus:border-porcelain/40"
                    : "input-soft flex-1 py-2"
                }
                placeholder="tu@email.com"
                disabled={resendStatus === "loading"}
              />
              <button
                type="button"
                onClick={handleResend}
                disabled={resendStatus === "loading" || coolingDown}
                className={
                  variant === "footer"
                    ? "btn btn-light shrink-0 px-4 py-2 text-xs"
                    : "btn btn-secondary shrink-0 px-4 py-2 text-xs"
                }
              >
                {resendStatus === "loading" ? "Enviando…" : "Reenviar"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendStatus === "loading" || coolingDown}
              className={`text-xs ${linkClass} disabled:opacity-50`}
            >
              {resendStatus === "loading"
                ? "Reenviando…"
                : coolingDown
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
      </div>
    );
  }

  const inputClass =
    variant === "footer"
      ? "min-w-0 flex-1 border border-porcelain/20 bg-porcelain/10 px-4 py-3 text-sm text-porcelain placeholder:text-porcelain/40 outline-none transition-colors focus:border-porcelain/40 focus:bg-porcelain/15"
      : "input-soft mt-1.5";

  const buttonClass =
    variant === "footer"
      ? "btn btn-light shrink-0 px-6 sm:px-8"
      : "btn btn-primary w-full";

  return (
    <form
      onSubmit={handleSubmit}
      className={variant === "footer" ? "mt-5" : "mt-4 space-y-4"}
    >
      <div
        className={
          variant === "footer"
            ? "flex flex-col gap-3 sm:flex-row sm:items-stretch"
            : undefined
        }
      >
        <label htmlFor={emailId} className="sr-only">
          Email
        </label>
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="tu@email.com"
          disabled={status === "loading"}
        />
        <button
          type="submit"
          className={buttonClass}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Enviando…" : "Recibir 10%"}
        </button>
      </div>
      {status === "error" && error ? (
        <p
          className={
            variant === "footer"
              ? "mt-2 text-xs text-rose/90"
              : "text-xs text-rose"
          }
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
