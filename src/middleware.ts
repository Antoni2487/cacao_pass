import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  // Solo donde hace falta sesión: panel y login. La página pública del lote no pasa por aquí.
  matcher: ["/panel/:path*", "/login"],
};
