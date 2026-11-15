import type { PostgrestError } from "@supabase/supabase-js";
import type { z } from "zod";

/** Estado que devuelven las Server Actions de formularios (para useActionState). */
export interface EstadoFormulario {
  /** Mensaje general (error de permisos, de base de datos, etc.). */
  error?: string;
  /** Errores de validación por campo. */
  errores?: Record<string, string[] | undefined>;
  /** Mensaje de éxito cuando la acción no redirige. */
  exito?: string;
}

export const ESTADO_INICIAL: EstadoFormulario = {};

/** Convierte un error de validación de Zod en errores por campo. */
export function erroresDeValidacion(error: z.ZodError): EstadoFormulario {
  const errores: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "formulario");
    (errores[campo] ??= []).push(issue.message);
  }
  return { error: "Revisa los campos marcados.", errores };
}

/** Traduce los errores de PostgreSQL más comunes a mensajes entendibles. */
export function mensajeDeErrorBD(error: PostgrestError): string {
  switch (error.code) {
    case "42501":
      return "No tienes permiso para realizar esta acción.";
    case "23505":
      return "Ya existe un registro con esos datos.";
    case "23503":
      return "No se puede completar: hay registros relacionados.";
    case "23514":
      return "Algún valor está fuera del rango permitido.";
    default:
      console.error("[supabase]", error);
      return "Ocurrió un error al guardar. Inténtalo de nuevo.";
  }
}

/** Lee un FormData como objeto plano (los campos repetidos se vuelven arreglo). */
export function formDataAObjeto(formData: FormData): Record<string, unknown> {
  const objeto: Record<string, unknown> = {};
  for (const clave of new Set(formData.keys())) {
    if (clave.startsWith("$ACTION")) continue; // campos internos de Next.js
    const valores = formData.getAll(clave);
    objeto[clave] = valores.length > 1 ? valores : valores[0];
  }
  return objeto;
}
