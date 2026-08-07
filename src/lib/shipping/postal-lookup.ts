import "server-only";

import fs from "fs";
import path from "path";
import zlib from "zlib";

export type PostalCodeInfo = {
  estado: string;
  municipio: string;
  ciudad: string;
  colonias: string[];
};

type RawEntry = { m: string; e: string; c: string; n: string[] };

let cache: Map<string, RawEntry> | null = null;

function loadDataset(): Map<string, RawEntry> {
  if (cache) return cache;
  const filePath = path.join(process.cwd(), "src", "data", "sepomex-cp.json.gz");
  const gz = fs.readFileSync(filePath);
  const json = zlib.gunzipSync(gz).toString("utf8");
  const parsed = JSON.parse(json) as Record<string, RawEntry>;
  cache = new Map(Object.entries(parsed));
  return cache;
}

/**
 * Catálogo SEPOMEX embebido (sin dependencia de APIs externas de terceros,
 * que en pruebas resultaron lentas/poco confiables para usarlas en el flujo
 * de pago). Ver scripts/build-sepomex-data.mjs para regenerar el dataset.
 */
export function lookupPostalCode(cp: string): PostalCodeInfo | null {
  const clean = cp.trim();
  if (!/^\d{5}$/.test(clean)) return null;

  try {
    const dataset = loadDataset();
    const entry = dataset.get(clean);
    if (!entry) return null;

    return {
      estado: entry.e,
      municipio: entry.m,
      ciudad: entry.c,
      colonias: entry.n,
    };
  } catch (error) {
    console.error("[postal-lookup] No se pudo leer el catálogo SEPOMEX:", error);
    return null;
  }
}
