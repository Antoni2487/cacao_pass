import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { SELECT_FILA_LOTE, TablaLotes, type FilaLote } from "@/components/panel/tabla-lotes";
import { ButtonLink } from "@/components/ui/button";
import { Card, EstadoVacio } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { obtenerUsuarioActual } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Lotes de cacao" };

export default async function LotesPage() {
  const [usuario, supabase] = await Promise.all([obtenerUsuarioActual(), crearClienteServidor()]);
  const { data, error } = await supabase
    .from("lotes")
    .select(SELECT_FILA_LOTE)
    .order("created_at", { ascending: false })
    .returns<FilaLote[]>();
  if (error) throw new Error("No se pudo cargar la lista de lotes.");

  return (
    <>
      <PageHeader
        titulo="Lotes de cacao"
        subtitulo={`${data.length} lotes registrados`}
        acciones={
          usuario.rol === "admin" && (
            <ButtonLink href="/panel/lotes/nuevo">
              <Plus className="size-4" aria-hidden /> Nuevo lote
            </ButtonLink>
          )
        }
      />
      <Card>
        {data.length === 0 ? (
          <EstadoVacio>Aún no hay lotes. Crea el primero desde “Nuevo lote”.</EstadoVacio>
        ) : (
          <TablaLotes lotes={data} />
        )}
      </Card>
    </>
  );
}
