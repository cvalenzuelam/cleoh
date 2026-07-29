/**
 * Normaliza .env*: quita \\r\\n literales, CRLF, comillas y espacios en valores.
 * Uso: node scripts/clean-env-local.mjs [archivo]
 */
import fs from "fs";
import { cleanEnvValue } from "./env-utils.mjs";

const path = process.argv[2] || ".env.local";
if (!fs.existsSync(path)) {
  console.log(`No hay ${path} — nada que limpiar.`);
  process.exit(0);
}

const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
const out = lines.map((line) => {
  if (!line || line.startsWith("#") || !line.includes("=")) {
    return line.replace(/\r$/, "");
  }
  const i = line.indexOf("=");
  const key = line.slice(0, i).trim();
  const value = cleanEnvValue(line.slice(i + 1));
  return `${key}=${value}`;
});

fs.writeFileSync(path, `${out.join("\n")}\n`, "utf8");
console.log(`${path} limpiado`);
