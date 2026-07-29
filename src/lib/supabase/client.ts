import { createBrowserClient } from "@supabase/ssr";
import { cleanEnv } from "@/lib/env/clean";

export function createClient() {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local",
    );
  }

  return createBrowserClient(url, key);
}
