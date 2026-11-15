/**
 * Tipos del dominio, espejo de las tablas de supabase/migrations.
 * Si cambias una tabla, actualiza aquí el tipo correspondiente.
 *
 * Nota: Supabase devuelve las columnas `numeric` como number y las `date` /
 * `timestamptz` como string ISO.
 */

export type Rol = "admin" | "operador";

export interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
  created_at: string;
}

export const TIPOS_PRODUCTOR = ["familia", "cooperativa", "asociacion"] as const;
export type TipoProductor = (typeof TIPOS_PRODUCTOR)[number];

export interface Productor {
  id: string;
  nombre: string;
  tipo: TipoProductor;
  region: string;
  anio_inicio: number | null;
  historia: string | null;
  created_at: string;
  updated_at: string;
}

export interface Parcela {
  id: string;
  productor_id: string;
  nombre: string;
  hectareas: number | null;
  altitud_msnm: number | null;
  latitud: number | null;
  longitud: number | null;
  libre_deforestacion: boolean;
  created_at: string;
}

export const ESTADOS_LOTE = ["registrado", "en_transito", "exportado"] as const;
export type EstadoLote = (typeof ESTADOS_LOTE)[number];

export const CERTIFICACIONES = ["Orgánico", "Comercio justo", "Rainforest Alliance"] as const;

export interface Lote {
  id: string;
  codigo: string;
  productor_id: string;
  parcela_id: string;
  variedad: string;
  peso_kg: number;
  fecha_cosecha: string;
  destino: string;
  certificaciones: string[];
  estado: EstadoLote;
  created_at: string;
  updated_at: string;
}

export const TIPOS_ETAPA = [
  "cosecha",
  "fermentacion_secado",
  "acopio",
  "planta",
  "exportacion",
] as const;
export type TipoEtapa = (typeof TIPOS_ETAPA)[number];

export interface Etapa {
  id: string;
  lote_id: string;
  tipo: TipoEtapa;
  orden: number;
  responsable_id: string | null;
  ubicacion: string;
  fecha: string;
  datos: Record<string, unknown>;
  hash: string | null;
  tx_hash: string | null;
  sellado_en: string | null;
  created_at: string;
}

/** Textos para mostrar en pantalla. */
export const ETIQUETAS = {
  tipoProductor: {
    familia: "Familia",
    cooperativa: "Cooperativa",
    asociacion: "Asociación",
  } satisfies Record<TipoProductor, string>,
  estadoLote: {
    registrado: "Registrado",
    en_transito: "En tránsito",
    exportado: "Exportado",
  } satisfies Record<EstadoLote, string>,
  tipoEtapa: {
    cosecha: "Cosecha",
    fermentacion_secado: "Fermentación y secado",
    acopio: "Centro de acopio",
    planta: "Procesamiento en planta",
    exportacion: "Exportación",
  } satisfies Record<TipoEtapa, string>,
} as const;
