import { describe, expect, it } from "vitest";
import { resumirVerificaciones, type LoteParaResumen } from "./resumen";

function lote(
  codigo: string,
  estado: LoteParaResumen["estado"],
  etapas: LoteParaResumen["etapas"] = [],
): LoteParaResumen {
  return { lote: { codigo, productores: { nombre: `Productor ${codigo}` } }, etapas, estado };
}

describe("resumirVerificaciones", () => {
  it("cuenta cada lote en su estado", () => {
    const r = resumirVerificaciones(
      [
        lote("LT-1", "verificado"),
        lote("LT-2", "verificado"),
        lote("LT-3", "pendiente"),
        lote("LT-4", "sin_etapas"),
        lote("LT-5", "error_red"),
      ],
      5,
    );
    expect(r).toMatchObject({
      revisados: 5,
      verificados: 2,
      pendientes: 1,
      sinEtapas: 1,
      errorRed: 1,
      alertas: [],
      truncado: false,
    });
  });

  it("genera una alerta con la primera etapa alterada", () => {
    const r = resumirVerificaciones(
      [
        lote("LT-9", "alterado", [
          { tipo: "cosecha", estado: "verificado", motivo: "ok" },
          { tipo: "acopio", estado: "alterado", motivo: "Los datos no coinciden." },
          { tipo: "planta", estado: "alterado", motivo: "otra" },
        ]),
      ],
      1,
    );
    expect(r.alertas).toEqual([
      {
        codigo: "LT-9",
        productor: "Productor LT-9",
        etapa: "acopio",
        motivo: "Los datos no coinciden.",
      },
    ]);
    expect(r.verificados).toBe(0);
  });

  it("avisa cuando no se revisaron todos los lotes", () => {
    expect(resumirVerificaciones([lote("LT-1", "verificado")], 150).truncado).toBe(true);
  });

  it("devuelve todo en cero sin lotes", () => {
    const r = resumirVerificaciones([], 0);
    expect(r.revisados).toBe(0);
    expect(r.alertas).toHaveLength(0);
  });
});
