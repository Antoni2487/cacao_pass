import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, EstadoVacio } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { obtenerUsuarioActual } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearNumero } from "@/lib/utils";
import { ETIQUETAS, type Parcela, type Productor } from "@/types/dominio";
import { actualizarProductor, eliminarParcela } from "../actions";
import { ParcelaForm } from "../parcela-form";
import { ProductorForm } from "../productor-form";

export const metadata: Metadata = { title: "Productor" };

type ProductorConParcelas = Productor & { parcelas: Parcela[]; lotes: { count: number }[] };

export default async function ProductorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [usuario, supabase] = await Promise.all([obtenerUsuarioActual(), crearClienteServidor()]);

  const { data: productor } = await supabase
    .from("productores")
    .select("*, parcelas(*), lotes(count)")
    .eq("id", id)
    .order("nombre", { referencedTable: "parcelas" })
    .maybeSingle<ProductorConParcelas>();
  if (!productor) notFound();

  const esAdmin = usuario.rol === "admin";

  return (
    <>
      <Link
        href="/panel/productores"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-tenue hover:text-cacao-700"
      >
        <ArrowLeft className="size-4" aria-hidden /> Productores
      </Link>
      <PageHeader
        titulo={productor.nombre}
        subtitulo={`${ETIQUETAS.tipoProductor[productor.tipo]} · ${productor.region} · ${productor.lotes[0]?.count ?? 0} lotes`}
      />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader titulo={`Parcelas (${productor.parcelas.length})`} />
          {productor.parcelas.length === 0 ? (
            <EstadoVacio>Este productor aún no tiene parcelas.</EstadoVacio>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-borde bg-crema text-left text-xs font-semibold text-tenue">
                  <tr>
                    <th className="px-6 py-3">Parcela</th>
                    <th className="px-6 py-3 text-right">Hectáreas</th>
                    <th className="px-6 py-3 text-right">Altitud</th>
                    <th className="px-6 py-3">Coordenadas</th>
                    <th className="px-6 py-3">Deforestación</th>
                    {esAdmin && <th className="px-6 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde">
                  {productor.parcelas.map((parcela) => (
                    <tr key={parcela.id}>
                      <td className="px-6 py-3.5 font-semibold">{parcela.nombre}</td>
                      <td className="px-6 py-3.5 text-right">
                        {formatearNumero(parcela.hectareas)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {parcela.altitud_msnm ? `${parcela.altitud_msnm} m` : "—"}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs">
                        {parcela.latitud !== null && parcela.longitud !== null
                          ? `${parcela.latitud}, ${parcela.longitud}`
                          : "—"}
                      </td>
                      <td className="px-6 py-3.5">
                        {parcela.libre_deforestacion ? (
                          <Badge tono="exito">Libre</Badge>
                        ) : (
                          <Badge tono="aviso">Sin verificar</Badge>
                        )}
                      </td>
                      {esAdmin && (
                        <td className="px-6 py-3.5 text-right">
                          <form action={eliminarParcela.bind(null, productor.id, parcela.id)}>
                            <button
                              type="submit"
                              className="rounded-lg p-2 text-tenue hover:bg-error-50 hover:text-error-700"
                              aria-label={`Eliminar parcela ${parcela.nombre}`}
                              title="Eliminar (solo si no tiene lotes)"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </form>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {esAdmin && (
            <div className="border-t border-borde p-6">
              <h3 className="mb-4 text-sm font-semibold">Agregar parcela</h3>
              <ParcelaForm productorId={productor.id} />
            </div>
          )}
        </Card>

        {esAdmin && (
          <Card>
            <CardHeader titulo="Datos del productor" />
            <div className="p-6">
              <ProductorForm
                accion={actualizarProductor.bind(null, productor.id)}
                productor={productor}
                textoBoton="Guardar cambios"
              />
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
