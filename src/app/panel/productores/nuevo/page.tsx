import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { obtenerUsuarioActual } from "@/lib/auth";
import { crearProductor } from "../actions";
import { ProductorForm } from "../productor-form";

export const metadata: Metadata = { title: "Nuevo productor" };

export default async function NuevoProductorPage() {
  if ((await obtenerUsuarioActual()).rol !== "admin") redirect("/panel/productores");

  return (
    <>
      <PageHeader
        titulo="Nuevo productor"
        subtitulo="Luego podrás agregar sus parcelas georreferenciadas"
      />
      <Card className="p-6">
        <ProductorForm accion={crearProductor} textoBoton="Registrar productor" />
      </Card>
    </>
  );
}
