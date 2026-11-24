import Link from "next/link";
import { formatearFecha, formatearNumero } from "@/lib/utils";
import type { Lote } from "@/types/dominio";
import { EstadoLoteBadge } from "./estado-lote";

export type FilaLote = Pick<
  Lote,
  "id" | "codigo" | "variedad" | "peso_kg" | "destino" | "estado" | "updated_at"
> & {
  productores: { nombre: string; region: string } | null;
};

/** Columnas que necesita la tabla, para usar en `.select()`. */
export const SELECT_FILA_LOTE =
  "id, codigo, variedad, peso_kg, destino, estado, updated_at, productores(nombre, region)";

export function TablaLotes({ lotes }: { lotes: FilaLote[] }) {
  return (
    <>
      {/* Móvil: una tarjeta por lote en vez de una tabla con scroll horizontal */}
      <ul className="divide-y divide-borde md:hidden">
        {lotes.map((lote) => (
          <li key={lote.id}>
            <Link
              href={`/panel/lotes/${lote.codigo}`}
              className="flex flex-col gap-1.5 px-5 py-4 active:bg-crema"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold">{lote.codigo}</span>
                <EstadoLoteBadge estado={lote.estado} />
              </span>
              <span className="text-sm">
                {lote.productores?.nombre ?? "Sin productor"}
                <span className="text-tenue">, {lote.variedad}</span>
              </span>
              <span className="text-xs text-tenue">
                {formatearNumero(lote.peso_kg)} kg rumbo a {lote.destino}. Actualizado el{" "}
                {formatearFecha(lote.updated_at)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-borde bg-crema text-left text-xs font-semibold text-tenue">
            <tr>
              <th className="px-6 py-3">Lote</th>
              <th className="px-6 py-3">Productor</th>
              <th className="px-6 py-3">Variedad</th>
              <th className="px-6 py-3 text-right">Peso</th>
              <th className="px-6 py-3">Destino</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Actualizado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {lotes.map((lote) => (
              <tr key={lote.id} className="hover:bg-crema/60">
                <td className="px-6 py-3.5">
                  <Link
                    href={`/panel/lotes/${lote.codigo}`}
                    className="font-semibold whitespace-nowrap hover:text-cacao-700"
                  >
                    {lote.codigo}
                  </Link>
                </td>
                <td className="px-6 py-3.5">
                  <p className="font-semibold">{lote.productores?.nombre ?? "—"}</p>
                  <p className="text-xs text-tenue">{lote.productores?.region}</p>
                </td>
                <td className="px-6 py-3.5">{lote.variedad}</td>
                <td className="px-6 py-3.5 text-right whitespace-nowrap">
                  {formatearNumero(lote.peso_kg)} kg
                </td>
                <td className="px-6 py-3.5">{lote.destino}</td>
                <td className="px-6 py-3.5">
                  <EstadoLoteBadge estado={lote.estado} />
                </td>
                <td className="px-6 py-3.5 whitespace-nowrap text-tenue">
                  {formatearFecha(lote.updated_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
