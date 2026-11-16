import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { ArrowRight, Clock, Leaf, MapPin, ShieldCheck, TriangleAlert, WifiOff } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import {
  Bloque,
  CabeceraPublica,
  MapaParcela,
  formatearMesAnio,
  iniciales,
  variedadEnFrase,
} from "@/components/publico/piezas";
import { abreviarHash } from "@/lib/trazabilidad/explorador";
import { registrarEscaneo, verificarLote, type LoteVerificado } from "@/lib/trazabilidad/servicio";
import { PATRON_CODIGO_LOTE } from "@/lib/qr";
import { cn, formatearNumero } from "@/lib/utils";
import { ETIQUETAS } from "@/types/dominio";

type Props = { params: Promise<{ codigo: string }> };

async function cargar(codigo: string) {
  if (!PATRON_CODIGO_LOTE.test(codigo)) notFound();
  const resultado = await verificarLote(codigo);
  if (!resultado) notFound();
  return resultado;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codigo } = await params;
  return {
    title: `Pasaporte digital · Lote ${codigo}`,
    description: "Origen y recorrido verificable de un lote de cacao peruano.",
    robots: { index: false },
  };
}

/** Página que abre el QR: 05 · Pasaporte digital, o 07 · Alerta si no verifica. */
export default async function PasaportePage({ params }: Props) {
  const { codigo } = await params;
  const resultado = await cargar(codigo);

  // RF14: registra el escaneo después de responder, sin demorar la página.
  const pais = (await headers()).get("x-vercel-ip-country");
  after(() => registrarEscaneo(resultado.lote.id, pais, resultado.estado));

  return (
    <div className="min-h-dvh bg-crema">
      <CabeceraPublica />
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-5">
        {resultado.estado === "alterado" ? (
          <AlertaAlterado resultado={resultado} />
        ) : (
          <Pasaporte resultado={resultado} estado={resultado.estado} />
        )}
      </main>
    </div>
  );
}

function Pasaporte({
  resultado,
  estado,
}: {
  resultado: LoteVerificado;
  estado: Exclude<LoteVerificado["estado"], "alterado">;
}) {
  const { lote } = resultado;
  const productor = lote.productores;
  const parcela = lote.parcelas;
  const region = productor.region.split(",")[0];

  return (
    <>
      <section className="rounded-2xl bg-gradient-to-br from-cacao-900 to-cacao-700 p-5 text-white">
        <p className="text-[11px] font-semibold tracking-wide text-white/70 uppercase">
          Pasaporte digital · Lote {lote.codigo}
        </p>
        <h1 className="mt-2 text-2xl leading-tight font-bold">
          Cacao {variedadEnFrase(lote.variedad)} de {region}, Perú
        </h1>
        <p className="mt-2 text-sm text-white/80">
          {formatearNumero(lote.peso_kg)} kg · Cosecha {formatearMesAnio(lote.fecha_cosecha)}
        </p>
      </section>

      <EstadoVerificacion estado={estado} />

      <Bloque titulo="Quién lo cultivó">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-cacao-100 font-bold text-cacao-700">
            {iniciales(productor.nombre)}
          </span>
          <div>
            <p className="text-lg font-semibold">{productor.nombre}</p>
            <p className="text-sm text-tenue">
              {productor.anio_inicio
                ? `Cultivan cacao desde ${productor.anio_inicio}`
                : ETIQUETAS.tipoProductor[productor.tipo]}
            </p>
          </div>
        </div>
        {productor.historia && (
          <p className="mt-3 text-[15px] leading-relaxed">“{productor.historia}”</p>
        )}
      </Bloque>

      <Bloque titulo="De dónde viene">
        {parcela.latitud !== null && parcela.longitud !== null && (
          <MapaParcela latitud={parcela.latitud} longitud={parcela.longitud} className="mb-3" />
        )}
        <p className="flex items-center gap-2 text-sm">
          <MapPin className="size-4 shrink-0 text-cacao-700" aria-hidden />
          Parcela {parcela.nombre}
          {parcela.hectareas && ` · ${formatearNumero(parcela.hectareas)} ha`}
          {parcela.altitud_msnm && ` · ${parcela.altitud_msnm} m s. n. m.`}
        </p>
        <p className="mt-1 pl-6 text-xs text-tenue">{productor.region}</p>
      </Bloque>

      <Bloque titulo="Sostenibilidad">
        <ul className="flex flex-wrap gap-2">
          {parcela.libre_deforestacion && <Chip>Libre de deforestación</Chip>}
          {lote.certificaciones.map((c) => (
            <Chip key={c}>{c}</Chip>
          ))}
          {!parcela.libre_deforestacion && lote.certificaciones.length === 0 && (
            <li className="text-sm text-tenue">Sin certificaciones registradas.</li>
          )}
        </ul>
      </Bloque>

      <ButtonLink href={`/lote/${lote.codigo}/recorrido`} className="w-full py-3.5">
        Ver recorrido del lote <ArrowRight className="size-4" aria-hidden />
      </ButtonLink>
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full bg-exito-50 px-3 py-1.5 text-sm font-semibold text-exito-700">
      <Leaf className="size-3.5" aria-hidden />
      {children}
    </li>
  );
}

