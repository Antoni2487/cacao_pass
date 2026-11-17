/**
 * Carga 3 lotes de ejemplo para la demo y los sella en blockchain:
 *
 *   1. Lote completo (5 etapas, exportado)   → la página pública dice "Verificado".
 *   2. Lote en tránsito (3 etapas)           → "Verificado", con el recorrido a medias.
 *   3. Lote completo ALTERADO a propósito    → después de sellarlo se cambia el peso del
 *      acopio directo en la base de datos, y la verificación muestra la alerta.
 *
 * Usa el mismo código que la app (registrarEtapa), así que cada etapa se sella de
 * verdad: son 13 sellos, unos 0.08 POL en total.
 *
 * Uso:
 *   npm run lotes:ejemplo                 crea los lotes (falla si ya existen)
 *   npm run lotes:ejemplo -- --reiniciar  borra los de ejemplo y los vuelve a crear
 *   npm run lotes:ejemplo -- --borrar     solo borra los de ejemplo
 */
import { formatEther, parseEther } from "ethers";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { saldoWallet, direccionWallet } from "@/lib/trazabilidad/blockchain";
import { urlExplorador } from "@/lib/trazabilidad/explorador";
import { RED } from "@/lib/trazabilidad/red";
import { registrarEtapa, reintentarSellado } from "@/lib/trazabilidad/servicio";
import type { DatosEtapa } from "@/lib/validaciones/etapa";
import type { TipoEtapa } from "@/types/dominio";

/** Tope de gas por sello con margen (hoy se pagan ~0.006 POL). */
const COSTO_MAXIMO_POR_SELLO = parseEther("0.015");
const MARCA = "Datos de ejemplo para la demostración de CacaoPass.";

const db = crearClienteAdmin();
const argumentos = new Set(process.argv.slice(2));

// ---------------------------------------------------------------------------
// Datos de ejemplo (ficticios)
// ---------------------------------------------------------------------------

/** Fecha ISO de hace `dias` días a la hora indicada en Lima (UTC-5). */
function haceDias(dias: number, hora = "09:00") {
  const fecha = new Date(Date.now() - dias * 86_400_000);
  const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(fecha);
  return new Date(`${dia}T${hora}:00-05:00`).toISOString();
}

interface EtapaEjemplo {
  tipo: TipoEtapa;
  ubicacion: string;
  diasAtras: number;
  peso_kg?: number;
  humedad_pct?: number;
  notas?: string;
}

interface LoteEjemplo {
  descripcion: string;
  productor: {
    nombre: string;
    tipo: "familia" | "cooperativa" | "asociacion";
    region: string;
    anio_inicio: number;
    historia: string;
  };
  parcela: {
    nombre: string;
    hectareas: number;
    altitud_msnm: number;
    latitud: number;
    longitud: number;
    libre_deforestacion: boolean;
  };
  lote: { variedad: string; peso_kg: number; destino: string; certificaciones: string[] };
  etapas: EtapaEjemplo[];
  /** Si se define, después de sellar se cambia este dato en la base de datos. */
  alteracion?: { tipo: TipoEtapa; campo: "peso_kg"; valor: number };
}

