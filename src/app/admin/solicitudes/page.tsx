import Link from "next/link";
import { requireOwner } from "@/lib/owner";
import { ApplicationManager } from "@/components/application-manager";
import type { Application } from "@/lib/applications";
export const dynamic = "force-dynamic";
export default async function Applications({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string }>;
}) {
  const client = await requireOwner();
  const { data: events, error } = await client
    .from("cfp_events")
    .select("id,name,capacity,registration_status,roster_locked")
    .order("starts_at");
  if (error) throw new Error("No se pudieron cargar los eventos.");
  const { evento } = await searchParams;
  const event = events?.find((e) => e.id === evento) ?? events?.[0];
  const result = event
    ? await client.rpc("cfp_admin_applications", { e: event.id })
    : { data: [], error: null };
  if (result.error) throw new Error("No se pudieron cargar las solicitudes.");
  return (
    <main className="management-page page-width">
      <Link href="/admin">← Eventos</Link>
      <h1>Centro de competición</h1>
      <p>Revisa solicitudes, confirma al capitán y prepara tus equipos.</p>
      <form className="event-form">
        <label htmlFor="event-selector">Evento que estás administrando</label>
        <select id="event-selector" name="evento" defaultValue={event?.id}>
          {events?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <button className="trophy-button">Consultar evento</button>
      </form>
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
            key={event.id}
            eventId={event.id}
            capacity={event.capacity}
            locked={event.roster_locked}
            open={event.registration_status === "open"}
            items={result.data as Application[]}
          />
        </>
      ) : (
        <p>Crea primero un evento desde el panel.</p>
      )}
    </main>
  );
}
