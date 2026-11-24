import { Mazorca } from "@/components/panel/logo";
import { cn, formatearNumero } from "@/lib/utils";
import { formatearMesAnio, variedadEnFrase } from "./piezas";
import { Guilloche } from "./guilloche";

export type EstadoPasaporte = "verificado" | "pendiente" | "alterado" | "sin_etapas" | "error_red";

export interface DatosPasaporte {
  codigo: string;
  variedad: string;
  /** "San Martín, Perú" o similar; se usa la primera parte. */
  region: string;
  peso_kg: number;
  fecha_cosecha: string;
  destino: string;
  productor: string;
}

/**
 * El pasaporte del lote dibujado como documento: papel con guilloche, sello
 * estampado según el resultado de la verificación y la franja legible por
 * máquina con el código del lote y la huella sellada en blockchain.
 */
export function DocumentoPasaporte({
  datos,
  estado,
  huella,
  className,
  animarSello = true,
}: {
  datos: DatosPasaporte;
  estado: EstadoPasaporte;
  /** Hash SHA-256 de la última etapa sellada. */
  huella: string | null;
  className?: string;
  animarSello?: boolean;
}) {
  const region = datos.region.split(",")[0]!.trim();

  return (
    <article
      className={cn(
        "relative isolate overflow-hidden rounded-[20px] border border-[#ddd6c6] bg-[#fbf9f2] text-tinta shadow-[0_1px_0_#fff_inset,0_18px_40px_-24px_rgb(36_23_18/0.45)]",
        className,
      )}
    >
      <Guilloche className="pointer-events-none absolute -top-24 -right-28 -z-10 size-[26rem] text-grano-700/[0.13]" />
      <Guilloche className="pointer-events-none absolute -bottom-40 -left-40 -z-10 size-[22rem] text-mazorca-500/20" />

      <header className="flex items-center gap-2.5 border-b border-dashed border-[#ddd6c6] px-5 py-3">
        <Mazorca className="size-7" />
        <p className="text-[13px] leading-tight text-tenue">
          Pasaporte digital de origen
          <span className="block font-semibold text-tinta">Lote {datos.codigo}</span>
        </p>
      </header>

      <div className="relative px-5 pt-4 pb-5">
        <h1 className="max-w-[15ch] font-serif text-[28px] leading-[1.1] font-semibold sm:text-[32px]">
          Cacao {variedadEnFrase(datos.variedad)} de {region}
        </h1>

        <Sello estado={estado} animar={animarSello} />

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Campo nombre="Productor" className="col-span-2">
            {datos.productor}
          </Campo>
          <Campo nombre="Origen">{datos.region}</Campo>
          <Campo nombre="Destino">{datos.destino}</Campo>
          <Campo nombre="Peso">{formatearNumero(datos.peso_kg)} kg</Campo>
          <Campo nombre="Cosecha">{formatearMesAnio(datos.fecha_cosecha)}</Campo>
        </dl>
      </div>

      <ZonaLegible datos={datos} huella={huella} alterado={estado === "alterado"} />
    </article>
  );
}

function Campo({
  nombre,
  className,
  children,
}: {
  nombre: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-tenue">{nombre}</dt>
      <dd className="font-semibold first-letter:uppercase">{children}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sello
// ---------------------------------------------------------------------------

const sellos: Record<EstadoPasaporte, { arriba: string; abajo: string; clase: string }> = {
  verificado: { arriba: "Verificado en blockchain", abajo: "Polygon", clase: "text-exito-700" },
  pendiente: { arriba: "Sellado en proceso", abajo: "Polygon", clase: "text-aviso-700" },
  alterado: { arriba: "No verificado", abajo: "Datos alterados", clase: "text-error-700" },
  sin_etapas: { arriba: "Lote recién registrado", abajo: "CacaoPass", clase: "text-cacao-700" },
  error_red: { arriba: "Verificación no disponible", abajo: "Polygon", clase: "text-tenue" },
};

function Sello({ estado, animar }: { estado: EstadoPasaporte; animar: boolean }) {
  const { arriba, abajo, clase } = sellos[estado];
  return (
    <div
      aria-hidden
      className={cn(
        "absolute top-2 right-3 size-[104px] opacity-90 mix-blend-multiply sm:right-5 sm:size-[116px]",
        animar ? "sello-estampado" : "-rotate-10",
        clase,
      )}
    >
      <svg viewBox="0 0 120 120" className="size-full" fill="none">
        <defs>
          <path id={`arco-sup-${estado}`} d="M18 60a42 42 0 0 1 84 0" />
          <path id={`arco-inf-${estado}`} d="M14 60a46 46 0 0 0 92 0" />
        </defs>
        <circle cx="60" cy="60" r="56" stroke="currentColor" strokeWidth="3" />
        <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="1" />
        <circle cx="60" cy="60" r="27" stroke="currentColor" strokeWidth="1.5" />
        <text fill="currentColor" fontSize="10.5" fontWeight="700" letterSpacing="0.6">
          <textPath href={`#arco-sup-${estado}`} startOffset="50%" textAnchor="middle">
            {arriba}
          </textPath>
        </text>
        <text fill="currentColor" fontSize="9.5" fontWeight="600" letterSpacing="1">
          <textPath href={`#arco-inf-${estado}`} startOffset="50%" textAnchor="middle">
            {abajo}
          </textPath>
        </text>
        {estado === "alterado" ? (
          <path
            d="M50 50l20 20M70 50 50 70"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        ) : estado === "verificado" ? (
          <path
            d="m48 61 8 8 16-18"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path d="M60 47v14l8 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        )}
        {/* Pequeñas imperfecciones de tinta para que parezca estampado */}
        <circle cx="96" cy="30" r="1.4" fill="currentColor" opacity="0.5" />
        <circle cx="24" cy="92" r="1" fill="currentColor" opacity="0.4" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Zona legible por máquina (como la de los pasaportes)
// ---------------------------------------------------------------------------

const ANCHO_MRZ = 34;

function aMrz(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "<");
}

function linea(texto: string) {
  return texto.slice(0, ANCHO_MRZ).padEnd(ANCHO_MRZ, "<");
}

function ZonaLegible({
  datos,
  huella,
  alterado,
}: {
  datos: DatosPasaporte;
  huella: string | null;
  alterado: boolean;
}) {
  const primera = linea(`CP<PER<${aMrz(datos.codigo)}<<${aMrz(datos.variedad)}`);
  const segunda = linea(
    `${(huella ?? "SIN<SELLO").slice(0, 20).toUpperCase()}<<${Math.round(datos.peso_kg)}KG<${datos.fecha_cosecha.slice(0, 4)}`,
  );

  return (
    <div
      className={cn(
        "border-t px-5 py-3 font-mono text-[11px] leading-[1.55] tracking-[0.12em] sm:text-xs",
        alterado
          ? "border-error-700/25 bg-error-50/70 text-error-700"
          : "border-[#ddd6c6] bg-[#f3efe3] text-cacao-800/80",
      )}
    >
      <p className="sr-only">
        Huella digital sellada: {huella ?? "todavía sin sellar"}. Código del lote {datos.codigo}.
      </p>
      <p aria-hidden className="overflow-hidden whitespace-nowrap">
        {primera}
      </p>
      <p
        aria-hidden
        className={cn("overflow-hidden whitespace-nowrap", alterado && "line-through")}
      >
        {segunda}
      </p>
    </div>
  );
}
