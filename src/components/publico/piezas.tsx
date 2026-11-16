import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

/** Barra superior de las páginas públicas. */
export function CabeceraPublica({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-borde bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3.5">
        {children ?? (
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-cacao-700 text-white">
              <Leaf className="size-4" aria-hidden />
            </span>
            <span className="font-bold">CacaoPass</span>
          </div>
        )}
      </div>
    </header>
  );
}

/** Tarjeta blanca con título pequeño en mayúsculas, como en el Figma. */
export function Bloque({
  titulo,
  className,
  children,
}: {
  titulo?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-borde bg-white p-4", className)}>
      {titulo && (
        <h2 className="mb-3 text-[11px] font-semibold tracking-wide text-tenue uppercase">
          {titulo}
        </h2>
      )}
      {children}
    </section>
  );
}

/** Mapa estático de OpenStreetMap con la parcela marcada (sin claves ni costo). */
export function MapaParcela({
  latitud,
  longitud,
  className,
}: {
  latitud: number;
  longitud: number;
  className?: string;
}) {
  const d = 0.012;
  const bbox = [longitud - d, latitud - d * 0.6, longitud + d, latitud + d * 0.6].join(",");
  return (
    <iframe
      title="Ubicación de la parcela"
      src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitud},${longitud}`}
      loading="lazy"
      className={cn("h-40 w-full rounded-xl border-0 bg-crema", className)}
    />
  );
}

export function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(p))
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** "Fino de aroma" → "fino de aroma"; "CCN-51" se mantiene. */
export function variedadEnFrase(variedad: string) {
  return /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(variedad)
    ? variedad[0]!.toLowerCase() + variedad.slice(1)
    : variedad;
}

const mesAnio = new Intl.DateTimeFormat("es-PE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-09-14" → "septiembre 2026". */
export function formatearMesAnio(fecha: string) {
  return mesAnio.format(new Date(`${fecha.slice(0, 10)}T12:00:00Z`)).replace(" de ", " ");
}
