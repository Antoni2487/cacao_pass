import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-lg border border-borde bg-white px-3.5 py-2.5 text-sm text-tinta placeholder:text-tenue/70 focus:border-cacao-700 focus:ring-2 focus:ring-cacao-700/15 focus:outline-none aria-invalid:border-error-700";

type BaseCampo = {
  etiqueta: string;
  /** Errores de validación devueltos por el servidor para este campo. */
  errores?: string[];
  ayuda?: string;
};

function Envoltura({
  id,
  etiqueta,
  errores,
  ayuda,
  children,
}: BaseCampo & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-tinta">
        {etiqueta}
      </label>
      {children}
      {errores?.length ? (
        <p id={`${id}-error`} className="text-xs text-error-700">
          {errores[0]}
        </p>
      ) : ayuda ? (
        <p className="text-xs text-tenue">{ayuda}</p>
      ) : null}
    </div>
  );
}

export function Input({
  etiqueta,
  errores,
  ayuda,
  className,
  ...props
}: BaseCampo & ComponentProps<"input">) {
  const id = props.id ?? props.name!;
  return (
    <Envoltura id={id} etiqueta={etiqueta} errores={errores} ayuda={ayuda}>
      <input
        id={id}
        aria-invalid={errores?.length ? true : undefined}
        aria-describedby={errores?.length ? `${id}-error` : undefined}
        className={cn(control, className)}
        {...props}
      />
    </Envoltura>
  );
}

export function Select({
  etiqueta,
  errores,
  ayuda,
  className,
  children,
  ...props
}: BaseCampo & ComponentProps<"select">) {
  const id = props.id ?? props.name!;
  return (
    <Envoltura id={id} etiqueta={etiqueta} errores={errores} ayuda={ayuda}>
      <select
        id={id}
        aria-invalid={errores?.length ? true : undefined}
        aria-describedby={errores?.length ? `${id}-error` : undefined}
        className={cn(control, className)}
        {...props}
      >
        {children}
      </select>
    </Envoltura>
  );
}

export function Textarea({
  etiqueta,
  errores,
  ayuda,
  className,
  ...props
}: BaseCampo & ComponentProps<"textarea">) {
  const id = props.id ?? props.name!;
  return (
    <Envoltura id={id} etiqueta={etiqueta} errores={errores} ayuda={ayuda}>
      <textarea
        id={id}
        rows={3}
        aria-invalid={errores?.length ? true : undefined}
        aria-describedby={errores?.length ? `${id}-error` : undefined}
        className={cn(control, className)}
        {...props}
      />
    </Envoltura>
  );
}
