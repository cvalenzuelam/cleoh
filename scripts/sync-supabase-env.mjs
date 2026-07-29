/**
 * Sincroniza vars de Supabase desde .env.regression → .env.local
 * Uso: node scripts/sync-supabase-env.mjs
 */
import fs from "fs";
import { cleanEnvValue } from "./env-utils.mjs";

const sourcePath = ".env.regression";
const targetPath = ".env.local";
const keys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function readEnv(path) {
  if (!fs.existsSync(path)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), cleanEnvValue(l.slice(i + 1))];
      }),
  );
}

if (!fs.existsSync(sourcePath)) {
  console.error(`Falta ${sourcePath}. Ejecuta: vercel env pull ${sourcePath} --environment=production --yes`);
  process.exit(1);
}

const source = readEnv(sourcePath);
const missing = keys.filter((k) => !source[k]);
if (missing.length) {
  console.error("Faltan en origen:", missing.join(", "));
  process.exit(1);
}

let lines = fs.existsSync(targetPath)
  ? fs.readFileSync(targetPath, "utf8").split(/\r?\n/)
  : [];
const present = new Set();

lines = lines.map((line) => {
  if (!line || line.startsWith("#") || !line.includes("=")) return line;
  const i = line.indexOf("=");
  const key = line.slice(0, i).trim();
  if (!keys.includes(key)) return line;
  present.add(key);
  return `${key}=${source[key]}`;
});

for (const key of keys) {
  if (!present.has(key)) lines.push(`${key}=${source[key]}`);
}

fs.writeFileSync(targetPath, `${lines.filter((l, idx, arr) => !(idx === arr.length - 1 && l === "")).join("\n")}\n`, "utf8");
console.log(`Supabase vars sincronizadas en ${targetPath}`);
