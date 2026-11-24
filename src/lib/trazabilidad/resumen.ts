/**
 * Resumen de integridad para el dashboard. Función pura (sin red ni base de
 * datos) para poder probarla en resumen.test.ts.
 */
import type { TipoEtapa } from "@/types/dominio";
import type { EstadoEtapa, EstadoLoteVerificado } from "./verificacion";

export interface AlertaIntegridad {
  codigo: string;
  productor: string;
  /** Primera etapa que no coincide con su sello. */
  etapa: TipoEtapa;
  motivo: string;
}

export interface ResumenIntegridad {
  revisados: number;
  verificados: number;
  /** Lotes con alguna etapa aún sin sellar o sin confirmar. */
  pendientes: number;
  sinEtapas: number;
  alertas: AlertaIntegridad[];
  /** Lotes que no se pudieron comprobar porque la blockchain no respondió. */
  errorRed: number;
  /** true si hay más lotes que los revisados. */
  truncado: boolean;
}

/** Lo mínimo de un lote ya verificado que necesita el resumen. */
export interface LoteParaResumen {
  lote: { codigo: string; productores: { nombre: string } | null };
  etapas: { tipo: TipoEtapa; estado: EstadoEtapa; motivo: string }[];
  estado: EstadoLoteVerificado | "error_red";
}

export function resumirVerificaciones(
  lotes: LoteParaResumen[],
  totalLotes: number,
): ResumenIntegridad {
  const resumen: ResumenIntegridad = {
    revisados: lotes.length,
    verificados: 0,
    pendientes: 0,
    sinEtapas: 0,
    alertas: [],
    errorRed: 0,
    truncado: totalLotes > lotes.length,
  };

  for (const { lote, etapas, estado } of lotes) {
    switch (estado) {
      case "alterado": {
        const etapa = etapas.find((e) => e.estado === "alterado");
        resumen.alertas.push({
          codigo: lote.codigo,
          productor: lote.productores?.nombre ?? "—",
          etapa: etapa?.tipo ?? "cosecha",
          motivo: etapa?.motivo ?? "Los datos no coinciden con el sello.",
        });
        break;
      }
      case "verificado":
        resumen.verificados++;
        break;
      case "pendiente":
        resumen.pendientes++;
        break;
      case "sin_etapas":
        resumen.sinEtapas++;
        break;
      case "error_red":
        resumen.errorRed++;
        break;
    }
  }
  return resumen;
}
