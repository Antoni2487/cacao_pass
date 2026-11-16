import type { Metadata } from "next";
import { Leaf, ScanLine, TriangleAlert, Users } from "lucide-react";
import { SELECT_FILA_LOTE, TablaLotes, type FilaLote } from "@/components/panel/tabla-lotes";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, EstadoVacio } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { obtenerUsuarioActual } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cn, formatearNumero } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function Indicador({
  titulo,
  valor,
  nota,
  icono: Icono,
  tono,
}: {
  titulo: string;
  valor: number | null;
  nota: string;
  icono: typeof Leaf;
  tono: "cacao" | "aviso" | "exito" | "error";
}) {
  const colores = {
    cacao: "bg-cacao-100 text-cacao-700",
    aviso: "bg-aviso-50 text-aviso-700",
    exito: "bg-exito-50 text-exito-700",
    error: "bg-error-50 text-error-700",
  }[tono];

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-tenue">{titulo}</p>
        <span className={cn("grid size-8 place-items-center rounded-lg", colores)}>
          <Icono className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold">{valor === null ? "—" : formatearNumero(valor)}</p>
      <p className={cn("mt-2 text-xs font-medium", colores.split(" ")[1])}>{nota}</p>
    </Card>
  );
}

export default async function DashboardPage() {
  const [usuario, supabase] = await Promise.all([obtenerUsuarioActual(), crearClienteServidor()]);

  // `head: true` solo cuenta filas, sin descargarlas.
  const [lotes, productores, escaneos, recientes] = await Promise.all([
    supabase.from("lotes").select("*", { count: "exact", head: true }),
    supabase.from("productores").select("*", { count: "exact", head: true }),
    supabase.from("escaneos").select("*", { count: "exact", head: true }),
    supabase
      .from("lotes")
      .select(SELECT_FILA_LOTE)
      .order("updated_at", { ascending: false })
      .limit(6)
      .returns<FilaLote[]>(),
  ]);

  return (
    <>
      <PageHeader
        titulo="Dashboard"
        subtitulo={`Hola, ${usuario.nombre} · Trazabilidad del cacao · Campaña ${new Date().getFullYear()}`}
        acciones={
          usuario.rol === "admin" && <ButtonLink href="/panel/lotes/nuevo">+ Nuevo lote</ButtonLink>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          titulo="Lotes registrados"
          valor={lotes.count}
          nota="Total histórico"
          icono={Leaf}
          tono="cacao"
        />
        <Indicador
          titulo="Productores"
          valor={productores.count}
          nota="Familias y cooperativas"
          icono={Users}
          tono="aviso"
        />
        <Indicador
          titulo="Escaneos de compradores"
          valor={escaneos.count}
          nota="Lecturas del QR"
          icono={ScanLine}
          tono="exito"
        />
        {/* Las alertas se calculan al verificar los hashes (Día 2). */}
        <Indicador
          titulo="Alertas de integridad"
          valor={null}
          nota="Disponible al activar el sellado"
          icono={TriangleAlert}
          tono="error"
        />
      </div>

      <Card>
        <CardHeader titulo="Lotes recientes" />
        {recientes.data?.length ? (
          <TablaLotes lotes={recientes.data} />
        ) : (
          <EstadoVacio>Aún no hay lotes registrados.</EstadoVacio>
        )}
      </Card>
    </>
  );
}
