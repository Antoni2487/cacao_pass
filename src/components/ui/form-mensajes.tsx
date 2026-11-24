import type { EstadoFormulario } from "@/lib/acciones";

/** Muestra el error general o el mensaje de éxito de una Server Action. */
export function MensajesFormulario({ estado }: { estado: EstadoFormulario }) {
  if (estado.error) {
    return (
      <p role="alert" className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">
        {estado.error}
      </p>
    );
  }
  if (estado.exito) {
    return (
      <p role="status" className="rounded-lg bg-exito-50 px-3 py-2 text-sm text-exito-700">
        {estado.exito}
      </p>
    );
  }
  return null;
}
