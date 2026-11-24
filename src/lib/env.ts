/**
 * Lectura centralizada de variables de entorno.
 * Falla con un mensaje claro si falta alguna, en vez de un error críptico de Supabase.
 */
function requerida(nombre: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa tu archivo .env.local`);
  }
  return valor;
}

// Las NEXT_PUBLIC_* deben leerse con el nombre literal para que Next.js las inyecte en el navegador.
export const envPublico = {
  supabaseUrl: () => requerida("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () =>
    requerida("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
