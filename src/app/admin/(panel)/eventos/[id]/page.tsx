import Link from "next/link";
import { SelectAdminEvent } from "@/components/select-admin-event";
import { adminNextStep, adminPhases } from "@/lib/admin-next-step";
import type { League } from "@/lib/league/types";
import type { Knockout } from "@/lib/knockout";
import { requireOwner } from "@/lib/owner";
import { EventForm } from "@/components/event-form";
import { EventLifecycleActions, TestSeedForm } from "@/components/event-lifecycle-actions";
import { eventStatusTerminal } from "@/lib/events";
import { eventColumns, type TournamentEvent } from "@/lib/events";
export default async function EditEvent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string }>;
}) {
  const client = await requireOwner();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) return <main><SelectAdminEvent invalid /></main>;
  const { data, error } = await client
    .from("cfp_events")
    .select(`${eventColumns},roster_locked` as const)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("No se pudo consultar el evento.");
  if (!data) return <main><SelectAdminEvent invalid /></main>;
  const event = data as TournamentEvent;
  const [l, k] = await Promise.all([
    client.rpc("cfp_league_read", { e: id, admin: true }),
    client.rpc("cfp_knockout_read", { e: id, admin: true }),
  ]);
  if (l.error || k.error) throw new Error("No se pudo consultar el progreso del torneo.");
  const league = l.data as League | null;
  const knockout = k.data as Knockout | null;
  const needsPrivacy = event.status === "published" && !data.roster_locked && event.registration_status === "closed" && !league?.state;
  const privacy = needsPrivacy ? await client.rpc("cfp_registration_status") : null;
  if (privacy?.error) throw new Error("No se pudo consultar el estado de las inscripciones.");
  const next = adminNextStep({ ...event, roster_locked: data.roster_locked }, league, knockout, privacy?.data?.enabled === true);
  const configIsNext = next.href?.endsWith("#event-settings");
  const terminal = eventStatusTerminal(event.status);
  return (
    <main className="admin-editor">
      <Link href="/admin/eventos">← Eventos</Link>
      {(await searchParams).guardado && <p role="status">Evento guardado.</p>}
      {event.is_test && <p className="admin-note">Evento de prueba privado</p>}
      {event.status !== "cancelled" ? (
        <section className="admin-surface admin-next-step">
          <h2>{next.phase === 7 ? "Torneo finalizado" : "Siguiente paso"}</h2>
          <p>{next.text}</p>
          {next.href && <Link href={next.href} className="action-link">{next.action}</Link>}
          <ol className="guided-phase-list" aria-label="Fases del torneo">
            {adminPhases.map((name, i) => {
              const current = next.phase === i;
              return (
                <li key={name} aria-current={current ? "step" : undefined}>
                  <span>{i === 4 && event.format !== "quarters" ? "Eliminatorias hasta cuartos" : name}</span>
                  <small>{next.phase > i ? "Completada" : current ? "En curso" : "Pendiente"}</small>
                </li>
              );
            })}
          </ol>
        </section>
      ) : <p>El evento está cancelado.</p>}
      {knockout?.champion && event.status === "published" && (
        <EventLifecycleActions event={event} only="finish" />
      )}
      {configIsNext && !terminal && (
        <section className="admin-surface" id="event-settings">
          <h2>Configuración del evento</h2>
          <EventForm key={id} event={event} />
        </section>
      )}
      <details className="admin-surface guided-options" id={configIsNext ? undefined : "event-settings"}>
        <summary>Más opciones del evento</summary>
        <nav className="admin-tabs" aria-label="Opciones del evento">
          <Link href={"/admin/solicitudes?evento=" + id + "&vista=approved"}>{event.is_test ? "Ver equipos del ensayo" : "Ver equipos aprobados"}</Link>
          {event.is_test && <Link href={"/admin/eventos/" + id + "/exportar"}>Exportar el ensayo</Link>}
          {event.status === "published" && !event.is_test && <Link href={"/eventos/" + id}>Ver página pública</Link>}
          <Link href={"/admin?evento=" + id + "&vista=actividad"}>Ver actividad de inscripciones</Link>
        </nav>
        {!terminal && !configIsNext && <EventForm key={id} event={event} />}
        {event.is_test && !data.roster_locked && !terminal && <TestSeedForm eventId={id} />}
        <EventLifecycleActions event={event} only="maintenance" />
      </details>
    </main>
  );
}
