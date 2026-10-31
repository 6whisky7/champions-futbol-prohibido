import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LiveAccessForm } from "@/components/live-access-form";
export const metadata = { title: "Acceso LIVE | Champions Fútbol Prohibido" };
export default async function LiveAccess({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="management-page page-width">
        <h1>Acceso LIVE</h1>
        <p>
          Para el propietario y ayudantes asignados expresamente a un evento.
          Los visitantes pueden consultar los partidos sin entrar aquí.
        </p>
        {estado === "sin-permiso" && (
          <p role="alert">
            Tu cuenta no tiene un evento asignado. Solicita al propietario que
            revise el permiso.
          </p>
        )}
        <LiveAccessForm />
        <Link href="/eventos">Consultar eventos públicos</Link>
      </main>
      <SiteFooter />
    </>
  );
}
