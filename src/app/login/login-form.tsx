"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useFormAction } from "@/lib/use-form-action";
import { iniciarSesion } from "./actions";

export function LoginForm({ siguiente }: { siguiente?: string }) {
  const { estado, onSubmit, pendiente } = useFormAction(iniciarSesion);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <input type="hidden" name="siguiente" value={siguiente ?? ""} />
      <Input
        etiqueta="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="nombre@empresa.com"
        required
      />
      <Input
        etiqueta="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />

      {estado.error && (
        <p role="alert" className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">
          {estado.error}
        </p>
      )}

      <Button type="submit" disabled={pendiente} className="w-full">
        {pendiente ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
