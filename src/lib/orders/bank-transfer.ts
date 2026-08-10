import { site } from "@/data/site";

/** Datos bancarios para depósito / transferencia SPEI (Cleoh). */
export const BANK_TRANSFER = {
  bank: "BBVA",
  accountNumber: "4152 3144 6872 1462",
  accountNumberRaw: "4152314468721462",
  holder: "Bricia J Elizalde",
  instagram: site.social.instagramHandle,
  instagramUrl: site.social.instagram,
} as const;
