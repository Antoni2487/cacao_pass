import { z } from "zod";
import { TIPOS_PRODUCTOR } from "@/types/dominio";
import { casilla, numeroOpcional, textoOpcional, textoRequerido } from "./comunes";

const anioActual = new Date().getFullYear();

export const esquemaProductor = z.object({
  nombre: textoRequerido("El nombre"),
  tipo: z.enum(TIPOS_PRODUCTOR, { error: "Elige un tipo." }),
  region: textoRequerido("La región"),
  anio_inicio: numeroOpcional({ min: 1900, max: anioActual, entero: true }),
  historia: textoOpcional,
});

export type DatosProductor = z.infer<typeof esquemaProductor>;

export const esquemaParcela = z.object({
  nombre: textoRequerido("El nombre de la parcela"),
  hectareas: numeroOpcional({ min: 0.01, max: 9999 }),
  altitud_msnm: numeroOpcional({ min: 0, max: 6000, entero: true }),
  latitud: numeroOpcional({ min: -90, max: 90 }),
  longitud: numeroOpcional({ min: -180, max: 180 }),
  libre_deforestacion: casilla,
});

export type DatosParcela = z.infer<typeof esquemaParcela>;
