import { publicCompetition } from "@/lib/public-competition";
import { nextPublicMatch, unresolved } from "@/lib/public-matches";
import Link from "next/link";
import { ApplicationForm } from "@/components/application-form";
import { EventStatus, PublicEventNavigation } from "@/components/public-event-navigation";
import { TeamIdentity } from "@/components/team-identity";
import { crests } from "@/lib/crests";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { eventDate, eventFormats } from "@/lib/events";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const competition = await publicCompetition(id);
  return {
    title: competition ? competition.event.name + " | Champions Fútbol Prohibido" : "Evento no disponible",
    description: competition?.event.description,
  };
}

export default async function PublicEvent({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ escudo?: string }>;
}) {
  const { id } = await params;
  const requestedCrest = (await searchParams).escudo;
  const data = await publicCompetition(id);
  if (!data) notFound();

  const { event, teams, league, knockout, matches } = data;
  const champion = knockout?.champion;
  const next = nextPublicMatch(matches);
  const client = await createClient();
  const privacy = event.registration_status === "open" ? await client.rpc("cfp_registration_status") : null;
  const privacyVersion = privacy && !privacy.error && privacy.data?.enabled ? privacy.data.version as string : null;
  const open = event.status === "published" && !!privacyVersion;
  const free = Math.max(0, event.capacity - teams.length);
  const reserved = teams.map(({ crest }) => crest);
  const initialCrest = requestedCrest && crests.some((crest) => crest.id === requestedCrest) &&
    (free === 0 || !reserved.includes(requestedCrest)) ? requestedCrest : "";
  const hasResults = matches.some((match) => !unresolved(match.kind));
  const tabs = ["calendario", "clasificacion",
    ...(hasResults ? ["resultados"] : []),
    ...(knockout || league?.state === "closed" ? ["eliminatorias"] : []),
  ];

  return (
    <>
      <SiteHeader />
      <main className="management-page page-width public-event-detail">
        <Link className="public-event-back" href="/eventos">← Eventos</Link>
        <section className="public-event-hero" aria-labelledby="public-event-title">
          <EventStatus status={event.status} registrationOpen={open} />
          <h1 id="public-event-title">{event.name}</h1>
          {event.description && <p className="event-description">{event.description}</p>}
          <dl className="public-event-facts">
            <div><dt>Inicio en Costa Rica</dt><dd><time dateTime={event.starts_at}>{eventDate(event.starts_at)}</time></dd></div>
            {event.ends_at && <div><dt>Fin previsto</dt><dd><time dateTime={event.ends_at}>{eventDate(event.ends_at)}</time></dd></div>}
            <div><dt>Formato</dt><dd>{eventFormats[event.format].label}</dd></div>
            <div><dt>Cupo</dt><dd>{event.capacity} equipos</dd></div>
            {open && <div><dt>Plazas disponibles</dt><dd>{free}</dd></div>}
          </dl>
          {open && <a className="action-link" href="#inscripcion">{free ? "Inscribir equipo" : "Ir a lista de espera"}</a>}
        </section>
        <PublicEventNavigation eventId={id} visible={tabs}
          featured={open || champion ? undefined : knockout ? "eliminatorias" : hasResults ? "clasificacion" : league ? "calendario" : undefined} />
        {champion && (
          <section className="public-event-highlight" aria-label="Campeón del evento">
            <div>
              <h2>Campeón</h2>
              <TeamIdentity name={champion.team.name} crest={champion.team.crest} />
            </div>
            <Link className="action-link" href={"/eventos/" + id + "/eliminatorias#campeon"}>Ver final y campeón</Link>
          </section>
        )}
        {next?.scheduled_at && (
          <section className="public-event-highlight">
            <div>
              <h2>Próximo partido</h2>
              <p>{next.homeName} vs {next.awayName}</p>
              <time dateTime={next.scheduled_at}>{eventDate(next.scheduled_at)} · Costa Rica</time>
            </div>
            <Link href={"/eventos/" + id + "/partidos/" + next.id}>Ver partido →</Link>
          </section>
        )}
        {open && (
          <section className="public-registration" id="inscripcion">
            <h2>{free ? "Inscribe a tu equipo" : "Lista de espera"}</h2>
            <p>{free ? "Confirma tu solicitud en " + event.review_hours + " horas." : "El cupo está completo. La espera no reserva plaza."}</p>
            <ApplicationForm eventId={id} initialCrest={initialCrest} privacyVersion={privacyVersion}
              defaultWaiting={free === 0} reserved={reserved} />
          </section>
        )}
        {!!teams.length && (
          <details className="public-event-teams">
            <summary>Equipos del evento ({teams.length})</summary>
            <ul>{teams.map((team) => (
              <li key={team.id}>
                <TeamIdentity href={"/eventos/" + id + "/equipos/" + team.id} name={team.name} crest={team.crest} />
                <span>{team.state === "approved" ? "Aprobado" : "Pendiente"}</span>
              </li>
            ))}</ul>
          </details>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
