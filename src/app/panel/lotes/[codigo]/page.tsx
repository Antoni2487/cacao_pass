import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, MapPin, TriangleAlert } from "lucide-react";
import { EstadoLoteBadge } from "@/components/panel/estado-lote";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, EstadoVacio } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha, formatearNumero } from "@/lib/utils";
import { ETIQUETAS, type Etapa, type Lote, type Parcela, type Productor } from "@/types/dominio";

type DetalleLote = Lote & {
  productores: Productor;
  parcelas: Parcela;
  etapas: Etapa[];
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}): Promise<Metadata> {
  return { title: `Lote ${(await params).codigo}` };
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-tenue">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm font-semibold">{valor}</dd>
    </div>
  );
}

export default async function LotePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const supabase = await crearClienteServidor();

  const { data: lote } = await supabase
    .from("lotes")
    .select("*, productores(*), parcelas(*), etapas(*)")
    .eq("codigo", decodeURIComponent(codigo))
    .order("orden", { referencedTable: "etapas" })
    .maybeSingle<DetalleLote>();
  if (!lote) notFound();

  const { productores: productor, parcelas: parcela } = lote;

  return (
    <>
      <Link
        href="/panel/lotes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-tenue hover:text-cacao-700"
      >
        <ArrowLeft className="size-4" aria-hidden /> Lotes de cacao
      </Link>
      <PageHeader
        titulo={`Lote ${lote.codigo}`}
        subtitulo={`${lote.variedad} · ${formatearNumero(lote.peso_kg)} kg · Destino: ${lote.destino}`}
        acciones={<EstadoLoteBadge estado={lote.estado} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader titulo="Origen del lote" />
            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <div>
                <Link
                  href={`/panel/productores/${productor.id}`}
                  className="text-base font-semibold hover:text-cacao-700"
                >
                  {productor.nombre}
                </Link>
                <p className="text-sm text-tenue">
                  {ETIQUETAS.tipoProductor[productor.tipo]} · {productor.region}
                  {productor.anio_inicio && ` · cultiva desde ${productor.anio_inicio}`}
                </p>
                {productor.historia && (
                  <p className="mt-3 text-sm leading-relaxed italic">“{productor.historia}”</p>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-4">
                <Dato etiqueta="Parcela" valor={parcela.nombre} />
                <Dato
                  etiqueta="Hectáreas"
                  valor={parcela.hectareas ? `${formatearNumero(parcela.hectareas)} ha` : "—"}
                />
                <Dato
                  etiqueta="Altitud"
                  valor={parcela.altitud_msnm ? `${parcela.altitud_msnm} m s. n. m.` : "—"}
                />
                <Dato etiqueta="Cosecha" valor={formatearFecha(lote.fecha_cosecha)} />
              </dl>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-borde px-6 py-4 text-sm">
              {parcela.libre_deforestacion ? (
                <span className="flex items-center gap-2 text-exito-700">
                  <CircleCheck className="size-4" aria-hidden /> Parcela libre de deforestación
                </span>
              ) : (
                <span className="flex items-center gap-2 text-aviso-700">
                  <TriangleAlert className="size-4" aria-hidden /> Deforestación sin verificar
                </span>
              )}
              {parcela.latitud !== null && parcela.longitud !== null && (
                <a
                  href={`https://www.google.com/maps?q=${parcela.latitud},${parcela.longitud}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 font-medium text-cacao-700 hover:underline"
                >
                  <MapPin className="size-4" aria-hidden /> Ver en el mapa
                </a>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader titulo="Recorrido y sellos en blockchain" />
            {lote.etapas.length === 0 ? (
              <EstadoVacio>Aún no se registran etapas para este lote.</EstadoVacio>
            ) : (
              <ol className="divide-y divide-borde">
                {lote.etapas.map((etapa) => (
                  <li key={etapa.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold">{ETIQUETAS.tipoEtapa[etapa.tipo]}</p>
                      <p className="text-xs text-tenue">
                        {etapa.ubicacion} · {formatearFecha(etapa.fecha)}
                      </p>
                    </div>
                    {etapa.sellado_en ? (
                      <Badge tono="exito">Sellado</Badge>
                    ) : (
                      <Badge tono="aviso">Pendiente</Badge>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader titulo="Datos del lote" />
          <dl className="grid grid-cols-2 gap-4 p-6">
            <Dato etiqueta="Código" valor={lote.codigo} />
            <Dato etiqueta="Variedad" valor={lote.variedad} />
            <Dato etiqueta="Peso" valor={`${formatearNumero(lote.peso_kg)} kg`} />
            <Dato etiqueta="Destino" valor={lote.destino} />
            <div className="col-span-2">
              <dt className="text-xs text-tenue">Certificaciones</dt>
              <dd className="mt-1.5 flex flex-wrap gap-2">
                {lote.certificaciones.length === 0
                  ? "—"
                  : lote.certificaciones.map((c) => (
                      <Badge key={c} tono="exito">
                        {c}
                      </Badge>
                    ))}
              </dd>
            </div>
            <Dato etiqueta="Registrado" valor={formatearFecha(lote.created_at)} />
          </dl>
        </Card>
      </div>
    </>
  );
}
