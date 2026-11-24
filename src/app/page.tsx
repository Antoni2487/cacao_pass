import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ArrowRight, Check, X } from "lucide-react";
import { Logo, Mazorca } from "@/components/panel/logo";
import { DocumentoPasaporte } from "@/components/publico/documento-pasaporte";
import { datosDelPasaporte, huellaDelLote } from "@/components/publico/datos-pasaporte";
import { Guilloche } from "@/components/publico/guilloche";
import { variedadEnFrase } from "@/components/publico/piezas";
import { ButtonLink } from "@/components/ui/button";
import { RED_BLOCKCHAIN } from "@/lib/trazabilidad/explorador";
import { lotesDeDemostracion, type LoteVerificado } from "@/lib/trazabilidad/servicio";
import { cn, formatearNumero } from "@/lib/utils";
import { ETIQUETAS } from "@/types/dominio";

// Se vuelve a verificar contra la blockchain como máximo cada 5 minutos.
export const revalidate = 300;

const cargarDemo = unstable_cache(
  async () => {
    try {
      return await lotesDeDemostracion();
    } catch (error) {
      console.error("[portada] lotes de ejemplo", error);
      return [];
    }
  },
  ["lotes-demo"],
  { revalidate: 300 },
);

export default async function Portada() {
  const lotes = await cargarDemo();
  const verificado = lotes.find((l) => l.estado === "verificado");
  const alterado = lotes.find((l) => l.estado === "alterado");
  const destacado = verificado ?? lotes[0];

  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4 sm:px-8">
        <Logo claro={false} />
        <nav aria-label="Secciones" className="ml-auto hidden items-center gap-6 text-sm md:flex">
          <a href="#como-funciona" className="text-tenue hover:text-tinta">
            Cómo funciona
          </a>
          <a href="#ejemplos" className="text-tenue hover:text-tinta">
            Lotes de ejemplo
          </a>
        </nav>
        <ButtonLink href="/login" variante="secundario" className="ml-auto md:ml-0">
          Entrar al panel
        </ButtonLink>
      </header>

      <main>
        <Hero destacado={destacado} verificado={verificado} alterado={alterado} />
        <ComoFunciona />
        {alterado && <SiAlguienCambiaUnDato lote={alterado} />}
        {lotes.length > 0 && <Ejemplos lotes={lotes} />}
      </main>

      <footer className="border-t border-borde">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-8 text-sm text-tenue sm:px-8">
          <span className="flex items-center gap-2 font-medium text-tinta">
            <Mazorca className="size-6" /> CacaoPass
          </span>
          <span>Proyecto de demostración de trazabilidad con blockchain.</span>
          <span className="md:ml-auto">Next.js, Supabase y {RED_BLOCKCHAIN}</span>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Hero({
  destacado,
  verificado,
  alterado,
}: {
  destacado?: LoteVerificado;
  verificado?: LoteVerificado;
  alterado?: LoteVerificado;
}) {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-8 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-16 lg:pb-28">
      <div>
        <h1 className="max-w-[16ch] font-serif text-[42px] leading-[1.04] font-semibold tracking-tight text-balance sm:text-6xl lg:text-[68px]">
          Cada lote de cacao, con un pasaporte que no se puede falsificar
        </h1>
        <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-tenue">
          CacaoPass registra el recorrido del cacao desde la parcela hasta el puerto y sella cada
          etapa en la blockchain de Polygon. El comprador escanea un QR y comprueba, en ese momento,
          que nadie cambió los datos.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {verificado && (
            <ButtonLink href={`/lote/${verificado.lote.codigo}`} className="px-5 py-3 text-[15px]">
              Ver un lote verificado <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          )}
          {alterado && (
            <ButtonLink
              href={`/lote/${alterado.lote.codigo}`}
              variante="secundario"
              className="px-5 py-3 text-[15px]"
            >
              Ver uno alterado
            </ButtonLink>
          )}
        </div>
      </div>

      {destacado && (
        <div className="relative mx-auto w-full max-w-[25rem] lg:mr-4">
          <Guilloche className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[44rem] -translate-1/2 text-cacao-700/[0.07]" />
          <Link
            href={`/lote/${destacado.lote.codigo}`}
            aria-label={`Abrir el pasaporte del lote ${destacado.lote.codigo}`}
            className="block rotate-[2.5deg] rounded-[20px] transition-transform duration-300 hover:rotate-0 motion-reduce:transition-none"
          >
            <DocumentoPasaporte
              datos={datosDelPasaporte(destacado)}
              estado={destacado.estado}
              huella={huellaDelLote(destacado)}
            />
          </Link>
          <figure className="absolute -bottom-20 -left-6 hidden w-32 -rotate-[4deg] rounded-2xl bg-white p-2.5 shadow-[0_18px_40px_-20px_rgb(36_23_18/0.5)] sm:block lg:-left-28">
            {/* eslint-disable-next-line @next/next/no-img-element -- PNG generado por la API */}
            <img
              src={`/api/lotes/${destacado.lote.codigo}/qr`}
              alt={`Código QR del lote ${destacado.lote.codigo}`}
              className="aspect-square w-full"
            />
            <figcaption className="mt-1 text-center text-xs leading-snug text-tenue">
              Escanéalo con tu celular
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

const pasos = [
  {
    titulo: "Se registra cada etapa",
    texto:
      "Cosecha, fermentación y secado, acopio, planta y exportación. Cada una con fecha, lugar, peso, humedad y fotos de evidencia.",
  },
  {
    titulo: "Se sella su huella digital",
    texto:
      "El sistema resume los datos en un hash SHA-256 y lo graba en una transacción de Polygon. Queda ahí para siempre y cuesta fracciones de centavo.",
  },
  {
    titulo: "El comprador escanea el QR",
    texto:
      "La página del lote recalcula la huella con los datos de hoy y la compara con la de la blockchain. Si no coinciden, lo avisa.",
  },
];

function ComoFunciona() {
  return (
    <section id="como-funciona" className="scroll-mt-6 bg-cacao-900 text-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
        <h2 className="max-w-[22ch] font-serif text-4xl leading-tight font-semibold sm:text-5xl">
          De la parcela al puerto, en tres pasos
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {pasos.map((paso, i) => (
            <li key={paso.titulo} className="border-t border-white/15 pt-6">
              <span className="font-serif text-5xl leading-none text-mazorca-300">{i + 1}</span>
              <h3 className="mt-4 text-xl font-semibold">{paso.titulo}</h3>
              <p className="mt-2 max-w-[38ch] leading-relaxed text-white/70">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function SiAlguienCambiaUnDato({ lote }: { lote: LoteVerificado }) {
  const etapa = lote.etapas.find((e) => e.estado === "alterado");
  if (!etapa) return null;

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-28">
      <div>
        <h2 className="font-serif text-4xl leading-tight font-semibold sm:text-5xl">
          Qué pasa si alguien cambia un dato
        </h2>
        <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-tenue">
          En el lote {lote.lote.codigo} alguien subió el peso registrado en el centro de acopio,
          directamente en la base de datos. La huella calculada hoy ya no es la que quedó sellada, y
          el pasaporte lo marca como no verificado.
        </p>
        <Link
          href={`/lote/${lote.lote.codigo}`}
          className="mt-6 inline-flex items-center gap-1.5 font-semibold text-cacao-700 hover:underline"
        >
          Abrir el pasaporte alterado <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="rounded-3xl border border-borde bg-white p-5 sm:p-7">
        <p className="text-sm text-tenue">
          Etapa: {ETIQUETAS.tipoEtapa[etapa.tipo]}, lote {lote.lote.codigo}
        </p>
        <dl className="mt-4 flex flex-col gap-3">
          <FilaHuella
            nombre="Huella sellada en Polygon"
            valor={etapa.hashEnCadena ?? "No encontrada"}
            ok
          />
          <FilaHuella nombre="Huella de los datos actuales" valor={etapa.hashActual} ok={false} />
        </dl>
      </div>
    </section>
  );
}

function FilaHuella({ nombre, valor, ok }: { nombre: string; valor: string; ok: boolean }) {
  const Icono = ok ? Check : X;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl p-4",
        ok ? "bg-exito-50 text-exito-700" : "bg-error-50 text-error-700",
      )}
    >
      <Icono className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        <dt className="text-sm font-semibold">{nombre}</dt>
        <dd className="mt-1 font-mono text-[13px] leading-relaxed break-all sm:text-sm">{valor}</dd>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

const resultado: Record<LoteVerificado["estado"], { texto: string; clase: string }> = {
  verificado: { texto: "Verificado", clase: "bg-exito-50 text-exito-700" },
  pendiente: { texto: "Sellando", clase: "bg-aviso-50 text-aviso-700" },
  alterado: { texto: "Datos alterados", clase: "bg-error-50 text-error-700" },
  sin_etapas: { texto: "Recién registrado", clase: "bg-cacao-100 text-cacao-700" },
  error_red: { texto: "Sin conexión", clase: "bg-cacao-100 text-cacao-700" },
};

function Ejemplos({ lotes }: { lotes: LoteVerificado[] }) {
  return (
    <section id="ejemplos" className="scroll-mt-6 border-t border-borde bg-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
        <h2 className="font-serif text-4xl leading-tight font-semibold sm:text-5xl">
          Pruébalo con estos lotes
        </h2>
        <p className="mt-4 max-w-[56ch] text-lg leading-relaxed text-tenue">
          Productores y datos ficticios, sellos reales en {RED_BLOCKCHAIN}. Su estado se comprueba
          contra la blockchain cada pocos minutos.
        </p>

        <ul className="mt-10 divide-y divide-borde border-y border-borde">
          {lotes.map((l) => {
            const etapas = l.etapas.length;
            const { texto, clase } = resultado[l.estado];
            return (
              <li key={l.lote.id}>
                <Link
                  href={`/lote/${l.lote.codigo}`}
                  className="group grid gap-x-6 gap-y-1 py-5 sm:grid-cols-[8rem_1fr_auto] sm:items-center"
                >
                  <span className="font-mono text-sm text-tenue">{l.lote.codigo}</span>
                  <span>
                    <span className="block font-serif text-xl font-semibold group-hover:text-cacao-700">
                      Cacao {variedadEnFrase(l.lote.variedad)}, {l.lote.productores.nombre}
                    </span>
                    <span className="text-sm text-tenue">
                      {etapas} de 5 etapas registradas, {formatearNumero(l.lote.peso_kg)} kg rumbo a{" "}
                      {l.lote.destino}
                    </span>
                  </span>
                  <span className="mt-2 flex items-center gap-3 sm:mt-0">
                    <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", clase)}>
                      {texto}
                    </span>
                    <ArrowRight
                      className="size-4 text-tenue transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
