import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, EstadoVacio } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { obtenerUsuarioActual } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { ETIQUETAS, type Productor } from "@/types/dominio";

export const metadata: Metadata = { title: "Productores" };

type FilaProductor = Productor & { parcelas: { count: number }[]; lotes: { count: number }[] };

export default async function ProductoresPage() {
  const [usuario, supabase] = await Promise.all([obtenerUsuarioActual(), crearClienteServidor()]);
  const { data, error } = await supabase
    .from("productores")
    .select("*, parcelas(count), lotes(count)")
    .order("nombre")
    .returns<FilaProductor[]>();
  if (error) throw new Error("No se pudo cargar la lista de productores.");

  return (
    <>
      <PageHeader
        titulo="Productores"
        subtitulo="Familias, cooperativas y asociaciones que abastecen los lotes"
        acciones={
          usuario.rol === "admin" && (
            <ButtonLink href="/panel/productores/nuevo">
              <Plus className="size-4" aria-hidden /> Nuevo productor
            </ButtonLink>
          )
        }
      />

      <Card>
        {data.length === 0 ? (
          <EstadoVacio>Aún no hay productores registrados.</EstadoVacio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-borde bg-crema text-left text-xs font-semibold text-tenue">
                <tr>
                  <th className="px-6 py-3">Productor</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Cultiva desde</th>
                  <th className="px-6 py-3 text-right">Parcelas</th>
                  <th className="px-6 py-3 text-right">Lotes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {data.map((p) => (
                  <tr key={p.id} className="hover:bg-crema/60">
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/panel/productores/${p.id}`}
                        className="font-semibold hover:text-cacao-700"
                      >
                        {p.nombre}
                      </Link>
                      <p className="text-xs text-tenue">{p.region}</p>
                    </td>
                    <td className="px-6 py-3.5">{ETIQUETAS.tipoProductor[p.tipo]}</td>
                    <td className="px-6 py-3.5">{p.anio_inicio ?? "—"}</td>
                    <td className="px-6 py-3.5 text-right">{p.parcelas[0]?.count ?? 0}</td>
                    <td className="px-6 py-3.5 text-right">{p.lotes[0]?.count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
