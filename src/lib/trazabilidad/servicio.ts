import "server-only";
import { randomUUID } from "node:crypto";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import type { DatosEtapa } from "@/lib/validaciones/etapa";
import type { Etapa } from "@/types/dominio";
import { esperarConfirmacion, sellarHash } from "./blockchain";
import { datosDeCalidad, estadoLoteTrasEtapa, ordenDeEtapa, siguienteEtapa } from "./etapas";
import { calcularHashEtapa } from "./hash";

/**
 * Casos de uso de la trazabilidad. Usan la service role porque las etapas solo
 * las escribe el servidor (ver RLS en docs/02-base-de-datos.md). Quien llame
 * a estas funciones debe haber comprobado antes la sesión del usuario.
 */

/** Error con mensaje apto para mostrar al usuario y su código HTTP. */
export class ErrorTrazabilidad extends Error {
  constructor(
    mensaje: string,
    readonly status = 400,
  ) {
    super(mensaje);
  }
}

/** Tiempo que esperamos la confirmación dentro de la petición (Amoy confirma en ~2-5 s). */
const ESPERA_CONFIRMACION_MS = 8_000;

export interface ResultadoSellado {
  etapaId: string;
  hash: string;
  txHash: string | null;
  selladoEn: string | null;
  /** Mensaje si el sellado falló; la etapa queda guardada y se puede reintentar. */
  errorSellado: string | null;
}

function hashDeFila(etapa: Etapa, loteCodigo: string) {
  return calcularHashEtapa({
    lote_codigo: loteCodigo,
    tipo: etapa.tipo,
    orden: etapa.orden,
    ubicacion: etapa.ubicacion,
    fecha: etapa.fecha,
    datos: etapa.datos,
  });
}

/** Envía el hash a la blockchain y guarda tx_hash y, si confirma a tiempo, sellado_en. */
async function enviarSello(etapaId: string, hash: string) {
  const db = crearClienteAdmin();
  try {
    const txHash = await sellarHash(hash);
    await db.from("etapas").update({ tx_hash: txHash }).eq("id", etapaId).throwOnError();

    const fecha = await esperarConfirmacion(txHash, ESPERA_CONFIRMACION_MS);
    const selladoEn = fecha?.toISOString() ?? null;
    if (selladoEn) {
      await db.from("etapas").update({ sellado_en: selladoEn }).eq("id", etapaId).throwOnError();
    }
    return { txHash, selladoEn, errorSellado: null };
  } catch (error) {
    console.error("[sellado]", error);
    const sinFondos = (error as { code?: string }).code === "INSUFFICIENT_FUNDS";
    return {
      txHash: null,
      selladoEn: null,
      errorSellado: sinFondos
        ? "La wallet no tiene POL de prueba. Recárgala en un faucet y reintenta."
        : "No se pudo sellar en blockchain. La etapa quedó guardada: reintenta el sellado.",
    };
  }
}

async function subirEvidencias(loteCodigo: string, etapaId: string, archivos: File[]) {
  if (archivos.length === 0) return;
  const db = crearClienteAdmin();

  for (const archivo of archivos) {
    const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "bin";
    const ruta = `${loteCodigo}/${etapaId}/${randomUUID()}.${extension}`;
    const { error } = await db.storage
      .from("evidencias")
      .upload(ruta, archivo, { contentType: archivo.type });
    if (error) {
      console.error("[evidencias]", error);
      continue; // una evidencia fallida no debe impedir registrar la etapa
    }
    const { data } = db.storage.from("evidencias").getPublicUrl(ruta);
    await db.from("evidencias").insert({
      etapa_id: etapaId,
      url: data.publicUrl,
      tipo: archivo.type === "application/pdf" ? "pdf" : "foto",
    });
  }
}

/** RF06 + RF07 + RF08 + RF13: registra la etapa, calcula su hash y la sella. */
export async function registrarEtapa(
  datos: DatosEtapa,
  responsableId: string,
  archivos: File[],
): Promise<ResultadoSellado> {
  const db = crearClienteAdmin();

  const { data: lote } = await db
    .from("lotes")
    .select("id, codigo, etapas(orden)")
    .eq("codigo", datos.lote_codigo)
    .maybeSingle<{ id: string; codigo: string; etapas: { orden: number }[] }>();
  if (!lote) throw new ErrorTrazabilidad("El lote no existe.", 404);

  const esperada = siguienteEtapa(lote.etapas.length);
  if (!esperada) throw new ErrorTrazabilidad("Este lote ya completó sus 5 etapas.");
  if (esperada !== datos.tipo) {
    throw new ErrorTrazabilidad("Las etapas deben registrarse en orden.");
  }

  const orden = ordenDeEtapa(datos.tipo);
  const { data: etapa, error } = await db
    .from("etapas")
    .insert({
      lote_id: lote.id,
      tipo: datos.tipo,
      orden,
      responsable_id: responsableId,
      ubicacion: datos.ubicacion,
      fecha: datos.fecha,
      datos: datosDeCalidad(datos),
    })
    .select("*")
    .single<Etapa>();
  if (error) {
    if (error.code === "23505") throw new ErrorTrazabilidad("Esa etapa ya fue registrada.", 409);
    throw error;
  }

  // El hash se calcula con la fila tal como quedó en la base de datos, que es
  // exactamente lo que se volverá a leer al verificar.
  const hash = hashDeFila(etapa, lote.codigo);
  await db.from("etapas").update({ hash }).eq("id", etapa.id).throwOnError();
  await db
    .from("lotes")
    .update({ estado: estadoLoteTrasEtapa(orden) })
    .eq("id", lote.id)
    .throwOnError();

  await subirEvidencias(lote.codigo, etapa.id, archivos);

  return { etapaId: etapa.id, hash, ...(await enviarSello(etapa.id, hash)) };
}

/** Reintenta el sellado de una etapa pendiente (POST /api/etapas/[id]/sellar). */
export async function reintentarSellado(etapaId: string): Promise<ResultadoSellado> {
  const db = crearClienteAdmin();
  const { data: etapa } = await db
    .from("etapas")
    .select("*, lotes(codigo)")
    .eq("id", etapaId)
    .maybeSingle<Etapa & { lotes: { codigo: string } }>();
  if (!etapa) throw new ErrorTrazabilidad("La etapa no existe.", 404);
  if (etapa.sellado_en) throw new ErrorTrazabilidad("Esta etapa ya está sellada.", 409);

  // Si los datos cambiaron desde que se registró, no sellamos la versión alterada.
  const hash = hashDeFila(etapa, etapa.lotes.codigo);
  if (etapa.hash && etapa.hash !== hash) {
    throw new ErrorTrazabilidad("Los datos cambiaron desde su registro; no se pueden sellar.", 409);
  }
  if (!etapa.hash) await db.from("etapas").update({ hash }).eq("id", etapaId).throwOnError();

  // Ya se envió antes: solo esperamos su confirmación.
  if (etapa.tx_hash) {
    const fecha = await esperarConfirmacion(etapa.tx_hash, ESPERA_CONFIRMACION_MS);
    if (fecha) {
      await db
        .from("etapas")
        .update({ sellado_en: fecha.toISOString() })
        .eq("id", etapaId)
        .throwOnError();
      return {
        etapaId,
        hash,
        txHash: etapa.tx_hash,
        selladoEn: fecha.toISOString(),
        errorSellado: null,
      };
    }
  }

  return { etapaId, hash, ...(await enviarSello(etapaId, hash)) };
}
