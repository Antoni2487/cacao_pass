import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, cache } from "react";
import { Leaf, ScanLine, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import { SELECT_FILA_LOTE, TablaLotes, type FilaLote } from "@/components/panel/tabla-lotes";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, EstadoVacio } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { obtenerUsuarioActual } from "@/lib/auth";
import { resumenIntegridad } from "@/lib/trazabilidad/servicio";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cn, formatearNumero } from "@/lib/utils";
import { ETIQUETAS } from "@/types/dominio";

export const metadata: Metadata = { title: "Dashboard" };

/** Una sola verificación por carga, aunque la pidan la tarjeta y el panel de alertas. */
const obtenerResumen = cache(async () => {
  try {
    return await resumenIntegridad();
  } catch (error) {
    console.error("[dashboard] resumen de integridad", error);
    return null;
  }
});

type Tono = "cacao" | "aviso" | "exito" | "error";

const COLORES: Record<Tono, string> = {
  cacao: "bg-cacao-100 text-cacao-700",
  aviso: "bg-aviso-50 text-aviso-700",
  exito: "bg-exito-50 text-exito-700",
  error: "bg-error-50 text-error-700",
};

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
  tono: Tono;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-tenue">{titulo}</p>
        <span className={cn("grid size-8 place-items-center rounded-lg", COLORES[tono])}>
          <Icono className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold">{valor === null ? "—" : formatearNumero(valor)}</p>
      <p className={cn("mt-2 text-xs font-medium", COLORES[tono].split(" ")[1])}>{nota}</p>
    </Card>
  );
}

function IndicadorCargando() {
  return (
    <Card className="p-6" aria-busy="true">
      <p className="text-sm text-tenue">Alertas de integridad</p>
      <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-borde" />
      <p className="mt-2 text-xs text-tenue">Verificando en blockchain…</p>
    </Card>
  );
}

async function IndicadorAlertas() {
  const resumen = await obtenerResumen();
  if (!resumen) {
    return (
      <Indicador
        titulo="Alertas de integridad"
        valor={null}
        nota="No se pudo verificar"
        icono={TriangleAlert}
        tono="aviso"
      />
    );
  }
  const alertas = resumen.alertas.length;
  return (
    <Indicador
      titulo="Alertas de integridad"
      valor={alertas}
      nota={alertas ? "Lotes con datos alterados" : "Ningún lote alterado"}
      icono={alertas ? TriangleAlert : ShieldCheck}
      tono={alertas ? "error" : "exito"}
    />
  );
}

function Cifra({ valor, etiqueta, clase }: { valor: number; etiqueta: string; clase: string }) {
  return (
    <div className="rounded-xl bg-crema px-4 py-3">
      <p className={cn("text-2xl font-bold", clase)}>{formatearNumero(valor)}</p>
      <p className="text-xs text-tenue">{etiqueta}</p>
    </div>
  );
}

async function PanelIntegridad() {
  const resumen = await obtenerResumen();

  if (!resumen) {
    return (
      <EstadoVacio>
        No se pudo verificar los lotes. Revisa la conexión con Supabase y la blockchain.
      </EstadoVacio>
    );
  }
  if (resumen.revisados === 0) return <EstadoVacio>Aún no hay lotes para verificar.</EstadoVacio>;

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="grid grid-cols-2 gap-3">
        <Cifra valor={resumen.verificados} etiqueta="Verificados" clase="text-exito-700" />
        <Cifra valor={resumen.alertas.length} etiqueta="Alterados" clase="text-error-700" />
        <Cifra
          valor={resumen.pendientes + resumen.sinEtapas}
          etiqueta="Pendientes de sellar"
          clase="text-aviso-700"
        />
        <Cifra valor={resumen.errorRed} etiqueta="Sin respuesta de la red" clase="text-tenue" />
      </div>

      {resumen.alertas.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {resumen.alertas.map((a) => (
            <li key={a.codigo}>
              <Link
                href={`/panel/lotes/${a.codigo}`}
                className="block rounded-xl border border-error-700/20 bg-error-50 px-4 py-3 hover:border-error-700/50"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-error-700">
                  <TriangleAlert className="size-4 shrink-0" aria-hidden />
                  {a.codigo} · {ETIQUETAS.tipoEtapa[a.etapa]}
                </p>
                <p className="mt-1 text-xs text-tenue">
                  {a.productor}. {a.motivo}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-sm text-exito-700">
          <ShieldCheck className="size-4" aria-hidden />
          Todos los datos coinciden con sus sellos en blockchain.
        </p>
      )}

      {resumen.truncado && (
        <p className="text-xs text-tenue">
          Se revisaron los {resumen.revisados} lotes actualizados más recientemente.
        </p>
      )}
    </div>
  );
}

function PanelCargando() {
  return (
    <div className="flex flex-col gap-3 p-6" aria-busy="true" aria-label="Verificando">
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-borde/60" />
        ))}
      </div>
      <p className="text-xs text-tenue">Comparando cada etapa con su sello en blockchain…</p>
    </div>
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
        <Suspense fallback={<IndicadorCargando />}>
          <IndicadorAlertas />
        </Suspense>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            titulo="Lotes recientes"
            accion={
              <Link href="/panel/lotes" className="text-sm font-semibold text-cacao-700">
                Ver todos
              </Link>
            }
          />
          {recientes.data?.length ? (
            <TablaLotes lotes={recientes.data} />
          ) : (
            <EstadoVacio>Aún no hay lotes registrados.</EstadoVacio>
          )}
        </Card>

        <Card>
          <CardHeader titulo="Integridad en blockchain" />
          <Suspense fallback={<PanelCargando />}>
            <PanelIntegridad />
          </Suspense>
        </Card>
      </div>
    </>
  );
}
