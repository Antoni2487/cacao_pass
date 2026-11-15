import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { obtenerUsuarioActual } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const usuario = await obtenerUsuarioActual();

  return (
    <PageHeader
      titulo="Dashboard"
      subtitulo={`Hola, ${usuario.nombre} · Trazabilidad del cacao · Campaña ${new Date().getFullYear()}`}
    />
  );
}
