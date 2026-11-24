import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "CacaoPass: cada lote de cacao con un pasaporte verificable en blockchain";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Vista previa al compartir el enlace (LinkedIn, WhatsApp, etc.). */
export default async function Image() {
  const svg = await readFile(join(process.cwd(), "public/marca/mazorca.svg"));
  const mazorca = `data:image/svg+xml;base64,${svg.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 90px",
          background: "#241712",
          color: "#ffffff",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo admite <img> */}
        <img src={mazorca} width={300} height={300} alt="" />
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
          <div style={{ display: "flex", fontSize: 40, color: "#e9c46a" }}>CacaoPass</div>
          <div style={{ display: "flex", fontSize: 64, lineHeight: 1.08, marginTop: 18 }}>
            Cada lote de cacao, con un pasaporte que no se puede falsificar
          </div>
          <div style={{ display: "flex", fontSize: 26, marginTop: 28, color: "#cbbfb6" }}>
            Trazabilidad de la parcela al puerto, sellada en Polygon
          </div>
        </div>
      </div>
    ),
    size,
  );
}
