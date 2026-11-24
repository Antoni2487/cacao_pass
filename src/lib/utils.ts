/** Une clases de Tailwind ignorando valores vacíos o falsos. */
export function cn(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(" ");
}

const formatoFecha = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Lima",
});

const formatoNumero = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });

/** "2026-09-14" o un ISO completo → "14 sept 2026". */
export function formatearFecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  // Una fecha sin hora ("2026-09-14") se interpreta como UTC; le fijamos mediodía
  // para que la zona horaria de Lima no la mueva al día anterior.
  const fecha = valor.length === 10 ? new Date(`${valor}T12:00:00Z`) : new Date(valor);
  return formatoFecha.format(fecha);
}

export function formatearNumero(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  return formatoNumero.format(Number(valor));
}
