import { TIPOS_ETAPA, type TipoEtapa } from "@/types/dominio";

/** Orden fijo de cada etapa (coincide con el CHECK de la tabla etapas). */
export function ordenDeEtapa(tipo: TipoEtapa): number {
  return TIPOS_ETAPA.indexOf(tipo) + 1;
}

/** Siguiente etapa a registrar según cuántas tiene el lote, o null si ya está completo. */
export function siguienteEtapa(etapasRegistradas: number): TipoEtapa | null {
  return TIPOS_ETAPA[etapasRegistradas] ?? null;
}

/** Estado del lote que corresponde después de registrar una etapa. */
export function estadoLoteTrasEtapa(orden: number): "registrado" | "en_transito" | "exportado" {
  if (orden >= 5) return "exportado";
  if (orden >= 3) return "en_transito";
  return "registrado";
}

/** Solo los datos de calidad que se llenaron (los vacíos no entran al hash). */
export function datosDeCalidad(campos: {
  peso_kg: number | null;
  humedad_pct: number | null;
  notas: string | null;
}): Record<string, string | number> {
  const datos: Record<string, string | number> = {};
  if (campos.peso_kg !== null) datos.peso_kg = campos.peso_kg;
  if (campos.humedad_pct !== null) datos.humedad_pct = campos.humedad_pct;
  if (campos.notas) datos.notas = campos.notas;
  return datos;
}
