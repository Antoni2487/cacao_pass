import { cn } from "@/lib/utils";

/** Mazorca de cacao (public/marca/mazorca.svg). Decorativa: el nombre va al lado. */
export function Mazorca({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG estático, no necesita optimización
    <img src="/marca/mazorca.svg" alt="" aria-hidden className={cn("size-10", className)} />
  );
}

export function Logo({ claro = true, className }: { claro?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Mazorca className="-my-1 size-10" />
      <span
        className={cn(
          "font-serif text-[22px] leading-none font-semibold tracking-tight",
          claro ? "text-white" : "text-tinta",
        )}
      >
        Cacao<span className={claro ? "text-mazorca-300" : "text-cacao-700"}>Pass</span>
      </span>
    </div>
  );
}
