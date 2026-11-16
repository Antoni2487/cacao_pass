import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft, Clock, ExternalLink, FileText, Link2, X } from "lucide-react";
import { Bloque, CabeceraPublica } from "@/components/publico/piezas";
import { PATRON_CODIGO_LOTE } from "@/lib/qr";
import {
  RED_BLOCKCHAIN,
  abreviarHash,
  urlDireccion,
  urlExplorador,
} from "@/lib/trazabilidad/explorador";
import { verificarLote, type EtapaVerificada } from "@/lib/trazabilidad/servicio";
import { cn, formatearFecha, formatearNumero } from "@/lib/utils";
import { ETIQUETAS, TIPOS_ETAPA } from "@/types/dominio";

type Props = { params: Promise<{ codigo: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Recorrido · Lote ${(await params).codigo}`, robots: { index: false } };
}

/** Resumen corto de los datos de calidad: "humedad 7 % · 1,250 kg". */
function resumenDatos(datos: Record<string, unknown>) {
  const partes: string[] = [];
  if (typeof datos.humedad_pct === "number") partes.push(`humedad ${datos.humedad_pct} %`);
  if (typeof datos.peso_kg === "number") partes.push(`${formatearNumero(datos.peso_kg)} kg`);
  return partes.join(" · ");
}

const iconoEstado = {
  verificado: { icono: Check, clase: "bg-exito-700 text-white" },
  alterado: { icono: X, clase: "bg-error-700 text-white" },
  pendiente: { icono: Clock, clase: "bg-aviso-700 text-white" },
} as const;

/** 06 · Recorrido del lote. */
export default async function RecorridoPage({ params }: Props) {
  const { codigo } = await params;
  if (!PATRON_CODIGO_LOTE.test(codigo)) notFound();
  const resultado = await verificarLote(codigo);
  if (!resultado) notFound();

  const { lote, etapas, wallet } = resultado;
  const ultimaSellada = [...etapas].reverse().find((e) => e.tx_hash);

  return (
    <div className="min-h-dvh bg-crema">
      <CabeceraPublica>
        <Link
          href={`/lote/${lote.codigo}`}
          className="-ml-2 rounded-lg p-1.5 hover:bg-crema"
          aria-label="Volver al pasaporte"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold">Recorrido del lote</h1>
      </CabeceraPublica>

      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-5">
        <p className="text-sm text-tenue">
          De la parcela en {lote.productores.region.split(",")[0]} a {lote.destino}. Cada etapa
          queda sellada en blockchain.
        </p>

        <Bloque>
          <ol>
            {TIPOS_ETAPA.map((tipo, i) => {
              const etapa = etapas.find((e) => e.tipo === tipo);
              const ultima = i === TIPOS_ETAPA.length - 1;
              return (
                <li key={tipo} className="relative flex gap-3 pb-5 last:pb-0">
                  {!ultima && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-7 bottom-0 left-[13px] w-0.5",
                        etapa ? "bg-exito-700" : "bg-borde",
                      )}
                    />
                  )}
                  {etapa ? (
                    <EtapaRegistrada etapa={etapa} />
                  ) : (
                    <>
                      <span className="z-[1] size-7 shrink-0 rounded-full border-2 border-borde bg-white" />
                      <div>
                        <p className="font-semibold text-tenue">{ETIQUETAS.tipoEtapa[tipo]}</p>
                        <p className="text-sm text-tenue">
                          En preparación
                          {tipo === "exportacion" && ` · Destino: ${lote.destino}`}
                        </p>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </Bloque>

        {ultimaSellada?.tx_hash && (
          <section className="rounded-2xl bg-cacao-900 p-4 text-sm text-white">
            <h2 className="mb-3 text-[11px] font-semibold tracking-wide text-white/70 uppercase">
              Prueba en blockchain · última etapa
            </h2>
            <dl className="flex flex-col gap-2">
              <div className="flex justify-between gap-4">
                <dt className="text-white/70">Hash (SHA-256)</dt>
                <dd className="font-mono font-semibold">
                  {abreviarHash(ultimaSellada.hashEnCadena ?? ultimaSellada.hashActual)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/70">Transacción</dt>
                <dd className="font-mono font-semibold">{abreviarHash(ultimaSellada.tx_hash)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/70">Red</dt>
                <dd className="font-semibold">{RED_BLOCKCHAIN}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={urlExplorador(ultimaSellada.tx_hash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[#e0a46b] hover:underline"
              >
                Ver en el explorador de blockchain <ExternalLink className="size-3.5" aria-hidden />
              </a>
              {wallet && (
                <a
                  href={urlDireccion(wallet)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-white/60 hover:underline"
                >
                  Wallet emisora: {abreviarHash(wallet, 8, 6)}
                </a>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function EtapaRegistrada({ etapa }: { etapa: EtapaVerificada }) {
  const { icono: Icono, clase } = iconoEstado[etapa.estado];
  const resumen = resumenDatos(etapa.datos);

  return (
    <>
      <span className={cn("z-[1] grid size-7 shrink-0 place-items-center rounded-full", clase)}>
        <Icono className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{ETIQUETAS.tipoEtapa[etapa.tipo]}</p>
        <p className="text-sm text-tenue">
          {formatearFecha(etapa.fecha)} · {etapa.ubicacion}
          {resumen && ` · ${resumen}`}
        </p>
        {typeof etapa.datos.notas === "string" && (
          <p className="mt-1 text-sm">{etapa.datos.notas}</p>
        )}

        {etapa.estado === "verificado" && etapa.tx_hash && (
          <a
            href={urlExplorador(etapa.tx_hash)}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-exito-700 hover:underline"
          >
            <Link2 className="size-3.5" aria-hidden /> Sellado en blockchain
          </a>
        )}
        {etapa.estado === "alterado" && (
          <p className="mt-1 text-xs font-semibold text-error-700">{etapa.motivo}</p>
        )}
        {etapa.estado === "pendiente" && (
          <p className="mt-1 text-xs font-semibold text-aviso-700">Sellado en proceso</p>
        )}

        {etapa.evidencias.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {etapa.evidencias.map((ev, i) => (
              <li key={ev.url}>
                <a href={ev.url} target="_blank" rel="noreferrer" className="block">
                  {ev.tipo === "foto" ? (
                    // eslint-disable-next-line @next/next/no-img-element -- archivo de Supabase Storage
                    <img
                      src={ev.url}
                      alt={`Evidencia ${i + 1} de ${ETIQUETAS.tipoEtapa[etapa.tipo]}`}
                      className="size-14 rounded-lg border border-borde object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-borde px-2 py-1.5 text-xs font-medium">
                      <FileText className="size-3.5" aria-hidden /> PDF
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
