import Link from "next/link";
import { CalendarDays, Trophy, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EventStatus } from "@/components/public-event-navigation";
import { eventDate, eventFormats, eventColumns, publicEventFilter, type TournamentEvent } from "@/lib/events";

export const dynamic = "force-dynamic";
export const metadata = { title: "Eventos | Champions Fútbol Prohibido" };

export default async function Events({ searchParams }: { searchParams: Promise<{ inscripciones?: string }> }) {
  const onlyOpen = (await searchParams).inscripciones === "abiertas";
  const client = await createClient();
  const [policy, { data, error }] = await Promise.all([
    client.rpc("cfp_registration_status"),
    client.from("cfp_events").select(eventColumns).or(publicEventFilter)
      .in("status", ["published", "finished"]).order("starts_at"),
  ]);
  const available = !policy.error && !!policy.data?.enabled && !!policy.data?.version;
  const isOpen = (event: TournamentEvent) => available && event.status === "published" && event.registration_status === "open";
  const events = ((data ?? []) as TournamentEvent[]).filter((event) => !onlyOpen || isOpen(event));
  const places = new Map(await Promise.all(events.filter(isOpen).map(async (event) => {
    const result = await client.rpc("cfp_public_teams", { e: event.id });
    return [event.id, result.error ? null : Math.max(0, event.capacity - (result.data?.length ?? 0))] as const;
  })));

  return (
    <>
      <SiteHeader />
      <main className="management-page page-width public-events">
        <div className="public-events-heading">
          <h1>Eventos del torneo</h1>
          <nav className="public-event-nav" aria-label="Filtrar eventos">
            <Link href="/eventos" aria-current={!onlyOpen ? "page" : undefined}>Todos</Link>
            <Link href="/eventos?inscripciones=abiertas" aria-current={onlyOpen ? "page" : undefined}>Inscripciones abiertas</Link>
          </nav>
        </div>
        {error ? (
          <p className="public-event-empty" role="alert">No pudimos cargar los eventos. Inténtalo de nuevo en unos minutos.</p>
        ) : !events.length ? (
          <p className="public-event-empty">{onlyOpen ? "Por ahora no hay inscripciones abiertas." : "Todavía no hay eventos publicados."}</p>
        ) : (
          <ul className="public-event-cards">
            {events.map((event) => {
              const open = isOpen(event);
              const remaining = places.get(event.id);
              const waiting = open && remaining === 0;
              return (
                <li key={event.id}>
                  <article className="public-event-card">
                    <EventStatus status={event.status} registrationOpen={open} />
                    <h2>{event.name}</h2>
                    <ul className="public-event-card-facts">
                      <li><CalendarDays size={18} aria-hidden="true" /><time dateTime={event.starts_at}>{eventDate(event.starts_at)}</time></li>
                      <li><Trophy size={18} aria-hidden="true" />{eventFormats[event.format].label}</li>
                      <li><Users size={18} aria-hidden="true" />{event.capacity} equipos</li>
                    </ul>
                    {open && remaining != null && <p className="public-event-places">
                      {waiting ? "Cupo completo · Lista de espera" : remaining + (remaining === 1 ? " plaza disponible" : " plazas disponibles")}
                    </p>}
                    <Link className={open ? "action-link" : "trophy-button"}
                      href={"/eventos/" + event.id + (open ? "#inscripcion" : "")}>
                      {waiting ? "Ir a lista de espera" : open ? "Inscribir equipo" : event.status === "finished" ? "Ver edición" : "Ver evento"}
                    </Link>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
