import type { LoteVerificado } from "@/lib/trazabilidad/servicio";
import type { DatosPasaporte } from "./documento-pasaporte";

/** Datos del documento a partir del lote verificado. */
export function datosDelPasaporte({ lote }: LoteVerificado): DatosPasaporte {
  return {
    codigo: lote.codigo,
    variedad: lote.variedad,
    region: lote.productores.region,
    peso_kg: Number(lote.peso_kg),
    fecha_cosecha: lote.fecha_cosecha,
    destino: lote.destino,
    productor: lote.productores.nombre,
  };
}

/** Hash de la última etapa sellada: el que se imprime en la franja del documento. */
export function huellaDelLote({ etapas }: LoteVerificado) {
  const sellada = [...etapas].reverse().find((e) => e.tx_hash);
  return sellada ? (sellada.hashEnCadena ?? sellada.hashActual) : null;
}
