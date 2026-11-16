/**
 * Reglas de verificación (RF10). Funciones puras, sin red ni base de datos,
 * para poder probarlas a fondo en verificacion.test.ts.
 */

export type EstadoEtapa = "verificado" | "alterado" | "pendiente";
export type EstadoLoteVerificado = EstadoEtapa | "sin_etapas";

export interface EntradaEvaluacion {
  /** Hash recalculado con los datos que hay HOY en la base de datos. */
  hashActual: string;
  /** tx_hash guardado en la etapa (null = nunca se envió a la blockchain). */
  txHash: string | null;
  /** La etapa ya figuraba como sellada (sellado_en no nulo). */
  marcadaComoSellada: boolean;
  /** Lo que devuelve la blockchain para ese tx_hash (null = no existe). */
  sello: { hash: string | null; emisor: string; confirmado: boolean } | null;
  /** Dirección de nuestra wallet. */
  walletEsperada: string;
}

export interface ResultadoEtapa {
  estado: EstadoEtapa;
  /** Motivo legible para el panel y la página pública. */
  motivo: string;
}

export function evaluarEtapa(e: EntradaEvaluacion): ResultadoEtapa {
  if (!e.txHash) return { estado: "pendiente", motivo: "Aún no se envió a la blockchain." };

  if (!e.sello) {
    // Si ya estaba confirmada y ahora no aparece, alguien cambió el tx_hash.
    return e.marcadaComoSellada
      ? { estado: "alterado", motivo: "La transacción registrada no existe en la blockchain." }
      : { estado: "pendiente", motivo: "La transacción aún no aparece en la blockchain." };
  }

  if (e.sello.emisor.toLowerCase() !== e.walletEsperada.toLowerCase()) {
    return { estado: "alterado", motivo: "El sello no fue emitido por la wallet de la empresa." };
  }

  if (e.sello.hash !== e.hashActual) {
    return {
      estado: "alterado",
      motivo: "Los datos actuales no coinciden con el hash sellado.",
    };
  }

  if (!e.sello.confirmado) {
    return { estado: "pendiente", motivo: "La transacción espera confirmación." };
  }

  return { estado: "verificado", motivo: "El hash coincide con el sellado en blockchain." };
}

/** Un lote está alterado si cualquier etapa lo está; verificado solo si todas lo están. */
export function estadoDelLote(estados: EstadoEtapa[]): EstadoLoteVerificado {
  if (estados.length === 0) return "sin_etapas";
  if (estados.includes("alterado")) return "alterado";
  if (estados.includes("pendiente")) return "pendiente";
  return "verificado";
}
