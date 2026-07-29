import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value.trim();
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("url ok:", Boolean(url?.startsWith("https://")));
console.log("anon len:", anon?.length);
console.log("service len:", service?.length);
console.log("anon ends with:", JSON.stringify(anon?.slice(-5)));

const res = await fetch(`${url}/rest/v1/categories?slug=eq.batas&select=slug,is_nav`, {
  headers: {
    apikey: anon,
  },
});

console.log("anon read status:", res.status, await res.text());

const res2 = await fetch(`${url}/rest/v1/categories?slug=eq.batas`, {
  method: "PATCH",
  headers: {
    apikey: service,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify({ is_nav: true }),
});

console.log("service patch status:", res2.status, await res2.text());
