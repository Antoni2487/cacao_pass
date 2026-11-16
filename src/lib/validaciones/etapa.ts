import { z } from "zod";
import { TIPOS_ETAPA } from "@/types/dominio";
import { numeroOpcional, textoOpcional, textoRequerido } from "./comunes";

/** Lima no tiene horario de verano: siempre UTC-5. */
const ZONA_LIMA = "-05:00";

export const MAX_EVIDENCIAS = 3;
/** Vercel limita el cuerpo de la petición a 4.5 MB; dejamos margen. */
export const MAX_BYTES_EVIDENCIAS = 4 * 1024 * 1024;
export const TIPOS_ARCHIVO_EVIDENCIA = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const esquemaEtapa = z.object({
  lote_codigo: textoRequerido("El lote"),
  tipo: z.enum(TIPOS_ETAPA, { error: "Elige una etapa." }),
  ubicacion: textoRequerido("La ubicación"),
  // <input type="datetime-local"> envía "2026-11-10T09:15", en hora de Lima.
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Ingresa fecha y hora.")
    .transform((v) => new Date(`${v}:00${ZONA_LIMA}`))
    .refine((d) => !Number.isNaN(d.getTime()), "Fecha no válida.")
    .refine((d) => d.getTime() <= Date.now() + 10 * 60_000, "La fecha no puede ser futura.")
    .transform((d) => d.toISOString()),
  peso_kg: numeroOpcional({ min: 0.01, max: 99_999_999 }),
  humedad_pct: numeroOpcional({ min: 0, max: 100 }),
  notas: textoOpcional,
});

export type DatosEtapa = z.infer<typeof esquemaEtapa>;

/** Valida los archivos adjuntos. Devuelve un mensaje de error o null. */
export function validarEvidencias(archivos: File[]): string | null {
  if (archivos.length > MAX_EVIDENCIAS) return `Máximo ${MAX_EVIDENCIAS} archivos.`;
  const total = archivos.reduce((suma, a) => suma + a.size, 0);
  if (total > MAX_BYTES_EVIDENCIAS) return "Los archivos superan 4 MB en total.";
  if (archivos.some((a) => !TIPOS_ARCHIVO_EVIDENCIA.includes(a.type))) {
    return "Solo se aceptan fotos (JPG, PNG, WEBP) o PDF.";
  }
  return null;
}
