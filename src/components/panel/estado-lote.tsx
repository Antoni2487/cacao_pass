import { Badge, type TonoBadge } from "@/components/ui/badge";
import { ETIQUETAS, type EstadoLote } from "@/types/dominio";

const tonos: Record<EstadoLote, TonoBadge> = {
  registrado: "neutro",
  en_transito: "aviso",
  exportado: "exito",
};

export function EstadoLoteBadge({ estado }: { estado: EstadoLote }) {
  return <Badge tono={tonos[estado]}>{ETIQUETAS.estadoLote[estado]}</Badge>;
}
