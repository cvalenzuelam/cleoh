import { readFileSync } from "node:fs";

const raw = readFileSync(".env.local", "utf8");
for (const line of raw.split("\n")) {
  if (line.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
    const v = line.slice("SUPABASE_SERVICE_ROLE_KEY=".length).trim();
    console.log("service key len:", v.length, "prefix:", v.slice(0, 12));
  }
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    console.log("url:", line.slice("NEXT_PUBLIC_SUPABASE_URL=".length).trim());
  }
}
