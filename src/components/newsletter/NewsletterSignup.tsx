"use client";

import { useEffect, useId, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import {
  saveCheckoutEmail,
  syncAbandonedCartNow,
} from "@/lib/cart/abandon-client";
import {
  isNewsletterSubscribed,
  markNewsletterSubscribed,
} from "@/lib/newsletter/client-storage";
import { site } from "@/data/site";

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
  const { items, ready } = useCart();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      setAlreadySubscribed(isNewsletterSubscribed());
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        emailSent?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error ?? "No pudimos registrar tu correo.");
        return;
      }

      markNewsletterSubscribed();
      setAlreadySubscribed(true);
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
        <p
          className={
            variant === "footer"
              ? "mt-2 text-sm text-porcelain/70"
              : "mt-2 text-sm text-ink-soft"
          }
        >
          {emailSent && email
            ? `También lo enviamos a ${email}. `
            : null}
          Escríbelo al pagar en checkout.
        </p>
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
