import "server-only";
import QRCode from "qrcode";
import { envPublico } from "@/lib/env";

/** Formato de los códigos generados por la base de datos (LT-26-0001). */
export const PATRON_CODIGO_LOTE = /^LT-\d{2}-\d{4,}$/;

/** URL del pasaporte público que va dentro del QR (RF05). */
export function urlPublicaLote(codigo: string) {
  return `${envPublico.siteUrl().replace(/\/$/, "")}/lote/${encodeURIComponent(codigo)}`;
}

/** PNG del QR. Corrección de errores "M": sigue leyéndose con el saco algo arrugado o sucio. */
export function generarQrPng(contenido: string): Promise<Buffer> {
  return QRCode.toBuffer(contenido, {
    type: "png",
    width: 720,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#231915", light: "#ffffff" },
  });
}
