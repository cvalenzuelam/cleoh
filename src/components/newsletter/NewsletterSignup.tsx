"use client";

import { useEffect, useId, useRef, useState } from "react";
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
import { useResendCooldown } from "@/lib/newsletter/use-resend-cooldown";

const RESEND_COOLDOWN_MS = 15_000;

type Props = {
  source?: string;
  variant?: "footer" | "inline";
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function NewsletterSignup({
  source = "footer",
  variant = "footer",
}: Props) {
  const formId = useId();
  const emailId = `${formId}-email`;
  const resendEmailId = `${formId}-resend-email`;
  const resendInputRef = useRef<HTMLInputElement>(null);
  const { items, ready } = useCart();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [isReturningSubscriber, setIsReturningSubscriber] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "loading" | "sent" | "error"
  >("idle");
  const [resendError, setResendError] = useState("");
  const [resendCooldownUntil, setResendCooldownUntil] = useState(0);
  const [resendEmail, setResendEmail] = useState("");
  const {
    coolingDown,
    resendLinkLabel,
    resendButtonLabel,
  } = useResendCooldown(resendCooldownUntil);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      const subscribed = isNewsletterSubscribed();
      setAlreadySubscribed(subscribed);
      if (subscribed) {
        setIsReturningSubscriber(true);
        const stored = getNewsletterEmail();
        if (stored) {
          setEmail(stored);
          setResendEmail(stored);
        }
      }
    });
  }, []);

  async function subscribe(targetEmail: string) {
    const res = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, source }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      emailSent?: boolean;
      duplicate?: boolean;
      error?: string;
    };
    return { res, data };
  }

  function validateSubscribeEmail(value: string) {
    const normalized = normalizeEmail(value);
    if (!normalized) {
      return "Escribe tu correo para recibir el código.";
    }
    if (!isValidEmail(normalized)) {
      return "Escribe un correo válido.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validateSubscribeEmail(email);
    if (validationError) {
      setStatus("error");
      setError(validationError);
      return;
    }

    setStatus("loading");

    try {
      const normalized = normalizeEmail(email);
      const { res, data } = await subscribe(normalized);

      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "No pudimos registrar tu correo.");
        return;
      }

      markNewsletterSubscribed(normalized);
      setAlreadySubscribed(true);
      setIsReturningSubscriber(Boolean(data.duplicate));
      setEmail(normalized);
      setResendEmail(normalized);
      setStatus("success");
      setResendError("");
      setResendStatus("idle");

      saveCheckoutEmail(normalized);
      if (ready && items.length) {
        syncAbandonedCartNow(normalized, items);
      }
    } catch {
      setStatus("error");
      setError("Error de conexión. Intenta de nuevo.");
    }
  }

  async function handleResendSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResendError("");

    if (coolingDown) return;

    const target = normalizeEmail(resendEmail);
    const validationError = validateSubscribeEmail(resendEmail);
    if (validationError) {
      setResendStatus("error");
      setResendError(validationError);
      resendInputRef.current?.focus();
      return;
    }

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

  async function handleQuickResend() {
    setResendError("");

    if (coolingDown) return;

    const target = normalizeEmail(email);
    if (!isValidEmail(target)) {
      setResendStatus("error");
      setResendError("No tenemos tu correo guardado. Escríbelo abajo.");
      resendInputRef.current?.focus();
      return;
    }

    setResendStatus("loading");

    try {
      const { res, data } = await subscribe(target);

      if (!res.ok || !data.ok) {
        setResendStatus("error");
        setResendError(data.error ?? "No pudimos reenviar el correo.");
        return;
      }

      markNewsletterSubscribed(target);
      setResendEmail(target);
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
        ? "text-porcelain underline-offset-4 transition-all duration-200 hover:text-porcelain hover:underline active:opacity-80"
        : "text-ink underline-offset-4 transition-all duration-200 hover:text-rose hover:underline active:opacity-80";
    const hasStoredEmail = isValidEmail(email);
    const resendInputClass =
      variant === "footer"
        ? "min-w-0 flex-1 border bg-porcelain/10 px-3 py-2 text-sm text-porcelain placeholder:text-porcelain/40 outline-none transition-colors focus:bg-porcelain/15"
        : "input-soft flex-1 py-2";
    const resendInputInvalidClass =
      resendStatus === "error" && resendError
        ? variant === "footer"
          ? "border-rose/70 focus:border-rose"
          : "border-rose focus:border-rose"
        : variant === "footer"
          ? "border-porcelain/20 focus:border-porcelain/40"
          : "";

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
          {isReturningSubscriber
            ? `${site.newsletter.successReturning} ${site.coupon.code}`
            : `${site.newsletter.successNew} ${site.coupon.code}`}
        </p>
        <p className={`mt-2 text-sm ${muted}`}>
          {hasStoredEmail ? (
            isReturningSubscriber ? (
              <>
                Si no lo encuentras, revisa tu correo en{" "}
                <span className="font-medium">{email}</span> o reenvíalo abajo.{" "}
              </>
            ) : (
              <>También lo enviamos a {email}. </>
            )
          ) : null}
          Escríbelo al pagar en checkout.
        </p>

        <div className="mt-3 space-y-2">
          {resendStatus === "sent" ? (
            <p className={`text-xs ${muted}`} role="status">
              Listo — revisa tu bandeja (y spam).
            </p>
          ) : null}

          {hasStoredEmail ? (
            <button
              type="button"
              onClick={handleQuickResend}
              disabled={resendStatus === "loading" || coolingDown}
              className={`pressable text-xs font-semibold ${linkClass} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {resendStatus === "loading"
                ? "Reenviando…"
                : resendLinkLabel}
            </button>
          ) : null}

          <form
            onSubmit={handleResendSubmit}
            noValidate
            className={
              hasStoredEmail
                ? "sr-only"
                : "flex flex-col gap-2 sm:flex-row sm:items-stretch"
            }
            aria-hidden={hasStoredEmail}
          >
            <label htmlFor={resendEmailId} className="sr-only">
              Email para reenviar
            </label>
            <input
              ref={resendInputRef}
              id={resendEmailId}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={resendEmail}
              onChange={(e) => {
                setResendEmail(e.target.value);
                if (resendError) {
                  setResendError("");
                  setResendStatus("idle");
                }
              }}
              className={`${resendInputClass} ${resendInputInvalidClass}`}
              placeholder="tu@email.com"
              disabled={resendStatus === "loading" || coolingDown}
              aria-invalid={resendStatus === "error" && Boolean(resendError)}
              aria-describedby={
                resendStatus === "error" && resendError
                  ? `${resendEmailId}-error`
                  : undefined
              }
            />
            <button
              type="submit"
              disabled={resendStatus === "loading" || coolingDown}
              className={
                variant === "footer"
                  ? "btn btn-light shrink-0 px-4 py-2 text-xs"
                  : "btn btn-secondary shrink-0 px-4 py-2 text-xs"
              }
            >
              {resendStatus === "loading" ? "Enviando…" : resendButtonLabel}
            </button>
          </form>

          {!hasStoredEmail ? (
            <p className={`text-xs ${muted}`}>
              Escribe el correo con el que te suscribiste para reenviar el
              código.
            </p>
          ) : null}

          {resendStatus === "error" && resendError ? (
            <p
              id={`${resendEmailId}-error`}
              className="text-xs text-rose"
              role="alert"
            >
              {resendError}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const inputClass =
    variant === "footer"
      ? "min-w-0 flex-1 border bg-porcelain/10 px-4 py-3 text-sm text-porcelain placeholder:text-porcelain/40 outline-none transition-colors focus:bg-porcelain/15"
      : "input-soft mt-1.5";
  const inputInvalidClass =
    status === "error" && error
      ? variant === "footer"
        ? "border-rose/70 focus:border-rose"
        : "border-rose focus:border-rose"
      : variant === "footer"
        ? "border-porcelain/20 focus:border-porcelain/40 focus:bg-porcelain/15"
        : "";

  const buttonClass =
    variant === "footer"
      ? "btn btn-light shrink-0 px-6 sm:px-8"
      : "btn btn-primary w-full";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
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
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) {
              setError("");
              setStatus("idle");
            }
          }}
          className={`${inputClass} ${inputInvalidClass}`}
          placeholder="tu@email.com"
          disabled={status === "loading"}
          aria-invalid={status === "error" && Boolean(error)}
          aria-describedby={
            status === "error" && error ? `${emailId}-error` : undefined
          }
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
          id={`${emailId}-error`}
          className={
            variant === "footer"
              ? "mt-2 text-xs text-rose/90"
              : "text-xs text-rose"
          }
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
