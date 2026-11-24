import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Spectral } from "next/font/google";
import "./globals.css";

const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"] });
const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

const sitio = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(sitio),
  title: { default: "CacaoPass · Trazabilidad verificable del cacao", template: "%s · CacaoPass" },
  description:
    "Pasaporte digital para lotes de cacao peruano: cada etapa, de la parcela al puerto, queda sellada en blockchain y se comprueba escaneando un QR.",
  applicationName: "CacaoPass",
  openGraph: { type: "website", locale: "es_PE", siteName: "CacaoPass" },
};

export const viewport: Viewport = { themeColor: "#241712" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        className={`${hanken.variable} ${spectral.variable} ${jetbrains.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
