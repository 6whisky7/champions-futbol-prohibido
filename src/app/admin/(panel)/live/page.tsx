import { SelectAdminEvent } from "@/components/select-admin-event";
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
  const event = events?.find((e) => e.id === evento);
  if (!event) return <main><SelectAdminEvent invalid={Boolean(evento)} /></main>;
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
