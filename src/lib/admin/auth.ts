import { createClient } from "@/lib/supabase/server";
import { getSafeUser } from "@/lib/supabase/safe-user";

export async function requireAdmin() {
  const supabase = await createClient();
  const user = await getSafeUser(supabase);

  if (!user) {
    throw new Error("No autenticado");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    throw new Error("Sin permiso admin");
  }

  return { supabase, user };
}
