"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RotateCw } from "lucide-react";

/** Botón para reintentar el sellado de una etapa pendiente. */
export function ReintentarSellado({ etapaId }: { etapaId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reintentar() {
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/etapas/${etapaId}/sellar`, { method: "POST" });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) setError(cuerpo.error);
      else if (cuerpo.errorSellado) setError(cuerpo.errorSellado);
      else if (!cuerpo.selladoEn)
        setError("Enviado. Aún espera confirmación; recarga en unos segundos.");
      router.refresh();
    } catch {
      setError("Sin conexión con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={reintentar}
        disabled={enviando}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-aviso-700 hover:underline disabled:opacity-60"
      >
        <RotateCw className={enviando ? "size-3.5 animate-spin" : "size-3.5"} aria-hidden />
        {enviando ? "Sellando…" : "Reintentar sellado"}
      </button>
      {error && <span className="max-w-56 text-xs text-tenue">{error}</span>}
    </span>
  );
}
