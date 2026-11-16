"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Check, FileText, Hash, Link2, QrCode, Upload } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/field";
import { MensajesFormulario } from "@/components/ui/form-mensajes";
import type { EstadoFormulario } from "@/lib/acciones";
import { siguienteEtapa } from "@/lib/trazabilidad/etapas";
import { cn, formatearFecha } from "@/lib/utils";
import { MAX_EVIDENCIAS } from "@/lib/validaciones/etapa";
import { ETIQUETAS, TIPOS_ETAPA, type TipoEtapa } from "@/types/dominio";

export interface LoteParaEtapa {
  codigo: string;
  destino: string;
  productores: { nombre: string } | null;
  etapas: { tipo: TipoEtapa; ubicacion: string; fecha: string }[];
}

/** "AAAA-MM-DDTHH:mm" en hora de Lima, para el valor inicial del datetime-local. */
function ahoraEnLima() {
  const partes = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
  return partes.replace(" ", "T");
}

export function EtapaForm({
  lotes,
  loteInicial,
  responsable,
}: {
  lotes: LoteParaEtapa[];
  loteInicial?: string;
  responsable: string;
}) {
  const router = useRouter();
  const [codigo, setCodigo] = useState(loteInicial ?? "");
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState<EstadoFormulario>({});
  const [archivos, setArchivos] = useState<string[]>([]);

  const lote = lotes.find((l) => l.codigo === codigo);
  const etapa = lote ? siguienteEtapa(lote.etapas.length) : null;
  const e = estado.errores ?? {};

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setEstado({});

    try {
      const respuesta = await fetch("/api/etapas", {
        method: "POST",
        body: new FormData(evento.currentTarget),
      });
      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        setEstado({ error: cuerpo.error, errores: cuerpo.errores });
        return;
      }
      // La etapa quedó guardada; si el sellado falló, el detalle permite reintentarlo.
      router.push(`/panel/lotes/${codigo}${cuerpo.errorSellado ? "?sellado=fallido" : ""}`);
      router.refresh();
    } catch {
      setEstado({ error: "No hay conexión con el servidor. Inténtalo de nuevo." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="p-6">
        <form onSubmit={enviar} className="flex flex-col gap-6">
          <section className="flex flex-col gap-4">
            <h2 className="font-semibold">1. Lote y etapa</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Select
                etiqueta="Lote"
                name="lote_codigo"
                value={codigo}
                onChange={(ev) => setCodigo(ev.target.value)}
                errores={e.lote_codigo}
                required
              >
                <option value="" disabled>
                  Elige un lote
                </option>
                {lotes.map((l) => (
                  <option key={l.codigo} value={l.codigo}>
                    {l.codigo} · {l.productores?.nombre}
                  </option>
                ))}
              </Select>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Etapa</span>
                <p className="rounded-lg border border-borde bg-crema px-3.5 py-2.5 text-sm">
                  {etapa ? ETIQUETAS.tipoEtapa[etapa] : "—"}
                </p>
                <p className="text-xs text-tenue">Las etapas se registran en orden.</p>
                {etapa && <input type="hidden" name="tipo" value={etapa} />}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 border-t border-borde pt-6">
            <h2 className="font-semibold">2. Detalle de la etapa</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Responsable</span>
                <p className="rounded-lg border border-borde bg-crema px-3.5 py-2.5 text-sm">
                  {responsable}
                </p>
              </div>
              <Input
                etiqueta="Ubicación"
                name="ubicacion"
                placeholder="Planta Pisco, Ica"
                errores={e.ubicacion}
                required
              />
              <Input
                etiqueta="Fecha y hora"
                name="fecha"
                type="datetime-local"
                defaultValue={ahoraEnLima()}
                errores={e.fecha}
                required
              />
              <Input
                etiqueta="Peso del lote (kg)"
                name="peso_kg"
                type="number"
                step="0.01"
                placeholder="1250"
                errores={e.peso_kg}
              />
            </div>
          </section>

          <section className="flex flex-col gap-4 border-t border-borde pt-6">
            <h2 className="font-semibold">3. Calidad y evidencias</h2>
            <Input
              etiqueta="Humedad (%)"
              name="humedad_pct"
              type="number"
              step="0.1"
              placeholder="7.0"
              errores={e.humedad_pct}
              className="sm:max-w-48"
            />
            <Textarea
              etiqueta="Notas de calidad"
              name="notas"
              placeholder="Fermentación de 6 días en cajones de madera."
              errores={e.notas}
            />
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-cacao-700/40 bg-crema px-4 py-4",
                e.evidencias && "border-error-700",
              )}
            >
              <Upload className="size-5 text-cacao-700" aria-hidden />
              <span className="text-sm">
                <span className="font-semibold">Adjuntar evidencias</span>
                <span className="block text-xs text-tenue">
                  {archivos.length
                    ? archivos.join(", ")
                    : `Fotos o PDF (guía de remisión, acta de calidad). Máx. ${MAX_EVIDENCIAS} archivos, 4 MB en total.`}
                </span>
              </span>
              <input
                type="file"
                name="evidencias"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                onChange={(ev) => setArchivos([...(ev.target.files ?? [])].map((a) => a.name))}
              />
            </label>
            {e.evidencias && <p className="text-xs text-error-700">{e.evidencias[0]}</p>}
          </section>

          <MensajesFormulario estado={estado} />

          <div className="flex flex-wrap justify-end gap-3">
            <ButtonLink href="/panel/lotes" variante="secundario">
              Cancelar
            </ButtonLink>
            <Button type="submit" disabled={enviando || !etapa}>
              {enviando ? "Sellando en blockchain…" : "Registrar y sellar en blockchain"}
            </Button>
          </div>
        </form>
      </Card>

      <aside className="h-fit rounded-2xl bg-cacao-900 p-6 text-white">
        <h2 className="font-semibold">Recorrido del lote</h2>
        <ol className="mt-5 flex flex-col gap-4">
          {TIPOS_ETAPA.map((tipo, i) => {
            const registrada = lote?.etapas[i];
            const actual = tipo === etapa;
            return (
              <li key={tipo} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                    registrada && "bg-exito-700",
                    actual && "bg-[#e0a46b]",
                    !registrada && !actual && "border border-white/30",
                  )}
                >
                  {registrada && <Check className="size-3.5" aria-hidden />}
                  {actual && <span className="size-2 rounded-full bg-white" />}
                </span>
                <span className={cn(!registrada && !actual && "text-white/50")}>
                  <span className="block text-sm font-semibold">{ETIQUETAS.tipoEtapa[tipo]}</span>
                  <span className="block text-xs text-white/60">
                    {registrada
                      ? `${registrada.ubicacion} · ${formatearFecha(registrada.fecha)}`
                      : actual
                        ? "Registrando"
                        : tipo === "exportacion" && lote
                          ? `Destino: ${lote.destino}`
                          : "Pendiente"}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 border-t border-white/10 pt-5">
          <h3 className="text-sm font-semibold">Al registrar se sella en blockchain</h3>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm text-white/75">
            <li className="flex gap-2.5">
              <FileText className="size-4 shrink-0" aria-hidden /> Se arma un JSON con los datos de
              la etapa
            </li>
            <li className="flex gap-2.5">
              <Hash className="size-4 shrink-0" aria-hidden /> Se calcula su hash SHA-256 (huella
              única)
            </li>
            <li className="flex gap-2.5">
              <Link2 className="size-4 shrink-0" aria-hidden /> Solo el hash se guarda en blockchain
            </li>
            <li className="flex gap-2.5">
              <QrCode className="size-4 shrink-0" aria-hidden /> El QR del lote muestra la etapa
              verificada
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
