"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  erroresDeValidacion,
  formDataAObjeto,
  mensajeDeErrorBD,
  type EstadoFormulario,
} from "@/lib/acciones";
import { obtenerUsuarioActual } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esquemaLote } from "@/lib/validaciones/lote";

export async function crearLote(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  if ((await obtenerUsuarioActual()).rol !== "admin") {
    return { error: "Solo un administrador puede crear lotes." };
  }

  const datos = esquemaLote.safeParse(formDataAObjeto(formData));
  if (!datos.success) return erroresDeValidacion(datos.error);

  // El código (LT-26-0001) lo genera la base de datos.
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("lotes").insert(datos.data).select("codigo").single();

  if (error) {
    // 23503 aquí significa que la parcela no pertenece al productor elegido.
    if (error.code === "23503") {
      return { errores: { parcela_id: ["La parcela no pertenece a este productor."] } };
    }
    return { error: mensajeDeErrorBD(error) };
  }

  revalidatePath("/panel/lotes");
  revalidatePath("/panel");
  redirect(`/panel/lotes/${data.codigo}`);
}
