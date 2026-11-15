import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";
import { Logo } from "@/components/panel/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

const beneficios = [
  "Trazabilidad por lote, de la parcela al puerto",
  "Cada etapa sellada en blockchain",
  "Pasaporte digital para compradores en Europa",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ siguiente?: string }>;
}) {
  const { siguiente } = await searchParams;

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca (01 · Login en Figma) */}
      <section className="hidden flex-col justify-center bg-gradient-to-br from-cacao-900 via-[#4a2c1c] to-[#6e3f22] px-16 text-white lg:flex xl:px-20">
        <Logo />
        <h1 className="mt-8 max-w-lg text-[42px] leading-tight font-bold">
          El origen de cada lote de cacao, verificable
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-white/75">
          Registra la ruta del cacao desde la parcela hasta el puerto, genera un QR por lote y sella
          cada etapa en blockchain para que tus compradores la comprueben.
        </p>
        <ul className="mt-8 flex flex-col gap-3">
          {beneficios.map((texto) => (
            <li key={texto} className="flex items-center gap-3 text-sm font-medium">
              <CircleCheck className="size-5 text-green-400" aria-hidden />
              {texto}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center justify-center bg-white px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo claro={false} />
          </div>
          <h2 className="text-[28px] font-bold">Iniciar sesión</h2>
          <p className="mt-1 mb-8 text-sm text-tenue">Panel interno · Machu Picchu Foods</p>
          <LoginForm siguiente={siguiente} />
          <p className="mt-6 text-center text-sm text-tenue">
            ¿Eres comprador?{" "}
            <span className="font-semibold text-cacao-700">Escanea el QR del lote</span>
          </p>
        </div>
      </section>
    </main>
  );
}
