export default function Cargando() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-borde" />
      <div className="h-64 animate-pulse rounded-2xl bg-borde/60" />
    </div>
  );
}
