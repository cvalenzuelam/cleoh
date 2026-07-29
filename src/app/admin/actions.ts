"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string };

export async function loginAdmin(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email y contraseña son obligatorios." };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      error:
        "Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local (API Keys → publishable/anon).",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Credenciales incorrectas o usuario inexistente." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No se pudo obtener la sesión." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "Esta cuenta no tiene rol admin." };
  }

  redirect("/admin");
}

export async function logoutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
