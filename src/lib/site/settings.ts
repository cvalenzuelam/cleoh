import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { cleanEnv } from "@/lib/env/clean";

export const DEFAULT_HERO_IMAGE =
  "https://static.wixstatic.com/media/7f4d67_64e50f84607944118736f90535394c8b~mv2.jpeg/v1/fill/w_1600,h_2000,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/7f4d67_64e50f84607944118736f90535394c8b~mv2.jpeg";

function publicClient() {
  noStore();
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getHeroImageUrl(): Promise<string> {
  const supabase = publicClient();
  if (!supabase) return DEFAULT_HERO_IMAGE;

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "hero_image_url")
    .maybeSingle();

  if (error) return DEFAULT_HERO_IMAGE;

  const url = data?.value?.replace(/[\r\n\t]+/g, "").trim();
  return url || DEFAULT_HERO_IMAGE;
}
