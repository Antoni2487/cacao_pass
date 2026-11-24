import { z } from "zod";

/** Texto obligatorio, sin espacios sobrantes. */
export const textoRequerido = (campo: string) =>
  z
    .string({ error: `${campo} es obligatorio.` })
    .trim()
    .min(1, `${campo} es obligatorio.`);

/** Texto opcional: un campo vacío del formulario se guarda como null. */
export const textoOpcional = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().trim().nullable().optional().default(null),
);

/** Número opcional desde un <input>: "" → null, "3.5" → 3.5. */
export const numeroOpcional = (opciones: { min?: number; max?: number; entero?: boolean } = {}) => {
  let esquema = z.number({ error: "Debe ser un número." });
  if (opciones.entero) esquema = esquema.int("Debe ser un número entero.");
  if (opciones.min !== undefined) esquema = esquema.min(opciones.min, `Mínimo ${opciones.min}.`);
  if (opciones.max !== undefined) esquema = esquema.max(opciones.max, `Máximo ${opciones.max}.`);
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    esquema.nullable(),
  );
};

/** Checkbox de HTML: llega "on" si está marcado y no llega si no. */
export const casilla = z.preprocess((v) => v === "on" || v === true, z.boolean());
