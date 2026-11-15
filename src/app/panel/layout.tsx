import { Sidebar } from "@/components/panel/sidebar";
import { obtenerUsuarioActual } from "@/lib/auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const usuario = await obtenerUsuarioActual();

  return (
    <div className="min-h-dvh">
      <Sidebar usuario={usuario} />
      <main className="px-4 py-6 sm:px-8 lg:ml-64 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
