import Link from "next/link";
import { ApplicationForm } from "@/components/application-form";
import Image from "next/image";
import { crests } from "@/lib/crests";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  eventDate,
  eventFormats,
  eventColumns,
  type TournamentEvent,
} from "@/lib/events";
export const dynamic = "force-dynamic";
export default async function PublicEvent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const client = await createClient();
  const { data, error } = await client
    .from("cfp_events")
    .select(eventColumns)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error)
    throw new Error("No se pudo cargar el evento. Vuelve a intentarlo.");
  if (!data) notFound();
  const e = data as TournamentEvent;
  const format = eventFormats[e.format];
  const { data: teams, error: teamsError } = await client.rpc(
    "cfp_public_teams",
    { e: id },
  );
  if (teamsError) throw new Error("No se pudieron consultar los equipos.");
  type PublicTeam = {
    id: string;
    name: string;
    crest: string;
    number: string;
    captain: string;
    state: string;
    members: { roblox: string }[];
  };
  const publicTeams = (teams ?? []) as PublicTeam[];
  return (
    <>
      <SiteHeader />
      <main className="management-page page-width">
        <Link href="/eventos">← Todos los eventos</Link>
        <h1>{e.name}</h1>
        <p className="event-description">{e.description}</p>
        <dl className="event-facts">
          <div>
            <dt>Inicio · hora de Costa Rica</dt>
            <dd>{eventDate(e.starts_at)}</dd>
          </div>
          {e.ends_at && (
            <div>
              <dt>Final previsto</dt>
              <dd>{eventDate(e.ends_at)}</dd>
            </div>
          )}
          <div>
            <dt>Cupo</dt>
            <dd>{e.capacity} equipos</dd>
          </div>
          <div>
            <dt>Formato</dt>
            <dd>{format.label}</dd>
          </div>
          <div>
            <dt>Liguilla</dt>
            <dd>
              {format.opponents} rivales distintos por equipo.{" "}
              {e.eliminate_after_league
                ? `Continúan los ${format.qualified} mejores.`
                : "Continúan todos los equipos."}
            </dd>
          </div>
        </dl>
        <nav className="admin-tabs"><Link href={`/eventos/${id}/calendario`}>Calendario</Link><Link href={`/eventos/${id}/resultados`}>Resultados</Link><Link href={`/eventos/${id}/clasificacion`}>Clasificación</Link></nav>
        <section>
          <h2>Equipos del evento</h2>
          <ul className="application-list">
            {publicTeams.map((t) => (
              <li key={t.id}>
                <Image
                  src={crests.find((c) => c.id === t.crest)?.src ?? ""}
                  alt={`Escudo ${t.crest}`}
                  width={72}
                  height={72}
                />
                <div>
                  <h3>
                    {t.name}
                    {t.number ? ` · Nº ${t.number}` : ""}
                  </h3>
                  <p>
                    {t.state === "approved"
                      ? "Aprobado"
                      : "Pendiente de revisión"}
                  </p>
                  <ul>
                    {t.members.map((m, i) => (
                      <li key={i}>
                        {m.roblox} · {i === 3 ? "Suplente" : "Titular"}
                        {String(i) === t.captain ? " · Capitán" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
          {!publicTeams.length && (
            <p>Todavía no hay equipos con reserva activa.</p>
          )}
        </section>
        {e.registration_status === "open" ? (
          <section>
            <h2>Inscribe a tu equipo</h2>
            <p>
              Plazo de confirmación y revisión: {e.review_hours} horas. Los
              usuarios de TikTok son privados del administrador.
            </p>
            <ApplicationForm
              eventId={id}
              reserved={publicTeams.map((t) => t.crest)}
            />
          </section>
        ) : (
          <p className="registration-lock">
            Inscripciones cerradas. Las solicitudes pendientes conservan su
            plazo de revisión.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
