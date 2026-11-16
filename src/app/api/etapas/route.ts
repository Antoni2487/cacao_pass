import { NextResponse } from "next/server";
import { manejarError, respuestaError, usuarioDeLaPeticion } from "@/lib/api";
import { registrarEtapa } from "@/lib/trazabilidad/servicio";
import { esquemaEtapa, validarEvidencias } from "@/lib/validaciones/etapa";

// El sellado espera unos segundos la confirmación del bloque.
export const maxDuration = 30;

/**
 * POST /api/etapas (multipart/form-data)
 * Guarda la etapa, calcula su hash SHA-256 y la sella en Polygon (Amoy o red principal).
 * Campos: lote_codigo, tipo, ubicacion, fecha, peso_kg?, humedad_pct?, notas?, evidencias[]?
 */
export async function POST(request: Request) {
  const usuarioId = await usuarioDeLaPeticion();
  if (!usuarioId) return respuestaError("Inicia sesión para registrar etapas.", 401);

  const formData = await request.formData();
  const campos = Object.fromEntries(
    [...formData.entries()].filter(([, valor]) => typeof valor === "string"),
  );
  const datos = esquemaEtapa.safeParse(campos);
  if (!datos.success) {
    const errores: Record<string, string[]> = {};
    for (const issue of datos.error.issues)
      (errores[String(issue.path[0])] ??= []).push(issue.message);
    return respuestaError("Revisa los campos marcados.", 422, { errores });
  }

  const archivos = formData
    .getAll("evidencias")
    .filter((v): v is File => v instanceof File && v.size > 0);
  const errorArchivos = validarEvidencias(archivos);
  if (errorArchivos)
    return respuestaError(errorArchivos, 422, { errores: { evidencias: [errorArchivos] } });

  try {
    const resultado = await registrarEtapa(datos.data, usuarioId, archivos);
    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    return manejarError(error);
  }
}
