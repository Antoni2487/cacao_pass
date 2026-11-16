import "server-only";
import { NextResponse } from "next/server";
import { ErrorTrazabilidad } from "@/lib/trazabilidad/servicio";
import { crearClienteServidor } from "@/lib/supabase/server";

/** Respuesta de error uniforme para las API routes: { error: "mensaje" }. */
export function respuestaError(mensaje: string, status: number, extra?: object) {
  return NextResponse.json({ error: mensaje, ...extra }, { status });
}

/** Devuelve el id del usuario con sesión, o null. */
export async function usuarioDeLaPeticion(): Promise<string | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Convierte cualquier excepción en una respuesta JSON sin filtrar detalles internos. */
export function manejarError(error: unknown) {
  if (error instanceof ErrorTrazabilidad) return respuestaError(error.message, error.status);
  console.error("[api]", error);
  return respuestaError("Error interno. Inténtalo de nuevo.", 500);
}
