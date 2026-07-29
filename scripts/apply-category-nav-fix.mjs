import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(path, "utf8");
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
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error: updateError } = await supabase
  .from("categories")
  .update({ is_nav: true, updated_at: new Date().toISOString() })
  .eq("slug", "batas");

if (updateError) {
  console.error("Error al activar Batas en nav:", updateError.message);
  process.exit(1);
}

const { error: deleteError } = await supabase
  .from("categories")
  .delete()
  .eq("slug", "bodies");

if (deleteError) {
  console.error("Error al eliminar Bodies:", deleteError.message);
  process.exit(1);
}

const { data: nav } = await supabase
  .from("categories")
  .select("slug, name, is_nav")
  .eq("is_nav", true)
  .order("sort_order");

console.log("Nav categories:", nav?.map((c) => c.name).join(", "));
console.log("Listo.");
