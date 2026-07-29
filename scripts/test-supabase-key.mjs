/** One-off: node scripts/test-supabase-key.mjs .env.regression --key-env=TEST_SUPABASE_KEY */
import fs from "fs";

const file = process.argv[2] || ".env.regression";
const keyEnvFlag = process.argv.find((a) => a.startsWith("--key-env="));
const overrideKey = keyEnvFlag
  ? process.env[keyEnvFlag.split("=")[1]]
  : process.env.TEST_SUPABASE_KEY;

const env = Object.fromEntries(
  fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .trim()
          .replace(/^["']|["']$/g, "")
          .replace(/[\r\n\t]+/g, "")
          .trim(),
      ];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = overrideKey || env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = overrideKey || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testKey(label, key) {
  if (!key) return;
  const res = await fetch(`${url}/rest/v1/products?select=slug&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  console.log(`${label} status`, res.status);
  console.log((await res.text()).slice(0, 120));
}

if (!url) {
  console.error("Missing Supabase URL");
  process.exit(1);
}

await testKey("service", serviceKey);
if (!overrideKey) await testKey("anon", anonKey);
