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
import { esquemaParcela, esquemaProductor } from "@/lib/validaciones/productor";

const SIN_PERMISO: EstadoFormulario = { error: "Solo un administrador puede hacer esto." };

async function esAdmin() {
  return (await obtenerUsuarioActual()).rol === "admin";
}

export async function crearProductor(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  if (!(await esAdmin())) return SIN_PERMISO;

  const datos = esquemaProductor.safeParse(formDataAObjeto(formData));
  if (!datos.success) return erroresDeValidacion(datos.error);

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("productores")
    .insert(datos.data)
    .select("id")
    .single();
  if (error) return { error: mensajeDeErrorBD(error) };

  revalidatePath("/panel/productores");
  redirect(`/panel/productores/${data.id}`);
}

export async function actualizarProductor(
  id: string,
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  if (!(await esAdmin())) return SIN_PERMISO;

  const datos = esquemaProductor.safeParse(formDataAObjeto(formData));
  if (!datos.success) return erroresDeValidacion(datos.error);

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("productores").update(datos.data).eq("id", id);
  if (error) return { error: mensajeDeErrorBD(error) };

  revalidatePath("/panel/productores");
  revalidatePath(`/panel/productores/${id}`);
  return { exito: "Cambios guardados." };
}

export async function crearParcela(
  productorId: string,
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  if (!(await esAdmin())) return SIN_PERMISO;

  const datos = esquemaParcela.safeParse(formDataAObjeto(formData));
  if (!datos.success) return erroresDeValidacion(datos.error);

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("parcelas")
    .insert({ ...datos.data, productor_id: productorId });
  if (error) return { error: mensajeDeErrorBD(error) };

  revalidatePath(`/panel/productores/${productorId}`);
  return { exito: "Parcela registrada." };
}

export async function eliminarParcela(productorId: string, parcelaId: string) {
  if (!(await esAdmin())) return;

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("parcelas").delete().eq("id", parcelaId);
  // 23503: la parcela ya tiene lotes; se conserva para no romper la trazabilidad.
  if (error) throw new Error(mensajeDeErrorBD(error));

  revalidatePath(`/panel/productores/${productorId}`);
}