const LOTES: LoteEjemplo[] = [
  {
    descripcion: "completo y verificado",
    productor: {
      nombre: "Familia Huamán Torres",
      tipo: "familia",
      region: "San Martín",
      anio_inicio: 1998,
      historia: `Tres generaciones cultivando cacao fino de aroma en el valle del Huallaga. ${MARCA}`,
    },
    parcela: {
      nombre: "Parcela El Mirador",
      hectareas: 4.5,
      altitud_msnm: 520,
      latitud: -6.4865,
      longitud: -76.3612,
      libre_deforestacion: true,
    },
    lote: {
      variedad: "Fino de aroma",
      peso_kg: 1200,
      destino: "Hamburgo, Alemania",
      certificaciones: ["Orgánico", "Comercio justo"],
    },
    etapas: [
      {
        tipo: "cosecha",
        ubicacion: "Parcela El Mirador, Lamas, San Martín",
        diasAtras: 40,
        peso_kg: 1850,
        notas: "Mazorcas maduras, cosecha manual.",
      },
      {
        tipo: "fermentacion_secado",
        ubicacion: "Módulo de beneficio familiar, Lamas",
        diasAtras: 33,
        humedad_pct: 7,
        notas: "6 días de fermentación en cajones de madera, secado solar.",
      },
      {
        tipo: "acopio",
        ubicacion: "Centro de acopio Tarapoto",
        diasAtras: 26,
        peso_kg: 1210,
        humedad_pct: 7,
      },
      {
        tipo: "planta",
        ubicacion: "Planta de procesamiento, Lima",
        diasAtras: 19,
        peso_kg: 1200,
        notas: "Selección y ensacado en sacos de yute de 60 kg.",
      },
      {
        tipo: "exportacion",
        ubicacion: "Puerto del Callao",
        diasAtras: 12,
        peso_kg: 1200,
        notas: "Contenedor con destino a Hamburgo.",
      },
    ],
  },
  {
    descripcion: "en tránsito (3 etapas) y verificado",
    productor: {
      nombre: "Cooperativa Agraria Selva Central",
      tipo: "cooperativa",
      region: "Junín",
      anio_inicio: 2007,
      historia: `Cooperativa de pequeños productores de Pichanaki y Satipo. ${MARCA}`,
    },
    parcela: {
      nombre: "Sector Alto Kuviriari",
      hectareas: 12,
      altitud_msnm: 780,
      latitud: -10.9271,
      longitud: -74.8742,
      libre_deforestacion: true,
    },
    lote: {
      variedad: "Trinitario",
      peso_kg: 2400,
      destino: "Róterdam, Países Bajos",
      certificaciones: ["Rainforest Alliance"],
    },
    etapas: [
      {
        tipo: "cosecha",
        ubicacion: "Sector Alto Kuviriari, Pichanaki, Junín",
        diasAtras: 14,
        peso_kg: 3700,
      },
      {
        tipo: "fermentacion_secado",
        ubicacion: "Planta de beneficio de la cooperativa, Pichanaki",
        diasAtras: 8,
        humedad_pct: 7.5,
        notas: "Fermentación en cajones escalonados.",
      },
      {
        tipo: "acopio",
        ubicacion: "Almacén central, La Merced",
        diasAtras: 3,
        peso_kg: 2410,
        humedad_pct: 7,
      },
    ],
  },
  {
    descripcion: "completo y ALTERADO a propósito",
    productor: {
      nombre: "Asociación Cacao Fino Quillabamba",
      tipo: "asociacion",
      region: "Cusco",
      anio_inicio: 2012,
      historia: `Productores de cacao chuncho nativo en La Convención. ${MARCA}`,
    },
    parcela: {
      nombre: "Parcela Santa Ana",
      hectareas: 3,
      altitud_msnm: 1050,
      latitud: -12.8634,
      longitud: -72.6921,
      libre_deforestacion: true,
    },
    lote: {
      variedad: "Chuncho",
      peso_kg: 800,
      destino: "Tokio, Japón",
      certificaciones: ["Orgánico"],
    },
    etapas: [
      {
        tipo: "cosecha",
        ubicacion: "Parcela Santa Ana, Quillabamba, Cusco",
        diasAtras: 35,
        peso_kg: 1250,
      },
      {
        tipo: "fermentacion_secado",
        ubicacion: "Centro de beneficio de la asociación, Quillabamba",
        diasAtras: 28,
        humedad_pct: 6.5,
      },
      {
        tipo: "acopio",
        ubicacion: "Centro de acopio Quillabamba",
        diasAtras: 21,
        peso_kg: 810,
        humedad_pct: 7,
      },
      {
        tipo: "planta",
        ubicacion: "Planta de procesamiento, Lima",
        diasAtras: 15,
        peso_kg: 800,
      },
      {
        tipo: "exportacion",
        ubicacion: "Puerto del Callao",
        diasAtras: 9,
        peso_kg: 800,
      },
    ],
    // Simula que alguien infló el peso del acopio después de sellarlo.
    alteracion: { tipo: "acopio", campo: "peso_kg", valor: 950 },
  },
];

const TOTAL_SELLOS = LOTES.reduce((suma, l) => suma + l.etapas.length, 0);

// ---------------------------------------------------------------------------
// Pasos
// ---------------------------------------------------------------------------

async function productoresDeEjemplo() {
  const { data } = await db
    .from("productores")
    .select("id")
    .in(
      "nombre",
      LOTES.map((l) => l.productor.nombre),
    )
    .throwOnError();
  return (data ?? []).map((p) => p.id as string);
}

async function borrarEjemplos() {
  const productores = await productoresDeEjemplo();
  if (productores.length === 0) return 0;

  const { data: lotes } = await db
    .from("lotes")
    .select("id")
    .in("productor_id", productores)
    .throwOnError();
  const idsLotes = (lotes ?? []).map((l) => l.id as string);

  // Orden por las claves foráneas: etapas → lotes → productores (parcelas y
  // escaneos se borran en cascada). Los sellos en blockchain quedan: son permanentes.
  if (idsLotes.length) {
    await db.from("etapas").delete().in("lote_id", idsLotes).throwOnError();
    await db.from("lotes").delete().in("id", idsLotes).throwOnError();
  }
  await db.from("productores").delete().in("id", productores).throwOnError();
  return idsLotes.length;
}

async function responsable() {
  const { data } = await db
    .from("usuarios")
    .select("id, nombre, rol")
    .order("rol") // "admin" va antes que "operador"
    .limit(1)
    .maybeSingle()
    .throwOnError();
  if (!data) {
    throw new Error("No hay usuarios en el panel. Crea uno (docs/03-guia-de-instalacion.md).");
  }
  return data as { id: string; nombre: string };
}

