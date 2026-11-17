import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/cron/mantener-activo
 *
 * Supabase (plan gratuito) pausa el proyecto tras ~7 días sin actividad. Vercel
 * llama a esta ruta una vez al día (vercel.json → crons) y hace una consulta
 * liviana para que la demo siga en línea hasta la exposición.
 *
 * Vercel envía `Authorization: Bearer <CRON_SECRET>` cuando esa variable existe
 * en el proyecto; sin ella la ruta no responde, para que nadie más la use.
 */
export const dynamic = "force-dynamic";

function autorizado(request: NextRequest): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  const recibido = Buffer.from(request.headers.get("authorization") ?? "");
  const esperado = Buffer.from(`Bearer ${secreto}`);
  // Comparación en tiempo constante: no revela cuántos caracteres coinciden.
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

export async function GET(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // `head: true` solo cuenta filas: toca la base de datos sin descargar nada.
  const { count, error } = await crearClienteAdmin()
    .from("lotes")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[cron] Supabase", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo consultar Supabase." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, lotes: count, en: new Date().toISOString() });
}
