import Link from "next/link";
import { requireOwner } from "@/lib/owner";
import type { LiveDocument, LiveAdmin } from "@/lib/live";
import { LiveWorkspace } from "@/components/live-workspace";
export default async function AdminLive({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string }>;
}) {
  const c = await requireOwner(),
    { evento } = await searchParams,
    { data: events, error } = await c
      .from("cfp_events")
      .select("id,name,status")
      .order("starts_at");
  if (error) throw Error("No se pudieron consultar los eventos.");
  const event = events?.find((e) => e.id === evento) ?? events?.[0];
  if (!event)
    return (
      <main className="admin-empty">
        <h2>Prepara el primer evento</h2>
        <p>
          LIVE estará disponible cuando exista un evento publicado y partidos
          confirmados.
        </p>
        <Link className="action-link" href="/admin/eventos/nuevo">
          Crear evento
        </Link>
      </main>
    );
  if (event.status !== "published")
    return (
      <main className="admin-empty">
        <h2>El borrador sigue privado</h2>
        <p>
          Publica el evento para utilizar LIVE y las vistas públicas de OBS.
          Esto no abre sus inscripciones ni genera partidos.
        </p>
        <Link className="action-link" href={`/admin/eventos/${event.id}`}>
          Configurar evento
        </Link>
      </main>
    );
  const [live, admin] = await Promise.all([
    c.rpc("cfp_live_read", { e: event.id }),
    c.rpc("cfp_live_admin", { e: event.id }),
  ]);
  if (live.error || admin.error) throw Error("No se pudo consultar LIVE.");
  return (
    <main>
      <LiveWorkspace
        key={event.id}
        initial={live.data as LiveDocument}
        admin={admin.data as LiveAdmin}
      />
    </main>
  );
}
