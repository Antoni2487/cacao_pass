import { createHash } from "node:crypto";

/**
 * Cálculo del hash de una etapa (RF07, RNF03).
 *
 * Este archivo es la pieza más delicada del sistema: si el mismo dato produjera
 * un hash distinto en dos momentos, la página pública mostraría una falsa alerta
 * de "datos alterados". Por eso todo pasa por un JSON canónico y está cubierto
 * por pruebas en hash.test.ts. Ver docs/01-conceptos-blockchain.md.
 */

/** Campos de la etapa que entran al hash. Cambiarlos invalida todos los sellos previos. */
export interface EntradaHashEtapa {
  lote_codigo: string;
  tipo: string;
  orden: number;
  ubicacion: string;
  /** Acepta el formato de Supabase ("2026-09-20 14:00:00+00") o ISO; se normaliza a UTC. */
  fecha: string | Date;
  datos: Record<string, unknown>;
}

type ValorJson = string | number | boolean | null | ValorJson[] | { [clave: string]: ValorJson };

/**
 * Serializa un valor a JSON con las claves ordenadas alfabéticamente (en todos
 * los niveles) y sin espacios. Las propiedades `undefined` se omiten, igual que
 * en JSON.stringify.
 */
export function jsonCanonico(valor: unknown): string {
  if (valor === null) return "null";

  switch (typeof valor) {
    case "string":
    case "boolean":
      return JSON.stringify(valor);
    case "number":
      if (!Number.isFinite(valor)) throw new Error(`Número no válido para el hash: ${valor}`);
      return JSON.stringify(valor);
    case "object": {
      if (Array.isArray(valor)) return `[${valor.map(jsonCanonico).join(",")}]`;
      const objeto = valor as Record<string, unknown>;
      const pares = Object.keys(objeto)
        .filter((clave) => objeto[clave] !== undefined)
        .sort()
        .map((clave) => `${JSON.stringify(clave)}:${jsonCanonico(objeto[clave])}`);
      return `{${pares.join(",")}}`;
    }
    default:
      throw new Error(`Tipo no soportado en el hash: ${typeof valor}`);
  }
}

/** Convierte cualquier fecha válida a ISO 8601 UTC con milisegundos. */
export function normalizarFecha(fecha: string | Date): string {
  const valor = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(valor.getTime())) throw new Error(`Fecha no válida para el hash: ${fecha}`);
  return valor.toISOString();
}

/** Texto exacto que se hashea. Útil para mostrarlo o depurarlo. */
export function textoCanonicoEtapa(etapa: EntradaHashEtapa): string {
  const entrada: { [clave: string]: ValorJson } = {
    lote_codigo: etapa.lote_codigo,
    tipo: etapa.tipo,
    orden: etapa.orden,
    ubicacion: etapa.ubicacion,
    fecha: normalizarFecha(etapa.fecha),
    datos: etapa.datos as ValorJson,
  };
  return jsonCanonico(entrada);
}

/** SHA-256 en hexadecimal (64 caracteres) del JSON canónico de la etapa. */
export function calcularHashEtapa(etapa: EntradaHashEtapa): string {
  return createHash("sha256").update(textoCanonicoEtapa(etapa), "utf8").digest("hex");
}
