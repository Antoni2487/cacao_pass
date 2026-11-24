/**
 * Guilloche: las líneas entrelazadas de pasaportes y billetes. Se generan con
 * hipotrocoides (la curva de un espirógrafo), así que son únicas de CacaoPass
 * y no pesan nada: unos pocos paths calculados una sola vez al cargar el módulo.
 */
function hipotrocoide(R: number, r: number, d: number, cx: number, cy: number, escala: number) {
  const vueltas = r / mcd(R, r); // vueltas necesarias para cerrar la curva
  const pasos = Math.round(360 * vueltas);
  const puntos: string[] = [];
  for (let i = 0; i <= pasos; i++) {
    const t = (i / pasos) * Math.PI * 2 * vueltas;
    const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
    puntos.push(`${(cx + x * escala).toFixed(1)} ${(cy + y * escala).toFixed(1)}`);
  }
  return `M${puntos.join("L")}Z`;
}

function mcd(a: number, b: number): number {
  return b === 0 ? a : mcd(b, a % b);
}

const ROSETA = [
  hipotrocoide(96, 36, 60, 200, 200, 1.55),
  hipotrocoide(96, 36, 52, 200, 200, 1.45),
  hipotrocoide(84, 30, 58, 200, 200, 1.2),
  hipotrocoide(70, 25, 42, 200, 200, 1.1),
];

export function Guilloche({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" aria-hidden className={className} fill="none">
      {ROSETA.map((d, i) => (
        <path key={i} d={d} stroke="currentColor" strokeWidth={0.6} opacity={1 - i * 0.18} />
      ))}
    </svg>
  );
}
