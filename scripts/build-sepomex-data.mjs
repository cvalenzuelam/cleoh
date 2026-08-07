// Genera src/data/sepomex-cp.json.gz a partir del catálogo oficial de SEPOMEX
// (IcaliaLabs/sepomex, lib/sepomex_db.csv — datos abiertos de Correos de México).
// Se ejecuta una sola vez (o cuando se quiera refrescar el catálogo); el
// resultado se comitea al repo para que el checkout funcione sin depender de
// ninguna API externa.
import fs from "fs";
import path from "path";
import zlib from "zlib";
import os from "os";

const SOURCE_CSV = path.join(os.tmpdir(), "sepomex_db.csv");
const OUT_PATH = path.join(process.cwd(), "src", "data", "sepomex-cp.json.gz");

// Normaliza los nombres de entidad de INEGI/SEPOMEX a los que usa
// src/data/mexico.ts (MX_STATES), que es lo que ve el usuario en el <select>.
const ESTADO_MAP = {
  "Coahuila de Zaragoza": "Coahuila",
  "Michoacán de Ocampo": "Michoacán",
  "México": "Estado de México",
  "Veracruz de Ignacio de la Llave": "Veracruz",
};
function normalizeEstado(raw) {
  return ESTADO_MAP[raw] ?? raw;
}

const text = fs.readFileSync(SOURCE_CSV, "utf8");
const lines = text.split(/\r?\n/).filter(Boolean);

/** @type {Map<string, { m: string, e: string, c: string, n: Set<string> }>} */
const byCp = new Map();

for (const line of lines) {
  const cols = line.split("|");
  const [d_codigo, d_asenta, , d_mnpio, d_estado, d_ciudad] = cols;
  if (!d_codigo || !d_asenta) continue;

  let entry = byCp.get(d_codigo);
  if (!entry) {
    entry = {
      m: d_mnpio || "",
      e: normalizeEstado(d_estado || ""),
      c: d_ciudad || d_mnpio || "",
      n: new Set(),
    };
    byCp.set(d_codigo, entry);
  }
  entry.n.add(d_asenta);
}

/** @type {Record<string, { m: string, e: string, c: string, n: string[] }>} */
const out = {};
for (const [cp, entry] of byCp) {
  out[cp] = {
    m: entry.m,
    e: entry.e,
    c: entry.c,
    n: [...entry.n].sort((a, b) => a.localeCompare(b, "es")),
  };
}

const json = JSON.stringify(out);
const gz = zlib.gzipSync(Buffer.from(json, "utf8"), { level: 9 });
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, gz);

console.log(`CPs únicos: ${byCp.size}`);
console.log(`JSON sin comprimir: ${(json.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`Gzip final: ${(gz.length / 1024 / 1024).toFixed(2)} MB -> ${OUT_PATH}`);

// Valida contra MX_STATES para detectar nombres de entidad sin normalizar
// en futuras actualizaciones del catálogo (typos, nuevas variantes, etc.).
const MX_STATES = fs
  .readFileSync(path.join(process.cwd(), "src", "data", "mexico.ts"), "utf8")
  .match(/"([^"]+)"/g)
  .map((s) => s.slice(1, -1));
const knownEstados = new Set(MX_STATES);
const unknown = new Set(
  [...byCp.values()].map((e) => e.e).filter((e) => !knownEstados.has(e)),
);
if (unknown.size > 0) {
  console.warn("Estados sin normalizar (revisar ESTADO_MAP):", [...unknown]);
} else {
  console.log("Todos los estados normalizados coinciden con MX_STATES. ✔");
}
