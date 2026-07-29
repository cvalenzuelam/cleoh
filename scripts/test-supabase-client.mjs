import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const file = process.argv[2] || ".env.regression";
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
const serviceKey = process.env.TEST_SUPABASE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("url", url);

for (const [label, key] of [
  ["service", serviceKey],
  ["anon", anonKey],
]) {
  if (!key) continue;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client
    .from("products")
    .select("slug")
    .limit(1);
  console.log(label, error?.message || "ok", data?.[0]?.slug || data);
}
