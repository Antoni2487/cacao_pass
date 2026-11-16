import { NextResponse } from "next/server";
import { manejarError, respuestaError } from "@/lib/api";
import { PATRON_CODIGO_LOTE } from "@/lib/qr";
import { RED_BLOCKCHAIN, urlExplorador } from "@/lib/trazabilidad/explorador";
import { verificarLote } from "@/lib/trazabilidad/servicio";

/**
 * GET /api/lotes/[codigo]/verificar — público.
 * Recalcula los hashes, los compara con la blockchain y devuelve el resultado.
 * Solo expone hashes y estados, no datos privados del productor.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  if (!PATRON_CODIGO_LOTE.test(codigo)) return respuestaError("Código de lote no válido.", 400);

  try {
    const resultado = await verificarLote(codigo);
    if (!resultado) return respuestaError("El lote no existe.", 404);

    return NextResponse.json(
      {
        codigo,
        estado: resultado.estado,
        red: RED_BLOCKCHAIN,
        wallet: resultado.wallet,
        verificado_en: resultado.verificadoEn,
        etapas: resultado.etapas.map((e) => ({
          tipo: e.tipo,
          orden: e.orden,
          estado: e.estado,
          motivo: e.motivo,
          hash_actual: e.hashActual,
          hash_en_blockchain: e.hashEnCadena,
          tx_hash: e.tx_hash,
          explorador: e.tx_hash ? urlExplorador(e.tx_hash) : null,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return manejarError(error);
  }
}
