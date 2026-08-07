import "server-only";

import { sendNewsletterWelcomeEmail } from "@/lib/email/newsletter";
import { createServiceClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeNewsletterEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export function isValidNewsletterEmail(email: string) {
  return EMAIL_RE.test(email) && email.length <= 254;
}

export async function subscribeNewsletter(input: {
  email: string;
  source?: string;
}) {
  const email = normalizeNewsletterEmail(input.email);
  if (!isValidNewsletterEmail(email)) {
    return { ok: false as const, error: "Correo inválido." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({
    email,
    source: input.source?.trim() || "popup",
  });

  const duplicate = error?.code === "23505";
  if (error && !duplicate) {
    console.error("[newsletter] No se pudo guardar suscriptor:", error.message);
    return {
      ok: false as const,
      error: "No pudimos guardar tu correo. Intenta de nuevo.",
    };
  }

  const emailResult = await sendNewsletterWelcomeEmail(email);
  if (!emailResult.sent && emailResult.reason !== "missing_config") {
    console.warn("[newsletter] Suscriptor guardado pero falló el correo:", emailResult.reason);
  }

  return {
    ok: true as const,
    code: "CLEOH10",
    duplicate,
    emailSent: emailResult.sent,
  };
}
