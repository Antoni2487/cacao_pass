"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { ESTADO_INICIAL, type EstadoFormulario } from "@/lib/acciones";

type Accion = (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;

/**
 * Igual que useActionState, pero se conecta con `onSubmit` en vez de `action`.
 * Así React no vacía el formulario cuando el servidor devuelve errores de validación
 * y el usuario no pierde lo que escribió.
 */
export function useFormAction(accion: Accion) {
  const [estado, ejecutar, pendiente] = useActionState(accion, ESTADO_INICIAL);

  function onSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formData = new FormData(evento.currentTarget);
    startTransition(() => ejecutar(formData));
  }

  return { estado, onSubmit, pendiente };
}
