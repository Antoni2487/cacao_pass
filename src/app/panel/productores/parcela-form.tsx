"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { MensajesFormulario } from "@/components/ui/form-mensajes";
import { ESTADO_INICIAL } from "@/lib/acciones";
import { crearParcela } from "./actions";

export function ParcelaForm({ productorId }: { productorId: string }) {
  const [estado, enviar, pendiente] = useActionState(
    crearParcela.bind(null, productorId),
    ESTADO_INICIAL,
  );
  const formulario = useRef<HTMLFormElement>(null);
  const e = estado.errores ?? {};

  // Limpia el formulario después de registrar una parcela.
  useEffect(() => {
    if (estado.exito) formulario.current?.reset();
  }, [estado]);

  return (
    <form ref={formulario} action={enviar} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-3">
        <Input
          etiqueta="Nombre"
          name="nombre"
          placeholder="El Mirador"
          errores={e.nombre}
          required
        />
        <Input
          etiqueta="Hectáreas"
          name="hectareas"
          type="number"
          step="0.01"
          placeholder="3.20"
          errores={e.hectareas}
        />
        <Input
          etiqueta="Altitud (m s. n. m.)"
          name="altitud_msnm"
          type="number"
          placeholder="650"
          errores={e.altitud_msnm}
        />
        <Input
          etiqueta="Latitud"
          name="latitud"
          type="number"
          step="0.000001"
          placeholder="-8.190312"
          errores={e.latitud}
        />
        <Input
          etiqueta="Longitud"
          name="longitud"
          type="number"
          step="0.000001"
          placeholder="-76.512845"
          errores={e.longitud}
          ayuda="Coordenadas en grados decimales (como en Google Maps)."
        />
      </div>
      <label className="flex items-center gap-2.5 text-sm">
        <input type="checkbox" name="libre_deforestacion" className="size-4 accent-cacao-700" />
        Parcela libre de deforestación (Reglamento UE 2023/1115)
      </label>
      <MensajesFormulario estado={estado} />
      <div>
        <Button type="submit" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Agregar parcela"}
        </Button>
      </div>
    </form>
  );
}
