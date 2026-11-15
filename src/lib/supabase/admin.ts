import "server-only";
import { createClient } from "@supabase/supabase-js";
import { envPublico } from "@/lib/env";

/**
 * Cliente con la service role: SALTA RLS.
 * Úsalo solo en el servidor y solo cuando sea necesario (sellar etapas,
 * página pública del lote). `server-only` impide importarlo desde el navegador.
 */
export function crearClienteAdmin() {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clave) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");

  return createClient(envPublico.supabaseUrl(), clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
