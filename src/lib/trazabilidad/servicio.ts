import "server-only";
import { MARCA_DEMO } from "@/lib/demo";
import { randomUUID } from "node:crypto";
import { cache } from "react";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import type { DatosEtapa } from "@/lib/validaciones/etapa";
import type { Etapa, Lote, Parcela, Productor } from "@/types/dominio";
import { direccionWallet, esperarConfirmacion, leerSello, sellarHash } from "./blockchain";
import { datosDeCalidad, estadoLoteTrasEtapa, ordenDeEtapa, siguienteEtapa } from "./etapas";
import { calcularHashEtapa } from "./hash";
import { resumirVerificaciones, type ResumenIntegridad } from "./resumen";
import {
  estadoDelLote,
  evaluarEtapa,
  type EstadoEtapa,
  type EstadoLoteVerificado,
} from "./verificacion";

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

/** Tiempo que esperamos la confirmación dentro de la petición (Polygon confirma en ~2-5 s). */
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
        ? "La wallet no tiene POL suficiente para pagar el sello. Recárgala y reintenta."
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

// ---------------------------------------------------------------------------
// Verificación (RF10, RF11)
// ---------------------------------------------------------------------------

export interface EtapaVerificada extends Etapa {
  evidencias: { url: string; tipo: "foto" | "pdf" }[];
  /** Hash recalculado con los datos actuales de la base de datos. */
  hashActual: string;
  /** Hash grabado en la blockchain (null si no hay sello legible). */
  hashEnCadena: string | null;
  estado: EstadoEtapa;
  motivo: string;
}

export interface LoteVerificado {
  lote: Lote & { productores: Productor; parcelas: Parcela };
  etapas: EtapaVerificada[];
  /** "error_red": no se pudo consultar la blockchain; no se afirma ni niega nada. */
  estado: EstadoLoteVerificado | "error_red";
  /** Dirección de la wallet emisora, para enlazarla en el explorador. */
  wallet: string | null;
  verificadoEn: string;
}

type FilaLoteCompleto = LoteVerificado["lote"] & {
  etapas: (Etapa & { evidencias: EtapaVerificada["evidencias"] })[];
};

/**
 * Recalcula el hash de cada etapa con los datos actuales y lo compara con el
 * que está en la blockchain. Devuelve null si el lote no existe.
 * `cache` evita repetir la verificación si la página y sus metadatos la piden.
 */
export const verificarLote = cache(async (codigo: string): Promise<LoteVerificado | null> => {
  const db = crearClienteAdmin();
  const { data: fila } = await db
    .from("lotes")
    .select(SELECT_LOTE_COMPLETO)
    .eq("codigo", codigo)
    .order("orden", { referencedTable: "etapas" })
    .maybeSingle<FilaLoteCompleto>();
  if (!fila) return null;

  return verificarFila(db, fila, walletOError());
});

const SELECT_LOTE_COMPLETO = "*, productores(*), parcelas(*), etapas(*, evidencias(url, tipo))";

/** Dirección de nuestra wallet, o null si WALLET_PRIVATE_KEY no está bien configurada. */
function walletOError(): string | null {
  try {
    return direccionWallet();
  } catch (error) {
    console.error("[verificacion] wallet no configurada", error);
    return null;
  }
}

async function verificarFila(
  db: ReturnType<typeof crearClienteAdmin>,
  fila: FilaLoteCompleto,
  wallet: string | null,
): Promise<LoteVerificado> {
  const { etapas, ...lote } = fila;
  let errorRed = wallet === null;

  const verificadas = await Promise.all(
    etapas.map(async (etapa): Promise<EtapaVerificada> => {
      const hashActual = hashDeFila(etapa, lote.codigo);
      let sello = null;
      if (etapa.tx_hash && wallet) {
        try {
          sello = await leerSello(etapa.tx_hash);
        } catch (error) {
          console.error("[verificacion] RPC", error);
          errorRed = true;
        }
      }

      const resultado = evaluarEtapa({
        hashActual,
        txHash: etapa.tx_hash,
        marcadaComoSellada: Boolean(etapa.sellado_en),
        sello,
        walletEsperada: wallet ?? "",
      });

      // Confirmación tardía: el bloque llegó después de responder al operador.
      if (resultado.estado === "verificado" && !etapa.sellado_en && sello?.fecha) {
        etapa.sellado_en = sello.fecha.toISOString();
        await db.from("etapas").update({ sellado_en: etapa.sellado_en }).eq("id", etapa.id);
      }

      return { ...etapa, hashActual, hashEnCadena: sello?.hash ?? null, ...resultado };
    }),
  );

  const estados = verificadas.map((e) => e.estado);
  return {
    lote,
    etapas: verificadas,
    // Una alteración detectada se informa aunque otra etapa haya fallado por red.
    estado: estados.includes("alterado")
      ? "alterado"
      : errorRed
        ? "error_red"
        : estadoDelLote(estados),
    wallet,
    verificadoEn: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Resumen de integridad para el dashboard
// ---------------------------------------------------------------------------

/** Máximo de lotes que el dashboard verifica en cada carga. */
const LIMITE_RESUMEN = 100;

/**
 * Verifica contra la blockchain los lotes más recientes (una sola consulta a la
 * base de datos y una lectura de la blockchain por etapa sellada).
 */
export async function resumenIntegridad(): Promise<ResumenIntegridad> {
  const db = crearClienteAdmin();
  const { data, count, error } = await db
    .from("lotes")
    .select(SELECT_LOTE_COMPLETO, { count: "exact" })
    .order("updated_at", { ascending: false })
    .order("orden", { referencedTable: "etapas" })
    .limit(LIMITE_RESUMEN)
    .returns<FilaLoteCompleto[]>();
  if (error) throw error;

  const wallet = walletOError();
  const lotes = await Promise.all((data ?? []).map((fila) => verificarFila(db, fila, wallet)));

  return resumirVerificaciones(lotes, count ?? lotes.length);
}

/** RF14: guarda un escaneo del QR para las estadísticas. Nunca rompe la página. */
export async function registrarEscaneo(
  loteId: string,
  pais: string | null,
  estado: LoteVerificado["estado"],
) {
  if (estado !== "verificado" && estado !== "alterado") return;
  const { error } = await crearClienteAdmin()
    .from("escaneos")
    .insert({ lote_id: loteId, pais, resultado: estado });
  if (error) console.error("[escaneos]", error);
}

/**
 * Lotes creados por `npm run lotes:ejemplo`, verificados contra la blockchain.
 * Los usa la portada para mostrar el sistema funcionando con datos reales.
 */
export async function lotesDeDemostracion(): Promise<LoteVerificado[]> {
  const db = crearClienteAdmin();
  const { data, error } = await db
    .from("lotes")
    .select("*, productores!inner(*), parcelas(*), etapas(*, evidencias(url, tipo))")
    .ilike("productores.historia", `%${MARCA_DEMO}%`)
    .order("codigo")
    .order("orden", { referencedTable: "etapas" })
    .limit(3)
    .returns<FilaLoteCompleto[]>();
  if (error) throw error;

  const wallet = walletOError();
  return Promise.all((data ?? []).map((fila) => verificarFila(db, fila, wallet)));
}
