import { describe, expect, it } from "vitest";
import { esquemaEtapa } from "@/lib/validaciones/etapa";
import { datosDeCalidad, estadoLoteTrasEtapa, ordenDeEtapa, siguienteEtapa } from "./etapas";

describe("orden de etapas", () => {
  it("asigna el orden que exige la base de datos", () => {
    expect(ordenDeEtapa("cosecha")).toBe(1);
    expect(ordenDeEtapa("exportacion")).toBe(5);
  });

  it("calcula la siguiente etapa", () => {
    expect(siguienteEtapa(0)).toBe("cosecha");
    expect(siguienteEtapa(3)).toBe("planta");
    expect(siguienteEtapa(5)).toBeNull();
  });

  it("actualiza el estado del lote", () => {
    expect(estadoLoteTrasEtapa(2)).toBe("registrado");
    expect(estadoLoteTrasEtapa(3)).toBe("en_transito");
    expect(estadoLoteTrasEtapa(5)).toBe("exportado");
  });
});

describe("datosDeCalidad", () => {
  it("omite los campos vacíos para que no entren al hash", () => {
    expect(datosDeCalidad({ peso_kg: 1250, humedad_pct: null, notas: null })).toEqual({
      peso_kg: 1250,
    });
  });
});

describe("esquemaEtapa", () => {
  const base = {
    lote_codigo: "LT-26-0001",
    tipo: "cosecha",
    ubicacion: "Tocache",
    fecha: "2026-09-18T09:15",
  };

  it("interpreta la fecha del formulario como hora de Lima", () => {
    expect(esquemaEtapa.parse(base).fecha).toBe("2026-09-18T14:15:00.000Z");
  });

  it("rechaza fechas futuras y humedad fuera de rango", () => {
    const r = esquemaEtapa.safeParse({ ...base, fecha: "2099-01-01T00:00", humedad_pct: "120" });
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(["fecha", "humedad_pct"]);
  });
});
