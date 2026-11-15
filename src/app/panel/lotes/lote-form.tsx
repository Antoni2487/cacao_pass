"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { MensajesFormulario } from "@/components/ui/form-mensajes";
import { useFormAction } from "@/lib/use-form-action";
import { CERTIFICACIONES } from "@/types/dominio";
import { crearLote } from "./actions";

export interface OpcionProductor {
  id: string;
  nombre: string;
  parcelas: { id: string; nombre: string; libre_deforestacion: boolean }[];
}

const VARIEDADES = ["Fino de aroma", "Chuncho", "Criollo", "CCN-51", "Trinitario"];

export function LoteForm({ productores }: { productores: OpcionProductor[] }) {
  const { estado, onSubmit, pendiente } = useFormAction(crearLote);
  const [productorId, setProductorId] = useState("");
  const e = estado.errores ?? {};

  const parcelas = productores.find((p) => p.id === productorId)?.parcelas ?? [];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          etiqueta="Productor"
          name="productor_id"
          value={productorId}
          onChange={(ev) => setProductorId(ev.target.value)}
          errores={e.productor_id}
          required
        >
          <option value="" disabled>
            Elige un productor
          </option>
          {productores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>

        {/* key reinicia la selección de parcela al cambiar de productor */}
        <Select
          key={productorId}
          etiqueta="Parcela de origen"
          name="parcela_id"
          defaultValue=""
          disabled={!productorId}
          errores={e.parcela_id}
          ayuda={
            productorId && parcelas.length === 0 ? "Este productor no tiene parcelas." : undefined
          }
          required
        >
          <option value="" disabled>
            {productorId ? "Elige una parcela" : "Primero elige un productor"}
          </option>
          {parcelas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
              {p.libre_deforestacion ? " · libre de deforestación" : ""}
            </option>
          ))}
        </Select>

        <Input
          etiqueta="Variedad"
          name="variedad"
          list="variedades"
          placeholder="Fino de aroma"
          errores={e.variedad}
          required
        />
        <datalist id="variedades">
          {VARIEDADES.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>

        <Input
          etiqueta="Peso (kg)"
          name="peso_kg"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="1200"
          errores={e.peso_kg}
          required
        />
        <Input
          etiqueta="Fecha de cosecha"
          name="fecha_cosecha"
          type="date"
          errores={e.fecha_cosecha}
          required
        />
        <Input
          etiqueta="Destino"
          name="destino"
          placeholder="Hamburgo, Alemania"
          errores={e.destino}
          required
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Certificaciones</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {CERTIFICACIONES.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="certificaciones"
                value={c}
                className="size-4 accent-cacao-700"
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <MensajesFormulario estado={estado} />
      <div>
        <Button type="submit" disabled={pendiente}>
          {pendiente ? "Creando…" : "Crear lote"}
        </Button>
      </div>
    </form>
  );
}
