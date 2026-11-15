import { redirect } from "next/navigation";

/** La raíz no tiene contenido propio: el panel interno empieza en el login. */
export default function Inicio() {
  redirect("/login");
}
