/**
 * Marca que el script `npm run lotes:ejemplo` agrega a la historia de los
 * productores ficticios. Sirve para encontrarlos (portada, borrado) y para
 * avisar en la página pública que son datos de demostración.
 */
export const MARCA_DEMO = "Datos de ejemplo para la demostración de CacaoPass.";

/** Separa la historia real de la marca de demostración. */
export function separarMarcaDemo(historia: string | null) {
  if (!historia) return { historia: null, esDemo: false };
  if (!historia.includes(MARCA_DEMO)) return { historia, esDemo: false };
  return { historia: historia.replace(MARCA_DEMO, "").trim() || null, esDemo: true };
}
