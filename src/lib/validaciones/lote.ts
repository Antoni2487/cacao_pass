import { z } from "zod";
import { CERTIFICACIONES } from "@/types/dominio";
import { textoRequerido } from "./comunes";

/** Fecha de hoy en Lima como "AAAA-MM-DD" (en-CA usa ese formato). */
function hoyEnLima() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
}

export const esquemaLote = z.object({
  productor_id: z.uuid("Elige un productor."),
  parcela_id: z.uuid("Elige una parcela."),
  variedad: textoRequerido("La variedad"),
  peso_kg: z.coerce
    .number({ error: "Debe ser un número." })
    .positive("El peso debe ser mayor a 0.")
    .max(99_999_999, "Peso demasiado grande."),
  fecha_cosecha: z.iso
    .date("Ingresa una fecha válida.")
    .refine((fecha) => fecha <= hoyEnLima(), "La cosecha no puede ser en el futuro."),
  destino: textoRequerido("El destino"),
  // Las casillas marcadas llegan como string (una) o arreglo (varias); ninguna = undefined.
  certificaciones: z.preprocess(
    (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]),
    z.array(z.enum(CERTIFICACIONES, { error: "Certificación no válida." })),
  ),
});

export type DatosLote = z.infer<typeof esquemaLote>;
