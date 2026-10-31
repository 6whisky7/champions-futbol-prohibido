import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LiveDocument } from "@/lib/live";
import { LiveWorkspace } from "@/components/live-workspace";
import { signOutLive } from "./actions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string }>;
}) {
  const c = await createClient(),
    auth = await c.auth.getUser();
  if (auth.error || !auth.data.user) redirect("/live/acceso");
  const { data, error } = await c.rpc("cfp_my_live_events");
  if (error) throw Error("No se pudieron comprobar los eventos asignados.");
  const events = (data ?? []) as { id: string; name: string }[],
    { evento } = await searchParams,
    event = events.find((x) => x.id === evento) ?? events[0];
  const live = event ? await c.rpc("cfp_live_read", { e: event.id }) : null;
  if (live?.error) throw Error("No se pudo comprobar el acceso al evento.");
  return (
    <>
      <SiteHeader />
      <main className="management-page page-width">
        <h1>Partido en LIVE</h1>
        <p>
          Marcador de trabajo para el evento autorizado. Las decisiones
          oficiales pertenecen al propietario.
        </p>
        <form action={signOutLive}>
          <button className="trophy-button">Cerrar sesión de LIVE</button>
        </form>
        {event ? (
          <>
            <nav className="admin-tabs" aria-label="Eventos LIVE asignados">
              {events.map((x) => (
                <Link
                  key={x.id}
                  aria-current={x.id === event.id ? "page" : undefined}
                  href={`/live?evento=${x.id}`}
                >
                  {x.name}
                </Link>
              ))}
            </nav>
            <h2>{event.name}</h2>
            <LiveWorkspace
              key={event.id}
              initial={live!.data as LiveDocument}
            />
          </>
        ) : (
          <section className="admin-surface live-panel">
            <h2>No tienes eventos asignados</h2>
            <p>
              Tu cuenta no tiene un permiso activo en eventos publicados. El
              propietario puede asignarlo expresamente; esta pantalla no concede
              acceso administrativo.
            </p>
            <Link href="/eventos">Consultar partidos públicos</Link>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
