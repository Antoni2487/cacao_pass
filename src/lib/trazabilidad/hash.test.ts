import { describe, expect, it } from "vitest";
import { calcularHashEtapa, jsonCanonico, normalizarFecha, textoCanonicoEtapa } from "./hash";

const etapa = {
  lote_codigo: "LT-26-0457",
  tipo: "fermentacion_secado",
  orden: 2,
  ubicacion: "Tocache, San Martín",
  fecha: "2026-09-20T14:00:00.000Z",
  datos: { humedad_pct: 7, peso_kg: 1180, notas: "Fermentación 6 días" },
};

// Valor de referencia publicado en docs/01-conceptos-blockchain.md.
const HASH_DOCUMENTADO = "5041366202b81266332c8aac605ca6106445c7104be1b2d696c8d4b741ad3bcb";

describe("jsonCanonico", () => {
  it("ordena las claves en todos los niveles y no deja espacios", () => {
    expect(jsonCanonico({ b: 1, a: { d: [2, { z: 1, y: 2 }], c: "x" } })).toBe(
      '{"a":{"c":"x","d":[2,{"y":2,"z":1}]},"b":1}',
    );
  });

  it("da el mismo texto sin importar el orden original de las claves", () => {
    expect(jsonCanonico({ orden: 2, tipo: "cosecha" })).toBe(
      jsonCanonico({ tipo: "cosecha", orden: 2 }),
    );
  });

  it("omite propiedades undefined pero conserva null", () => {
    expect(jsonCanonico({ a: undefined, b: null })).toBe('{"b":null}');
  });

  it("rechaza valores que JSON no puede representar", () => {
    expect(() => jsonCanonico({ a: Number.NaN })).toThrow();
    expect(() => jsonCanonico({ a: () => 1 })).toThrow();
  });
});

describe("normalizarFecha", () => {
  it("convierte el formato de Supabase y otras zonas horarias al mismo ISO UTC", () => {
    const esperado = "2026-09-20T14:00:00.000Z";
    expect(normalizarFecha("2026-09-20 14:00:00+00")).toBe(esperado);
    expect(normalizarFecha("2026-09-20T14:00:00+00:00")).toBe(esperado);
    expect(normalizarFecha("2026-09-20T09:00:00-05:00")).toBe(esperado); // hora de Lima
    expect(normalizarFecha(new Date(esperado))).toBe(esperado);
  });

  it("rechaza fechas inválidas", () => {
    expect(() => normalizarFecha("no es fecha")).toThrow();
  });
});

describe("calcularHashEtapa", () => {
  it("coincide con el valor documentado", () => {
    expect(calcularHashEtapa(etapa)).toBe(HASH_DOCUMENTADO);
  });

  it("devuelve 64 caracteres hexadecimales", () => {
    expect(calcularHashEtapa(etapa)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("no cambia si los datos vuelven de la base con otro formato de fecha u orden de claves", () => {
    const desdeSupabase = {
      ...etapa,
      fecha: "2026-09-20 14:00:00+00",
      datos: { peso_kg: 1180, notas: "Fermentación 6 días", humedad_pct: 7 },
    };
    expect(calcularHashEtapa(desdeSupabase)).toBe(HASH_DOCUMENTADO);
  });

  it("cambia si se altera cualquier dato (demo del lote alterado)", () => {
    const alterada = { ...etapa, datos: { ...etapa.datos, humedad_pct: 6.5 } };
    expect(calcularHashEtapa(alterada)).toBe(
      "c8023ac92e28aa12e35c1da226f3860e1f2a4de0deb6bf794bf3f438fa345064",
    );
    expect(calcularHashEtapa({ ...etapa, ubicacion: "Tocache" })).not.toBe(HASH_DOCUMENTADO);
    expect(calcularHashEtapa({ ...etapa, fecha: "2026-09-20T14:00:01.000Z" })).not.toBe(
      HASH_DOCUMENTADO,
    );
  });

  it("solo usa los campos documentados", () => {
    expect(textoCanonicoEtapa(etapa)).toBe(
      '{"datos":{"humedad_pct":7,"notas":"Fermentación 6 días","peso_kg":1180},"fecha":"2026-09-20T14:00:00.000Z","lote_codigo":"LT-26-0457","orden":2,"tipo":"fermentacion_secado","ubicacion":"Tocache, San Martín"}',
    );
  });
});
