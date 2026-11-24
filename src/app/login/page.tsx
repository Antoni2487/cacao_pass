import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/panel/logo";
import { Guilloche } from "@/components/publico/guilloche";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

const pasos = [
  "Registra cada etapa del lote, de la parcela al puerto",
  "El sistema sella su huella digital en Polygon",
  "El comprador la comprueba escaneando el QR",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ siguiente?: string }>;
}) {
  const { siguiente } = await searchParams;

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative isolate hidden flex-col justify-between overflow-hidden bg-cacao-900 px-14 py-12 text-white lg:flex xl:px-20">
        <Guilloche className="pointer-events-none absolute -right-48 -bottom-56 -z-10 size-[46rem] text-mazorca-300/[0.12]" />
        <Link href="/" className="self-start rounded-lg" aria-label="CacaoPass, ir al inicio">
          <Logo />
        </Link>

        <div>
          <h1 className="max-w-[14ch] font-serif text-5xl leading-[1.08] font-semibold">
            El origen de cada lote, verificable por cualquiera
          </h1>
          <ol className="mt-10 flex flex-col gap-4">
            {pasos.map((texto, i) => (
              <li key={texto} className="flex items-baseline gap-4 text-white/80">
                <span className="font-serif text-2xl text-mazorca-300">{i + 1}</span>
                {texto}
              </li>
            ))}
          </ol>
        </div>

        <p className="text-sm text-white/50">Panel interno de trazabilidad</p>
      </section>

      <section className="flex flex-col px-5 py-8 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 self-start rounded-lg text-sm font-medium text-tenue hover:text-tinta"
        >
          <ArrowLeft className="size-4" aria-hidden /> Volver al inicio
        </Link>

        <div className="mx-auto my-auto w-full max-w-sm py-12">
          <div className="mb-10 lg:hidden">
            <Logo claro={false} />
          </div>
          <h2 className="font-serif text-4xl font-semibold">Iniciar sesión</h2>
          <p className="mt-2 mb-8 text-tenue">Acceso para el equipo de calidad y trazabilidad.</p>
          <LoginForm siguiente={siguiente} />
          <p className="mt-8 border-t border-borde pt-6 text-sm leading-relaxed text-tenue">
            ¿Eres comprador? No necesitas cuenta: escanea el QR del lote o{" "}
            <Link href="/#ejemplos" className="font-semibold text-cacao-700 hover:underline">
              mira los lotes de ejemplo
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
