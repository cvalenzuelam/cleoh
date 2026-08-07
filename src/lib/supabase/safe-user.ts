import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Igual que `supabase.auth.getUser()`, pero no lanza cuando la cookie de
 * sesión trae un refresh token inválido/caducado (p. ej. de una sesión ya
 * revocada desde otro dispositivo). Ese caso llega como `AuthApiError:
 * Invalid Refresh Token` y, sin este wrapper, tira el request completo
 * (proxy/middleware, server actions, route handlers) con un 500 en vez de
 * simplemente tratar al usuario como no autenticado.
 */
export async function getSafeUser(supabase: SupabaseClient) {
  try {
    const { data, error } = await supabase.auth.getUser();
    // supabase-js normalmente NO lanza en este caso: devuelve
    // { data: { user: null }, error } ya resuelto. Si no revisamos `error`
    // aquí, la cookie inválida nunca se limpia y el mismo error se repite
    // en cada visita de ese usuario (es lo que se veía en los logs).
    if (error) {
      console.error("[supabase] Sesión inválida, se limpia:", error.message);
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
      return null;
    }
    return data.user;
  } catch (error) {
    // Defensa extra por si alguna ruta interna sí llega a lanzar.
    console.error("[supabase] getUser() lanzó, se limpia sesión:", error);
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    return null;
  }
}
