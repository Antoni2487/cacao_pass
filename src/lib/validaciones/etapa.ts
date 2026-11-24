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

/** Primeros bytes ("firma") de cada formato aceptado. */
const FIRMAS: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // "RIFF" (+ "WEBP" en el byte 8)
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // "%PDF"
};

/**
 * Comprueba que el contenido de cada archivo sea realmente del tipo declarado.
 * El tipo MIME lo envía el navegador y se puede falsificar (p. ej. un HTML
 * disfrazado de imagen), así que se leen los primeros bytes. Solo en el servidor.
 */
export async function validarContenidoEvidencias(archivos: File[]): Promise<string | null> {
  for (const archivo of archivos) {
    const cabecera = new Uint8Array(await archivo.slice(0, 12).arrayBuffer());
    const firmas = FIRMAS[archivo.type] ?? [];
    const coincide = firmas.some((firma) => firma.every((byte, i) => cabecera[i] === byte));
    const esWebp =
      archivo.type !== "image/webp" || String.fromCharCode(...cabecera.slice(8, 12)) === "WEBP";
    if (!coincide || !esWebp) {
      return `"${archivo.name}" no es una imagen o PDF válido.`;
    }
  }
  return null;
}
