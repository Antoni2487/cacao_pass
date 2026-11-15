import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variante = "primario" | "secundario" | "peligro";

const estilos: Record<Variante, string> = {
  primario: "bg-cacao-700 text-white hover:bg-cacao-600 disabled:bg-cacao-700/60",
  secundario: "border border-borde bg-white text-tinta hover:bg-crema",
  peligro: "border border-error-700/30 bg-white text-error-700 hover:bg-error-50",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cacao-700 disabled:cursor-not-allowed";

export function Button({
  variante = "primario",
  className,
  ...props
}: ComponentProps<"button"> & { variante?: Variante }) {
  return <button className={cn(base, estilos[variante], className)} {...props} />;
}

export function ButtonLink({
  variante = "primario",
  className,
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={cn(base, estilos[variante], className)} {...props} />;
}
