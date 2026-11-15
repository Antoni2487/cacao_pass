import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, EstadoVacio } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { obtenerUsuarioActual } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { LoteForm, type OpcionProductor } from "../lote-form";

export const metadata: Metadata = { title: "Nuevo lote" };

export default async function NuevoLotePage() {
  if ((await obtenerUsuarioActual()).rol !== "admin") redirect("/panel/lotes");

  const supabase = await crearClienteServidor();
  const { data: productores, error } = await supabase
    .from("productores")
    .select("id, nombre, parcelas(id, nombre, libre_deforestacion)")
    .order("nombre")
    .returns<OpcionProductor[]>();
  if (error) throw new Error("No se pudo cargar la lista de productores.");

  return (
    <>
      <PageHeader
        titulo="Nuevo lote"
        subtitulo="El código y el QR se generan automáticamente al crearlo"
      />
      <Card className="p-6">
        {productores.length === 0 ? (
          <EstadoVacio>
            Primero{" "}
            <Link href="/panel/productores/nuevo" className="font-semibold text-cacao-700">
              registra un productor
            </Link>{" "}
            con al menos una parcela.
          </EstadoVacio>
        ) : (
          <LoteForm productores={productores} />
        )}
      </Card>
    </>
  );
}
