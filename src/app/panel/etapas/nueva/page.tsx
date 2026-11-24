import type { Metadata } from "next";
import Link from "next/link";
import { Card, EstadoVacio } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { obtenerUsuarioActual } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { EtapaForm, type LoteParaEtapa } from "./etapa-form";

export const metadata: Metadata = { title: "Registrar etapa" };

export default async function NuevaEtapaPage({
  searchParams,
}: {
  searchParams: Promise<{ lote?: string }>;
}) {
  const [{ lote }, usuario, supabase] = await Promise.all([
    searchParams,
    obtenerUsuarioActual(),
    crearClienteServidor(),
  ]);

  const { data, error } = await supabase
    .from("lotes")
    .select("codigo, destino, productores(nombre), etapas(tipo, ubicacion, fecha)")
    .neq("estado", "exportado")
    .order("created_at", { ascending: false })
    .order("orden", { referencedTable: "etapas" })
    .returns<LoteParaEtapa[]>();
  if (error) throw new Error("No se pudo cargar la lista de lotes.");

  // Solo lotes a los que aún les falta alguna etapa.
  const lotes = data.filter((l) => l.etapas.length < 5);
  const inicial = lotes.some((l) => l.codigo === lote) ? lote : undefined;

  return (
    <>
      <PageHeader
        titulo="Registrar etapa del lote"
        subtitulo="Al guardar, la etapa se sella en blockchain y ya no podrá modificarse"
      />
      {lotes.length === 0 ? (
        <Card>
          <EstadoVacio>
            No hay lotes con etapas pendientes.{" "}
            <Link href="/panel/lotes" className="font-semibold text-cacao-700">
              Ver lotes
            </Link>
          </EstadoVacio>
        </Card>
      ) : (
        <EtapaForm lotes={lotes} loteInicial={inicial} responsable={usuario.nombre} />
      )}
    </>
  );
}
