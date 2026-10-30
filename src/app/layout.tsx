import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const manrope = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  variable: "--font-body",
  weight: "200 800",
  display: "swap",
});
const barlow = localFont({
  src: "../../node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2",
  variable: "--font-title",
  weight: "700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Champions Fútbol Prohibido",
  description:
    "El torneo de Fútbol Prohibido en Roblox. Consulta cómo se juega y explora 48 escudos originales para tu equipo.",
  applicationName: "Champions Fútbol Prohibido",
  openGraph: {
    title: "Champions Fútbol Prohibido",
    description:
      "Tres jugadores por equipo, de la liguilla a la final. Conoce el torneo y sus 48 escudos.",
    type: "website",
    locale: "es_CR",
  },
};
export const viewport: Viewport = { themeColor: "#020612" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${manrope.variable} ${barlow.variable}`}>
      <body>{children}</body>
    </html>
  );
}
