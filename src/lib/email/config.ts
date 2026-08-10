import "server-only";

import { cleanEnv } from "@/lib/env/clean";
import { site } from "@/data/site";

export function getEmailConfig() {
  const apiKey = cleanEnv(process.env.RESEND_API_KEY);
  const from = cleanEnv(process.env.EMAIL_FROM);
  return {
    apiKey,
    from,
    configured: Boolean(apiKey && from),
  };
}

export function getOrderNotifyEmail() {
  return cleanEnv(process.env.ORDER_NOTIFY_EMAIL) || site.orderNotifyEmail;
}
