import fs from "fs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).trim()];
    }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

async function api(path, opts = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "User-Agent": "cleoh-test/1.0",
      ...(opts.headers || {}),
    },
  });
  const t = await res.text();
  if (!res.ok) throw new Error(t);
  return t ? JSON.parse(t) : null;
}

async function page(u) {
  const r = await fetch(u, { cache: "no-store" });
  return r.text();
}

const [p] = await api(
  "products?select=id,slug,price_cents&slug=eq.pijama-novia",
);
const original = p.price_cents;
await api(`products?id=eq.${p.id}`, {
  method: "PATCH",
  body: JSON.stringify({ price_cents: 49400 }),
});

const home = await page("https://cleoh.vercel.app/");
const prod = await page("https://cleoh.vercel.app/producto/pijama-novia");
const homeHit = home.includes("$494");
const prodHit = prod.includes("$494");
console.log({ homeHit, prodHit });

await api(`products?id=eq.${p.id}`, {
  method: "PATCH",
  body: JSON.stringify({ price_cents: original }),
});
const home2 = await page("https://cleoh.vercel.app/");
const restored = home2.includes("$490") && !home2.includes("$494");
console.log({ restored });

if (!homeHit || !prodHit || !restored) process.exit(2);
console.log("FRESHNESS_OK");
