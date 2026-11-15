"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, Leaf, LogOut, Menu, Users, X } from "lucide-react";
import { cerrarSesion } from "@/app/login/actions";
import { cn } from "@/lib/utils";
import type { Usuario } from "@/types/dominio";
import { Logo } from "./logo";

const enlaces = [
  { href: "/panel", texto: "Dashboard", icono: LayoutGrid, exacto: true },
  { href: "/panel/lotes", texto: "Lotes de cacao", icono: Leaf },
  { href: "/panel/productores", texto: "Productores", icono: Users },
];

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

export function Sidebar({ usuario }: { usuario: Usuario }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      {/* Barra superior en móvil */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-cacao-900 px-4 py-3 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="rounded-lg p-2 text-white hover:bg-cacao-800"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {abierto && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setAbierto(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-cacao-900 px-5 py-7 transition-transform lg:translate-x-0",
          abierto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <Logo />
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="rounded-lg p-1 text-white/70 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="mt-10 flex flex-col gap-1">
          {enlaces.map(({ href, texto, icono: Icono, exacto }) => {
            const activo = exacto ? ruta === href : ruta.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setAbierto(false)}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors",
                  activo
                    ? "bg-cacao-700 text-white"
                    : "text-white/75 hover:bg-cacao-800 hover:text-white",
                )}
              >
                <Icono className="size-5" aria-hidden />
                {texto}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center gap-3 rounded-xl bg-cacao-800 p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cacao-700 text-xs font-bold text-white">
            {iniciales(usuario.nombre)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{usuario.nombre}</p>
            <p className="text-xs text-white/60">
              {usuario.rol === "admin" ? "Administrador" : "Calidad y trazabilidad"}
            </p>
          </div>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="rounded-lg p-2 text-white/60 hover:bg-cacao-700 hover:text-white"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
