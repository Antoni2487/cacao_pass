import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Link2, ShieldCheck, TriangleAlert, WifiOff } from "lucide-react";
import { EstadoLoteBadge } from "@/components/panel/estado-lote";
import { ReintentarSellado } from "@/components/panel/reintentar-sellado";
import { TarjetaQr } from "@/components/panel/tarjeta-qr";
import { MapaParcela, iniciales } from "@/components/publico/piezas";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, EstadoVacio } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PATRON_CODIGO_LOTE, urlPublicaLote } from "@/lib/qr";
import { RED_BLOCKCHAIN, abreviarHash, urlExplorador } from "@/lib/trazabilidad/explorador";
import { verificarLote, type LoteVerificado } from "@/lib/trazabilidad/servicio";
import { cn, formatearFecha, formatearNumero } from "@/lib/utils";
import { ETIQUETAS } from "@/types/dominio";

type Props = {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ sellado?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Lote ${(await params).codigo}` };
}

/** 04 · Detalle del lote. El acceso ya lo validó el layout del panel. */
export default async function LotePage({ params, searchParams }: Props) {
  const [{ codigo }, { sellado }] = await Promise.all([params, searchParams]);
  if (!PATRON_CODIGO_LOTE.test(codigo)) notFound();
  const resultado = await verificarLote(codigo);
  if (!resultado) notFound();

  const { lote, etapas } = resultado;
  const { productores: productor, parcelas: parcela } = lote;
  const selladas = etapas.filter((e) => e.sellado_en).length;

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
        acciones={
          <>
            <EstadoLoteBadge estado={lote.estado} />
            <ButtonLink href={`/lote/${lote.codigo}`} target="_blank" variante="secundario">
              Ver pasaporte público
            </ButtonLink>
            {etapas.length < 5 && (
              <ButtonLink href={`/panel/etapas/nueva?lote=${lote.codigo}`}>
                Registrar etapa
              </ButtonLink>
            )}
          </>
        }
      />

      {sellado === "fallido" && (
        <p
          role="alert"
          className="mb-6 rounded-xl bg-aviso-50 px-4 py-3 text-sm font-medium text-aviso-700"
        >
          La etapa se guardó, pero no se pudo sellar en blockchain. Usa “Reintentar sellado”.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader titulo="Origen del lote" />
            <div className="grid gap-6 p-6 md:grid-cols-[1fr_240px]">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-cacao-100 text-sm font-bold text-cacao-700">
                    {iniciales(productor.nombre)}
                  </span>
                  <div>
                    <Link
                      href={`/panel/productores/${productor.id}`}
                      className="font-semibold hover:text-cacao-700"
                    >
                      {productor.nombre}
                    </Link>
                    <p className="text-sm text-tenue">
                      {productor.anio_inicio && `Productores desde ${productor.anio_inicio} · `}
                      {productor.region}
                    </p>
                  </div>
                </div>
                <dl className="grid gap-2 sm:grid-cols-3">
                  <Dato
                    etiqueta="Parcela"
                    valor={`${parcela.nombre}${parcela.hectareas ? ` · ${formatearNumero(parcela.hectareas)} ha` : ""}`}
                  />
                  <Dato
                    etiqueta="Altitud"
                    valor={parcela.altitud_msnm ? `${parcela.altitud_msnm} m s. n. m.` : "—"}
                  />
                  <Dato etiqueta="Cosecha" valor={formatearFecha(lote.fecha_cosecha)} />
                </dl>
                {parcela.libre_deforestacion ? (
                  <p className="flex items-center gap-2 rounded-lg bg-exito-50 px-3 py-2 text-sm font-medium text-exito-700">
                    <ShieldCheck className="size-4 shrink-0" aria-hidden /> Parcela libre de
                    deforestación (Reglamento UE)
                  </p>
                ) : (
                  <p className="flex items-center gap-2 rounded-lg bg-aviso-50 px-3 py-2 text-sm font-medium text-aviso-700">
                    <TriangleAlert className="size-4 shrink-0" aria-hidden /> Deforestación sin
                    verificar
                  </p>
                )}
              </div>
              {parcela.latitud !== null && parcela.longitud !== null ? (
                <MapaParcela
                  latitud={parcela.latitud}
                  longitud={parcela.longitud}
                  className="h-full min-h-40"
                />
              ) : (
                <p className="grid min-h-40 place-items-center rounded-xl bg-crema text-xs text-tenue">
                  Sin coordenadas
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              titulo="Recorrido y sellos en blockchain"
              accion={<span className="text-sm text-tenue">{selladas} de 5 etapas selladas</span>}
            />
            {etapas.length === 0 ? (
              <EstadoVacio>Aún no se registran etapas para este lote.</EstadoVacio>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="border-b border-borde bg-crema text-left text-xs font-semibold text-tenue">
                    <tr>
                      <th className="px-6 py-3">Etapa</th>
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Ubicación</th>
                      <th className="px-6 py-3">Hash</th>
                      <th className="px-6 py-3">Blockchain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borde">
                    {etapas.map((etapa) => (
                      <tr key={etapa.id}>
                        <td className="px-6 py-3.5 font-semibold">
                          {ETIQUETAS.tipoEtapa[etapa.tipo]}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          {formatearFecha(etapa.fecha)}
                        </td>
                        <td className="px-6 py-3.5">{etapa.ubicacion}</td>
                        <td
                          className={cn(
                            "px-6 py-3.5 font-mono text-xs",
                            etapa.estado === "alterado" && "text-error-700",
                          )}
                          title={etapa.hashActual}
                        >
                          {abreviarHash(etapa.hashActual, 4, 4)}
                        </td>
                        <td className="px-6 py-3.5">
                          {etapa.estado === "alterado" ? (
                            <Badge tono="error">Alterado</Badge>
                          ) : etapa.sellado_en && etapa.tx_hash ? (
                            <a
                              href={urlExplorador(etapa.tx_hash)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-exito-700 hover:underline"
                            >
                              <Link2 className="size-3.5" aria-hidden /> Sellado
                            </a>
                          ) : (
                            <ReintentarSellado etapaId={etapa.id} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h2 className="mb-4 text-center text-base font-semibold">Código QR del lote</h2>
            <TarjetaQr codigo={lote.codigo} url={urlPublicaLote(lote.codigo)} />
            <p className="mt-4 text-center text-xs text-tenue">
              Va impreso en los sacos y documentos de exportación. El comprador lo escanea y ve el
              pasaporte digital.
            </p>
          </Card>
          <TarjetaIntegridad resultado={resultado} />
          <Card>
            <CardHeader titulo="Datos del lote" />
            <dl className="grid grid-cols-2 gap-2 p-6">
              <Dato etiqueta="Variedad" valor={lote.variedad} />
              <Dato etiqueta="Peso" valor={`${formatearNumero(lote.peso_kg)} kg`} />
              <Dato etiqueta="Destino" valor={lote.destino} />
              <Dato etiqueta="Registrado" valor={formatearFecha(lote.created_at)} />
              <div className="col-span-2 pt-2">
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
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-crema px-3 py-2">
      <dt className="text-xs text-tenue">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm font-semibold">{valor}</dd>
    </div>
  );
}

const integridad = {
  verificado: {
    icono: ShieldCheck,
    titulo: "Datos íntegros",
    clases: "border-exito-700/20 bg-exito-50 text-exito-700",
  },
  alterado: {
    icono: TriangleAlert,
    titulo: "Datos alterados",
    clases: "border-error-700/20 bg-error-50 text-error-700",
  },
  pendiente: {
    icono: Clock,
    titulo: "Sellado en proceso",
    clases: "border-aviso-700/20 bg-aviso-50 text-aviso-700",
  },
  sin_etapas: {
    icono: Clock,
    titulo: "Sin etapas aún",
    clases: "border-borde bg-white text-tenue",
  },
  error_red: {
    icono: WifiOff,
    titulo: "Blockchain no disponible",
    clases: "border-borde bg-white text-tenue",
  },
} as const;

function TarjetaIntegridad({ resultado }: { resultado: LoteVerificado }) {
  const { icono: Icono, titulo, clases } = integridad[resultado.estado];
  const verificadas = resultado.etapas.filter((e) => e.estado === "verificado").length;
  const alterada = resultado.etapas.find((e) => e.estado === "alterado");

  const texto = {
    verificado: `Los hashes de las ${verificadas} etapas coinciden con los registrados en blockchain. Nadie modificó la información.`,
    alterado: `La etapa “${alterada ? ETIQUETAS.tipoEtapa[alterada.tipo] : ""}” no coincide. ${alterada?.motivo ?? ""} La página pública muestra la alerta.`,
    pendiente: "Hay etapas sin confirmar en blockchain. Reintenta el sellado si no avanza.",
    sin_etapas: "Registra la primera etapa para empezar el recorrido.",
    error_red:
      "No se pudo consultar la blockchain. Revisa RPC_URL, NEXT_PUBLIC_RED_BLOCKCHAIN y WALLET_PRIVATE_KEY.",
  }[resultado.estado];

  return (
    <section className={cn("rounded-2xl border p-6", clases)}>
      <h2 className="flex items-center gap-2 font-semibold">
        <Icono className="size-5" aria-hidden /> {titulo}
      </h2>
      <p className="mt-2 text-sm text-tinta">{texto}</p>
      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-tenue">Red</dt>
          <dd className="font-semibold text-tinta">{RED_BLOCKCHAIN}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-tenue">Última verificación</dt>
          <dd className="font-semibold text-tinta">
            {new Intl.DateTimeFormat("es-PE", {
              timeStyle: "short",
              timeZone: "America/Lima",
            }).format(new Date(resultado.verificadoEn))}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-tenue">Algoritmo</dt>
          <dd className="font-semibold text-tinta">SHA-256</dd>
        </div>
      </dl>
    </section>
  );
}
