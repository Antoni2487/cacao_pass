import { Download } from "lucide-react";

/** QR del lote con su enlace y botón de descarga. */
export function TarjetaQr({ codigo, url }: { codigo: string; url: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- PNG dinámico de nuestra API */}
      <img
        src={`/api/lotes/${codigo}/qr`}
        alt={`Código QR del lote ${codigo}`}
        width={200}
        height={200}
        className="rounded-xl border border-borde bg-white p-2"
      />
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium break-all text-cacao-700 hover:underline"
      >
        {url.replace(/^https?:\/\//, "")}
      </a>
      <a
        href={`/api/lotes/${codigo}/qr?descargar=1`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-tinta hover:text-cacao-700"
      >
        <Download className="size-4" aria-hidden /> Descargar PNG
      </a>
    </div>
  );
}
