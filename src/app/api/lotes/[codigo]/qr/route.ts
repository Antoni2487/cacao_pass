import { respuestaError } from "@/lib/api";
import { PATRON_CODIGO_LOTE, generarQrPng, urlPublicaLote } from "@/lib/qr";

/**
 * GET /api/lotes/[codigo]/qr — PNG del QR del lote.
 * Con ?descargar=1 el navegador lo descarga como archivo.
 * Es público: el QR solo contiene la URL del pasaporte, que ya es pública.
 */
export async function GET(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  if (!PATRON_CODIGO_LOTE.test(codigo)) return respuestaError("Código de lote no válido.", 400);

  const png = await generarQrPng(urlPublicaLote(codigo));
  const descargar = new URL(request.url).searchParams.has("descargar");

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
      ...(descargar && { "Content-Disposition": `attachment; filename="QR-${codigo}.png"` }),
    },
  });
}
