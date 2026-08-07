import "server-only";

import { cleanEnv } from "@/lib/env/clean";

export function getWhatsAppConfig() {
  const accessToken = cleanEnv(process.env.WHATSAPP_ACCESS_TOKEN);
  const phoneNumberId = cleanEnv(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const verifyToken = cleanEnv(process.env.WHATSAPP_VERIFY_TOKEN);
  const appSecret = cleanEnv(process.env.WHATSAPP_APP_SECRET);
  const graphVersion = cleanEnv(process.env.WHATSAPP_GRAPH_VERSION) || "v22.0";

  return {
    accessToken,
    phoneNumberId,
    verifyToken,
    appSecret,
    graphVersion,
    configured: Boolean(accessToken && phoneNumberId && verifyToken),
  };
}

export function getPublicWhatsAppNumber() {
  return cleanEnv(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER).replace(/\D/g, "");
}
