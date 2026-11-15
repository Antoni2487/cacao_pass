import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Usuario } from "@/types/dominio";

/**
 * Usuario del panel con su perfil (nombre y rol). Redirige al login si no hay sesión.
 * `cache` evita repetir la consulta dentro de un mismo render.
 */
export const obtenerUsuarioActual = cache(async (): Promise<Usuario> => {
  const supabase = await crearClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", auth.user.id)
    .single<Usuario>();

  // Usuario en Auth sin perfil (creado antes de la migración): lo tratamos como operador.
  return (
    perfil ?? {
      id: auth.user.id,
      nombre: auth.user.email ?? "Usuario",
      rol: "operador",
      created_at: auth.user.created_at,
    }
  );
});

/** Para Server Actions que solo puede ejecutar un admin. */
export async function exigirAdmin(): Promise<Usuario> {
  const usuario = await obtenerUsuarioActual();
  if (usuario.rol !== "admin") {
    throw new Error("Solo un administrador puede realizar esta acción.");
  }
  return usuario;
}
