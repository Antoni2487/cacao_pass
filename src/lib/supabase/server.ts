import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { envPublico } from "@/lib/env";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Actúa con la sesión del usuario (cookies), así que RLS aplica.
 */
export async function crearClienteServidor() {
  const almacenCookies = await cookies();

  return createServerClient(envPublico.supabaseUrl(), envPublico.supabaseAnonKey(), {
    cookies: {
      getAll: () => almacenCookies.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => almacenCookies.set(name, value, options));
        } catch {
          // Desde un Server Component no se pueden escribir cookies; el middleware
          // ya se encarga de refrescar la sesión, así que se puede ignorar.
        }
      },
    },
  });
}
