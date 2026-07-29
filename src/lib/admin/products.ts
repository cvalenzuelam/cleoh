export const DEFAULT_SIZES = [
  "Extra Chica",
  "Chica",
  "Mediano",
  "Grande",
] as const;

export type DefaultSize = (typeof DEFAULT_SIZES)[number];

/** Orden canónico: más chica → más grande (incluye alias antiguos) */
const SIZE_ORDER: Record<string, number> = {
  "Extra Chica": 0,
  "Extra Chico": 0,
  Chica: 1,
  Chico: 1,
  Mediano: 2,
  Grande: 3,
};

const SIZE_ABBR: Record<string, string> = {
  "Extra Chica": "XS",
  "Extra Chico": "XS",
  Chica: "S",
  Chico: "S",
  Mediano: "M",
  Grande: "G",
};

/** Nombres en femenino para mostrar en tienda */
const SIZE_DISPLAY: Record<string, string> = {
  "Extra Chico": "Extra Chica",
  Chico: "Chica",
  "Extra Chica": "Extra Chica",
  Chica: "Chica",
};

/** Alias masculinos antiguos → nombre canónico del admin/form */
const SIZE_CANONICAL: Record<string, DefaultSize> = {
  "Extra Chico": "Extra Chica",
  "Extra Chica": "Extra Chica",
  Chico: "Chica",
  Chica: "Chica",
  Mediano: "Mediano",
  Grande: "Grande",
};

/** Nombres posibles en DB para cada talla del formulario */
const SIZE_DB_ALIASES: Record<DefaultSize, string[]> = {
  "Extra Chica": ["Extra Chica", "Extra Chico"],
  Chica: ["Chica", "Chico"],
  Mediano: ["Mediano"],
  Grande: ["Grande"],
};

export function sizeSortIndex(size: string) {
  return SIZE_ORDER[size] ?? 99;
}

export function sizeLabel(size: string) {
  const display = sizeDisplayName(size);
  const abbr = SIZE_ABBR[size];
  return abbr ? `${display} (${abbr})` : display;
}

export function sizeDisplayName(size: string) {
  return SIZE_DISPLAY[size] ?? size;
}

/** Normaliza Extra Chico/Chico → Extra Chica/Chica */
export function canonicalSize(size: string): DefaultSize | string {
  return SIZE_CANONICAL[size] ?? size;
}

export function sizeDbAliases(size: string): string[] {
  const canon = canonicalSize(size);
  if (canon in SIZE_DB_ALIASES) {
    return SIZE_DB_ALIASES[canon as DefaultSize];
  }
  return [size];
}

export function sortSizes<T extends { size: string }>(sizes: T[]): T[] {
  return [...sizes].sort(
    (a, b) => sizeSortIndex(a.size) - sizeSortIndex(b.size),
  );
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function pesosToCents(pesos: number) {
  return Math.round(pesos * 100);
}

export function centsToPesos(cents: number) {
  return cents / 100;
}

export function formatMxnFromCents(cents: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}
