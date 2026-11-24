import { NextResponse } from "next/server";
import { z } from "zod";
import { manejarError, respuestaError, usuarioDeLaPeticion } from "@/lib/api";
import { reintentarSellado } from "@/lib/trazabilidad/servicio";

export const maxDuration = 30;

/** POST /api/etapas/[id]/sellar — reintenta el sellado de una etapa pendiente. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await usuarioDeLaPeticion())) return respuestaError("Inicia sesión.", 401);

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return respuestaError("Etapa no válida.", 400);

  try {
    return NextResponse.json(await reintentarSellado(id));
  } catch (error) {
    return manejarError(error);
  }
}
