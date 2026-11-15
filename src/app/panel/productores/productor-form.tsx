"use client";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { MensajesFormulario } from "@/components/ui/form-mensajes";
import type { EstadoFormulario } from "@/lib/acciones";
import { useFormAction } from "@/lib/use-form-action";
import { ETIQUETAS, TIPOS_PRODUCTOR, type Productor } from "@/types/dominio";

type Accion = (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;

export function ProductorForm({
  accion,
  productor,
  textoBoton,
}: {
  accion: Accion;
  productor?: Productor;
  textoBoton: string;
}) {
  const { estado, onSubmit, pendiente } = useFormAction(accion);
  const e = estado.errores ?? {};

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          etiqueta="Nombre"
          name="nombre"
          placeholder="Familia Huamán"
          defaultValue={productor?.nombre}
          errores={e.nombre}
          required
        />
        <Select
          etiqueta="Tipo"
          name="tipo"
          defaultValue={productor?.tipo ?? "familia"}
          errores={e.tipo}
        >
          {TIPOS_PRODUCTOR.map((tipo) => (
            <option key={tipo} value={tipo}>
              {ETIQUETAS.tipoProductor[tipo]}
            </option>
          ))}
        </Select>
        <Input
          etiqueta="Región"
          name="region"
          placeholder="Tocache, San Martín"
          defaultValue={productor?.region}
          errores={e.region}
          required
        />
        <Input
          etiqueta="Cultiva cacao desde (año)"
          name="anio_inicio"
          type="number"
          inputMode="numeric"
          placeholder="1998"
          defaultValue={productor?.anio_inicio ?? ""}
          errores={e.anio_inicio}
        />
      </div>
      <Textarea
        etiqueta="Historia"
        name="historia"
        placeholder="Tres generaciones cultivando cacao fino de aroma en el valle del Huallaga."
        defaultValue={productor?.historia ?? ""}
        errores={e.historia}
        ayuda="Una o dos frases. Se mostrarán en el pasaporte público del lote."
      />
      <MensajesFormulario estado={estado} />
      <div>
        <Button type="submit" disabled={pendiente}>
          {pendiente ? "Guardando…" : textoBoton}
        </Button>
      </div>
    </form>
  );
}
