import { ShieldCheck } from "lucide-react";

export function Logo({ claro = true }: { claro?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-lg bg-cacao-700 text-white">
        <ShieldCheck className="size-5" aria-hidden />
      </span>
      <span className={claro ? "text-lg font-bold text-white" : "text-lg font-bold text-tinta"}>
        CacaoPass
      </span>
    </div>
  );
}