async function comprobarSaldo() {
  const saldo = await saldoWallet();
  const necesario = COSTO_MAXIMO_POR_SELLO * BigInt(TOTAL_SELLOS);
  console.log(`Wallet    : ${direccionWallet()}`);
  console.log(`Red       : ${RED.nombre}`);
  console.log(
    `Saldo     : ${formatEther(saldo)} POL (se necesitan hasta ${formatEther(necesario)})`,
  );
  if (saldo < necesario) {
    throw new Error(
      `Saldo insuficiente para ${TOTAL_SELLOS} sellos. Carga POL en la wallet y vuelve a intentar.`,
    );
  }
}

/** Reintenta las etapas que no confirmaron dentro de la petición. */
async function esperarConfirmaciones(loteId: string) {
  for (let intento = 0; intento < 4; intento++) {
    const { data } = await db
      .from("etapas")
      .select("id")
      .eq("lote_id", loteId)
      .is("sellado_en", null)
      .throwOnError();
    if (!data?.length) return true;
    for (const { id } of data) await reintentarSellado(id).catch(() => null);
  }
  return false;
}

async function crearLote(ejemplo: LoteEjemplo, responsableId: string) {
  const { data: productor } = await db
    .from("productores")
    .insert(ejemplo.productor)
    .select("id")
    .single()
    .throwOnError();
  const { data: parcela } = await db
    .from("parcelas")
    .insert({ ...ejemplo.parcela, productor_id: productor.id })
    .select("id")
    .single()
    .throwOnError();
  const cosecha = ejemplo.etapas[0];
  const { data: lote } = await db
    .from("lotes")
    .insert({
      ...ejemplo.lote,
      productor_id: productor.id,
      parcela_id: parcela.id,
      fecha_cosecha: haceDias(cosecha.diasAtras).slice(0, 10),
    })
    .select("id, codigo")
    .single()
    .throwOnError();

  console.log(`\n${lote.codigo} · ${ejemplo.productor.nombre} (${ejemplo.descripcion})`);

  for (const etapa of ejemplo.etapas) {
    const datos: DatosEtapa = {
      lote_codigo: lote.codigo,
      tipo: etapa.tipo,
      ubicacion: etapa.ubicacion,
      fecha: haceDias(etapa.diasAtras),
      peso_kg: etapa.peso_kg ?? null,
      humedad_pct: etapa.humedad_pct ?? null,
      notas: etapa.notas ?? null,
    };
    const resultado = await registrarEtapa(datos, responsableId, []);
    if (resultado.errorSellado || !resultado.txHash) {
      throw new Error(
        `${etapa.tipo}: ${resultado.errorSellado}\nLa etapa quedó guardada; puedes reintentar el ` +
          "sellado desde el panel o correr el script con --reiniciar.",
      );
    }
    console.log(`  ✓ ${etapa.tipo.padEnd(20)} ${urlExplorador(resultado.txHash)}`);
  }

  if (!(await esperarConfirmaciones(lote.id))) {
    console.log(
      "  … algunas etapas aún esperan confirmación; la verificación las completará sola.",
    );
  }

  if (ejemplo.alteracion) {
    const { tipo, campo, valor } = ejemplo.alteracion;
    const { data: etapa } = await db
      .from("etapas")
      .select("id, datos")
      .eq("lote_id", lote.id)
      .eq("tipo", tipo)
      .single()
      .throwOnError();
    const datos = etapa.datos as Record<string, unknown>;
    console.log(`  ⚠ Alterando ${tipo}.${campo}: ${datos[campo]} → ${valor} (sin volver a sellar)`);
    await db
      .from("etapas")
      .update({ datos: { ...datos, [campo]: valor } })
      .eq("id", etapa.id)
      .throwOnError();
  }

  return lote.codigo as string;
}

// ---------------------------------------------------------------------------

async function main() {
  if (argumentos.has("--borrar") || argumentos.has("--reiniciar")) {
    const borrados = await borrarEjemplos();
    console.log(`Se borraron ${borrados} lotes de ejemplo.`);
    if (argumentos.has("--borrar")) return;
  } else if ((await productoresDeEjemplo()).length > 0) {
    console.log("Los lotes de ejemplo ya existen. Usa --reiniciar para volver a crearlos.");
    return;
  }

  await comprobarSaldo();
  const usuario = await responsable();
  console.log(`Responsable de las etapas: ${usuario.nombre}`);

  const codigos: string[] = [];
  for (const ejemplo of LOTES) codigos.push(await crearLote(ejemplo, usuario.id));

  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  console.log("\nListo. Páginas públicas (las mismas que abre el QR):");
  codigos.forEach((codigo, i) => {
    console.log(`  ${sitio}/lote/${codigo}   ${LOTES[i].descripcion}`);
  });
  console.log(`\nSaldo restante: ${formatEther(await saldoWallet())} POL`);
}

main().catch((error) => {
  console.error(`\n✗ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
