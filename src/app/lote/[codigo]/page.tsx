import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import {
  ArrowRight,
  Clock,
  FlaskConical,
  Leaf,
  ShieldCheck,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { DocumentoPasaporte } from "@/components/publico/documento-pasaporte";
import { datosDelPasaporte, huellaDelLote } from "@/components/publico/datos-pasaporte";
import { Bloque, CabeceraPublica, MapaParcela, iniciales } from "@/components/publico/piezas";
import { separarMarcaDemo } from "@/lib/demo";
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

/** Página que abre el QR: pasaporte digital, o alerta si los datos no verifican. */
export default async function PasaportePage({ params }: Props) {
  const { codigo } = await params;
  const resultado = await cargar(codigo);

  // RF14: registra el escaneo después de responder, sin demorar la página.
  const pais = (await headers()).get("x-vercel-ip-country");
  after(() => registrarEscaneo(resultado.lote.id, pais, resultado.estado));

  const alterado = resultado.estado === "alterado";

  return (
    <div className="min-h-dvh">
      <CabeceraPublica />
      <main className="mx-auto grid max-w-md gap-4 px-4 pt-5 pb-10 lg:max-w-5xl lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start lg:gap-10 lg:px-8 lg:pt-10">
        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <DocumentoPasaporte
            datos={datosDelPasaporte(resultado)}
            estado={resultado.estado}
            huella={huellaDelLote(resultado)}
          />
          <EstadoVerificacion estado={resultado.estado} />
          <ButtonLink
            href={`/lote/${resultado.lote.codigo}/recorrido`}
            variante={alterado ? "secundario" : "primario"}
            className="w-full py-3.5"
          >
            {alterado ? "Ver historial del lote" : "Ver recorrido del lote"}
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>

        <div className="flex flex-col gap-4">
          {alterado ? (
            <DetalleAlteracion resultado={resultado} />
          ) : (
            <Detalle resultado={resultado} />
          )}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lote verificado (o en proceso)
// ---------------------------------------------------------------------------

function Detalle({ resultado }: { resultado: LoteVerificado }) {
  const { lote } = resultado;
  const productor = lote.productores;
  const parcela = lote.parcelas;
  const { historia, esDemo } = separarMarcaDemo(productor.historia);

  return (
    <>
      <Bloque titulo="Quién lo cultivó">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-cacao-100 font-serif text-lg font-semibold text-cacao-700">
            {iniciales(productor.nombre)}
          </span>
          <div>
            <p className="text-lg leading-tight font-semibold">{productor.nombre}</p>
            <p className="text-sm text-tenue">
              {productor.anio_inicio
                ? `Cultivan cacao desde ${productor.anio_inicio}`
                : ETIQUETAS.tipoProductor[productor.tipo]}
            </p>
          </div>
        </div>
        {historia && (
          <blockquote className="mt-4 border-l-2 border-mazorca-500 pl-4 font-serif text-[17px] leading-relaxed text-cacao-800 italic">
            {historia}
          </blockquote>
        )}
      </Bloque>

      <Bloque titulo="De dónde viene">
        {parcela.latitud !== null && parcela.longitud !== null && (
          <MapaParcela latitud={parcela.latitud} longitud={parcela.longitud} className="mb-4" />
        )}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-3">
            <dt className="text-xs text-tenue">Parcela</dt>
            <dd className="font-semibold">
              {parcela.nombre}, {productor.region}
            </dd>
          </div>
          {parcela.hectareas && (
            <div>
              <dt className="text-xs text-tenue">Superficie</dt>
              <dd className="font-semibold">{formatearNumero(parcela.hectareas)} ha</dd>
            </div>
          )}
          {parcela.altitud_msnm && (
            <div>
              <dt className="text-xs text-tenue">Altitud</dt>
              <dd className="font-semibold">{formatearNumero(parcela.altitud_msnm)} m s. n. m.</dd>
            </div>
          )}
        </dl>
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

      {esDemo && <AvisoDemo />}
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

function AvisoDemo() {
  return (
    <p className="flex items-start gap-2.5 rounded-2xl border border-dashed border-borde px-4 py-3 text-sm text-tenue">
      <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
      Lote de demostración: el productor y los datos son ficticios, pero los sellos en blockchain
      son reales.
    </p>
  );
}

const mensajes = {
  verificado: {
    icono: ShieldCheck,
    titulo: "Verificado en blockchain",
    texto: "Los datos coinciden con lo sellado en Polygon. Nadie los ha modificado.",
    clases: "bg-exito-50 text-exito-700",
  },
  pendiente: {
    icono: Clock,
    titulo: "Verificación en proceso",
    texto: "Algunas etapas aún se están sellando en blockchain.",
    clases: "bg-aviso-50 text-aviso-700",
  },
  sin_etapas: {
    icono: Clock,
    titulo: "Lote recién registrado",
    texto: "Su recorrido aparecerá a medida que avance.",
    clases: "bg-cacao-100 text-cacao-700",
  },
  error_red: {
    icono: WifiOff,
    titulo: "No se pudo verificar ahora",
    texto: "La blockchain no respondió. Vuelve a intentarlo en un momento.",
    clases: "bg-cacao-100 text-cacao-700",
  },
  alterado: {
    icono: TriangleAlert,
    titulo: "Información no verificada",
    texto: "Los datos cambiaron después de sellarse y ya no coinciden con el registro original.",
    clases: "bg-error-50 text-error-700",
  },
} as const;

function EstadoVerificacion({ estado }: { estado: keyof typeof mensajes }) {
  const { icono: Icono, titulo, texto, clases } = mensajes[estado];
  return (
    <section
      role={estado === "alterado" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-2xl p-4", clases)}
    >
      <Icono className="mt-0.5 size-6 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">{titulo}</p>
        <p className="text-sm leading-relaxed opacity-90">{texto}</p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Lote alterado (RF11)
// ---------------------------------------------------------------------------

function DetalleAlteracion({ resultado }: { resultado: LoteVerificado }) {
  const { lote } = resultado;
  const alterada = resultado.etapas.find((e) => e.estado === "alterado")!;
  const { esDemo } = separarMarcaDemo(lote.productores.historia);

  return (
    <>
      <Bloque
        titulo={`Qué no coincide en la etapa de ${ETIQUETAS.tipoEtapa[alterada.tipo].toLowerCase()}`}
      >
        <p className="text-sm leading-relaxed text-tenue">
          Cada etapa se resume en una huella digital (hash SHA-256) que se graba en blockchain y ya
          no se puede cambiar. Si alguien modifica un dato, la huella calculada hoy deja de
          coincidir.
        </p>
        <dl className="mt-4 flex flex-col gap-2">
          <Huella
            nombre="Huella sellada en blockchain"
            valor={alterada.hashEnCadena}
            clase="text-exito-700"
          />
          <Huella
            nombre="Huella de los datos actuales"
            valor={alterada.hashActual}
            clase="text-error-700"
          />
        </dl>
        <p className="mt-3 text-xs text-tenue">{alterada.motivo}</p>
      </Bloque>

      <Bloque titulo="Qué hacer">
        <p className="text-[15px] leading-relaxed">
          No aceptes este lote como verificado. Contacta al equipo de calidad del exportador
          indicando el código <strong>{lote.codigo}</strong>.
        </p>
      </Bloque>

      {esDemo && (
        <p className="flex items-start gap-2.5 rounded-2xl border border-dashed border-borde px-4 py-3 text-sm text-tenue">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
          Lote de demostración: después de sellarlo, se cambió a propósito un peso directamente en
          la base de datos para mostrar cómo se detecta.
        </p>
      )}
    </>
  );
}

function Huella({ nombre, valor, clase }: { nombre: string; valor: string | null; clase: string }) {
  return (
    <div className="rounded-xl bg-crema p-3">
      <dt className="text-xs text-tenue">{nombre}</dt>
      <dd
        className={cn(
          "mt-0.5 font-mono text-[13px] leading-relaxed font-semibold break-all",
          clase,
        )}
      >
        {valor ?? "No encontrada"}
      </dd>
    </div>
  );
}
