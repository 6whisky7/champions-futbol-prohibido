import { ChampionPresentation } from "@/components/champion";
import { publicCompetition } from "@/lib/public-competition";
import { nextPublicMatch } from "@/lib/public-matches";
import { NextMatch } from "@/components/next-match";
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
} from "@/lib/events";
export const dynamic = "force-dynamic";
export async function generateMetadata({params}:{params:Promise<{id:string}>}) {
  const {id}=await params,d=await publicCompetition(id);
  return {title:d ? `${d.event.name} | Champions Fútbol Prohibido` : "Evento no disponible",description:d?.event.description};
}
export default async function PublicEvent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const client = await createClient();
  const d=await publicCompetition(id);
  if(!d)notFound();
  const e=d.event,format=eventFormats[e.format],publicTeams=d.teams,champion=d.knockout?.champion;
  const {data:privacy,error:privacyError}=await client.rpc("cfp_registration_status");
  const privacyVersion=!privacyError && privacy?.enabled ? privacy.version as string : null;
  return (
    <>
      <SiteHeader />
      <main className="management-page page-width">
        <Link href="/eventos">← Todos los eventos</Link>
        <h1>{e.name}</h1>
        {champion && <ChampionPresentation champion={champion} />}
        <p className="event-description">{e.description}</p>
        <NextMatch eventId={id} match={nextPublicMatch(d.matches)}/>
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
        <nav className="admin-tabs">
          <Link href={`/eventos/${id}/eliminatorias`}>Eliminatorias</Link>
          <Link href={`/eventos/${id}/calendario`}>Calendario</Link>
          <Link href={`/eventos/${id}/resultados`}>Resultados</Link>
          <Link href={`/eventos/${id}/clasificacion`}>Clasificación</Link>
        </nav>
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
                    <Link href={`/eventos/${id}/equipos/${t.id}`}>{t.name}</Link>
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
          <section id="inscripcion">
            <h2>{publicTeams.length >= e.capacity ? "Apúntate a la lista de espera" : "Inscribe a tu equipo"}</h2>
            {publicTeams.length >= e.capacity && <p>El cupo está lleno. La espera no reserva plaza, escudo ni jugadores. El propietario decide las promociones y vuelve a comprobar los datos.</p>}
            <p>
              Plazo de confirmación y revisión: {e.review_hours} horas. Los
              usuarios de TikTok son privados del administrador.
            </p>
            <ApplicationForm
              eventId={id}
              privacyVersion={privacyVersion}
              defaultWaiting={publicTeams.length >= e.capacity}
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
