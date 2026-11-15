import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-borde bg-white", className)}>
      {children}
    </section>
  );
}

export function CardHeader({ titulo, accion }: { titulo: string; accion?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-borde px-6 py-4">
      <h2 className="text-base font-semibold">{titulo}</h2>
      {accion}
    </header>
  );
}

/** Mensaje para listas vacías. */
export function EstadoVacio({ children }: { children: React.ReactNode }) {
  return <p className="px-6 py-10 text-center text-sm text-tenue">{children}</p>;
}
