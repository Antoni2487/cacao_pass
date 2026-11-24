import type { Metadata } from "next";
import Link from "next/link";
import { EstadoLoteBadge } from "@/components/panel/estado-lote";
import { TarjetaQr } from "@/components/panel/tarjeta-qr";
import { Card, EstadoVacio } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { urlPublicaLote } from "@/lib/qr";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoLote } from "@/types/dominio";

export const metadata: Metadata = { title: "Códigos QR" };

export default async function CodigosQrPage() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("lotes")
    .select("codigo, estado, productores(nombre)")
    .order("created_at", { ascending: false })
    .returns<{ codigo: string; estado: EstadoLote; productores: { nombre: string } | null }[]>();
  if (error) throw new Error("No se pudieron cargar los lotes.");

  return (
    <>
      <PageHeader
        titulo="Códigos QR"
        subtitulo="Imprímelos en los sacos y documentos de exportación. Abren el pasaporte digital del lote."
      />
      {data.length === 0 ? (
        <Card>
          <EstadoVacio>Aún no hay lotes.</EstadoVacio>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((lote) => (
            <Card key={lote.codigo} className="p-5">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/panel/lotes/${lote.codigo}`}
                    className="font-semibold hover:text-cacao-700"
                  >
                    {lote.codigo}
                  </Link>
                  <p className="text-xs text-tenue">{lote.productores?.nombre}</p>
                </div>
                <EstadoLoteBadge estado={lote.estado} />
              </div>
              <TarjetaQr codigo={lote.codigo} url={urlPublicaLote(lote.codigo)} />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
