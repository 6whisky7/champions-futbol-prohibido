import Link from "next/link";
import { requireOwner } from "@/lib/owner";
import { ApplicationManager } from "@/components/application-manager";
import type { Application } from "@/lib/applications";
export const dynamic = "force-dynamic";
export default async function Applications({
  searchParams,
}: {
  searchParams: Promise<{
    evento?: string;
    vista?: string;
    solicitud?: string;
  }>;
}) {
  const client = await requireOwner();
  const { data: events, error } = await client
    .from("cfp_events")
    .select("id,name,capacity,registration_status,roster_locked")
    .order("starts_at");
  if (error) throw new Error("No se pudieron cargar los eventos.");
  const { evento, vista, solicitud } = await searchParams;
  const event = events?.find((e) => e.id === evento) ?? events?.[0];
  const result = event
    ? await client.rpc("cfp_admin_applications", { e: event.id })
    : { data: [], error: null };
  if (result.error) throw new Error("No se pudieron cargar las solicitudes.");
  return (
    <main className="admin-requests">
      {event ? (
        <>
          <p>
            {event.name} · Inscripciones{" "}
            {event.registration_status === "open" ? "abiertas" : "cerradas"}
          </p>
          <Link href={`/admin/eventos/${event.id}`}>
            Configurar evento y apertura →
          </Link>
          <ApplicationManager
            initialFilter={vista ?? "pending"}
            initialSelected={solicitud}
            key={event.id + (vista ?? "pending") + (solicitud ?? "")}
            eventId={event.id}
            capacity={event.capacity}
            locked={event.roster_locked}
            open={event.registration_status === "open"}
            items={result.data as Application[]}
          />
        </>
      ) : (
        <section className="admin-empty"><h2>Todavía no hay solicitudes que revisar</h2><p>Prepara primero un evento como borrador. Aquí aparecerán sus equipos y requisitos.</p><Link className="action-link" href="/admin/eventos">Ir a Eventos</Link></section>
      )}
    </main>
  );
}