const mensajes = {
  verificado: {
    icono: ShieldCheck,
    titulo: "Verificado en blockchain",
    texto: "Nadie ha modificado esta información",
    clases: "bg-exito-50 text-exito-700",
  },
  pendiente: {
    icono: Clock,
    titulo: "Verificación en proceso",
    texto: "Algunas etapas aún se están sellando en blockchain",
    clases: "bg-aviso-50 text-aviso-700",
  },
  sin_etapas: {
    icono: Clock,
    titulo: "Lote recién registrado",
    texto: "Su recorrido aparecerá a medida que avance",
    clases: "bg-cacao-100 text-cacao-700",
  },
  error_red: {
    icono: WifiOff,
    titulo: "No se pudo verificar ahora",
    texto: "La blockchain no respondió. Vuelve a intentarlo en un momento",
    clases: "bg-cacao-100 text-cacao-700",
  },
} as const;

function EstadoVerificacion({ estado }: { estado: keyof typeof mensajes }) {
  const { icono: Icono, titulo, texto, clases } = mensajes[estado];
  return (
    <section role="status" className={cn("flex items-center gap-3 rounded-2xl p-4", clases)}>
      <Icono className="size-7 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">{titulo}</p>
        <p className="text-sm opacity-90">{texto}</p>
      </div>
    </section>
  );
}

/** 07 · Alerta: datos alterados (RF11). */
function AlertaAlterado({ resultado }: { resultado: LoteVerificado }) {
  const { lote } = resultado;
  const alterada = resultado.etapas.find((e) => e.estado === "alterado")!;

  return (
    <>
      <section
        role="alert"
        className="flex flex-col items-center rounded-2xl bg-error-50 px-5 py-7 text-center text-error-700"
      >
        <span className="grid size-14 place-items-center rounded-full bg-white">
          <TriangleAlert className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-bold">Información no verificada</h1>
        <p className="mt-2 text-sm leading-relaxed">
          Los datos de este lote cambiaron después de ser sellados en blockchain. No coinciden con
          el registro original.
        </p>
      </section>

      <Bloque titulo={`Lote ${lote.codigo} · ${lote.productores.nombre}`}>
        <div className="flex flex-col gap-2">
          <div className="rounded-xl bg-crema p-3">
            <p className="text-xs text-tenue">Hash sellado en blockchain</p>
            <p className="font-mono text-lg font-bold text-exito-700">
              {alterada.hashEnCadena ? abreviarHash(alterada.hashEnCadena) : "No encontrado"}
            </p>
          </div>
          <div className="rounded-xl bg-crema p-3">
            <p className="text-xs text-tenue">Hash de los datos actuales</p>
            <p className="font-mono text-lg font-bold text-error-700">
              {abreviarHash(alterada.hashActual)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold">
          Etapa con diferencias: {ETIQUETAS.tipoEtapa[alterada.tipo]}
        </p>
        <p className="text-xs text-tenue">{alterada.motivo}</p>
      </Bloque>

      <Bloque>
        <h2 className="font-semibold">¿Qué hacer?</h2>
        <p className="mt-1 text-sm leading-relaxed">
          No aceptes este lote como verificado. Contacta al equipo de calidad del exportador
          indicando el código <strong>{lote.codigo}</strong>.
        </p>
      </Bloque>

      <ButtonLink
        href={`/lote/${lote.codigo}/recorrido`}
        variante="secundario"
        className="w-full py-3.5"
      >
        Ver historial del lote
      </ButtonLink>
    </>
  );
}
