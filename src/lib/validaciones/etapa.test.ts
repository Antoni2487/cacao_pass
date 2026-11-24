import { describe, expect, it } from "vitest";
import { validarContenidoEvidencias } from "./etapa";

const archivo = (bytes: number[], tipo: string, nombre = "f") =>
  new File([new Uint8Array(bytes)], nombre, { type: tipo });

describe("validarContenidoEvidencias", () => {
  it("acepta JPG, PNG, WEBP y PDF reales", async () => {
    const validos = [
      archivo([0xff, 0xd8, 0xff, 0xe0], "image/jpeg"),
      archivo([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "image/png"),
      archivo([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50], "image/webp"),
      archivo([0x25, 0x50, 0x44, 0x46, 0x2d], "application/pdf"),
    ];
    expect(await validarContenidoEvidencias(validos)).toBeNull();
  });

  it("rechaza un HTML disfrazado de imagen", async () => {
    const html = [...new TextEncoder().encode("<script>alert(1)</script>")];
    const error = await validarContenidoEvidencias([archivo(html, "image/png", "foto.png")]);
    expect(error).toContain("foto.png");
  });

  it("rechaza un RIFF que no es WEBP", async () => {
    const wav = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45];
    expect(await validarContenidoEvidencias([archivo(wav, "image/webp")])).not.toBeNull();
  });
});
