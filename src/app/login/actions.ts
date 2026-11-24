"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { EstadoFormulario } from "@/lib/acciones";
import { crearClienteServidor } from "@/lib/supabase/server";

const esquemaLogin = z.object({
  email: z.email("Ingresa un correo válido."),
  password: z.string().min(1, "Ingresa tu contraseña."),
  siguiente: z.string().optional(),
});

export async function iniciarSesion(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const datos = esquemaLogin.safeParse(Object.fromEntries(formData));
  if (!datos.success) return { error: datos.error.issues[0].message };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: datos.data.email,
    password: datos.data.password,
  });

  if (error) return { error: "Correo o contraseña incorrectos." };

  // Solo redirigimos dentro del panel, para evitar redirecciones abiertas a otros sitios.
  const destino = datos.data.siguiente?.startsWith("/panel") ? datos.data.siguiente : "/panel";
  redirect(destino);
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
