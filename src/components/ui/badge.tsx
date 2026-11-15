import { cn } from "@/lib/utils";

export type TonoBadge = "exito" | "aviso" | "error" | "neutro";

const tonos: Record<TonoBadge, string> = {
  exito: "bg-exito-50 text-exito-700",
  aviso: "bg-aviso-50 text-aviso-700",
  error: "bg-error-50 text-error-700",
  neutro: "bg-cacao-100 text-cacao-700",
};

export function Badge({ tono, children }: { tono: TonoBadge; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        tonos[tono],
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
