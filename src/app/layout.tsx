import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Champions Fútbol Prohibido",
  description:
    "El torneo de Fútbol Prohibido en Roblox. Conoce el formato, reúne a tu equipo y explora 48 escudos originales para representarlo.",
  applicationName: "Champions Fútbol Prohibido",
  openGraph: {
    title: "Champions Fútbol Prohibido",
    description: "Tres jugadores, un equipo y un camino hasta la copa. Fútbol Prohibido en Roblox.",
    type: "website",
    locale: "es_CR",
  },
};

export const viewport: Viewport = { themeColor: "#050d24" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
