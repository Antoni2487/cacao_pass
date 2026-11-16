import { describe, expect, it } from "vitest";
import { estadoDelLote, evaluarEtapa, type EntradaEvaluacion } from "./verificacion";

const WALLET = "0xAbC0000000000000000000000000000000000001";
const HASH = "a".repeat(64);
const TX = `0x${"1".repeat(64)}`;

const base: EntradaEvaluacion = {
  hashActual: HASH,
  txHash: TX,
  marcadaComoSellada: true,
  sello: { hash: HASH, emisor: WALLET, confirmado: true },
  walletEsperada: WALLET,
};

describe("evaluarEtapa", () => {
  it("verifica cuando el hash recalculado coincide con el de la blockchain", () => {
    expect(evaluarEtapa(base).estado).toBe("verificado");
  });

  it("compara la wallet sin importar mayúsculas", () => {
    const sello = { ...base.sello!, emisor: WALLET.toLowerCase() };
    expect(evaluarEtapa({ ...base, sello }).estado).toBe("verificado");
  });

  it("detecta datos alterados en la base de datos", () => {
    expect(evaluarEtapa({ ...base, hashActual: "b".repeat(64) }).estado).toBe("alterado");
  });

  it("detecta un sello emitido por otra wallet", () => {
    const sello = { ...base.sello!, emisor: "0x9990000000000000000000000000000000000009" };
    expect(evaluarEtapa({ ...base, sello }).estado).toBe("alterado");
  });

  it("detecta un tx_hash reemplazado por una transacción inexistente", () => {
    expect(evaluarEtapa({ ...base, sello: null }).estado).toBe("alterado");
  });

  it("marca como pendiente lo que aún no se envió o no se confirma", () => {
    expect(evaluarEtapa({ ...base, txHash: null }).estado).toBe("pendiente");
    expect(evaluarEtapa({ ...base, sello: null, marcadaComoSellada: false }).estado).toBe(
      "pendiente",
    );
    const sello = { ...base.sello!, confirmado: false };
    expect(evaluarEtapa({ ...base, sello }).estado).toBe("pendiente");
  });

  it("prioriza la alteración aunque la transacción no esté confirmada", () => {
    const sello = { ...base.sello!, confirmado: false };
    expect(evaluarEtapa({ ...base, sello, hashActual: "c".repeat(64) }).estado).toBe("alterado");
  });
});

describe("estadoDelLote", () => {
  it("combina los estados de las etapas", () => {
    expect(estadoDelLote([])).toBe("sin_etapas");
    expect(estadoDelLote(["verificado", "verificado"])).toBe("verificado");
    expect(estadoDelLote(["verificado", "pendiente"])).toBe("pendiente");
    expect(estadoDelLote(["pendiente", "alterado", "verificado"])).toBe("alterado");
  });
});
