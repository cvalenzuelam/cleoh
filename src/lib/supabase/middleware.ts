import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cleanEnv } from "@/lib/env/clean";
import { getSafeUser } from "@/lib/supabase/safe-user";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const user = await getSafeUser(supabase);

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isPublicAdminPath =
    path === "/admin/login" ||
    path === "/admin/icon" ||
    path === "/admin/apple-icon" ||
    path === "/admin/manifest.webmanifest";
  const isLogin = path === "/admin/login";

  if (!isAdminRoute) {
    return supabaseResponse;
  }

  if (isPublicAdminPath && !isLogin) {
    return supabaseResponse;
  }

  if (isLogin) {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        const redirect = NextResponse.redirect(new URL("/admin", request.url));
        supabaseResponse.cookies.getAll().forEach((c) =>
          redirect.cookies.set(c.name, c.value),
        );
        return redirect;
      }
    }
    return supabaseResponse;
  }

  if (!user) {
    const redirect = NextResponse.redirect(
      new URL("/admin/login", request.url),
    );
    supabaseResponse.cookies.getAll().forEach((c) =>
      redirect.cookies.set(c.name, c.value),
    );
    return redirect;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    const redirect = NextResponse.redirect(
      new URL("/admin/login?error=forbidden", request.url),
    );
    supabaseResponse.cookies.getAll().forEach((c) =>
      redirect.cookies.set(c.name, c.value),
    );
    return redirect;
  }

  return supabaseResponse;
}
